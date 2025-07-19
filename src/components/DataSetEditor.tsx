import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DataSet } from '../types/brainfuck';
import { presets } from '../data/presets';

interface DataSetEditorProps {
  trainData: DataSet;
  testData: DataSet;
  onTrainDataChange: (data: DataSet) => void;
  onTestDataChange: (data: DataSet) => void;
}

export function DataSetEditor({ 
  trainData, 
  testData, 
  onTrainDataChange, 
  onTestDataChange 
}: DataSetEditorProps) {
  
  const loadPreset = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      // Convert preset test cases to comma-separated format
      const inputs = preset.testCases.map(tc => tc.input.charCodeAt(0).toString()).join(',');
      const targets = preset.testCases.map(tc => tc.expected.charCodeAt(0).toString()).join(',');
      
      // Use 80% for training, 20% for testing
      const inputArray = inputs.split(',');
      const targetArray = targets.split(',');
      const splitIndex = Math.ceil(inputArray.length * 0.8);
      
      const trainInputs = inputArray.slice(0, splitIndex).join(',');
      const trainTargets = targetArray.slice(0, splitIndex).join(',');
      const testInputs = inputArray.slice(splitIndex).join(',');
      const testTargets = targetArray.slice(splitIndex).join(',');
      
      onTrainDataChange({ inputs: trainInputs, targets: trainTargets });
      onTestDataChange({ inputs: testInputs, targets: testTargets });
    }
  };

  const validateData = (inputs: string, targets: string): { isValid: boolean; message?: string } => {
    if (!inputs.trim() || !targets.trim()) {
      return { isValid: false, message: 'Both inputs and targets are required' };
    }
    
    const inputArray = inputs.split(',').map(s => s.trim()).filter(s => s);
    const targetArray = targets.split(',').map(s => s.trim()).filter(s => s);
    
    if (inputArray.length !== targetArray.length) {
      return { isValid: false, message: 'Number of inputs must match number of targets' };
    }
    
    if (inputArray.length === 0) {
      return { isValid: false, message: 'At least one input/target pair is required' };
    }
    
    // Validate that all values are valid numbers (0-255)
    for (const input of inputArray) {
      const num = parseInt(input);
      if (isNaN(num) || num < 0 || num > 255) {
        return { isValid: false, message: `Invalid input value: ${input} (must be 0-255)` };
      }
    }
    
    for (const target of targetArray) {
      const num = parseInt(target);
      if (isNaN(num) || num < 0 || num > 255) {
        return { isValid: false, message: `Invalid target value: ${target} (must be 0-255)` };
      }
    }
    
    return { isValid: true };
  };

  const trainValidation = validateData(trainData.inputs, trainData.targets);
  const testValidation = validateData(testData.inputs, testData.targets);

  const getDataPreview = (inputs: string, targets: string) => {
    if (!inputs.trim() || !targets.trim()) return '';
    
    const inputArray = inputs.split(',').map(s => s.trim()).filter(s => s);
    const targetArray = targets.split(',').map(s => s.trim()).filter(s => s);
    
    const pairs = inputArray.slice(0, 3).map((input, i) => {
      const target = targetArray[i] || '?';
      return `${input}→${target}`;
    });
    
    const preview = pairs.join(', ');
    return inputArray.length > 3 ? `${preview}, ...` : preview;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Training & Test Data</CardTitle>
        <div className="flex gap-2">
          <Select onValueChange={loadPreset}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Load preset..." />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.name} value={preset.name}>
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Training Data */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Training Data</Label>
            <span className="text-xs text-muted-foreground">
              (Used for evolution)
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="train-inputs" className="text-xs">
                Inputs (comma-separated, 0-255)
              </Label>
              <Textarea
                id="train-inputs"
                value={trainData.inputs}
                onChange={(e) => onTrainDataChange({ ...trainData, inputs: e.target.value })}
                placeholder="1,2,3,4,5"
                className="font-mono text-sm resize-none"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="train-targets" className="text-xs">
                Targets (comma-separated, 0-255)
              </Label>
              <Textarea
                id="train-targets"
                value={trainData.targets}
                onChange={(e) => onTrainDataChange({ ...trainData, targets: e.target.value })}
                placeholder="2,4,6,8,10"
                className="font-mono text-sm resize-none"
                rows={2}
              />
            </div>
          </div>
          
          {trainData.inputs && trainData.targets && (
            <div className="text-xs">
              {trainValidation.isValid ? (
                <div className="text-muted-foreground">
                  <span className="text-green-600">✓</span> {getDataPreview(trainData.inputs, trainData.targets)}
                </div>
              ) : (
                <div className="text-red-600">
                  ✗ {trainValidation.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Data */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Test Data</Label>
            <span className="text-xs text-muted-foreground">
              (Used for final validation)
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="test-inputs" className="text-xs">
                Inputs (comma-separated, 0-255)
              </Label>
              <Textarea
                id="test-inputs"
                value={testData.inputs}
                onChange={(e) => onTestDataChange({ ...testData, inputs: e.target.value })}
                placeholder="6,7,8"
                className="font-mono text-sm resize-none"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="test-targets" className="text-xs">
                Targets (comma-separated, 0-255)
              </Label>
              <Textarea
                id="test-targets"
                value={testData.targets}
                onChange={(e) => onTestDataChange({ ...testData, targets: e.target.value })}
                placeholder="12,14,16"
                className="font-mono text-sm resize-none"
                rows={2}
              />
            </div>
          </div>
          
          {testData.inputs && testData.targets && (
            <div className="text-xs">
              {testValidation.isValid ? (
                <div className="text-muted-foreground">
                  <span className="text-green-600">✓</span> {getDataPreview(testData.inputs, testData.targets)}
                </div>
              ) : (
                <div className="text-red-600">
                  ✗ {testValidation.message}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Training Data:</strong> Used to evolve programs (larger dataset recommended)</p>
          <p>🎯 <strong>Test Data:</strong> Used to validate final solution (unseen data)</p>
          <p>📊 Evolution stops when both train and test reach 100% accuracy</p>
        </div>
      </CardContent>
    </Card>
  );
}