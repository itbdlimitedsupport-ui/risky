import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Clock,
  Delete,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { DrawArchive, LanguageCode, SavedPattern, TimeWindowFilter } from '../types/wingo';
import { COPY } from '../utils/i18n';
import {
  analyzeMarketPattern,
  getCurrentTimeHHMM,
  getDigitMeta,
  sanitizeSequenceInput,
  sanitizeTimeHHMM,
} from '../utils/wingoEngine';
import { DigitBall } from './DigitBall';

interface PatternPredictorViewProps {
  lang: LanguageCode;
  archives: DrawArchive[];
  savedPatterns: SavedPattern[];
  querySequence: string;
  onChangeQuery: (seq: string) => void;
  onSavePattern: (sequence: string, label: string) => Promise<void>;
  onDeletePattern: (patternId: string) => Promise<void>;
  onGoToUpload: () => void;
}

export const PatternPredictorView: React.FC<PatternPredictorViewProps> = ({
  lang,
  archives,
  savedPatterns,
  querySequence,
  onChangeQuery,
  onSavePattern,
  onDeletePattern,
  onGoToUpload,
}) => {
  const t = COPY[lang];
  const [watchLabel, setWatchLabel] = useState('');
  const [savingWatch, setSavingWatch] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeWindowFilter>('all');
  const [refTime, setRefTime] = useState<string>(() => getCurrentTimeHHMM());

  const totalDraws = useMemo(
    () => archives.reduce((sum, a) => sum + a.sequence.length, 0),
    [archives]
  );

  const latestMarketTail = useMemo(() => {
    if (archives.length === 0) return '';
    const combined = archives.map((a) => a.sequence).join('');
    return combined.slice(-6);
  }, [archives]);

  const analysis = useMemo(
    () => analyzeMarketPattern(archives, querySequence, timeFilter, refTime),
    [archives, querySequence, timeFilter, refTime]
  );

  const allTimeAnalysis = useMemo(
    () =>
      timeFilter === 'all'
        ? analysis
        : analyzeMarketPattern(archives, querySequence, 'all', refTime),
    [archives, querySequence, timeFilter, refTime, analysis]
  );

  const suffix2 = querySequence.length > 2 ? querySequence.slice(-2) : '';
  const fallbackAnalysis = useMemo(
    () => (suffix2 ? analyzeMarketPattern(archives, suffix2, 'all', refTime) : null),
    [archives, suffix2, refTime]
  );

  const handleDigitTap = (d: number) => {
    if (querySequence.length >= 8) return;
    onChangeQuery(querySequence + String(d));
  };

  const handleSaveWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!querySequence) return;
    setSavingWatch(true);
    try {
      await onSavePattern(querySequence, watchLabel || `Pattern ${querySequence}`);
      setWatchLabel('');
    } finally {
      setSavingWatch(false);
    }
  };

  if (totalDraws === 0) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto my-8 space-y-4">
        <Search className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-xl font-semibold text-slate-900">{t.noDataTitle}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{t.noDataDesc}</p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4" />
            {t.goUploadBtn}
          </button>
        </div>
      </section>
    );
  }

  const top3 = analysis.nextDigitStats.slice(0, 3);
  const top1 = top3[0];
  const dominantColor =
    analysis.colorBreakdown.green.pct >= analysis.colorBreakdown.red.pct ? t.green : t.red;
  const dominantColorPct = Math.max(
    analysis.colorBreakdown.green.pct,
    analysis.colorBreakdown.red.pct
  );
  const dominantSize =
    analysis.sizeBreakdown.big.pct >= analysis.sizeBreakdown.small.pct ? t.big : t.small;
  const dominantSizePct = Math.max(
    analysis.sizeBreakdown.big.pct,
    analysis.sizeBreakdown.small.pct
  );

  const timeOptions: [TimeWindowFilter, string][] = [
    ['all', t.timeAll],
    ['current_hour', t.timeCurrentHour],
    ['morning', t.timeMorning],
    ['afternoon', t.timeAfternoon],
    ['evening', t.timeEvening],
    ['night', t.timeNight],
  ];

  return (
    <div className="space-y-6">
      {/* Simple Query Builder */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {t.predictorTitle}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">{t.predictorSubtitle}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 font-mono-tabular shrink-0">
            <span>
              {t.scannedDraws}:{' '}
              <strong className="text-slate-900">{analysis.totalDrawsScanned.toLocaleString()}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t.exactMatches}:{' '}
              <strong className="text-slate-900">{analysis.matchCount.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Time Window Filter Strip */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 mr-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {lang === 'bn' ? 'সময় ফিল্টার:' : 'Time Filter:'}
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {timeOptions.map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTimeFilter(mode)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    timeFilter === mode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {timeFilter === 'current_hour' && (
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="ref-time-input" className="text-slate-600 font-medium">
                {lang === 'bn' ? 'নির্বাচিত সময়:' : 'Target Time:'}
              </label>
              <input
                id="ref-time-input"
                type="time"
                value={refTime}
                onChange={(e) => setRefTime(sanitizeTimeHHMM(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-100">
          {/* Left: Sequence Input + Keypad */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="market-seq-input" className="text-sm font-medium text-slate-800">
                {t.sequenceInputLabel}
              </label>
              {latestMarketTail && (
                <button
                  type="button"
                  onClick={() => onChangeQuery(latestMarketTail.slice(-3))}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {lang === 'bn'
                    ? `সর্বশেষ ৩টি বসান (${latestMarketTail.slice(-3)})`
                    : `Use Latest 3 (${latestMarketTail.slice(-3)})`}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                id="market-seq-input"
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={querySequence}
                onChange={(e) => onChangeQuery(sanitizeSequenceInput(e.target.value).slice(0, 8))}
                placeholder={t.sequencePlaceholder}
                className="w-48 px-4 py-2.5 text-lg font-mono-tabular font-semibold tracking-widest bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => onChangeQuery(querySequence.slice(0, -1))}
                disabled={!querySequence}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Delete className="w-4 h-4" />
                {t.backspaceSeq}
              </button>
              <button
                type="button"
                onClick={() => onChangeQuery('')}
                disabled={!querySequence}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                {t.clearSeq}
              </button>
            </div>

            {/* Active Sequence Visual Strip */}
            <div className="min-h-[48px] flex items-center gap-2 flex-wrap py-2">
              {querySequence ? (
                <>
                  {querySequence.split('').map((ch, idx) => (
                    <React.Fragment key={`${ch}-${idx}`}>
                      <DigitBall digit={Number(ch)} size="md" />
                      {idx < querySequence.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                  <ArrowRight className="w-4 h-4 text-slate-700 shrink-0 mx-1" />
                  <span className="text-sm font-semibold text-slate-700 font-mono-tabular">?</span>
                </>
              ) : (
                <span className="text-xs text-slate-500">
                  {lang === 'bn'
                    ? 'নিচের ০–৯ বাটনে ট্যাপ করে বর্তমান মার্কেটের সংখ্যা দিন'
                    : 'Tap digits 0–9 below to enter the numbers currently in the market'}
                </span>
              )}
            </div>

            {/* 0-9 Tap Keypad */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
                const meta = getDigitMeta(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigitTap(d)}
                    className="flex flex-col items-center justify-center py-2.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer min-h-[54px]"
                  >
                    <DigitBall digit={d} size="sm" />
                    <span className="text-[11px] text-slate-600 mt-1 whitespace-nowrap">
                      {meta.size === 'big' ? 'Big' : 'Small'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Save Pattern & Saved Watches */}
          <div className="lg:col-span-5 lg:border-l lg:border-slate-100 lg:pl-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">{t.savedWatchesTitle}</h3>
            <form onSubmit={handleSaveWatch} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                maxLength={80}
                value={watchLabel}
                onChange={(e) => setWatchLabel(e.target.value)}
                placeholder={t.watchLabelPlaceholder}
                className="flex-1 min-w-0 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                disabled={!querySequence || savingWatch}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Bookmark className="w-3.5 h-3.5" />
                {t.saveWatch}
              </button>
            </form>

            {savedPatterns.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                {lang === 'bn'
                  ? 'গুরুত্বপূর্ণ প্যাটার্নগুলো সেভ করে রাখলে এক ক্লিকে পুনরায় চেক করতে পারবেন।'
                  : 'Pin frequent market sequences here for 1-click re-analysis.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {savedPatterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => onChangeQuery(pat.sequence)}
                      className="flex items-center gap-3 text-left hover:text-slate-900 text-slate-700 min-w-0 cursor-pointer"
                    >
                      <span className="font-mono-tabular font-semibold text-slate-900 shrink-0">
                        {pat.sequence}
                      </span>
                      <span className="text-xs text-slate-500 truncate">{pat.label}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePattern(pat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                      aria-label="Delete pattern"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* No Match Notice + Instant All-Time or Suffix Suggestions */}
      {querySequence && analysis.matchCount === 0 ? (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700 font-medium">{t.noMatchDesc}</p>
            {timeFilter !== 'all' && allTimeAnalysis.matchCount > 0 && (
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                {lang === 'bn'
                  ? `সব সময়ে দেখুন (${allTimeAnalysis.matchCount}টি মিল)`
                  : `Check All Times (${allTimeAnalysis.matchCount} matches)`}
              </button>
            )}
          </div>
          {fallbackAnalysis && fallbackAnalysis.matchCount > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t.fallbackSuffixTitle}: <span className="font-mono-tabular">{suffix2}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setTimeFilter('all');
                    onChangeQuery(suffix2);
                  }}
                  className="text-xs font-medium text-slate-900 underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {lang === 'bn' ? `${suffix2} দিয়ে বিশ্লেষণ করুন` : `Switch to ${suffix2}`}
                </button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                {fallbackAnalysis.nextDigitStats.slice(0, 3).map((item) => (
                  <div key={item.digit} className="flex items-center gap-2.5">
                    <DigitBall digit={item.digit} size="sm" />
                    <span className="font-mono-tabular font-semibold text-slate-900">
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono-tabular">
                      ({item.count}/{fallbackAnalysis.matchCount})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {querySequence && analysis.matchCount > 0 && (
        <>
          {/* Clear Natural-Language Verdict Banner */}
          <section className="bg-slate-900 text-white rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-1.5">
              <div className="text-xs text-slate-300 font-mono-tabular">
                {lang === 'bn'
                  ? `পূর্বের ${analysis.matchCount} বার ম্যাচ থেকে বিশ্লেষণ`
                  : `Based on ${analysis.matchCount} historical matches`}
                {timeFilter !== 'all' &&
                  ` · ${timeOptions.find(([k]) => k === timeFilter)?.[1] || ''}`}
              </div>
              <p className="text-base sm:text-lg font-semibold leading-snug">
                {lang === 'bn' ? (
                  <>
                    মার্কেটে <span className="font-mono-tabular text-emerald-300">{querySequence}</span>{' '}
                    থাকলে পূর্বের রেজাল্ট অনুযায়ী এরপর{' '}
                    <span className="text-emerald-300 font-mono-tabular">
                      {top3.map((x) => x.digit).join(', ')}
                    </span>{' '}
                    ({dominantColor} {dominantColorPct.toFixed(0)}% · {dominantSize}{' '}
                    {dominantSizePct.toFixed(0)}%) আসার সম্ভাবনা সবচেয়ে বেশি।
                  </>
                ) : (
                  <>
                    After <span className="font-mono-tabular text-emerald-300">{querySequence}</span>,
                    past history favors{' '}
                    <span className="text-emerald-300 font-mono-tabular">
                      {top3.map((x) => x.digit).join(', ')}
                    </span>{' '}
                    ({dominantColor} {dominantColorPct.toFixed(0)}% · {dominantSize}{' '}
                    {dominantSizePct.toFixed(0)}%).
                  </>
                )}
              </p>
            </div>
            {top1 && (
              <div className="flex items-center gap-3 shrink-0 bg-white/10 px-4 py-3 rounded-lg">
                <DigitBall digit={top1.digit} size="lg" />
                <div>
                  <div className="text-xs text-slate-300">
                    {lang === 'bn' ? 'সর্বোচ্চ সম্ভাবনা' : 'Top Candidate'}
                  </div>
                  <div className="text-xl font-bold font-mono-tabular">
                    {top1.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Top-3 Next Numbers + Color & Big/Small Bias */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-slate-900">{t.topRecommendations}</h2>
                <span className="text-xs text-slate-500 font-mono-tabular whitespace-nowrap">
                  n = {analysis.matchCount}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {top3.map((item) => {
                  const meta = getDigitMeta(item.digit);
                  return (
                    <div
                      key={item.digit}
                      className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          Rank #{item.rank} · {item.confidenceTier}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DigitBall digit={item.digit} size="lg" />
                        <div>
                          <div className="text-2xl font-bold font-mono-tabular text-slate-900">
                            {item.percentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-600 font-mono-tabular">
                            {item.count} / {analysis.matchCount} hits
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                        {lang === 'bn' ? meta.colorLabelBn : meta.colorLabelEn} ·{' '}
                        {meta.size === 'big' ? 'Big (5-9)' : 'Small (0-4)'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Color & Size Bias */}
            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-slate-900">{t.colorProbability}</h2>
                <div className="space-y-2.5 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-green-700">{t.green} (1,3,5,7,9)</span>
                      <span className="font-mono-tabular text-slate-900">
                        {analysis.colorBreakdown.green.pct.toFixed(1)}% (
                        {analysis.colorBreakdown.green.count})
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 100 6"
                      className="w-full h-2 rounded-full bg-slate-100 block"
                      preserveAspectRatio="none"
                    >
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(0, Math.min(100, analysis.colorBreakdown.green.pct))}
                        height="6"
                        rx="3"
                        className="fill-green-600"
                      />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-red-700">{t.red} (0,2,4,6,8)</span>
                      <span className="font-mono-tabular text-slate-900">
                        {analysis.colorBreakdown.red.pct.toFixed(1)}% (
                        {analysis.colorBreakdown.red.count})
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 100 6"
                      className="w-full h-2 rounded-full bg-slate-100 block"
                      preserveAspectRatio="none"
                    >
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(0, Math.min(100, analysis.colorBreakdown.red.pct))}
                        height="6"
                        rx="3"
                        className="fill-red-600"
                      />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-violet-700">{t.purple} (0,5)</span>
                      <span className="font-mono-tabular text-slate-900">
                        {analysis.colorBreakdown.purple.pct.toFixed(1)}% (
                        {analysis.colorBreakdown.purple.count})
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 100 6"
                      className="w-full h-2 rounded-full bg-slate-100 block"
                      preserveAspectRatio="none"
                    >
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(0, Math.min(100, analysis.colorBreakdown.purple.pct))}
                        height="6"
                        rx="3"
                        className="fill-violet-600"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">{t.sizeProbability}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-600">{t.big}</div>
                    <div className="text-lg font-bold font-mono-tabular text-slate-900 mt-0.5">
                      {analysis.sizeBreakdown.big.pct.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 font-mono-tabular">
                      {analysis.sizeBreakdown.big.count} hits
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-600">{t.small}</div>
                    <div className="text-lg font-bold font-mono-tabular text-slate-900 mt-0.5">
                      {analysis.sizeBreakdown.small.pct.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 font-mono-tabular">
                      {analysis.sizeBreakdown.small.count} hits
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Complete 0-9 Probability Table + Historical Match Audit Trail With Exact Time */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">{t.digitTableTitle}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2 text-left font-medium">Digit</th>
                      <th className="py-2 text-left font-medium">Attributes</th>
                      <th className="py-2 text-right font-medium">Hits</th>
                      <th className="py-2 text-right font-medium">Probability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analysis.nextDigitStats.map((row) => {
                      const meta = getDigitMeta(row.digit);
                      return (
                        <tr key={row.digit} className="hover:bg-slate-50">
                          <td className="py-2">
                            <DigitBall digit={row.digit} size="sm" />
                          </td>
                          <td className="py-2 text-xs text-slate-600">
                            {lang === 'bn' ? meta.colorLabelBn : meta.colorLabelEn} ·{' '}
                            {meta.size === 'big' ? 'Big' : 'Small'}
                          </td>
                          <td className="py-2 text-right font-mono-tabular text-slate-800">
                            {row.count}
                          </td>
                          <td className="py-2 text-right font-mono-tabular font-semibold text-slate-900">
                            {row.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">{t.occurrencesTitle}</h2>
                <span className="text-xs text-slate-500">
                  Latest {analysis.recentOccurrences.length}
                </span>
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2 text-left font-medium">Date</th>
                      <th className="py-2 text-left font-medium">Time</th>
                      <th className="py-2 text-left font-medium">Context</th>
                      <th className="py-2 text-right font-medium">Next</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analysis.recentOccurrences.map((occ, idx) => (
                      <tr key={`${occ.archiveId}-${occ.index}-${idx}`} className="hover:bg-slate-50">
                        <td className="py-2 text-xs text-slate-700 font-mono-tabular whitespace-nowrap">
                          {occ.dateKey}
                        </td>
                        <td className="py-2 text-xs text-slate-900 font-mono-tabular font-medium whitespace-nowrap">
                          {occ.timeStr}
                        </td>
                        <td className="py-2 font-mono-tabular text-xs text-slate-600 tracking-wider">
                          {occ.contextBefore}
                        </td>
                        <td className="py-2 text-right">
                          <DigitBall digit={occ.nextDigit} size="xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
