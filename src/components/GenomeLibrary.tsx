import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

import { Trash2, Copy, Download, Database, TrendingUp, Zap } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { genomeStorage, StoredGenome } from '../services/genomeStorage';
import { DataSet } from '../types/brainfuck';

interface GenomeLibraryProps {
  trainData: DataSet;
  testData: DataSet;
  onLoadGenomes: (genomes: string[]) => void;
  isEvolutionRunning: boolean;
}

export function GenomeLibrary({ trainData, testData, onLoadGenomes, isEvolutionRunning }: GenomeLibraryProps) {
  const { toast } = useToast();
  const [allGenomes, setAllGenomes] = useState<StoredGenome[]>([]);
  const [taskGenomes, setTaskGenomes] = useState<StoredGenome[]>([]);
  const [similarGenomes, setSimilarGenomes] = useState<StoredGenome[]>([]);
  const [taskStats, setTaskStats] = useState<{ taskName: string; count: number; bestAccuracy: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenomes, setSelectedGenomes] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [all, task, similar, stats] = await Promise.all([
        genomeStorage.getAllGenomes(50),
        genomeStorage.getBestGenomesForTask(trainData, testData, 10),
        genomeStorage.getSimilarTaskGenomes(trainData, testData, 20),
        genomeStorage.getTaskStats()
      ]);
      
      setAllGenomes(all);
      setTaskGenomes(task);
      setSimilarGenomes(similar);
      setTaskStats(stats);
    } catch (error) {
      console.error('Failed to load genome data:', error);
      toast({
        title: "Error",
        description: "Failed to load genome library",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [trainData, testData, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteGenome = async (genomeId: string) => {
    try {
      await genomeStorage.deleteGenome(genomeId);
      await loadData();
      toast({
        title: "Deleted",
        description: "Genome removed from library"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete genome",
        variant: "destructive"
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Brainfuck code copied to clipboard"
    });
  };

  const handleDownloadCode = (code: string, taskName: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${taskName.toLowerCase().replace(/\s+/g, '_')}_genome.bf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Genome saved to file"
    });
  };

  const toggleGenomeSelection = (genomeId: string) => {
    const newSelection = new Set(selectedGenomes);
    if (newSelection.has(genomeId)) {
      newSelection.delete(genomeId);
    } else {
      newSelection.add(genomeId);
    }
    setSelectedGenomes(newSelection);
  };

  const handleLoadSelected = () => {
    const selectedCodes = allGenomes
      .filter(genome => selectedGenomes.has(genome.id))
      .map(genome => genome.programCode);
    
    if (selectedCodes.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select genomes to load",
        variant: "destructive"
      });
      return;
    }

    onLoadGenomes(selectedCodes);
    toast({
      title: "Genomes Loaded",
      description: `${selectedCodes.length} genomes will seed the next population`
    });
  };

  const handleLoadBestForTask = () => {
    const bestCodes = taskGenomes.slice(0, 5).map(genome => genome.programCode);
    if (bestCodes.length === 0) {
      toast({
        title: "No Genomes",
        description: "No stored genomes found for this task",
        variant: "destructive"
      });
      return;
    }

    onLoadGenomes(bestCodes);
    toast({
      title: "Best Genomes Loaded",
      description: `${bestCodes.length} best genomes for this task will seed the population`
    });
  };

  const handleLoadSimilar = () => {
    const similarCodes = similarGenomes.slice(0, 10).map(genome => genome.programCode);
    if (similarCodes.length === 0) {
      toast({
        title: "No Similar Genomes",
        description: "No similar genomes found",
        variant: "destructive"
      });
      return;
    }

    onLoadGenomes(similarCodes);
    toast({
      title: "Similar Genomes Loaded",
      description: `${similarCodes.length} genomes from similar tasks will seed the population`
    });
  };

  const GenomeCard = ({ genome, showSelection = false }: { genome: StoredGenome; showSelection?: boolean }) => (
    <Card className={`mb-3 ${selectedGenomes.has(genome.id) ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showSelection && (
              <input
                type="checkbox"
                checked={selectedGenomes.has(genome.id)}
                onChange={() => toggleGenomeSelection(genome.id)}
                className="rounded"
              />
            )}
            <CardTitle className="text-sm">{genome.taskName}</CardTitle>
            <Badge variant={genome.trainAccuracy === 100 ? "default" : "secondary"}>
              {genome.trainAccuracy.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyCode(genome.programCode)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadCode(genome.programCode, genome.taskName)}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteGenome(genome.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <code className="text-xs bg-muted p-2 rounded block font-mono break-all">
            {genome.programCode.length > 50 
              ? `${genome.programCode.substring(0, 50)}...` 
              : genome.programCode}
          </code>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Length: {genome.programLength}</span>
            <span>Gen: {genome.generationFound}</span>
            <span>Fitness: {genome.fitness.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Genome Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading genome library...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Genome Library
        </CardTitle>
        <CardDescription>
          Stored genomes from previous evolution runs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current-task" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current-task">Current Task</TabsTrigger>
            <TabsTrigger value="similar">Similar</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current-task" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Best genomes for this exact task
              </p>
              <Button
                size="sm"
                onClick={handleLoadBestForTask}
                disabled={isEvolutionRunning || taskGenomes.length === 0}
              >
                <Zap className="h-3 w-3 mr-1" />
                Load Best
              </Button>
            </div>
            <ScrollArea className="h-64">
              {taskGenomes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No genomes stored for this task yet
                </div>
              ) : (
                taskGenomes.map(genome => (
                  <GenomeCard key={genome.id} genome={genome} />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="similar" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Genomes from similar tasks
              </p>
              <Button
                size="sm"
                onClick={handleLoadSimilar}
                disabled={isEvolutionRunning || similarGenomes.length === 0}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Load Similar
              </Button>
            </div>
            <ScrollArea className="h-64">
              {similarGenomes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No similar genomes found
                </div>
              ) : (
                similarGenomes.map(genome => (
                  <GenomeCard key={genome.id} genome={genome} />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                All stored genomes ({selectedGenomes.size} selected)
              </p>
              <Button
                size="sm"
                onClick={handleLoadSelected}
                disabled={isEvolutionRunning || selectedGenomes.size === 0}
              >
                <Zap className="h-3 w-3 mr-1" />
                Load Selected
              </Button>
            </div>
            <ScrollArea className="h-64">
              {allGenomes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No genomes stored yet
                </div>
              ) : (
                allGenomes.map(genome => (
                  <GenomeCard key={genome.id} genome={genome} showSelection />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Task statistics and achievements
            </p>
            <ScrollArea className="h-64">
              {taskStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task statistics available
                </div>
              ) : (
                <div className="space-y-2">
                  {taskStats.map((stat, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{stat.taskName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stat.count} genome{stat.count !== 1 ? 's' : ''} stored
                            </p>
                          </div>
                          <Badge variant={stat.bestAccuracy === 100 ? "default" : "secondary"}>
                            Best: {stat.bestAccuracy.toFixed(1)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}