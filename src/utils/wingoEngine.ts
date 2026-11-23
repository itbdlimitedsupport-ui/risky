import {
  BetType,
  DailyRiskStatus,
  DigitMeta,
  DigitProbability,
  DrawArchive,
  HistoryWindow,
  MatrixCellStats,
  ParsedDayGroup,
  PatternMatchResult,
  PatternOccurrence,
  ProgressionStep,
  RiskProfile,
  StakingStrategy,
  TimeWindowFilter,
  TradeLog,
} from '../types/wingo';

export const DIGIT_METAS: Record<number, DigitMeta> = {
  0: {
    digit: 0,
    primaryColor: 'red',
    hasPurple: true,
    size: 'small',
    parity: 'even',
    colorLabelEn: 'Red + Purple',
    colorLabelBn: 'লাল + বেগুনি',
  },
  1: {
    digit: 1,
    primaryColor: 'green',
    hasPurple: false,
    size: 'small',
    parity: 'odd',
    colorLabelEn: 'Green',
    colorLabelBn: 'সবুজ',
  },
  2: {
    digit: 2,
    primaryColor: 'red',
    hasPurple: false,
    size: 'small',
    parity: 'even',
    colorLabelEn: 'Red',
    colorLabelBn: 'লাল',
  },
  3: {
    digit: 3,
    primaryColor: 'green',
    hasPurple: false,
    size: 'small',
    parity: 'odd',
    colorLabelEn: 'Green',
    colorLabelBn: 'সবুজ',
  },
  4: {
    digit: 4,
    primaryColor: 'red',
    hasPurple: false,
    size: 'small',
    parity: 'even',
    colorLabelEn: 'Red',
    colorLabelBn: 'লাল',
  },
  5: {
    digit: 5,
    primaryColor: 'green',
    hasPurple: true,
    size: 'big',
    parity: 'odd',
    colorLabelEn: 'Green + Purple',
    colorLabelBn: 'সবুজ + বেগুনি',
  },
  6: {
    digit: 6,
    primaryColor: 'red',
    hasPurple: false,
    size: 'big',
    parity: 'even',
    colorLabelEn: 'Red',
    colorLabelBn: 'লাল',
  },
  7: {
    digit: 7,
    primaryColor: 'green',
    hasPurple: false,
    size: 'big',
    parity: 'odd',
    colorLabelEn: 'Green',
    colorLabelBn: 'সবুজ',
  },
  8: {
    digit: 8,
    primaryColor: 'red',
    hasPurple: false,
    size: 'big',
    parity: 'even',
    colorLabelEn: 'Red',
    colorLabelBn: 'লাল',
  },
  9: {
    digit: 9,
    primaryColor: 'green',
    hasPurple: false,
    size: 'big',
    parity: 'odd',
    colorLabelEn: 'Green',
    colorLabelBn: 'সবুজ',
  },
};

