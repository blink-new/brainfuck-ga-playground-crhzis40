import { Individual, TestCase, GASettings } from '../types/brainfuck';
import { executeBrainfuck, generateRandomProgram, mutateProgram, crossoverPrograms } from './brainfuck';

export class GeneticAlgorithm {
  private settings: GASettings;
  private trainCases: TestCase[];
  private testCases: TestCase[];
  private population: Individual[] = [];
  private generation = 0;
  private seedGenomes: string[] = [];

  constructor(settings: GASettings, trainCases: TestCase[], testCases: TestCase[] = []) {
    this.settings = settings;
    this.trainCases = trainCases;
    this.testCases = testCases;
  }

  initialize(): void {
    this.population = [];
    this.generation = 0;
    const uniqueCodes = new Set<string>();
    
    // First, add seed genomes if available
    let seededCount = 0;
    for (const seedCode of this.seedGenomes) {
      if (seededCount >= Math.floor(this.settings.populationSize * 0.3)) break; // Max 30% seeded
      if (!uniqueCodes.has(seedCode)) {
        uniqueCodes.add(seedCode);
        const individual = this.evaluateIndividual(seedCode);
        this.population.push(individual);
        seededCount++;
      }
    }
    
    // Generate unique individuals with wider length distribution for remaining slots
    while (this.population.length < this.settings.populationSize) {
      // Wider distribution: 20% short (5-15), 60% medium (16-40), 20% long (41-maxLength)
      const lengthCategory = Math.random();
      let programLength: number;
      
      if (lengthCategory < 0.2) {
        // Short programs (5-15 chars)
        programLength = Math.floor(Math.random() * 11) + 5;
      } else if (lengthCategory < 0.8) {
        // Medium programs (16-40 chars)
        programLength = Math.floor(Math.random() * 25) + 16;
      } else {
        // Long programs (41 chars up to maxProgramLength)
        const maxLength = Math.min(this.settings.maxProgramLength, 100);
        programLength = Math.floor(Math.random() * (maxLength - 40)) + 41;
      }
      
      const code = generateRandomProgram(programLength, this.settings.maxProgramLength);
      
      // Ensure uniqueness
      if (!uniqueCodes.has(code)) {
        uniqueCodes.add(code);
        const individual = this.evaluateIndividual(code);
        this.population.push(individual);
      }
    }
    
    this.sortPopulation();
  }

  evolve(): Individual[] {
    const newPopulation: Individual[] = [];
    const uniqueCodes = new Set<string>();
    
    // Elitism: keep best individuals
    const elite = this.population.slice(0, this.settings.elitism);
    newPopulation.push(...elite);
    elite.forEach(ind => uniqueCodes.add(ind.code));
    
    // Generate offspring with uniqueness guarantee
    let attempts = 0;
    const maxAttempts = this.settings.populationSize * 10; // Prevent infinite loops
    
    while (newPopulation.length < this.settings.populationSize && attempts < maxAttempts) {
      attempts++;
      
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();
      
      let child1Code = parent1.code;
      let child2Code = parent2.code;
      
      // Crossover
      if (Math.random() < this.settings.crossoverRate) {
        [child1Code, child2Code] = crossoverPrograms(parent1.code, parent2.code);
      }
      
      // Mutation with length constraint
      child1Code = mutateProgram(child1Code, this.settings.mutationRate, this.settings.maxProgramLength);
      child2Code = mutateProgram(child2Code, this.settings.mutationRate, this.settings.maxProgramLength);
      
      // Add unique children only
      if (!uniqueCodes.has(child1Code)) {
        uniqueCodes.add(child1Code);
        const child1 = this.evaluateIndividual(child1Code);
        newPopulation.push(child1);
      }
      
      if (newPopulation.length < this.settings.populationSize && !uniqueCodes.has(child2Code)) {
        uniqueCodes.add(child2Code);
        const child2 = this.evaluateIndividual(child2Code);
        newPopulation.push(child2);
      }
    }
    
    // Fill remaining slots with random unique individuals if needed
    while (newPopulation.length < this.settings.populationSize) {
      const programLength = Math.floor(Math.random() * Math.min(this.settings.maxProgramLength, 50)) + 5;
      const code = generateRandomProgram(programLength, this.settings.maxProgramLength);
      if (!uniqueCodes.has(code)) {
        uniqueCodes.add(code);
        const individual = this.evaluateIndividual(code);
        newPopulation.push(individual);
      }
    }
    
    this.population = newPopulation.slice(0, this.settings.populationSize);
    this.sortPopulation();
    this.generation++;
    
    return this.population;
  }

