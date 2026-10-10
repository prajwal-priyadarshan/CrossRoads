export function pickFromBank(roundType: string, difficulty: number, used: string[]) {
  return { format: 'MCQ', topic: 'General Practice', prompt: 'Sample question?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Sample' };
}
