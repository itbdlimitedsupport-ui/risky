import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  FileUp,
  PlusCircle,
  Save,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { DrawArchive, LanguageCode, ParsedDayGroup } from '../types/wingo';
import { COPY } from '../utils/i18n';
import {
  getCurrentTimeHHMM,
  getDigitMeta,
  getDrawTimeAt,
  getLast30DaysKeys,
  getTodayDateKey,
  parseBulkDrawsSmart,
  sanitizeSequenceInput,
  sanitizeTimeHHMM,
} from '../utils/wingoEngine';
import { DigitBall } from './DigitBall';

interface UploadHistoryViewProps {
  lang: LanguageCode;
  archives: DrawArchive[];
  onAppendLiveDigit: (
    dateKey: string,
    digit: number,
    startPeriod: string,
    tapTimeHHMM: string
  ) => Promise<void>;
  onUndoLastDigit: (archive: DrawArchive) => Promise<void>;
  onSaveBulkMultiDay: (
    groups: ParsedDayGroup[],
    labelBase: string,
    startPeriod: string,
    source: 'bulk' | 'csv'
  ) => Promise<{ batches: number; totalDraws: number }>;
  onUpdateArchive: (
    archiveId: string,
    updates: {
      label: string;
      sequence: string;
      startPeriod: string;
      startTime: string;
      times?: string;
    }
  ) => Promise<void>;
  onDeleteArchive: (archiveId: string) => Promise<void>;
}

