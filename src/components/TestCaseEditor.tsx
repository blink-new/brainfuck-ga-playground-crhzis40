import React from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TestCase } from '../types/brainfuck';
import { presets } from '../data/presets';

interface TestCaseEditorProps {
  testCases: TestCase[];
  onTestCasesChange: (testCases: TestCase[]) => void;
}

export function TestCaseEditor({ testCases, onTestCasesChange }: TestCaseEditorProps) {
  const addTestCase = () => {
    onTestCasesChange([...testCases, { input: '', expected: '' }]);
  };

  const removeTestCase = (index: number) => {
    onTestCasesChange(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: 'input' | 'expected', value: string) => {
    const updated = testCases.map((testCase, i) => 
      i === index ? { ...testCase, [field]: value } : testCase
    );
    onTestCasesChange(updated);
  };

  const loadPreset = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      onTestCasesChange(preset.testCases.map(tc => ({
        input: tc.input.charCodeAt(0).toString(),
        expected: tc.expected.charCodeAt(0).toString()
      })));
    }
  };

  const formatByteValue = (value: string): string => {
    const num = parseInt(value);
    if (isNaN(num)) return value;
    return `${num} (0x${num.toString(16).toUpperCase().padStart(2, '0')})`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Test Cases</CardTitle>
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
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {testCases.map((testCase, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor={`input-${index}`} className="text-xs">
                  Input (byte value)
                </Label>
                <Input
                  id={`input-${index}`}
                  type="number"
                  min="0"
                  max="255"
                  value={testCase.input}
                  onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                  placeholder="0-255"
                  className="font-mono"
                />
                {testCase.input && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatByteValue(testCase.input)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor={`expected-${index}`} className="text-xs">
                  Expected (byte value)
                </Label>
                <Input
                  id={`expected-${index}`}
                  type="number"
                  min="0"
                  max="255"
                  value={testCase.expected}
                  onChange={(e) => updateTestCase(index, 'expected', e.target.value)}
                  placeholder="0-255"
                  className="font-mono"
                />
                {testCase.expected && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatByteValue(testCase.expected)}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeTestCase(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <Button onClick={addTestCase} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Test Case
        </Button>
        
        <div className="text-xs text-muted-foreground">
          <p>💡 Tip: Input and output are single byte values (0-255)</p>
          <p>Use presets above for common patterns like doubling or incrementing</p>
        </div>
      </CardContent>
    </Card>
  );
}