export function getDigitMeta(d: number): DigitMeta {
  const safe = Math.max(0, Math.min(9, Math.trunc(d)));
  return DIGIT_METAS[safe];
}

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function sanitizeTimeHHMM(raw: string): string {
  const match = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(raw.trim());
  if (!match) return '00:00';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function addMinutesToHHMM(startHHMM: string, offsetMinutes: number): string {
  const clean = sanitizeTimeHHMM(startHHMM);
  const [h, m] = clean.split(':').map(Number);
  const total = ((h * 60 + m + offsetMinutes) % 1440 + 1440) % 1440;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function buildSequentialTimesString(startHHMM: string, count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += addMinutesToHHMM(startHHMM, i).replace(':', '');
  }
  return out;
}

export function getDrawTimeAt(archive: DrawArchive, index: number): string {
  if (archive.times && archive.times.length >= (index + 1) * 4) {
    const chunk = archive.times.slice(index * 4, index * 4 + 4);
    if (/^[0-9]{4}$/.test(chunk)) {
      return `${chunk.slice(0, 2)}:${chunk.slice(2, 4)}`;
    }
  }
  return addMinutesToHHMM(archive.startTime || '00:00', index);
}

export function matchesTimeFilter(
  hhmm: string,
  filter: TimeWindowFilter,
  referenceHHMM?: string
): boolean {
  if (filter === 'all') return true;
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return true;
  const mins = h * 60 + m;

  switch (filter) {
    case 'morning':
      return mins >= 360 && mins < 720; // 06:00 - 11:59
    case 'afternoon':
      return mins >= 720 && mins < 1080; // 12:00 - 17:59
    case 'evening':
      return mins >= 1080 && mins < 1440; // 18:00 - 23:59
    case 'night':
      return mins >= 0 && mins < 360; // 00:00 - 05:59
    case 'current_hour': {
      const ref = sanitizeTimeHHMM(referenceHHMM || getCurrentTimeHHMM());
      const [rh, rm] = ref.split(':').map(Number);
      const refMins = rh * 60 + rm;
      const diff = Math.abs(mins - refMins);
      const wrapDiff = Math.min(diff, 1440 - diff);
      return wrapDiff <= 60;
    }
  }
}

export function getLast30DaysKeys(): string[] {
  const keys: string[] = [];
  const base = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

export function sanitizeSequenceInput(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

/**
 * Smart multi-format parser for bulk / CSV / time-tagged uploads.
 * Supports:
 * 1) Raw digits: "60491827"
 * 2) Comma/space digits: "6, 0, 4, 9"
 * 3) Time + digit lines: "18:30 6" or "18:31, 0"
 * 4) Date + Time + digit CSV lines: "2026-11-23,18:30,6"
 */
export function parseBulkDrawsSmart(
  raw: string,
  defaultDateKey: string,
  defaultStartTime: string
): ParsedDayGroup[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const cleanDefaultTime = sanitizeTimeHHMM(defaultStartTime);
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Check if lines carry explicit dates or HH:MM timestamps
  const groups = new Map<string, { digits: string[]; times: string[] }>();
  let structuredLines = 0;

  for (const line of lines) {
    // Skip header lines
    if (structuredLines === 0 && /^(date|time|period|draw|result|number)/i.test(line) && !/[0-9]/.test(line)) {
      continue;
    }

    const dateMatch = /(20[0-9]{2}-[0-9]{2}-[0-9]{2})/.exec(line);
    const timeMatch = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/.exec(line);

    if (dateMatch || timeMatch) {
      // Find the winning single digit (last standalone 0-9 token in the line)
      const withoutDateAndTime = line
        .replace(/20[0-9]{2}-[0-9]{2}-[0-9]{2}/g, ' ')
        .replace(/\b([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?\b/g, ' ');
      const tokens = withoutDateAndTime.split(/[,\t;|\s\-]+/).filter(Boolean);
      const digitToken = [...tokens].reverse().find((tok) => /^[0-9]$/.test(tok));

      if (digitToken) {
        structuredLines += 1;
        const dKey = dateMatch ? dateMatch[1] : defaultDateKey;
        const hhmm = timeMatch
          ? `${timeMatch[1].padStart(2, '0')}${timeMatch[2]}`
          : '';
        if (!groups.has(dKey)) {
          groups.set(dKey, { digits: [], times: [] });
        }
        const entry = groups.get(dKey)!;
        entry.digits.push(digitToken);
        if (hhmm) entry.times.push(hhmm);
        continue;
      }
    }
  }

  if (structuredLines > 0 && groups.size > 0) {
    const out: ParsedDayGroup[] = [];
    for (const [dateKey, data] of groups.entries()) {
      const seq = data.digits.join('');
      const hasExactTimes = data.times.length === seq.length;
      const startTime = hasExactTimes
        ? `${data.times[0].slice(0, 2)}:${data.times[0].slice(2, 4)}`
        : cleanDefaultTime;
      out.push({
        dateKey,
        sequence: seq,
        startTime,
        times: hasExactTimes ? data.times.join('') : '',
      });
    }
    return out.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }

  // Fallback: tabular "period, digit" without dates/times
  if (lines.length > 1 && lines.every((l) => l.includes(',') || l.includes('\t') || /\s+/.test(l))) {
    const digits: string[] = [];
    let looksTabular = true;
    for (const line of lines) {
      const cells = line.split(/[,\t;|\s]+/).filter(Boolean);
      const lastCell = cells[cells.length - 1];
      if (/^[0-9]$/.test(lastCell)) {
        digits.push(lastCell);
      } else if (cells.length >= 2 && /^[0-9]+$/.test(cells[0]) && /^[0-9]$/.test(cells[1])) {
        digits.push(cells[1]);
      } else if (digits.length === 0 && /period|draw|result|number/i.test(line)) {
        continue;
      } else {
        looksTabular = false;
        break;
      }
    }
    if (looksTabular && digits.length > 0) {
      return [
        {
          dateKey: defaultDateKey,
          sequence: digits.join(''),
          startTime: cleanDefaultTime,
          times: '',
        },
      ];
    }
  }

  const rawDigits = sanitizeSequenceInput(trimmed);
  if (!rawDigits) return [];
  return [
    {
      dateKey: defaultDateKey,
      sequence: rawDigits,
      startTime: cleanDefaultTime,
      times: '',
    },
  ];
}

export function parseBulkDigitsFromText(raw: string): string {
  const groups = parseBulkDrawsSmart(raw, getTodayDateKey(), '00:00');
  return groups.map((g) => g.sequence).join('');
}

export function filterArchivesByWindow(archives: DrawArchive[], windowMode: HistoryWindow): DrawArchive[] {
  const sorted = [...archives].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    return a.id.localeCompare(b.id);
  });
  if (windowMode === 'all') return sorted;
  const days = windowMode === '15d' ? 15 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  return sorted.filter((a) => a.dateKey >= cutoffKey);
}

export function analyzeMarketPattern(
  archives: DrawArchive[],
  rawQuery: string,
  timeFilter: TimeWindowFilter = 'all',
  referenceHHMM?: string
): PatternMatchResult {
  const query = sanitizeSequenceInput(rawQuery).slice(0, 8);
  const nextCounts = Array(10).fill(0);
  const occurrences: PatternOccurrence[] = [];
  let totalDrawsScanned = 0;

  for (const arc of archives) {
    totalDrawsScanned += arc.sequence.length;
  }

  if (query.length > 0) {
    const qLen = query.length;
    for (const arc of archives) {
      const seq = arc.sequence;
      if (seq.length <= qLen) continue;
      for (let i = 0; i <= seq.length - qLen - 1; i++) {
        if (seq.slice(i, i + qLen) === query) {
          const nextIndex = i + qLen;
          const timeStr = getDrawTimeAt(arc, nextIndex);
          if (!matchesTimeFilter(timeStr, timeFilter, referenceHHMM)) {
            continue;
          }
          const nextChar = seq[nextIndex];
          const nextDigit = Number(nextChar);
          nextCounts[nextDigit] += 1;
          const contextStart = Math.max(0, i - 3);
          const periodNum =
            arc.startPeriod && /^[0-9]+$/.test(arc.startPeriod)
              ? String(BigInt(arc.startPeriod) + BigInt(nextIndex))
              : `#${nextIndex + 1}`;
          occurrences.push({
            archiveId: arc.id,
            dateKey: arc.dateKey,
            timeStr,
            archiveLabel: arc.label,
            index: nextIndex,
            periodLabel: periodNum,
            contextBefore: seq.slice(contextStart, nextIndex),
            nextDigit,
          });
        }
      }
    }
  }

  const matchCount = nextCounts.reduce((acc, c) => acc + c, 0);

  const sortedStats: DigitProbability[] = nextCounts
    .map((count, digit) => {
      const pct = matchCount > 0 ? (count / matchCount) * 100 : 0;
      return {
        digit,
        count,
        percentage: pct,
        rank: 0,
        confidenceTier: 'Low' as 'High' | 'Moderate' | 'Low',
      };
    })
    .sort((a, b) => b.count - a.count || a.digit - b.digit)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
      confidenceTier:
        matchCount === 0
          ? 'Low'
          : idx < 2 && item.percentage >= 12
            ? 'High'
            : idx < 5 && item.percentage >= 9
              ? 'Moderate'
              : 'Low',
    }));

  let greenCount = 0;
  let redCount = 0;
  let purpleCount = 0;
  let bigCount = 0;
  let smallCount = 0;

  for (let d = 0; d <= 9; d++) {
    const c = nextCounts[d];
    const meta = getDigitMeta(d);
    if (meta.primaryColor === 'green') greenCount += c;
    if (meta.primaryColor === 'red') redCount += c;
    if (meta.hasPurple) purpleCount += c;
    if (meta.size === 'big') bigCount += c;
    else smallCount += c;
  }

  return {
    querySequence: query,
    timeFilter,
    totalDrawsScanned,
    matchCount,
    nextDigitStats: sortedStats,
    colorBreakdown: {
      green: { count: greenCount, pct: matchCount > 0 ? (greenCount / matchCount) * 100 : 0 },
      red: { count: redCount, pct: matchCount > 0 ? (redCount / matchCount) * 100 : 0 },
      purple: { count: purpleCount, pct: matchCount > 0 ? (purpleCount / matchCount) * 100 : 0 },
    },
    sizeBreakdown: {
      big: { count: bigCount, pct: matchCount > 0 ? (bigCount / matchCount) * 100 : 0 },
      small: { count: smallCount, pct: matchCount > 0 ? (smallCount / matchCount) * 100 : 0 },
    },
    recentOccurrences: occurrences.slice(-30).reverse(),
  };
}

