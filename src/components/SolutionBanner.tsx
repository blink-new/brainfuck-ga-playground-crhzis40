import React from 'react';
import { CheckCircle, Copy, Download, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Individual } from '../types/brainfuck';

interface SolutionBannerProps {
  solution: Individual;
  generation: number;
  onCopy: (code: string) => void;
  onDownload: (code: string) => void;
  onContinue: () => void;
  isVisible: boolean;
}

export function SolutionBanner({ 
  solution, 
  generation, 
  onCopy, 
  onDownload, 
  onContinue,
  isVisible 
}: SolutionBannerProps) {
  if (!isVisible) return null;

  return (
    <Card className="border-green-500/50 bg-green-500/10">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="h-8 w-8 text-green-400 flex-shrink-0 mt-1" />
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-bold text-green-400">
                🎉 Solution Found!
              </h3>
              <p className="text-sm text-muted-foreground">
                Perfect solution discovered in generation {generation}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-semibold">Brainfuck Code:</div>
              <div className="brainfuck-code bg-background/50">
                {solution.code}
              </div>
              <div className="text-xs text-muted-foreground">
                Program length: {solution.code.length} characters
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => onCopy(solution.code)}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
              
              <Button 
                onClick={() => onDownload(solution.code)}
                size="sm"
                variant="outline"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Download .bf
              </Button>
              
              <Button 
                onClick={onContinue}
                size="sm"
                variant="outline"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Evolving
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              💡 You can continue evolution to find shorter or alternative solutions
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}