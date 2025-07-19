import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GenerationStats } from '../types/brainfuck';

interface EvolutionLogProps {
  stats: GenerationStats[];
}

export function EvolutionLog({ stats }: EvolutionLogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [stats]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLogColor = (bestFitness: number) => {
    if (bestFitness >= 100) return 'text-green-400';
    if (bestFitness >= 80) return 'text-yellow-400';
    if (bestFitness >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Evolution Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={logRef} className="evolution-log">
          {stats.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              Evolution log will appear here...
            </div>
          ) : (
            stats.map((stat, index) => (
              <div key={index} className="mb-1">
                <span className="text-muted-foreground text-xs">
                  [{formatTime(Date.now())}]
                </span>
                <span className="ml-2">
                  Gen {stat.generation.toString().padStart(3, ' ')} |
                </span>
                <span className={`ml-1 font-semibold ${getLogColor(stat.bestFitness)}`}>
                  Best: {stat.bestFitness.toFixed(1)}%
                </span>
                <span className="ml-2 text-muted-foreground">
                  | Avg: {stat.averageFitness.toFixed(1)}%
                </span>
                {stat.bestAccuracy !== undefined && (
                  <span className="ml-2 text-blue-400">
                    | Acc: {stat.bestAccuracy.toFixed(1)}%
                  </span>
                )}
                {stat.trainAccuracy !== undefined && stat.testAccuracy !== undefined && (
                  <span className="ml-2 text-purple-400">
                    | Train: {stat.trainAccuracy.toFixed(1)}% Test: {stat.testAccuracy.toFixed(1)}%
                  </span>
                )}
                {stat.trainAccuracy === 100 && stat.testAccuracy === 100 && (
                  <span className="ml-2 text-green-400 font-bold">
                    🎉 PERFECT SOLUTION!
                  </span>
                )}
                {stat.bestProgram && (
                  <div className="ml-4 text-xs text-muted-foreground truncate">
                    Best program: {stat.bestProgram.length > 50 ? 
                      stat.bestProgram.substring(0, 50) + '...' : 
                      stat.bestProgram
                    }
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}