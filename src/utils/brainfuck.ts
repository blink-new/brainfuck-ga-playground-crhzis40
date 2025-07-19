/**
 * Brainfuck interpreter with timeout protection
 */
export function executeBrainfuck(code: string, input: string, maxSteps = 10000): string {
  const memory = new Array(30000).fill(0);
  let pointer = 0;
  let codePointer = 0;
  let inputPointer = 0;
  let output = '';
  let steps = 0;
  
  const bracketMap = buildBracketMap(code);
  
  while (codePointer < code.length && steps < maxSteps) {
    const command = code[codePointer];
    steps++;
    
    switch (command) {
      case '>':
        pointer = (pointer + 1) % memory.length;
        break;
      case '<':
        pointer = (pointer - 1 + memory.length) % memory.length;
        break;
      case '+':
        memory[pointer] = (memory[pointer] + 1) % 256;
        break;
      case '-':
        memory[pointer] = (memory[pointer] - 1 + 256) % 256;
        break;
      case '.':
        output += String.fromCharCode(memory[pointer]);
        break;
      case ',':
        if (inputPointer < input.length) {
          memory[pointer] = input.charCodeAt(inputPointer);
          inputPointer++;
        } else {
          memory[pointer] = 0;
        }
        break;
      case '[':
        if (memory[pointer] === 0) {
          codePointer = bracketMap[codePointer];
        }
        break;
      case ']':
        if (memory[pointer] !== 0) {
          codePointer = bracketMap[codePointer];
        }
        break;
    }
    
    codePointer++;
  }
  
  return output;
}

function buildBracketMap(code: string): { [key: number]: number } {
  const map: { [key: number]: number } = {};
  const stack: number[] = [];
  
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '[') {
      stack.push(i);
    } else if (code[i] === ']') {
      if (stack.length > 0) {
        const start = stack.pop()!;
        map[start] = i;
        map[i] = start;
      }
    }
  }
  
  return map;
}

/**
 * Generate a random Brainfuck program
 */
export function generateRandomProgram(length: number, maxLength: number = 100): string {
  const commands = ['>', '<', '+', '-', '.', ',', '[', ']'];
  let program = '';
  let bracketDepth = 0;
  
  for (let i = 0; i < length; i++) {
    let availableCommands = [...commands];
    
    // Avoid unmatched brackets
    if (bracketDepth === 0) {
      availableCommands = availableCommands.filter(cmd => cmd !== ']');
    }
    
    const command = availableCommands[Math.floor(Math.random() * availableCommands.length)];
    
    if (command === '[') {
      bracketDepth++;
    } else if (command === ']') {
      bracketDepth--;
    }
    
    program += command;
  }
  
  // Close any remaining open brackets
  while (bracketDepth > 0 && program.length < maxLength) {
    program += ']';
    bracketDepth--;
  }
  
  // Ensure we don't exceed max length
  if (program.length > maxLength) {
    program = program.substring(0, maxLength);
  }
  
  return program;
}

/**
 * Advanced mutation that can alter, shrink, or grow programs
 */
export function mutateProgram(program: string, mutationRate: number, maxLength: number = 100): string {
  const commands = ['>', '<', '+', '-', '.', ',', '[', ']'];
  let mutated = '';
  
  // Apply multiple types of mutations
  for (let i = 0; i < program.length; i++) {
    if (Math.random() < mutationRate) {
      const mutationType = Math.random();
      
      if (mutationType < 0.4) {
        // Replace/Alter: Change current character
        mutated += commands[Math.floor(Math.random() * commands.length)];
      } else if (mutationType < 0.7) {
        // Grow: Insert new character(s)
        const insertCount = Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 3) + 2; // 1-4 chars
        mutated += program[i]; // Keep original
        for (let j = 0; j < insertCount; j++) {
          mutated += commands[Math.floor(Math.random() * commands.length)];
        }
      } else {
        // Shrink: Delete character (skip it)
        // Optionally delete multiple characters
        if (Math.random() < 0.3 && i + 1 < program.length) {
          i++; // Skip next character too
        }
      }
    } else {
      mutated += program[i];
    }
  }
  
  // Additional growth mutations: append or prepend (respect max length)
  if (Math.random() < mutationRate * 0.5 && mutated.length < maxLength) {
    const growthType = Math.random();
    const maxGrowth = Math.min(5, maxLength - mutated.length);
    const growthSize = Math.floor(Math.random() * maxGrowth) + 1;
    
    if (growthType < 0.5) {
      // Prepend
      for (let i = 0; i < growthSize && mutated.length < maxLength; i++) {
        mutated = commands[Math.floor(Math.random() * commands.length)] + mutated;
      }
    } else {
      // Append
      for (let i = 0; i < growthSize && mutated.length < maxLength; i++) {
        mutated += commands[Math.floor(Math.random() * commands.length)];
      }
    }
  }
  
  // Additional shrinkage: remove random segments
  if (Math.random() < mutationRate * 0.3 && mutated.length > 3) {
    const segmentStart = Math.floor(Math.random() * mutated.length);
    const segmentLength = Math.floor(Math.random() * Math.min(mutated.length - segmentStart, 5)) + 1;
    mutated = mutated.slice(0, segmentStart) + mutated.slice(segmentStart + segmentLength);
  }
  
  // Ensure we don't exceed max length and program is non-empty
  if (mutated.length > maxLength) {
    mutated = mutated.substring(0, maxLength);
  }
  
  return mutated || '+'; // Ensure non-empty program
}