/**
 * Builds the 10x10 (Prev2 -> Prev1) Transition Notebook Matrix matching the user's handwritten sheet.
 */
export function buildNotebookMatrix(archives: DrawArchive[]): MatrixCellStats[][] {
  const counts: number[][][] = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => Array(10).fill(0))
  );
  const trailing: string[][] = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => '')
  );

  for (const arc of archives) {
    const seq = arc.sequence;
    for (let i = 0; i <= seq.length - 3; i++) {
      const p2 = Number(seq[i]);
      const p1 = Number(seq[i + 1]);
      const next = Number(seq[i + 2]);
      counts[p2][p1][next] += 1;
      if (trailing[p2][p1].length < 8) {
        trailing[p2][p1] += seq[i + 2];
      }
    }
  }

  const matrix: MatrixCellStats[][] = [];
  for (let p2 = 0; p2 < 10; p2++) {
    const row: MatrixCellStats[] = [];
    for (let p1 = 0; p1 < 10; p1++) {
      const cellCounts = counts[p2][p1];
      const totalHits = cellCounts.reduce((a, b) => a + b, 0);
      const ranked = cellCounts
        .map((c, d) => ({ d, c }))
        .sort((a, b) => b.c - a.c || a.d - b.d);
      const top = ranked[0];
      const second = ranked[1];
      row.push({
        prev2: p2,
        prev1: p1,
        totalHits,
        trailingDigits: trailing[p2][p1],
        topDigit: totalHits > 0 && top.c > 0 ? top.d : null,
        topDigitPct: totalHits > 0 ? (top.c / totalHits) * 100 : 0,
        secondDigit: totalHits > 0 && second.c > 0 ? second.d : null,
        secondDigitPct: totalHits > 0 ? (second.c / totalHits) * 100 : 0,
        counts: cellCounts,
      });
    }
    matrix.push(row);
  }
  return matrix;
}

