import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileUp, PlusCircle, Trash2, Undo2 } from 'lucide-react';
import { DrawArchive, LanguageCode } from '../types/wingo';
import { COPY } from '../utils/i18n';
import {
  getDigitMeta,
  getTodayDateKey,
  parseBulkDigitsFromText,
} from '../utils/wingoEngine';
import { DigitBall } from './DigitBall';

interface UploadHistoryViewProps {
  lang: LanguageCode;
  archives: DrawArchive[];
  onAppendLiveDigit: (dateKey: string, digit: number, startPeriod: string) => Promise<void>;
  onUndoLastDigit: (archive: DrawArchive) => Promise<void>;
  onSaveBulk: (
    dateKey: string,
    labelBase: string,
    digits: string,
    startPeriod: string,
    source: 'bulk' | 'csv'
  ) => Promise<number>;
  onDeleteArchive: (archiveId: string) => Promise<void>;
}

export const UploadHistoryView: React.FC<UploadHistoryViewProps> = ({
  lang,
  archives,
  onAppendLiveDigit,
  onUndoLastDigit,
  onSaveBulk,
  onDeleteArchive,
}) => {
  const t = COPY[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [liveDate, setLiveDate] = useState(getTodayDateKey());
  const [livePeriod, setLivePeriod] = useState('');
  const [liveBusy, setLiveBusy] = useState(false);

  const [bulkDate, setBulkDate] = useState(getTodayDateKey());
  const [bulkLabel, setBulkLabel] = useState('');
  const [bulkStartPeriod, setBulkStartPeriod] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkSource, setBulkSource] = useState<'bulk' | 'csv'>('bulk');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const parsedBulkDigits = useMemo(() => parseBulkDigitsFromText(bulkText), [bulkText]);

  const latestLiveArchive = useMemo(() => {
    return [...archives]
      .filter((a) => a.dateKey === liveDate && a.source === 'manual')
      .sort((a, b) => b.id.localeCompare(a.id))[0];
  }, [archives, liveDate]);

  const recentLiveDigits = useMemo(() => {
    if (!latestLiveArchive) return [];
    return latestLiveArchive.sequence.slice(-18).split('').map(Number);
  }, [latestLiveArchive]);

  const sortedArchives = useMemo(
    () =>
      [...archives].sort((a, b) => {
        if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey);
        return b.id.localeCompare(a.id);
      }),
    [archives]
  );

  const handleTapDigit = async (digit: number) => {
    setLiveBusy(true);
    setFeedbackMsg('');
    try {
      await onAppendLiveDigit(liveDate, digit, livePeriod);
      setFeedbackMsg(
        lang === 'bn' ? `সংখ্যা ${digit} ফায়ারবেসে সেভ হয়েছে` : `Saved digit ${digit} to Firestore`
      );
    } finally {
      setLiveBusy(false);
    }
  };

  const handleUndo = async () => {
    if (!latestLiveArchive) return;
    setLiveBusy(true);
    try {
      await onUndoLastDigit(latestLiveArchive);
      setFeedbackMsg(lang === 'bn' ? 'সর্বশেষ সংখ্যাটি মুছে ফেলা হয়েছে' : 'Removed last digit');
    } finally {
      setLiveBusy(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setBulkText(text);
    setBulkSource('csv');
    if (!bulkLabel) {
      setBulkLabel(file.name.replace(/\.[^.]+$/, '').slice(0, 60));
    }
    e.target.value = '';
  };

  const handleSaveBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedBulkDigits) return;
    setBulkBusy(true);
    setFeedbackMsg('');
    try {
      const batches = await onSaveBulk(
        bulkDate,
        bulkLabel || `History ${bulkDate}`,
        parsedBulkDigits,
        bulkStartPeriod,
        bulkSource
      );
      setFeedbackMsg(
        lang === 'bn'
          ? `${parsedBulkDigits.length.toLocaleString()}টি রেজাল্ট (${batches}টি ব্যাচ) ফায়ারবেসে সেভ হয়েছে!`
          : `Saved ${parsedBulkDigits.length.toLocaleString()} draws across ${batches} batch(es) to Firestore!`
      );
      setBulkText('');
      setBulkLabel('');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live 1-Minute Quick Tap Logger */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">{t.liveTapTitle}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{t.liveTapDesc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">{t.targetDate}</label>
              <input
                type="date"
                value={liveDate}
                onChange={(e) => setLiveDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">{t.startPeriod}</label>
              <input
                type="text"
                maxLength={40}
                value={livePeriod}
                onChange={(e) => setLivePeriod(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="e.g. 11317401"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
              const meta = getDigitMeta(d);
              return (
                <button
                  key={d}
                  type="button"
                  disabled={liveBusy}
                  onClick={() => handleTapDigit(d)}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <DigitBall digit={d} size="md" />
                  <span className="text-[11px] text-slate-600 mt-1.5 whitespace-nowrap">
                    {meta.size === 'big' ? 'Big' : 'Small'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                {lang === 'bn'
                  ? `আজকের লাইভ স্ট্রিম (${latestLiveArchive?.drawCount || 0}টি)`
                  : `Live Stream (${latestLiveArchive?.drawCount || 0} logged)`}
              </span>
              <button
                type="button"
                disabled={!latestLiveArchive || liveBusy}
                onClick={handleUndo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Undo2 className="w-3.5 h-3.5" />
                {t.undoLast}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 min-h-[34px]">
              {recentLiveDigits.length === 0 ? (
                <span className="text-xs text-slate-400">
                  {lang === 'bn' ? 'এখনো কোনো লাইভ সংখ্যা যোগ করা হয়নি।' : 'No live digits tapped for this date yet.'}
                </span>
              ) : (
                recentLiveDigits.map((d, idx) => <DigitBall key={`${d}-${idx}`} digit={d} size="xs" />)
              )}
            </div>
          </div>
        </section>

        {/* Bulk Sequence & CSV Importer */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">{t.bulkTitle}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{t.bulkDesc}</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileUp className="w-3.5 h-3.5" />
                {t.importFileBtn}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveBulk} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.targetDate}</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.batchLabel}</label>
                <input
                  type="text"
                  maxLength={64}
                  value={bulkLabel}
                  onChange={(e) => setBulkLabel(e.target.value)}
                  placeholder="e.g. Day 14 Full History"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.startPeriod}</label>
                <input
                  type="text"
                  maxLength={40}
                  value={bulkStartPeriod}
                  onChange={(e) =>
                    setBulkStartPeriod(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                  }
                  placeholder="e.g. 11310001"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <textarea
                rows={5}
                value={bulkText}
                onChange={(e) => {
                  setBulkText(e.target.value);
                  setBulkSource('bulk');
                }}
                placeholder={t.bulkPlaceholder}
                className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <span className="font-mono-tabular">
                  {lang === 'bn'
                    ? `শনাক্তকৃত ড্র সংখ্যা: ${parsedBulkDigits.length.toLocaleString()}টি (${Math.max(1, Math.ceil(parsedBulkDigits.length / 1440))}টি ব্যাচ)`
                    : `Parsed draws: ${parsedBulkDigits.length.toLocaleString()} (${Math.max(1, Math.ceil(parsedBulkDigits.length / 1440))} Firestore batch${parsedBulkDigits.length > 1440 ? 'es' : ''})`}
                </span>
                <button
                  type="submit"
                  disabled={!parsedBulkDigits || bulkBusy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  {t.saveBulkBtn}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* Stored Archives Ledger */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">{t.archivesTableTitle}</h2>
          <span className="text-xs text-slate-500 font-mono-tabular">
            {sortedArchives.length} {lang === 'bn' ? 'টি ডকুমেন্ট' : 'documents'}
          </span>
        </div>

        {sortedArchives.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            {lang === 'bn'
              ? 'ফায়ারবেসে এখনো কোনো হিস্ট্রি ব্যাচ সংরক্ষিত নেই।'
              : 'No draw batches stored in Firestore yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2.5 text-left font-medium">Date</th>
                  <th className="py-2.5 text-left font-medium">Label</th>
                  <th className="py-2.5 text-left font-medium">Source</th>
                  <th className="py-2.5 text-right font-medium">Draws</th>
                  <th className="py-2.5 text-left font-medium pl-4">Tail Preview</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedArchives.map((arc) => (
                  <tr key={arc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono-tabular text-xs text-slate-800 whitespace-nowrap">
                      {arc.dateKey}
                    </td>
                    <td className="py-2.5 text-slate-900 font-medium max-w-[200px] truncate">
                      {arc.label}
                    </td>
                    <td className="py-2.5 text-xs text-slate-600 uppercase font-mono-tabular">
                      {arc.source}
                    </td>
                    <td className="py-2.5 text-right font-mono-tabular font-semibold text-slate-900">
                      {arc.drawCount.toLocaleString()}
                    </td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-1">
                        {arc.sequence
                          .slice(-8)
                          .split('')
                          .map((ch, idx) => (
                            <DigitBall key={`${arc.id}-${idx}`} digit={Number(ch)} size="xs" />
                          ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteArchive(arc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        aria-label={`Delete ${arc.label}`}
                      >
                        <Trash2 className="w-4 h-4" />
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
