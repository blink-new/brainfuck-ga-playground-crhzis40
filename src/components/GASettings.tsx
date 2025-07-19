import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { GASettings as GASettingsType } from '../types/brainfuck';

interface GASettingsProps {
  settings: GASettingsType;
  onSettingsChange: (settings: GASettingsType) => void;
  disabled?: boolean;
}

export function GASettings({ settings, onSettingsChange, disabled = false }: GASettingsProps) {
  const updateSetting = (key: keyof GASettingsType, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Genetic Algorithm Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="population-size">Population Size</Label>
          <Input
            id="population-size"
            type="number"
            min="10"
            max="1000"
            value={settings.populationSize}
            onChange={(e) => updateSetting('populationSize', parseInt(e.target.value) || 50)}
            disabled={disabled}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Number of programs in each generation (10-1000)
          </p>
        </div>

        <div className="space-y-3">
          <Label>Mutation Rate: {(settings.mutationRate * 100).toFixed(1)}%</Label>
          <Slider
            value={[settings.mutationRate * 100]}
            onValueChange={([value]) => updateSetting('mutationRate', value / 100)}
            min={0.1}
            max={10}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Probability of random changes to programs
          </p>
        </div>

        <div className="space-y-3">
          <Label>Crossover Rate: {(settings.crossoverRate * 100).toFixed(0)}%</Label>
          <Slider
            value={[settings.crossoverRate * 100]}
            onValueChange={([value]) => updateSetting('crossoverRate', value / 100)}
            min={10}
            max={100}
            step={5}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Probability of combining two parent programs
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="elitism">Elitism Count</Label>
          <Input
            id="elitism"
            type="number"
            min="0"
            max={Math.floor(settings.populationSize / 2)}
            value={settings.elitism}
            onChange={(e) => updateSetting('elitism', parseInt(e.target.value) || 2)}
            disabled={disabled}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Best programs automatically kept each generation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-generations">Max Generations</Label>
          <Input
            id="max-generations"
            type="number"
            min="10"
            max="10000"
            value={settings.maxGenerations}
            onChange={(e) => updateSetting('maxGenerations', parseInt(e.target.value) || 1000)}
            disabled={disabled}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Stop evolution after this many generations
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-program-length">Max Program Length</Label>
          <Input
            id="max-program-length"
            type="number"
            min="5"
            max="500"
            value={settings.maxProgramLength}
            onChange={(e) => updateSetting('maxProgramLength', parseInt(e.target.value) || 100)}
            disabled={disabled}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Maximum allowed characters in evolved programs
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>🧬 <strong>Population:</strong> Larger = better solutions, slower evolution</p>
            <p>🎲 <strong>Mutation:</strong> Higher = more exploration, less stability</p>
            <p>💕 <strong>Crossover:</strong> Higher = more mixing of successful traits</p>
            <p>👑 <strong>Elitism:</strong> Preserves best solutions across generations</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}