export const UploadHistoryView: React.FC<UploadHistoryViewProps> = ({
  lang,
  archives,
  onAppendLiveDigit,
  onUndoLastDigit,
  onSaveBulkMultiDay,
  onUpdateArchive,
  onDeleteArchive,
}) => {
  const t = COPY[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [liveDate, setLiveDate] = useState(getTodayDateKey());
  const [liveTime, setLiveTime] = useState(getCurrentTimeHHMM());
  const [autoClock, setAutoClock] = useState(true);
  const [livePeriod, setLivePeriod] = useState('');
  const [liveBusy, setLiveBusy] = useState(false);

  const [bulkDate, setBulkDate] = useState(getTodayDateKey());
  const [bulkStartTime, setBulkStartTime] = useState('00:00');
  const [bulkLabel, setBulkLabel] = useState('');
  const [bulkStartPeriod, setBulkStartPeriod] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkSource, setBulkSource] = useState<'bulk' | 'csv'>('bulk');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Archive inspector / editor state
  const [editingArchive, setEditingArchive] = useState<DrawArchive | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editStartTime, setEditStartTime] = useState('00:00');
  const [editStartPeriod, setEditStartPeriod] = useState('');
  const [editSequence, setEditSequence] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const last30Days = useMemo(() => getLast30DaysKeys(), []);

  const drawsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of archives) {
      map.set(a.dateKey, (map.get(a.dateKey) || 0) + a.sequence.length);
    }
    return map;
  }, [archives]);

  const parsedGroups = useMemo(
    () => parseBulkDrawsSmart(bulkText, bulkDate, bulkStartTime),
    [bulkText, bulkDate, bulkStartTime]
  );

  const parsedTotalDraws = useMemo(
    () => parsedGroups.reduce((s, g) => s + g.sequence.length, 0),
    [parsedGroups]
  );

  const parsedHasTimes = useMemo(
    () => parsedGroups.some((g) => g.times.length > 0),
    [parsedGroups]
  );

  const latestLiveArchive = useMemo(() => {
    return [...archives]
      .filter((a) => a.dateKey === liveDate && a.source === 'manual')
      .sort((a, b) => b.id.localeCompare(a.id))[0];
  }, [archives, liveDate]);

  const recentLiveEntries = useMemo(() => {
    if (!latestLiveArchive) return [];
    const total = latestLiveArchive.sequence.length;
    const startIdx = Math.max(0, total - 15);
    const items: { digit: number; timeStr: string }[] = [];
    for (let i = startIdx; i < total; i++) {
      items.push({
        digit: Number(latestLiveArchive.sequence[i]),
        timeStr: getDrawTimeAt(latestLiveArchive, i),
      });
    }
    return items;
  }, [latestLiveArchive]);

  const sortedArchives = useMemo(
    () =>
      [...archives].sort((a, b) => {
        if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey);
        return b.id.localeCompare(a.id);
      }),
    [archives]
  );

  const handleSelectCalendarDay = (dateKey: string) => {
    setLiveDate(dateKey);
    setBulkDate(dateKey);
  };

  const handleTapDigit = async (digit: number) => {
    setLiveBusy(true);
    setFeedbackMsg('');
    const tapTime = autoClock ? getCurrentTimeHHMM() : sanitizeTimeHHMM(liveTime);
    if (autoClock) setLiveTime(tapTime);
    try {
      await onAppendLiveDigit(liveDate, digit, livePeriod, tapTime);
      setFeedbackMsg(
        lang === 'bn'
          ? `${liveDate} · ${tapTime} সময়ে সংখ্যা ${digit} ফায়ারবেসে সেভ হয়েছে`
          : `Saved digit ${digit} at ${liveDate} ${tapTime} to Firestore`
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
    if (parsedGroups.length === 0 || parsedTotalDraws === 0) return;
    setBulkBusy(true);
    setFeedbackMsg('');
    try {
      const res = await onSaveBulkMultiDay(parsedGroups, bulkLabel, bulkStartPeriod, bulkSource);
      setFeedbackMsg(
        lang === 'bn'
          ? `${parsedGroups.length}টি দিনের মোট ${res.totalDraws.toLocaleString()}টি রেজাল্ট (${res.batches}টি ব্যাচ) ফায়ারবেসে সেভ হয়েছে!`
          : `Saved ${res.totalDraws.toLocaleString()} draws across ${parsedGroups.length} day(s) to Firestore!`
      );
      setBulkText('');
      setBulkLabel('');
    } finally {
      setBulkBusy(false);
    }
  };

  const openEditor = (arc: DrawArchive) => {
    setEditingArchive(arc);
    setEditLabel(arc.label);
    setEditStartTime(arc.startTime || '00:00');
    setEditStartPeriod(arc.startPeriod || '');
    setEditSequence(arc.sequence);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArchive) return;
    const cleanSeq = sanitizeSequenceInput(editSequence).slice(0, 1500);
    if (!cleanSeq) return;
    setSavingEdit(true);
    try {
      // Preserve explicit times only if length didn't change and times existed
      const keepTimes =
        editingArchive.times && editingArchive.times.length === cleanSeq.length * 4
          ? editingArchive.times
          : '';
      await onUpdateArchive(editingArchive.id, {
        label: editLabel,
        sequence: cleanSeq,
        startPeriod: editStartPeriod,
        startTime: editStartTime,
        times: keepTimes,
      });
      setFeedbackMsg(
        lang === 'bn'
          ? `${editingArchive.dateKey}-এর ডাটা আপডেট হয়েছে`
          : `Updated ${editingArchive.dateKey} archive`
      );
      setEditingArchive(null);
    } finally {
      setSavingEdit(false);
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

      {/* 30-Day Coverage Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{t.calendarTitle}</h2>
          <span className="text-xs text-slate-500 font-mono-tabular">
            {Array.from(drawsByDate.values()).filter((c) => c > 0).length} / 30{' '}
            {lang === 'bn' ? 'দিনে ডাটা আছে' : 'days populated'}
          </span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-15 gap-1.5">
          {last30Days.map((dayKey) => {
            const count = drawsByDate.get(dayKey) || 0;
            const isSelected = liveDate === dayKey || bulkDate === dayKey;
            const dayNum = dayKey.slice(8, 10);
            const monthNum = dayKey.slice(5, 7);
            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => handleSelectCalendarDay(dayKey)}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : count > 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-mono-tabular font-semibold">
                  {dayNum}/{monthNum}
                </div>
                <div
                  className={`text-[10px] font-mono-tabular mt-0.5 ${
                    isSelected ? 'text-slate-300' : count > 0 ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {count > 0 ? count : '—'}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live 1-Minute Quick Tap Logger With Exact Time */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">{t.liveTapTitle}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{t.liveTapDesc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">{t.targetDate}</label>
              <input
                type="date"
                value={liveDate}
                onChange={(e) => setLiveDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">{t.startTimeLabel}</label>
              <input
                type="time"
                value={liveTime}
                disabled={autoClock}
                onChange={(e) => setLiveTime(sanitizeTimeHHMM(e.target.value))}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">{t.startPeriod}</label>
              <input
                type="text"
                maxLength={40}
                value={livePeriod}
                onChange={(e) => setLivePeriod(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="11317401"
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoClock}
              onChange={(e) => {
                setAutoClock(e.target.checked);
                if (e.target.checked) setLiveTime(getCurrentTimeHHMM());
              }}
              className="rounded border-slate-300"
            />
            <span>
              {lang === 'bn'
                ? 'ট্যাপ করার সাথে সাথে বর্তমান ঘড়ির সময় অটো সেভ হবে'
                : 'Auto-stamp current clock time (HH:MM) on every tap'}
            </span>
          </label>

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
                  ? `${liveDate} লাইভ এন্ট্রি (${latestLiveArchive?.drawCount || 0}টি)`
                  : `${liveDate} Live Entries (${latestLiveArchive?.drawCount || 0})`}
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
            <div className="flex flex-wrap items-center gap-2 min-h-[42px]">
              {recentLiveEntries.length === 0 ? (
                <span className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'এই তারিখে এখনো কোনো লাইভ সংখ্যা যোগ করা হয়নি।'
                    : 'No live digits tapped for this date yet.'}
                </span>
              ) : (
                recentLiveEntries.map((item, idx) => (
                  <div key={`${item.timeStr}-${idx}`} className="flex flex-col items-center gap-0.5">
                    <DigitBall digit={item.digit} size="xs" />
                    <span className="text-[10px] font-mono-tabular text-slate-500">
                      {item.timeStr}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Bulk Sequence & Multi-Day CSV Importer */}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.targetDate}</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.startTimeLabel}</label>
                <input
                  type="time"
                  value={bulkStartTime}
                  onChange={(e) => setBulkStartTime(sanitizeTimeHHMM(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.batchLabel}</label>
                <input
                  type="text"
                  maxLength={64}
                  value={bulkLabel}
                  onChange={(e) => setBulkLabel(e.target.value)}
                  placeholder="Day History"
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
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
                  placeholder="11310001"
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-tabular text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                rows={6}
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
                    ? `শনাক্ত: ${parsedTotalDraws.toLocaleString()}টি রেজাল্ট · ${parsedGroups.length} দিন${parsedHasTimes ? ' · টাইমসহ' : ''}`
                    : `Parsed: ${parsedTotalDraws.toLocaleString()} draws · ${parsedGroups.length} day(s)${parsedHasTimes ? ' · Exact times detected' : ''}`}
                </span>
                <button
                  type="submit"
                  disabled={parsedTotalDraws === 0 || bulkBusy}
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

      {/* Inline Day / Batch Editor & Time Inspector */}
      {editingArchive && (
        <section className="bg-white border border-slate-300 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {lang === 'bn'
                  ? `ডাটা দেখুন ও আপডেট করুন — ${editingArchive.dateKey}`
                  : `Inspect & Update — ${editingArchive.dateKey}`}
              </h3>
              <p className="text-xs text-slate-600 font-mono-tabular">
                {editingArchive.drawCount} draws · Start {editingArchive.startTime || '00:00'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingArchive(null)}
              className="p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
              aria-label="Close editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.batchLabel}</label>
                <input
                  type="text"
                  maxLength={80}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.startTimeLabel}</label>
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(sanitizeTimeHHMM(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">{t.startPeriod}</label>
                <input
                  type="text"
                  maxLength={40}
                  value={editStartPeriod}
                  onChange={(e) =>
                    setEditStartPeriod(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                  }
                  className="w-full px-3 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                {lang === 'bn'
                  ? `সংখ্যা সিকোয়েন্স (${sanitizeSequenceInput(editSequence).length}/1500)`
                  : `Digit Sequence (${sanitizeSequenceInput(editSequence).length}/1500)`}
              </label>
              <textarea
                rows={3}
                value={editSequence}
                onChange={(e) => setEditSequence(sanitizeSequenceInput(e.target.value).slice(0, 1500))}
                className="w-full px-3 py-2 text-sm font-mono-tabular tracking-wider bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="pt-2 space-y-2">
              <div className="text-xs font-medium text-slate-600">
                {lang === 'bn'
                  ? 'টাইম অনুযায়ী রেজাল্ট প্রিভিউ (সর্বশেষ ৬০টি):'
                  : 'Time-by-Time Preview (Latest 60):'}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-lg border border-slate-200">
                {editingArchive.sequence
                  .slice(-60)
                  .split('')
                  .map((ch, idx) => {
                    const realIdx = Math.max(0, editingArchive.sequence.length - 60) + idx;
                    const tStr = getDrawTimeAt(editingArchive, realIdx);
                    return (
                      <div
                        key={`${realIdx}-${tStr}`}
                        className="flex flex-col items-center p-1.5 bg-white border border-slate-200 rounded-md"
                      >
                        <span className="text-[10px] font-mono-tabular text-slate-500 mb-1">
                          {tStr}
                        </span>
                        <DigitBall digit={Number(ch)} size="xs" />
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingArchive(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={savingEdit || !sanitizeSequenceInput(editSequence)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'পরিবর্তন সেভ করুন' : 'Save Updates'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Stored Archives Ledger */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">{t.archivesTableTitle}</h2>
          <span className="text-xs text-slate-500 font-mono-tabular">
            {sortedArchives.length} {lang === 'bn' ? 'টি ব্যাচ' : 'batches'}
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
                  <th className="py-2.5 text-left font-medium">Time Range</th>
                  <th className="py-2.5 text-left font-medium">Label</th>
                  <th className="py-2.5 text-right font-medium">Draws</th>
                  <th className="py-2.5 text-left font-medium pl-4">Latest Tail</th>
                  <th className="py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedArchives.map((arc) => {
                  const firstTime = getDrawTimeAt(arc, 0);
                  const lastTime = getDrawTimeAt(arc, Math.max(0, arc.sequence.length - 1));
                  return (
                    <tr key={arc.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono-tabular text-xs text-slate-800 whitespace-nowrap">
                        {arc.dateKey}
                      </td>
                      <td className="py-2.5 font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                        {firstTime} – {lastTime}
                      </td>
                      <td className="py-2.5 text-slate-900 font-medium max-w-[180px] truncate">
                        {arc.label}
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
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditor(arc)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer mr-1"
                          aria-label={`Inspect and edit ${arc.label}`}
                          title={lang === 'bn' ? 'দেখুন ও আপডেট করুন' : 'Inspect & Update'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
