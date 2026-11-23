import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Save, ShieldAlert, Trash2 } from 'lucide-react';
import {
  BetType,
  CurrencyCode,
  LanguageCode,
  RiskProfile,
  StakingStrategy,
  TradeLog,
} from '../types/wingo';
import { COPY } from '../utils/i18n';
import {
  calculateProgressionTable,
  doesBetWinForDigit,
  evaluateDailyRiskStatus,
  getCurrencySymbol,
  getTodayDateKey,
} from '../utils/wingoEngine';
import { DigitBall } from './DigitBall';

interface MoneyRiskViewProps {
  lang: LanguageCode;
  profile: RiskProfile;
  trades: TradeLog[];
  onSaveProfile: (profile: RiskProfile) => Promise<void>;
  onRecordTrade: (trade: Omit<TradeLog, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onDeleteTrade: (tradeId: string) => Promise<void>;
}

const STRATEGIES: { id: StakingStrategy; labelEn: string; labelBn: string }[] = [
  { id: 'flat', labelEn: 'Flat Betting (1x)', labelBn: 'ফ্ল্যাট বেটিং (১x)' },
  { id: 'martingale2x', labelEn: 'Martingale (2x)', labelBn: 'মার্টিনগেল (২x)' },
  { id: 'recovery25x', labelEn: 'Recovery (2.5x)', labelBn: 'রিকভারি (২.৫x)' },
  { id: 'recovery3x', labelEn: 'Aggressive Recovery (3x)', labelBn: 'রিকভারি (৩x)' },
  { id: 'fibonacci', labelEn: 'Fibonacci (1-1-2-3-5...)', labelBn: 'ফিবোনাচি (১-১-২-৩-৫)' },
  { id: 'dalembert', labelEn: "D'Alembert (+1 Unit)", labelBn: 'ডি-অ্যালেম্বার্ট (+১ ইউনিট)' },
];

export const MoneyRiskView: React.FC<MoneyRiskViewProps> = ({
  lang,
  profile,
  trades,
  onSaveProfile,
  onRecordTrade,
  onDeleteTrade,
}) => {
  const t = COPY[lang];
  const todayKey = getTodayDateKey();

  const [draft, setDraft] = useState<RiskProfile>(profile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState('');

  // Keep draft synced when profile loads from Firestore initially
  React.useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const riskStatus = useMemo(
    () => evaluateDailyRiskStatus(draft, trades, todayKey),
    [draft, trades, todayKey]
  );

  const progression = useMemo(() => calculateProgressionTable(draft), [draft]);
  const sym = getCurrencySymbol(draft.currency);

  // Trade Logger Form State
  const [periodId, setPeriodId] = useState('');
  const [betType, setBetType] = useState<BetType>('green');
  const [selection, setSelection] = useState('Green');
  const [resultDigit, setResultDigit] = useState<number>(1);
  const [stake, setStake] = useState<number>(riskStatus.recommendedStake || draft.baseBet);
  const [stepNumber, setStepNumber] = useState<number>(riskStatus.recommendedStep || 1);
  const [note, setNote] = useState('');
  const [loggingTrade, setLoggingTrade] = useState(false);

  React.useEffect(() => {
    setStake(riskStatus.recommendedStake);
    setStepNumber(riskStatus.recommendedStep);
  }, [riskStatus.recommendedStake, riskStatus.recommendedStep]);

  const handleBetTypeChange = (nextType: BetType) => {
    setBetType(nextType);
    if (nextType === 'green') setSelection('Green');
    else if (nextType === 'red') setSelection('Red');
    else if (nextType === 'purple') setSelection('Purple');
    else if (nextType === 'big') setSelection('Big');
    else if (nextType === 'small') setSelection('Small');
    else setSelection('0');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSavedNotice('');
    try {
      await onSaveProfile(draft);
      setProfileSavedNotice(
        lang === 'bn'
          ? 'মানি ও রিস্ক প্রোফাইল ফায়ারবেসে সেভ হয়েছে।'
          : 'Money & risk profile saved to Firestore.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const tradePreview = useMemo(() => {
    const evalWin = doesBetWinForDigit(betType, selection, resultDigit);
    const validStake = Math.max(0, Number(stake) || 0);
    const netPnl = evalWin.won
      ? Number((validStake * (evalWin.effectiveOddsMultiplier - 1)).toFixed(2))
      : Number((-validStake).toFixed(2));
    const bankrollAfter = Math.max(0, Number((draft.currentBankroll + netPnl).toFixed(2)));
    return { ...evalWin, netPnl, bankrollAfter };
  }, [betType, selection, resultDigit, stake, draft.currentBankroll]);

  const handleLogTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stake <= 0) return;
    setLoggingTrade(true);
    try {
      await onRecordTrade({
        dateKey: todayKey,
        periodId: periodId.trim() || `M-${Date.now().toString().slice(-6)}`,
        betType,
        selection,
        resultDigit,
        stake: Number(stake),
        stepNumber: Number(stepNumber),
        odds: tradePreview.effectiveOddsMultiplier,
        outcome: tradePreview.won ? 'win' : 'loss',
        netPnl: tradePreview.netPnl,
        bankrollAfter: tradePreview.bankrollAfter,
        note: note.trim(),
      });
      setPeriodId('');
      setNote('');
    } finally {
      setLoggingTrade(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Daily Risk Guardrail Banner */}
      <section
        className={`rounded-xl border p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
          riskStatus.guardrailLevel === 'STOP_LOSS_HIT'
            ? 'bg-red-50 border-red-200 text-red-950'
            : riskStatus.guardrailLevel === 'TARGET_HIT'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : riskStatus.guardrailLevel === 'CAUTION'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-start gap-3">
          {riskStatus.guardrailLevel === 'STOP_LOSS_HIT' ||
          riskStatus.guardrailLevel === 'CAUTION' ? (
            <ShieldAlert
              className={`w-5 h-5 mt-0.5 shrink-0 ${
                riskStatus.guardrailLevel === 'STOP_LOSS_HIT' ? 'text-red-600' : 'text-amber-600'
              }`}
            />
          ) : (
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
          )}
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">
              {riskStatus.guardrailLevel === 'STOP_LOSS_HIT'
                ? lang === 'bn'
                  ? 'সতর্কতা: আজকের ডেইলি স্টপ-লস সীমা অতিক্রম করেছে — ট্রেড বন্ধ রাখুন!'
                  : 'STOP-LOSS REACHED: Daily maximum loss limit hit. Pause trading today.'
                : riskStatus.guardrailLevel === 'TARGET_HIT'
                  ? lang === 'bn'
                    ? 'আজকের ডেইলি প্রফিট টার্গেট পূরণ হয়েছে — প্রফিট সুরক্ষিত করুন!'
                    : 'PROFIT TARGET HIT: Daily goal achieved. Lock in gains for today.'
                  : riskStatus.guardrailLevel === 'CAUTION'
                    ? lang === 'bn'
                      ? 'রিস্ক সতর্কতা: স্টপ-লস সীমার কাছাকাছি বা টানা লস চলছে, পরবর্তী বেট সতর্কতার সাথে দিন।'
                      : 'RISK CAUTION: Approaching stop-loss or deep into recovery steps.'
                    : lang === 'bn'
                      ? 'রিস্ক স্ট্যাটাস: নিরাপদ সীমার মধ্যে আছেন'
                      : 'RISK STATUS: Within safe capital & stop-loss limits'}
            </h2>
            <p className="text-xs opacity-80 font-mono-tabular">
              {lang === 'bn' ? 'আজকের নেট:' : 'Today Net:'}{' '}
              {riskStatus.todayNetPnl >= 0 ? '+' : ''}
              {sym}
              {riskStatus.todayNetPnl.toFixed(2)} · Stop-Loss: -{sym}
              {riskStatus.stopLossAmount.toFixed(0)} · Target: +{sym}
              {riskStatus.takeProfitAmount.toFixed(0)} ·{' '}
              {lang === 'bn' ? 'সর্বোচ্চ নিরাপদ স্টেপ:' : 'Safe Steps:'}{' '}
              {progression.maxSafeStopLossSteps}/{draft.maxSteps}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 font-mono-tabular text-xs shrink-0">
          <div>
            <div className="text-slate-500">{lang === 'bn' ? 'বর্তমান লস স্ট্রিক' : 'Loss Streak'}</div>
            <div className="text-base font-bold">{riskStatus.currentLossStreak}</div>
          </div>
          <div>
            <div className="text-slate-500">{lang === 'bn' ? 'পরবর্তী স্টেপ' : 'Next Step'}</div>
            <div className="text-base font-bold">Step #{riskStatus.recommendedStep}</div>
          </div>
          <div>
            <div className="text-slate-500">{lang === 'bn' ? 'প্রস্তাবিত বেট' : 'Next Stake'}</div>
            <div className="text-base font-bold">
              {sym}
              {riskStatus.recommendedStake.toFixed(2)}
            </div>
          </div>
        </div>
      </section>

      {/* Risk Profile Settings & Live Trade Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">{t.riskProfileTitle}</h2>
            {profileSavedNotice && (
              <span className="text-xs font-medium text-emerald-700">{profileSavedNotice}</span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Currency</label>
                <select
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft({ ...draft, currency: e.target.value as CurrencyCode })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="INR">₹ INR</option>
                  <option value="BDT">৳ BDT</option>
                  <option value="USD">$ USD</option>
                  <option value="COIN">Coins</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  {lang === 'bn' ? 'শুরুর মূলধন' : 'Starting Capital'}
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={draft.startingCapital}
                  onChange={(e) =>
                    setDraft({ ...draft, startingCapital: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  {lang === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current Bankroll'}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={draft.currentBankroll}
                  onChange={(e) =>
                    setDraft({ ...draft, currentBankroll: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  {lang === 'bn' ? 'বেস বেট (Step 1)' : 'Base Bet (Step 1)'}
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={draft.baseBet}
                  onChange={(e) => setDraft({ ...draft, baseBet: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  {lang === 'bn' ? 'স্টেকিং স্ট্র্যাটেজি' : 'Money Strategy'}
                </label>
                <select
                  value={draft.strategy}
                  onChange={(e) =>
                    setDraft({ ...draft, strategy: e.target.value as StakingStrategy })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {STRATEGIES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {lang === 'bn' ? st.labelBn : st.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  {lang === 'bn' ? 'সর্বোচ্চ স্টেপ' : 'Max Steps'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={draft.maxSteps}
                  onChange={(e) => setDraft({ ...draft, maxSteps: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  {lang === 'bn' ? 'কালার অডস' : 'Color Odds'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  step="0.01"
                  value={draft.colorOdds}
                  onChange={(e) => setDraft({ ...draft, colorOdds: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  {lang === 'bn' ? 'ডেইলি স্টপ-লস %' : 'Daily Stop-Loss %'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step="0.5"
                  value={draft.dailyStopLossPct}
                  onChange={(e) =>
                    setDraft({ ...draft, dailyStopLossPct: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  {lang === 'bn' ? 'ডেইলি টার্গেট %' : 'Take-Profit %'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  step="0.5"
                  value={draft.dailyTakeProfitPct}
                  onChange={(e) =>
                    setDraft({ ...draft, dailyTakeProfitPct: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  {t.saveProfileBtn}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Log Real Bet / Trade Execution */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">{t.logTradeTitle}</h2>
          <form onSubmit={handleLogTrade} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Draw / Period #</label>
                <input
                  type="text"
                  maxLength={40}
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  placeholder="e.g. 11317401"
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Bet Category</label>
                <select
                  value={betType}
                  onChange={(e) => handleBetTypeChange(e.target.value as BetType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="green">Green (1.96x / 1.47x)</option>
                  <option value="red">Red (1.96x / 1.47x)</option>
                  <option value="purple">Purple (4.5x)</option>
                  <option value="big">Big 5–9 (1.96x)</option>
                  <option value="small">Small 0–4 (1.96x)</option>
                  <option value="number">Exact Number (9x)</option>
                </select>
              </div>
            </div>

            {betType === 'number' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Predicted Digit (0–9)</label>
                <select
                  value={selection}
                  onChange={(e) => setSelection(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <option key={d} value={String(d)}>
                      Number {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Stake ({sym})</label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Step #</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={stepNumber}
                  onChange={(e) => setStepNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Result Digit</label>
                <select
                  value={resultDigit}
                  onChange={(e) => setResultDigit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Note (Optional)</label>
              <input
                type="text"
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Followed 6→0 pattern"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="font-mono-tabular">
                <span className={tradePreview.won ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                  {tradePreview.won ? t.win : t.loss}: {tradePreview.netPnl >= 0 ? '+' : ''}
                  {sym}
                  {tradePreview.netPnl.toFixed(2)}
                </span>
                <span className="text-slate-500 ml-2">
                  → {sym}
                  {tradePreview.bankrollAfter.toFixed(2)}
                </span>
              </div>
              <button
                type="submit"
                disabled={loggingTrade || stake <= 0}
                className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
              >
                {lang === 'bn' ? 'ট্রেড সেভ করুন' : 'Record Trade'}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Recovery Progression & Ruin-Check Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{t.progressionTitle}</h2>
          <div className="flex items-center gap-4 text-xs text-slate-600 font-mono-tabular">
            <span>
              Bankroll Max: <strong>{progression.maxSurvivableBankrollSteps} steps</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Stop-Loss Safe: <strong>{progression.maxSafeStopLossSteps} steps</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 text-left font-medium">Step</th>
                <th className="py-2 text-right font-medium">Multiplier</th>
                <th className="py-2 text-right font-medium">Stake ({sym})</th>
                <th className="py-2 text-right font-medium">Cumulative Risk</th>
                <th className="py-2 text-right font-medium">Net Profit on Win</th>
                <th className="py-2 text-right font-medium">Remaining Capital</th>
                <th className="py-2 text-right font-medium">Risk Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {progression.steps.map((row) => (
                <tr key={row.step} className="hover:bg-slate-50">
                  <td className="py-2 font-mono-tabular font-semibold text-slate-900">
                    Step {row.step}
                  </td>
                  <td className="py-2 text-right font-mono-tabular text-slate-600">
                    {row.multiplier}x
                  </td>
                  <td className="py-2 text-right font-mono-tabular font-semibold text-slate-900">
                    {sym}
                    {row.stake.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 text-right font-mono-tabular text-slate-700">
                    {sym}
                    {row.cumulativeRisk.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`py-2 text-right font-mono-tabular font-medium ${
                      row.netProfitOnWin >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {row.netProfitOnWin >= 0 ? '+' : ''}
                    {sym}
                    {row.netProfitOnWin.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 text-right font-mono-tabular text-slate-700">
                    {sym}
                    {row.remainingBankroll.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 text-right text-xs font-medium whitespace-nowrap">
                    {!row.withinBankroll ? (
                      <span className="text-red-700 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Exceeds Bankroll
                      </span>
                    ) : !row.withinStopLoss ? (
                      <span className="text-amber-700">Exceeds Stop-Loss</span>
                    ) : (
                      <span className="text-green-700">Safe</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trade & P&L Ledger */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{t.tradeLedgerTitle}</h2>
          <span className="text-xs text-slate-500 font-mono-tabular">{trades.length} entries</span>
        </div>

        {trades.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">
            {lang === 'bn'
              ? 'এখনো কোনো ট্রেড রেকর্ড করা হয়নি। উপরের ফর্ম থেকে আপনার প্রথম ট্রেড যোগ করুন।'
              : 'No trades logged yet. Use the trade form above to track real bets and P&L.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 text-left font-medium">Date · Period</th>
                  <th className="py-2 text-left font-medium">Bet</th>
                  <th className="py-2 text-center font-medium">Result</th>
                  <th className="py-2 text-right font-medium">Step</th>
                  <th className="py-2 text-right font-medium">Stake</th>
                  <th className="py-2 text-right font-medium">Net P&L</th>
                  <th className="py-2 text-right font-medium">Balance</th>
                  <th className="py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trades.slice(0, 50).map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50">
                    <td className="py-2 font-mono-tabular text-xs text-slate-700 whitespace-nowrap">
                      {tr.dateKey} · {tr.periodId}
                    </td>
                    <td className="py-2 text-slate-900 font-medium">{tr.selection}</td>
                    <td className="py-2 text-center">
                      <DigitBall digit={tr.resultDigit} size="xs" />
                    </td>
                    <td className="py-2 text-right font-mono-tabular text-xs text-slate-600">
                      #{tr.stepNumber}
                    </td>
                    <td className="py-2 text-right font-mono-tabular text-slate-800">
                      {sym}
                      {tr.stake.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 text-right font-mono-tabular font-semibold ${
                        tr.outcome === 'win' ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {tr.netPnl >= 0 ? '+' : ''}
                      {sym}
                      {tr.netPnl.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono-tabular text-slate-800">
                      {sym}
                      {tr.bankrollAfter.toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteTrade(tr.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        aria-label="Delete trade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
