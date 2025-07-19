import { Preset } from '../types/brainfuck';

export const presets: Preset[] = [
  {
    name: "Double Number",
    description: "Multiply input by 2",
    testCases: [
      { input: "\x01", expected: "\x02" }, // 1 -> 2
      { input: "\x02", expected: "\x04" }, // 2 -> 4
      { input: "\x03", expected: "\x06" }, // 3 -> 6
      { input: "\x04", expected: "\x08" }, // 4 -> 8
    ]
  },
  {
    name: "Increment",
    description: "Add 1 to input",
    testCases: [
      { input: "\x00", expected: "\x01" }, // 0 -> 1
      { input: "\x01", expected: "\x02" }, // 1 -> 2
      { input: "\x02", expected: "\x03" }, // 2 -> 3
      { input: "\x05", expected: "\x06" }, // 5 -> 6
    ]
  },
  {
    name: "Square Number",
    description: "Square the input (limited to small numbers)",
    testCases: [
      { input: "\x01", expected: "\x01" }, // 1 -> 1
      { input: "\x02", expected: "\x04" }, // 2 -> 4
      { input: "\x03", expected: "\x09" }, // 3 -> 9
      { input: "\x04", expected: "\x10" }, // 4 -> 16
    ]
  },
  {
    name: "Echo",
    description: "Output the same as input",
    testCases: [
      { input: "\x01", expected: "\x01" },
      { input: "\x05", expected: "\x05" },
      { input: "\x0A", expected: "\x0A" },
      { input: "\x0F", expected: "\x0F" },
    ]
  },
  {
    name: "Constant Output",
    description: "Always output 42 regardless of input",
    testCases: [
      { input: "\x01", expected: "\x2A" }, // -> 42
      { input: "\x05", expected: "\x2A" }, // -> 42
      { input: "\x0A", expected: "\x2A" }, // -> 42
      { input: "\x00", expected: "\x2A" }, // -> 42
    ]
  },
  {
    name: "Halve Number",
    description: "Divide input by 2 (integer division)",
    testCases: [
      { input: "\x02", expected: "\x01" }, // 2 -> 1
      { input: "\x04", expected: "\x02" }, // 4 -> 2
      { input: "\x06", expected: "\x03" }, // 6 -> 3
      { input: "\x08", expected: "\x04" }, // 8 -> 4
    ]
  }
];

export function getPresetByName(name: string): Preset | undefined {
  return presets.find(preset => preset.name === name);
}