export function getCurrencySymbol(currency: RiskProfile['currency']): string {
  switch (currency) {
    case 'INR':
      return '₹';
    case 'BDT':
      return '৳';
    case 'USD':
      return '$';
    case 'COIN':
      return 'C';
  }
}

export function getStrategyMultiplier(strategy: StakingStrategy, step: number): number {
  if (step <= 1) return 1;
  switch (strategy) {
    case 'flat':
      return 1;
    case 'martingale2x':
      return Math.pow(2, step - 1);
    case 'recovery25x':
      return Number(Math.pow(2.5, step - 1).toFixed(2));
    case 'recovery3x':
      return Math.pow(3, step - 1);
    case 'fibonacci': {
      let a = 1;
      let b = 1;
      for (let i = 3; i <= step; i++) {
        const next = a + b;
        a = b;
        b = next;
      }
      return b;
    }
    case 'dalembert':
      return step;
  }
}

export function calculateProgressionTable(profile: RiskProfile): {
  steps: ProgressionStep[];
  maxSurvivableBankrollSteps: number;
  maxSafeStopLossSteps: number;
  stopLossLimit: number;
  takeProfitTarget: number;
} {
  const stopLossLimit = Number(((profile.startingCapital * profile.dailyStopLossPct) / 100).toFixed(2));
  const takeProfitTarget = Number(((profile.startingCapital * profile.dailyTakeProfitPct) / 100).toFixed(2));
  const steps: ProgressionStep[] = [];
  let cumulativeRisk = 0;
  let maxSurvivableBankrollSteps = 0;
  let maxSafeStopLossSteps = 0;

  for (let s = 1; s <= profile.maxSteps; s++) {
    const mult = getStrategyMultiplier(profile.strategy, s);
    const stake = Number((profile.baseBet * mult).toFixed(2));
    cumulativeRisk = Number((cumulativeRisk + stake).toFixed(2));
    const payoutOnWin = Number((stake * profile.colorOdds).toFixed(2));
    const netProfitOnWin = Number((payoutOnWin - cumulativeRisk).toFixed(2));
    const remainingBankroll = Number((profile.currentBankroll - cumulativeRisk).toFixed(2));
    const withinBankroll = remainingBankroll >= 0;
    const withinStopLoss = cumulativeRisk <= stopLossLimit;
    if (withinBankroll) maxSurvivableBankrollSteps = s;
    if (withinStopLoss && withinBankroll) maxSafeStopLossSteps = s;

    steps.push({
      step: s,
      multiplier: mult,
      stake,
      cumulativeRisk,
      payoutOnWin,
      netProfitOnWin,
      remainingBankroll,
      withinBankroll,
      withinStopLoss,
    });
  }

  return {
    steps,
    maxSurvivableBankrollSteps,
    maxSafeStopLossSteps,
    stopLossLimit,
    takeProfitTarget,
  };
}

