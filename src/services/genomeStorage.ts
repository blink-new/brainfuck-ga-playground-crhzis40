import { createClient } from '@blinkdotnew/sdk';
import { Individual, DataSet } from '../types/brainfuck';

const blink = createClient({
  projectId: 'brainfuck-ga-playground-crhzis40',
  authRequired: true
});

export interface StoredGenome {
  id: string;
  userId: string;
  taskName: string;
  taskDescription?: string;
  trainInputs: string;
  trainTargets: string;
  testInputs?: string;
  testTargets?: string;
  programCode: string;
  fitness: number;
  trainAccuracy: number;
  testAccuracy?: number;
  programLength: number;
  generationFound: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSignature {
  trainInputs: string;
  trainTargets: string;
  testInputs?: string;
  testTargets?: string;
}

export class GenomeStorageService {
  private static instance: GenomeStorageService;

  static getInstance(): GenomeStorageService {
    if (!GenomeStorageService.instance) {
      GenomeStorageService.instance = new GenomeStorageService();
    }
    return GenomeStorageService.instance;
  }

  /**
   * Generate a unique task signature based on input/output data
   */
  private generateTaskSignature(trainData: DataSet, testData?: DataSet): string {
    const parts = [trainData.inputs, trainData.targets];
    if (testData?.inputs && testData?.targets) {
      parts.push(testData.inputs, testData.targets);
    }
    return parts.join('|');
  }

  /**
   * Generate a task name based on the data pattern
   */
  private generateTaskName(trainData: DataSet): string {
    try {
      const inputs = trainData.inputs.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      const targets = trainData.targets.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      
      if (inputs.length < 2 || targets.length < 2) {
        return 'Custom Task';
      }

      // Check for common patterns
      const isIncrement = inputs.every((input, i) => targets[i] === input + 1);
      if (isIncrement) return 'Increment';

      const isDouble = inputs.every((input, i) => targets[i] === input * 2);
      if (isDouble) return 'Double';

      const isSquare = inputs.every((input, i) => targets[i] === input * input);
      if (isSquare) return 'Square';

      const isEcho = inputs.every((input, i) => targets[i] === input);
      if (isEcho) return 'Echo';

      const isConstant = targets.every(target => target === targets[0]);
      if (isConstant) return `Constant ${targets[0]}`;

      const isHalve = inputs.every((input, i) => targets[i] === Math.floor(input / 2));
      if (isHalve) return 'Halve';

      return 'Custom Task';
    } catch {
      return 'Custom Task';
    }
  }