/**
 * Advanced crossover that can merge and swap program segments
 */
export function crossoverPrograms(parent1: string, parent2: string): [string, string] {
  if (parent1.length === 0 || parent2.length === 0) {
    return [parent1, parent2];
  }
  
  const crossoverType = Math.random();
  
  if (crossoverType < 0.4) {
    // Single-point crossover (traditional)
    const point1 = Math.floor(Math.random() * parent1.length);
    const point2 = Math.floor(Math.random() * parent2.length);
    
    const child1 = parent1.slice(0, point1) + parent2.slice(point2);
    const child2 = parent2.slice(0, point2) + parent1.slice(point1);
    
    return [child1, child2];
  } else if (crossoverType < 0.7) {
    // Two-point crossover (swap middle segments)
    const start1 = Math.floor(Math.random() * parent1.length);
    const end1 = Math.min(start1 + Math.floor(Math.random() * (parent1.length - start1)), parent1.length);
    
    const start2 = Math.floor(Math.random() * parent2.length);
    const end2 = Math.min(start2 + Math.floor(Math.random() * (parent2.length - start2)), parent2.length);
    
    const child1 = parent1.slice(0, start1) + parent2.slice(start2, end2) + parent1.slice(end1);
    const child2 = parent2.slice(0, start2) + parent1.slice(start1, end1) + parent2.slice(end2);
    
    return [child1, child2];
  } else if (crossoverType < 0.85) {
    // Merge crossover (combine both parents)
    const mergeType = Math.random();
    
    if (mergeType < 0.5) {
      // Interleave segments
      const child1 = interleavePrograms(parent1, parent2);
      const child2 = interleavePrograms(parent2, parent1);
      return [child1, child2];
    } else {
      // Concatenate with random order
      const child1 = Math.random() < 0.5 ? parent1 + parent2 : parent2 + parent1;
      const child2 = Math.random() < 0.5 ? parent2 + parent1 : parent1 + parent2;
      return [child1, child2];
    }
  } else {
    // Uniform crossover (character-by-character)
    let child1 = '';
    let child2 = '';
    
    const maxLength = Math.max(parent1.length, parent2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const char1 = i < parent1.length ? parent1[i] : '';
      const char2 = i < parent2.length ? parent2[i] : '';
      
      if (Math.random() < 0.5) {
        child1 += char1;
        child2 += char2;
      } else {
        child1 += char2;
        child2 += char1;
      }
    }
    
    return [child1 || '+', child2 || '+'];
  }
}

/**
 * Interleave two programs by alternating segments
 */
function interleavePrograms(prog1: string, prog2: string): string {
  let result = '';
  let i1 = 0, i2 = 0;
  let useFirst = true;
  
  while (i1 < prog1.length || i2 < prog2.length) {
    const segmentLength = Math.floor(Math.random() * 5) + 1; // 1-5 characters
    
    if (useFirst && i1 < prog1.length) {
      const end = Math.min(i1 + segmentLength, prog1.length);
      result += prog1.slice(i1, end);
      i1 = end;
    } else if (!useFirst && i2 < prog2.length) {
      const end = Math.min(i2 + segmentLength, prog2.length);
      result += prog2.slice(i2, end);
      i2 = end;
    }
    
    useFirst = !useFirst;
    
    // If one program is exhausted, use the other
    if (i1 >= prog1.length) useFirst = false;
    if (i2 >= prog2.length) useFirst = true;
  }
  
  return result || '+';
}