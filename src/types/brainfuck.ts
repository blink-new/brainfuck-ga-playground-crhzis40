export interface DataSet {
  inputs: string; // comma-separated values
  targets: string; // comma-separated values
}

export interface TestCase {
  input: string;
  expected: string;
}

export interface GASettings {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitism: number;
  maxGenerations: number;
  maxProgramLength: number;
}

export interface Individual {
  code: string;
  fitness: number;
  accuracy: number;
  results: boolean[];
  outputs: string[];
  trainResults?: boolean[];
  testResults?: boolean[];
  trainAccuracy?: number;
  testAccuracy?: number;
}

export interface GenerationStats {
  generation: number;
  bestFitness: number;
  averageFitness: number;
  bestAccuracy: number;
  averageAccuracy: number;
  bestProgram: string;
  trainAccuracy?: number;
  testAccuracy?: number;
}

export interface EvolutionState {
  isRunning: boolean;
  isPaused: boolean;
  currentGeneration: number;
  population: Individual[];
  stats: GenerationStats[];
  bestSolution: Individual | null;
}

export interface Preset {
  name: string;
  description: string;
  testCases: TestCase[];
}