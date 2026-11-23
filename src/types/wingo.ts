import { Timestamp } from 'firebase/firestore';

export type CurrencyCode = 'INR' | 'BDT' | 'USD' | 'COIN';

export type StakingStrategy =
  | 'flat'
  | 'martingale2x'
  | 'recovery25x'
  | 'recovery3x'
  | 'fibonacci'
  | 'dalembert';

export type ArchiveSource = 'manual' | 'bulk' | 'csv';

export type BetType = 'green' | 'red' | 'purple' | 'big' | 'small' | 'number';

export type TradeOutcome = 'win' | 'loss';

export type HistoryWindow = '15d' | '30d' | 'all';

export type TimeWindowFilter =
  | 'all'
  | 'current_hour'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night';

export type LanguageCode = 'bn' | 'en';

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RiskProfile {
  userId: string;
  currency: CurrencyCode;
  startingCapital: number;
  currentBankroll: number;
  baseBet: number;
  strategy: StakingStrategy;
  maxSteps: number;
  dailyStopLossPct: number;
  dailyTakeProfitPct: number;
  colorOdds: number;
  purpleOdds: number;
  numberOdds: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DrawArchive {
  id: string;
  userId: string;
  dateKey: string;
  label: string;
  sequence: string;
  drawCount: number;
  startPeriod: string;
  startTime?: string;
  times?: string;
  source: ArchiveSource;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TradeLog {
  id: string;
  userId: string;
  dateKey: string;
  periodId: string;
  betType: BetType;
  selection: string;
  resultDigit: number;
  stake: number;
  stepNumber: number;
  odds: number;
  outcome: TradeOutcome;
  netPnl: number;
  bankrollAfter: number;
  note: string;
  createdAt?: Timestamp;
}

export interface SavedPattern {
  id: string;
  userId: string;
  sequence: string;
  label: string;
  createdAt?: Timestamp;
}

export interface DigitMeta {
  digit: number;
  primaryColor: 'green' | 'red';
  hasPurple: boolean;
  size: 'big' | 'small';
  parity: 'odd' | 'even';
  colorLabelEn: string;
  colorLabelBn: string;
}

export interface DigitProbability {
  digit: number;
  count: number;
  percentage: number;
  rank: number;
  confidenceTier: 'High' | 'Moderate' | 'Low';
}

export interface PatternOccurrence {
  archiveId: string;
  dateKey: string;
  timeStr: string;
  archiveLabel: string;
  index: number;
  periodLabel: string;
  contextBefore: string;
  nextDigit: number;
}

export interface PatternMatchResult {
  querySequence: string;
  timeFilter: TimeWindowFilter;
  totalDrawsScanned: number;
  matchCount: number;
  nextDigitStats: DigitProbability[];
  colorBreakdown: {
    green: { count: number; pct: number };
    red: { count: number; pct: number };
    purple: { count: number; pct: number };
  };
  sizeBreakdown: {
    big: { count: number; pct: number };
    small: { count: number; pct: number };
  };
  recentOccurrences: PatternOccurrence[];
}

export interface MatrixCellStats {
  prev2: number;
  prev1: number;
  totalHits: number;
  trailingDigits: string;
  topDigit: number | null;
  topDigitPct: number;
  secondDigit: number | null;
  secondDigitPct: number;
  counts: number[];
}

export interface ProgressionStep {
  step: number;
  multiplier: number;
  stake: number;
  cumulativeRisk: number;
  payoutOnWin: number;
  netProfitOnWin: number;
  remainingBankroll: number;
  withinBankroll: boolean;
  withinStopLoss: boolean;
}

export type RiskGuardrailLevel = 'SAFE' | 'CAUTION' | 'STOP_LOSS_HIT' | 'TARGET_HIT';

export interface DailyRiskStatus {
  todayNetPnl: number;
  todayTrades: number;
  todayWins: number;
  todayLosses: number;
  currentLossStreak: number;
  recommendedStep: number;
  recommendedStake: number;
  stopLossAmount: number;
  takeProfitAmount: number;
  guardrailLevel: RiskGuardrailLevel;
}

export interface ParsedDayGroup {
  dateKey: string;
  sequence: string;
  startTime: string;
  times: string;
}
