import type { PlayerAction } from '../game';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'tournament';

export interface ScoredAction {
  action: PlayerAction;
  score: number;
  tags: string[];
}

export type AIIssueSeverity = 'info' | 'warn' | 'error';

export interface AIIssue {
  severity: AIIssueSeverity;
  code: string;
  message: string;
}
