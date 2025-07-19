import React, { useState } from 'react';
import { Eye, Copy, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Individual, TestCase } from '../types/brainfuck';

interface ProgramsTableProps {
  programs: Individual[];
  testCases: TestCase[];
  onCopyProgram: (code: string) => void;
  onDownloadProgram: (code: string) => void;
}

export function ProgramsTable({ programs, testCases, onCopyProgram, onDownloadProgram }: ProgramsTableProps) {
  const [selectedProgram, setSelectedProgram] = useState<Individual | null>(null);

  const truncateCode = (code: string, maxLength = 30) => {
    return code.length > maxLength ? code.substring(0, maxLength) + '...' : code;
  };

  const getFitnessColor = (fitness: number) => {
    if (fitness >= 100) return 'text-green-400';
    if (fitness >= 80) return 'text-yellow-400';
    if (fitness >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRowClass = (fitness: number) => {
    return fitness >= 100 ? 'perfect-solution' : '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Programs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {programs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No programs yet. Start evolution to see results!
            </div>
          ) : (
            programs.slice(0, 10).map((program, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-3 rounded-lg border ${getRowClass(program.fitness)}`}
              >
                <div className="text-sm font-mono text-muted-foreground w-8">
                  #{index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">
                    {truncateCode(program.code)}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {program.results.map((passed, i) => (
                      <Badge 
                        key={i} 
                        variant={passed ? "default" : "destructive"}
                        className="text-xs px-1 py-0"
                      >
                        {passed ? '✓' : '✗'}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className={`font-mono font-bold text-sm ${getFitnessColor(program.fitness)}`}>
                    {program.fitness.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Acc: {program.accuracy?.toFixed(1) || '0.0'}%
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedProgram(program)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Program Details</DialogTitle>
                      </DialogHeader>
                      {selectedProgram && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Brainfuck Code</h4>
                            <div className="brainfuck-code break-all">
                              {selectedProgram.code}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">
                                Fitness: <span className={getFitnessColor(selectedProgram.fitness)}>
                                  {selectedProgram.fitness.toFixed(1)}%
                                </span>
                              </h4>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">
                                Accuracy: <span className={getFitnessColor(selectedProgram.accuracy || 0)}>
                                  {selectedProgram.accuracy?.toFixed(1) || '0.0'}%
                                </span>
                              </h4>
                            </div>
                            {selectedProgram.trainAccuracy !== undefined && (
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Train Accuracy: <span className={getFitnessColor(selectedProgram.trainAccuracy)}>
                                    {selectedProgram.trainAccuracy.toFixed(1)}%
                                  </span>
                                </h4>
                              </div>
                            )}
                            {selectedProgram.testAccuracy !== undefined && (
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Test Accuracy: <span className={getFitnessColor(selectedProgram.testAccuracy)}>
                                    {selectedProgram.testAccuracy.toFixed(1)}%
                                  </span>
                                </h4>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Test Results</h4>
                            <div className="space-y-2">
                              {testCases.map((testCase, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center gap-3 text-sm">
                                    <Badge 
                                      variant={selectedProgram.results[i] ? "default" : "destructive"}
                                      className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                                    >
                                      {selectedProgram.results[i] ? '✓' : '✗'}
                                    </Badge>
                                    <span className="font-mono">
                                      Input: <span className="text-blue-400">{testCase.input}</span> → Expected: <span className="text-green-400">{testCase.expected}</span>
                                    </span>
                                  </div>
                                  <div className="ml-9 text-xs font-mono">
                                    <span className="text-muted-foreground">Actual output: </span>
                                    <span className={selectedProgram.results[i] ? "text-green-400" : "text-red-400"}>
                                      {selectedProgram.outputs && selectedProgram.outputs[i] !== undefined 
                                        ? (selectedProgram.outputs[i] === '' 
                                            ? '[empty]' 
                                            : selectedProgram.outputs[i].length === 1 
                                              ? selectedProgram.outputs[i].charCodeAt(0).toString()
                                              : `"${selectedProgram.outputs[i]}"`)
                                        : '[no output]'
                                      }
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-4">
                            <Button 
                              onClick={() => onCopyProgram(selectedProgram.code)}
                              className="flex-1"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Code
                            </Button>
                            <Button 
                              onClick={() => onDownloadProgram(selectedProgram.code)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download .bf
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCopyProgram(program.code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}