  private evaluateIndividual(code: string): Individual {
    // Evaluate on training data (used for fitness)
    const trainResults: boolean[] = [];
    const trainOutputs: string[] = [];
    let passedTrainTests = 0;
    
    for (const testCase of this.trainCases) {
      try {
        const output = executeBrainfuck(code, testCase.input);
        trainOutputs.push(output);
        const passed = output === testCase.expected;
        trainResults.push(passed);
        if (passed) passedTrainTests++;
      } catch (error) {
        trainOutputs.push('[ERROR]');
        trainResults.push(false);
      }
    }
    
    // Evaluate on test data (used for validation)
    const testResults: boolean[] = [];
    const testOutputs: string[] = [];
    let passedTestTests = 0;
    
    for (const testCase of this.testCases) {
      try {
        const output = executeBrainfuck(code, testCase.input);
        testOutputs.push(output);
        const passed = output === testCase.expected;
        testResults.push(passed);
        if (passed) passedTestTests++;
      } catch (error) {
        testOutputs.push('[ERROR]');
        testResults.push(false);
      }
    }
    
    // Calculate accuracies
    const trainAccuracy = this.trainCases.length > 0 ? (passedTrainTests / this.trainCases.length) * 100 : 0;
    const testAccuracy = this.testCases.length > 0 ? (passedTestTests / this.testCases.length) * 100 : 0;
    
    // Fitness is based on training accuracy with slight penalty for program length
    const lengthPenalty = Math.min(code.length * 0.1, 5); // Max 5% penalty
    const fitness = Math.max(0, trainAccuracy - lengthPenalty);
    
    // For display purposes, use training data as primary results
    const results = trainResults;
    const outputs = trainOutputs;
    const accuracy = trainAccuracy;
    
    return {
      code,
      fitness,
      accuracy,
      results,
      outputs,
      trainResults,
      testResults,
      trainAccuracy,
      testAccuracy
    };
  }

  private tournamentSelection(): Individual {
    const tournamentSize = 3;
    let best = this.population[Math.floor(Math.random() * this.population.length)];
    
    for (let i = 1; i < tournamentSize; i++) {
      const candidate = this.population[Math.floor(Math.random() * this.population.length)];
      if (candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    
    return best;
  }

  private sortPopulation(): void {
    this.population.sort((a, b) => b.fitness - a.fitness);
  }

  getBestIndividual(): Individual | null {
    return this.population.length > 0 ? this.population[0] : null;
  }

  getAverageFitness(): number {
    if (this.population.length === 0) return 0;
    const sum = this.population.reduce((acc, ind) => acc + ind.fitness, 0);
    return sum / this.population.length;
  }

  getAverageAccuracy(): number {
    if (this.population.length === 0) return 0;
    const sum = this.population.reduce((acc, ind) => acc + ind.accuracy, 0);
    return sum / this.population.length;
  }

  getGeneration(): number {
    return this.generation;
  }

  getPopulation(): Individual[] {
    return [...this.population];
  }

  updateSettings(settings: GASettings): void {
    this.settings = settings;
  }

  updateTrainCases(trainCases: TestCase[]): void {
    this.trainCases = trainCases;
  }

  updateTestCases(testCases: TestCase[]): void {
    this.testCases = testCases;
  }

  // Check if we have a perfect solution on both train and test data
  hasPerfectSolution(): boolean {
    const best = this.getBestIndividual();
    if (!best) return false;
    
    return (best.trainAccuracy === 100) && 
           (this.testCases.length === 0 || best.testAccuracy === 100);
  }

  // Set seed genomes to initialize population with known good solutions
  setSeedGenomes(genomes: string[]): void {
    this.seedGenomes = [...genomes];
  }

  // Get seed genomes
  getSeedGenomes(): string[] {
    return [...this.seedGenomes];
  }

  // Clear seed genomes
  clearSeedGenomes(): void {
    this.seedGenomes = [];
  }

  // Get the number of seeded individuals in current population
  getSeededCount(): number {
    if (this.seedGenomes.length === 0) return 0;
    return this.population.filter(ind => this.seedGenomes.includes(ind.code)).length;
  }
}