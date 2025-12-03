export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface DecorationConfig {
  count: number;
  color: string;
  size: number;
  weight: number; // 0 (light) to 1 (heavy)
  type: 'box' | 'sphere' | 'light';
}

export interface HandData {
  bbox: [number, number, number, number]; // x, y, width, height
  class: number; // 1 for hand? depends on model
  score: number;
  label: string; // 'open', 'closed', etc
}

export type Vector3Array = [number, number, number];