  /**
   * Save a genome for a specific task
   */
  async saveGenome(
    individual: Individual,
    trainData: DataSet,
    testData: DataSet,
    generation: number,
    taskName?: string
  ): Promise<void> {
    try {
      const user = await blink.auth.me();
      if (!user) throw new Error('User not authenticated');

      const autoTaskName = taskName || this.generateTaskName(trainData);
      const id = `genome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await blink.db.taskGenomes.create({
        id,
        userId: user.id,
        taskName: autoTaskName,
        taskDescription: `Task: ${autoTaskName}`,
        trainInputs: trainData.inputs,
        trainTargets: trainData.targets,
        testInputs: testData.inputs || null,
        testTargets: testData.targets || null,
        programCode: individual.code,
        fitness: individual.fitness,
        trainAccuracy: individual.trainAccuracy || individual.accuracy,
        testAccuracy: individual.testAccuracy,
        programLength: individual.code.length,
        generationFound: generation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save genome:', error);
      throw error;
    }
  }

  /**
   * Get the best genomes for a specific task
   */
  async getBestGenomesForTask(
    trainData: DataSet,
    testData: DataSet,
    limit: number = 10
  ): Promise<StoredGenome[]> {
    try {
      const user = await blink.auth.me();
      if (!user) return [];

      const taskName = this.generateTaskName(trainData);
      
      const genomes = await blink.db.taskGenomes.list({
        where: {
          AND: [
            { userId: user.id },
            { taskName: taskName }
          ]
        },
        orderBy: { trainAccuracy: 'desc' },
        limit
      });

      return genomes.map(this.mapToStoredGenome);
    } catch (error) {
      console.error('Failed to get genomes for task:', error);
      return [];
    }
  }

  /**
   * Get all stored genomes for the current user
   */
  async getAllGenomes(limit: number = 50): Promise<StoredGenome[]> {
    try {
      const user = await blink.auth.me();
      if (!user) return [];

      const genomes = await blink.db.taskGenomes.list({
        where: { userId: user.id },
        orderBy: { trainAccuracy: 'desc' },
        limit
      });

      return genomes.map(this.mapToStoredGenome);
    } catch (error) {
      console.error('Failed to get all genomes:', error);
      return [];
    }
  }

  /**
   * Get genomes from similar tasks that could be useful for seeding
   */
  async getSimilarTaskGenomes(
    trainData: DataSet,
    testData: DataSet,
    limit: number = 20
  ): Promise<StoredGenome[]> {
    try {
      const user = await blink.auth.me();
      if (!user) return [];

      // Get all genomes and filter by similarity
      const allGenomes = await blink.db.taskGenomes.list({
        where: { userId: user.id },
        orderBy: { trainAccuracy: 'desc' },
        limit: 100
      });

      const currentTaskName = this.generateTaskName(trainData);
      
      // Score genomes by similarity
      const scoredGenomes = allGenomes
        .map(genome => ({
          genome: this.mapToStoredGenome(genome),
          similarity: this.calculateTaskSimilarity(
            currentTaskName,
            genome.taskName,
            trainData,
            { inputs: genome.trainInputs, targets: genome.trainTargets }
          )
        }))
        .filter(item => item.similarity > 0.1) // Only include somewhat similar tasks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.genome);

      return scoredGenomes;
    } catch (error) {
      console.error('Failed to get similar task genomes:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between two tasks
   */
  private calculateTaskSimilarity(
    taskName1: string,
    taskName2: string,
    data1: DataSet,
    data2: DataSet
  ): number {
    // Same task name gets high similarity
    if (taskName1 === taskName2) return 0.9;

    // Related task names get medium similarity
    const relatedTasks = [
      ['Increment', 'Double', 'Square'],
      ['Echo', 'Constant'],
      ['Halve', 'Double']
    ];

    for (const group of relatedTasks) {
      if (group.includes(taskName1) && group.includes(taskName2)) {
        return 0.6;
      }
    }

    // Calculate data pattern similarity
    try {
      const inputs1 = data1.inputs.split(',').map(s => parseInt(s.trim()));
      const targets1 = data1.targets.split(',').map(s => parseInt(s.trim()));
      const inputs2 = data2.inputs.split(',').map(s => parseInt(s.trim()));
      const targets2 = data2.targets.split(',').map(s => parseInt(s.trim()));

      // Check if input ranges are similar
      const range1 = Math.max(...inputs1) - Math.min(...inputs1);
      const range2 = Math.max(...inputs2) - Math.min(...inputs2);
      const rangeRatio = Math.min(range1, range2) / Math.max(range1, range2);

      // Check if output ranges are similar
      const outRange1 = Math.max(...targets1) - Math.min(...targets1);
      const outRange2 = Math.max(...targets2) - Math.min(...targets2);
      const outRangeRatio = Math.min(outRange1, outRange2) / Math.max(outRange1, outRange2);

      return (rangeRatio + outRangeRatio) / 4; // Low similarity for different patterns
    } catch {
      return 0.1; // Minimal similarity if we can't parse the data
    }
  }

  /**
   * Delete a stored genome
   */
  async deleteGenome(genomeId: string): Promise<void> {
    try {
      const user = await blink.auth.me();
      if (!user) throw new Error('User not authenticated');

      await blink.db.taskGenomes.delete(genomeId);
    } catch (error) {
      console.error('Failed to delete genome:', error);
      throw error;
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<{ taskName: string; count: number; bestAccuracy: number }[]> {
    try {
      const user = await blink.auth.me();
      if (!user) return [];

      const genomes = await blink.db.taskGenomes.list({
        where: { userId: user.id },
        orderBy: { trainAccuracy: 'desc' }
      });

      const taskMap = new Map<string, { count: number; bestAccuracy: number }>();
      
      genomes.forEach(genome => {
        const taskName = genome.taskName;
        const accuracy = Number(genome.trainAccuracy) || 0;
        
        if (!taskMap.has(taskName)) {
          taskMap.set(taskName, { count: 0, bestAccuracy: 0 });
        }
        
        const stats = taskMap.get(taskName)!;
        stats.count++;
        stats.bestAccuracy = Math.max(stats.bestAccuracy, accuracy);
      });

      return Array.from(taskMap.entries()).map(([taskName, stats]) => ({
        taskName,
        count: stats.count,
        bestAccuracy: stats.bestAccuracy
      }));
    } catch (error) {
      console.error('Failed to get task stats:', error);
      return [];
    }
  }

  /**
   * Map database record to StoredGenome interface
   */
  private mapToStoredGenome(record: any): StoredGenome {
    return {
      id: record.id,
      userId: record.userId,
      taskName: record.taskName,
      taskDescription: record.taskDescription,
      trainInputs: record.trainInputs,
      trainTargets: record.trainTargets,
      testInputs: record.testInputs,
      testTargets: record.testTargets,
      programCode: record.programCode,
      fitness: Number(record.fitness),
      trainAccuracy: Number(record.trainAccuracy),
      testAccuracy: record.testAccuracy ? Number(record.testAccuracy) : undefined,
      programLength: Number(record.programLength),
      generationFound: Number(record.generationFound),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}

export const genomeStorage = GenomeStorageService.getInstance();