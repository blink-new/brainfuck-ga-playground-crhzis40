import React from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';

interface EvolutionControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  currentGeneration: number;
  maxGenerations: number;
  bestFitness: number;
  bestAccuracy?: number;
  trainAccuracy?: number;
  testAccuracy?: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  canStart: boolean;
  seedGenomesCount?: number;
}

export function EvolutionControls({
  isRunning,
  isPaused,
  currentGeneration,
  maxGenerations,
  bestFitness,
  bestAccuracy,
  trainAccuracy,
  testAccuracy,
  onStart,
  onPause,
  onStop,
  onReset,
  canStart,
  seedGenomesCount = 0
}: EvolutionControlsProps) {
  const progress = maxGenerations > 0 ? (currentGeneration / maxGenerations) * 100 : 0;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            {!isRunning ? (
              <Button 
                onClick={onStart} 
                disabled={!canStart}
                className="flex-1"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {isPaused ? 'Resume' : 'Start Evolution'}
              </Button>
            ) : (
              <Button 
                onClick={onPause} 
                variant="secondary"
                className="flex-1"
                size="lg"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button 
              onClick={onStop} 
              variant="outline"
              disabled={!isRunning && !isPaused}
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            
            <Button 
              onClick={onReset} 
              variant="outline"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generation Progress</span>
              <span className="font-mono">
                {currentGeneration} / {maxGenerations}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono text-primary">
                {currentGeneration}
              </div>
              <div className="text-xs text-muted-foreground">Generation</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold font-mono text-accent">
                {bestFitness.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Best Fitness</div>
            </div>
          </div>

          {(bestAccuracy !== undefined || trainAccuracy !== undefined || testAccuracy !== undefined) && (
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {bestAccuracy !== undefined && (
                <div className="space-y-1">
                  <div className="font-bold font-mono text-green-400">
                    {bestAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              )}
              {trainAccuracy !== undefined && (
                <div className="space-y-1">
                  <div className="font-bold font-mono text-blue-400">
                    {trainAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Train</div>
                </div>
              )}
              {testAccuracy !== undefined && (
                <div className="space-y-1">
                  <div className="font-bold font-mono text-purple-400">
                    {testAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Test</div>
                </div>
              )}
            </div>
          )}

          {seedGenomesCount > 0 && (
            <div className="text-xs text-center p-2 bg-primary/10 text-primary rounded">
              🧬 {seedGenomesCount} seed genome{seedGenomesCount !== 1 ? 's' : ''} loaded
            </div>
          )}

          {!canStart && (
            <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
              ⚠️ Add training data to start evolution
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}