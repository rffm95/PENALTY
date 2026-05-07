export enum GameState {
  IDLE = 'IDLE',
  POWERING = 'POWERING',
  RUNNING = 'RUNNING',
  KICKING = 'KICKING',
  RESULT = 'RESULT',
}

export enum PrizeType {
  FINO_1 = '1 Fino',
  FINO_3 = '3 Finos',
  REGUA_1 = '1 Régua',
}

export interface Prize {
  type: PrizeType;
  probability: number;
}

export const PRIZES: Prize[] = [
  { type: PrizeType.FINO_1, probability: 0.50 },
  { type: PrizeType.FINO_3, probability: 0.35 },
  { type: PrizeType.REGUA_1, probability: 0.15 },
];