export function evaluateDailyRiskStatus(
  profile: RiskProfile,
  trades: TradeLog[],
  todayKey: string
): DailyRiskStatus {
  const todayTrades = trades.filter((t) => t.dateKey === todayKey);
  const todayNetPnl = Number(todayTrades.reduce((sum, t) => sum + t.netPnl, 0).toFixed(2));
  const todayWins = todayTrades.filter((t) => t.outcome === 'win').length;
  const todayLosses = todayTrades.filter((t) => t.outcome === 'loss').length;

  let currentLossStreak = 0;
  for (const t of todayTrades) {
    if (t.outcome === 'loss') {
      currentLossStreak += 1;
    } else {
      break;
    }
  }

  const recommendedStep = Math.min(profile.maxSteps, currentLossStreak + 1);
  const recommendedStake = Number(
    (profile.baseBet * getStrategyMultiplier(profile.strategy, recommendedStep)).toFixed(2)
  );
  const stopLossAmount = Number(((profile.startingCapital * profile.dailyStopLossPct) / 100).toFixed(2));
  const takeProfitAmount = Number(((profile.startingCapital * profile.dailyTakeProfitPct) / 100).toFixed(2));

  let guardrailLevel: DailyRiskStatus['guardrailLevel'] = 'SAFE';
  if (todayNetPnl <= -stopLossAmount) {
    guardrailLevel = 'STOP_LOSS_HIT';
  } else if (todayNetPnl >= takeProfitAmount) {
    guardrailLevel = 'TARGET_HIT';
  } else if (todayNetPnl <= -(stopLossAmount * 0.65) || currentLossStreak >= Math.max(2, profile.maxSteps - 1)) {
    guardrailLevel = 'CAUTION';
  }

  return {
    todayNetPnl,
    todayTrades: todayTrades.length,
    todayWins,
    todayLosses,
    currentLossStreak,
    recommendedStep,
    recommendedStake,
    stopLossAmount,
    takeProfitAmount,
    guardrailLevel,
  };
}

export function doesBetWinForDigit(betType: BetType, selection: string, digit: number): { won: boolean; effectiveOddsMultiplier: number } {
  const meta = getDigitMeta(digit);
  switch (betType) {
    case 'green':
      if (digit === 5) return { won: true, effectiveOddsMultiplier: 1.47 };
      return { won: meta.primaryColor === 'green', effectiveOddsMultiplier: 1.96 };
    case 'red':
      if (digit === 0) return { won: true, effectiveOddsMultiplier: 1.47 };
      return { won: meta.primaryColor === 'red', effectiveOddsMultiplier: 1.96 };
    case 'purple':
      return { won: meta.hasPurple, effectiveOddsMultiplier: 4.5 };
    case 'big':
      return { won: meta.size === 'big', effectiveOddsMultiplier: 1.96 };
    case 'small':
      return { won: meta.size === 'small', effectiveOddsMultiplier: 1.96 };
    case 'number':
      return { won: String(digit) === selection.trim(), effectiveOddsMultiplier: 9.0 };
  }
}

export function createDefaultRiskProfile(userId: string): RiskProfile {
  return {
    userId,
    currency: 'INR',
    startingCapital: 10000,
    currentBankroll: 10000,
    baseBet: 50,
    strategy: 'martingale2x',
    maxSteps: 6,
    dailyStopLossPct: 15,
    dailyTakeProfitPct: 20,
    colorOdds: 1.96,
    purpleOdds: 4.5,
    numberOdds: 9.0,
  };
}
