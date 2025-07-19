import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';
import { DataSetEditor } from './components/DataSetEditor';
import { GASettings } from './components/GASettings';
import { EvolutionControls } from './components/EvolutionControls';
import { ProgramsTable } from './components/ProgramsTable';
import { EvolutionLog } from './components/EvolutionLog';
import { SolutionBanner } from './components/SolutionBanner';
import { TestCase, DataSet, GASettings as GASettingsType, Individual, GenerationStats, EvolutionState } from './types/brainfuck';
import { GeneticAlgorithm } from './utils/genetic-algorithm';
import { GenomeLibrary } from './components/GenomeLibrary';
import { genomeStorage } from './services/genomeStorage';

const defaultSettings: GASettingsType = {
  populationSize: 50,
  mutationRate: 0.02,
  crossoverRate: 0.8,
  elitism: 2,
  maxGenerations: 1000,
  maxProgramLength: 100
};

const defaultTrainData: DataSet = {
  inputs: '1,2,3,4',
  targets: '2,4,6,8'
};

const defaultTestData: DataSet = {
  inputs: '5,6',
  targets: '10,12'
};

function App() {
  const { toast } = useToast();
  const [trainData, setTrainData] = useState<DataSet>(defaultTrainData);
  const [testData, setTestData] = useState<DataSet>(defaultTestData);
  const [settings, setSettings] = useState<GASettingsType>(defaultSettings);
  const [evolutionState, setEvolutionState] = useState<EvolutionState>({
    isRunning: false,
    isPaused: false,
    currentGeneration: 0,
    population: [],
    stats: [],
    bestSolution: null
  });

  const [ga, setGA] = useState<GeneticAlgorithm | null>(null);
  const [evolutionInterval, setEvolutionInterval] = useState<NodeJS.Timeout | null>(null);
  const [seedGenomes, setSeedGenomes] = useState<string[]>([]);
  const [lastSavedBest, setLastSavedBest] = useState<Individual | null>(null);

  // Convert DataSet to TestCase arrays for the GA
  const convertDataSetToTestCases = useCallback((data: DataSet): TestCase[] => {
    if (!data.inputs.trim() || !data.targets.trim()) return [];
    
    const inputs = data.inputs.split(',').map(s => s.trim()).filter(s => s);
    const targets = data.targets.split(',').map(s => s.trim()).filter(s => s);
    
    const minLength = Math.min(inputs.length, targets.length);
    return Array.from({ length: minLength }, (_, i) => ({
      input: String.fromCharCode(parseInt(inputs[i]) || 0),
      expected: String.fromCharCode(parseInt(targets[i]) || 0)
    }));
  }, []);

  const initializeGA = useCallback(() => {
    const trainCases = convertDataSetToTestCases(trainData);
    const testCases = convertDataSetToTestCases(testData);
    const newGA = new GeneticAlgorithm(settings, trainCases, testCases);
    
    // Set seed genomes if available
    if (seedGenomes.length > 0) {
      newGA.setSeedGenomes(seedGenomes);
    }
    
    newGA.initialize();
    setGA(newGA);
    
    const population = newGA.getPopulation();
    const best = newGA.getBestIndividual();
    const avg = newGA.getAverageFitness();
    const avgAcc = newGA.getAverageAccuracy();
    
    setEvolutionState(prev => ({
      ...prev,
      currentGeneration: 0,
      population,
      stats: [{
        generation: 0,
        bestFitness: best?.fitness || 0,
        averageFitness: avg,
        bestAccuracy: best?.accuracy || 0,
        averageAccuracy: avgAcc,
        bestProgram: best?.code || '',
        trainAccuracy: best?.trainAccuracy,
        testAccuracy: best?.testAccuracy
      }],
      bestSolution: newGA.hasPerfectSolution() ? best : null
    }));
  }, [trainData, testData, settings, convertDataSetToTestCases, seedGenomes]);

  const startEvolution = useCallback(() => {
    if (!ga) {
      initializeGA();
      return;
    }

    setEvolutionState(prev => ({ ...prev, isRunning: true, isPaused: false }));

    const interval = setInterval(() => {
      if (!ga) return;

      const population = ga.evolve();
      const generation = ga.getGeneration();
      const best = ga.getBestIndividual();
      const avg = ga.getAverageFitness();
      const avgAcc = ga.getAverageAccuracy();

      const newStat: GenerationStats = {
        generation,
        bestFitness: best?.fitness || 0,
        averageFitness: avg,
        bestAccuracy: best?.accuracy || 0,
        averageAccuracy: avgAcc,
        bestProgram: best?.code || '',
        trainAccuracy: best?.trainAccuracy,
        testAccuracy: best?.testAccuracy
      };

      setEvolutionState(prev => ({
        ...prev,
        currentGeneration: generation,
        population,
        stats: [...prev.stats, newStat],
        bestSolution: ga.hasPerfectSolution() ? best : prev.bestSolution
      }));

      // Auto-save best genome if it's significantly better than the last saved one
      if (best && (!lastSavedBest || best.trainAccuracy > lastSavedBest.trainAccuracy + 10)) {
        saveGenomeToLibrary(best, generation);
        setLastSavedBest(best);
      }

      // Stop if perfect solution found (100% on both train and test) or max generations reached
      if (ga.hasPerfectSolution() || generation >= settings.maxGenerations) {
        clearInterval(interval);
        setEvolutionState(prev => ({ ...prev, isRunning: false }));
        
        if (ga.hasPerfectSolution()) {
          toast({
            title: "🎉 Perfect Solution Found!",
            description: `100% accuracy on both train and test data in generation ${generation}`,
          });
        } else {
          toast({
            title: "Evolution Complete",
            description: `Reached maximum generations (${settings.maxGenerations})`,
          });
        }
      }
    }, 100); // Evolution speed: 10 generations per second

    setEvolutionInterval(interval);
  }, [ga, settings.maxGenerations, toast, initializeGA, lastSavedBest, saveGenomeToLibrary]);

  const pauseEvolution = useCallback(() => {
    if (evolutionInterval) {
      clearInterval(evolutionInterval);
      setEvolutionInterval(null);
    }
    setEvolutionState(prev => ({ ...prev, isRunning: false, isPaused: true }));
  }, [evolutionInterval]);

  const stopEvolution = useCallback(() => {
    if (evolutionInterval) {
      clearInterval(evolutionInterval);
      setEvolutionInterval(null);
    }
    setEvolutionState(prev => ({ ...prev, isRunning: false, isPaused: false }));
  }, [evolutionInterval]);

  const resetEvolution = useCallback(() => {
    if (evolutionInterval) {
      clearInterval(evolutionInterval);
      setEvolutionInterval(null);
    }
    setEvolutionState({
      isRunning: false,
      isPaused: false,
      currentGeneration: 0,
      population: [],
      stats: [],
      bestSolution: null
    });
    setGA(null);
  }, [evolutionInterval]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Brainfuck code copied to clipboard",
      });
    });
  }, [toast]);

  const downloadProgram = useCallback((code: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.bf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Brainfuck program saved as program.bf",
    });
  }, [toast]);

  // Save genome to library
  const saveGenomeToLibrary = useCallback(async (individual: Individual, generation: number) => {
    try {
      await genomeStorage.saveGenome(individual, trainData, testData, generation);
    } catch (error) {
      console.error('Failed to save genome:', error);
    }
  }, [trainData, testData]);

  // Handle loading genomes from library
  const handleLoadGenomes = useCallback((genomes: string[]) => {
    setSeedGenomes(genomes);
    // Clear last saved best to allow saving new improvements
    setLastSavedBest(null);
  }, []);

  const canStart = (trainData.inputs.trim() && trainData.targets.trim()) || 
                   (testData.inputs.trim() && testData.targets.trim());
  const bestFitness = evolutionState.population.length > 0 ? evolutionState.population[0].fitness : 0;
  const bestAccuracy = evolutionState.population.length > 0 ? evolutionState.population[0].accuracy : 0;
  const trainAccuracy = evolutionState.population.length > 0 ? evolutionState.population[0].trainAccuracy : undefined;
  const testAccuracy = evolutionState.population.length > 0 ? evolutionState.population[0].testAccuracy : undefined;

  // Convert current train/test data to test cases for display
  const displayTestCases = convertDataSetToTestCases(trainData).map(tc => ({
    input: tc.input.charCodeAt(0).toString(),
    expected: tc.expected.charCodeAt(0).toString()
  }));

  // Update GA settings when they change
  useEffect(() => {
    if (ga) {
      ga.updateSettings(settings);
      ga.updateTrainCases(convertDataSetToTestCases(trainData));
      ga.updateTestCases(convertDataSetToTestCases(testData));
    }
  }, [ga, settings, trainData, testData, convertDataSetToTestCases]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (evolutionInterval) {
        clearInterval(evolutionInterval);
      }
    };
  }, [evolutionInterval]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Brainfuck GA Playground
          </h1>
          <p className="text-muted-foreground mt-2">
            Evolve Brainfuck programs using genetic algorithms to match your input/output patterns
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <DataSetEditor 
              trainData={trainData}
              testData={testData}
              onTrainDataChange={setTrainData}
              onTestDataChange={setTestData}
            />
            
            <GASettings 
              settings={settings}
              onSettingsChange={setSettings}
              disabled={evolutionState.isRunning}
            />
            
            <EvolutionControls
              isRunning={evolutionState.isRunning}
              isPaused={evolutionState.isPaused}
              currentGeneration={evolutionState.currentGeneration}
              maxGenerations={settings.maxGenerations}
              bestFitness={bestFitness}
              bestAccuracy={bestAccuracy}
              trainAccuracy={trainAccuracy}
              testAccuracy={testAccuracy}
              onStart={startEvolution}
              onPause={pauseEvolution}
              onStop={stopEvolution}
              onReset={resetEvolution}
              canStart={canStart}
              seedGenomesCount={seedGenomes.length}
            />

            <GenomeLibrary
              trainData={trainData}
              testData={testData}
              onLoadGenomes={handleLoadGenomes}
              isEvolutionRunning={evolutionState.isRunning}
            />
          </div>

          {/* Right Main Area - Results */}
          <div className="lg:col-span-2 space-y-6">
            {evolutionState.bestSolution && (
              <SolutionBanner
                solution={evolutionState.bestSolution}
                generation={evolutionState.currentGeneration}
                onCopy={copyToClipboard}
                onDownload={downloadProgram}
                onContinue={startEvolution}
                isVisible={true}
              />
            )}
            
            <ProgramsTable
              programs={evolutionState.population}
              testCases={displayTestCases}
              onCopyProgram={copyToClipboard}
              onDownloadProgram={downloadProgram}
            />
            
            <EvolutionLog stats={evolutionState.stats} />
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
}

export default App;