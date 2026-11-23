import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Grid3X3, Upload } from 'lucide-react';
import { DrawArchive, LanguageCode } from '../types/wingo';
import { COPY } from '../utils/i18n';
import { buildNotebookMatrix, getDigitMeta } from '../utils/wingoEngine';
import { DigitBall } from './DigitBall';

interface NotebookMatrixViewProps {
  lang: LanguageCode;
  archives: DrawArchive[];
  onOpenInPredictor: (sequence: string) => void;
  onGoToUpload: () => void;
}

// Notebook order: 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 (matches user's handwritten sheet)
const NOTEBOOK_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export const NotebookMatrixView: React.FC<NotebookMatrixViewProps> = ({
  lang,
  archives,
  onOpenInPredictor,
  onGoToUpload,
}) => {
  const t = COPY[lang];
  const [selectedPair, setSelectedPair] = useState<{ prev2: number; prev1: number }>({
    prev2: 6,
    prev1: 0,
  });

  const totalDraws = useMemo(
    () => archives.reduce((sum, a) => sum + a.sequence.length, 0),
    [archives]
  );

  const matrix = useMemo(() => buildNotebookMatrix(archives), [archives]);

  if (totalDraws < 3) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto my-8 space-y-4">
        <Grid3X3 className="w-10 h-10 text-slate-400 mx-auto" />
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

  const activeCell = matrix[selectedPair.prev2][selectedPair.prev1];
  const rankedDigits = activeCell.counts
    .map((count, digit) => ({
      digit,
      count,
      pct: activeCell.totalHits > 0 ? (count / activeCell.totalHits) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.digit - b.digit);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {t.matrixTitle}
            </h1>
            <p className="text-sm text-slate-600">{t.matrixSubtitle}</p>
          </div>
          <div className="text-xs text-slate-600 font-mono-tabular whitespace-nowrap">
            {lang === 'bn'
              ? `মোট বিশ্লেষিত ড্র: ${totalDraws.toLocaleString()}`
              : `Total draws analyzed: ${totalDraws.toLocaleString()}`}
          </div>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="p-2 text-left font-medium whitespace-nowrap">
                  Prev2 \ Prev1
                </th>
                {NOTEBOOK_ORDER.map((col) => (
                  <th key={col} className="p-2 text-center font-semibold font-mono-tabular">
                    Col {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {NOTEBOOK_ORDER.map((rowDigit) => (
                <tr key={rowDigit}>
                  <td className="p-2 font-mono-tabular font-semibold text-slate-700 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                    Row /{rowDigit}
                  </td>
                  {NOTEBOOK_ORDER.map((colDigit) => {
                    const cell = matrix[colDigit][rowDigit];
                    // Note: in the user's handwritten sheet, fraction is Top(colDigit)/Bottom(rowDigit), e.g., 1/1, 2/1, 3/1...
                    const isSelected =
                      selectedPair.prev2 === colDigit && selectedPair.prev1 === rowDigit;
                    return (
                      <td key={`${colDigit}-${rowDigit}`} className="p-1">
                        <button
                          type="button"
                          onClick={() => setSelectedPair({ prev2: colDigit, prev1: rowDigit })}
                          className={`w-full min-w-[78px] p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : cell.totalHits > 0
                                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
                                : 'bg-slate-50/50 border-slate-100 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 font-mono-tabular">
                            <span
                              className={`text-[11px] font-semibold ${
                                isSelected ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {colDigit}/{rowDigit}
                            </span>
                            {cell.topDigit !== null ? (
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? 'text-emerald-300' : 'text-slate-900'
                                }`}
                              >
                                →{cell.topDigit}
                              </span>
                            ) : (
                              <span className="text-[11px]">—</span>
                            )}
                          </div>
                          <div
                            className={`mt-1 font-mono-tabular text-[11px] truncate ${
                              isSelected ? 'text-slate-200' : 'text-slate-600'
                            }`}
                          >
                            {cell.totalHits > 0 ? cell.trailingDigits || '—' : '0 hits'}
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Selected Pair Inspector */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">{t.matrixCellDetail}:</h2>
            <div className="flex items-center gap-1.5">
              <DigitBall digit={selectedPair.prev2} size="sm" />
              <span className="text-slate-400 font-mono-tabular">/</span>
              <DigitBall digit={selectedPair.prev1} size="sm" />
            </div>
            <span className="text-xs text-slate-500 font-mono-tabular">
              ({activeCell.totalHits} {lang === 'bn' ? 'বার পাওয়া গেছে' : 'historical hits'})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenInPredictor(`${selectedPair.prev2}${selectedPair.prev1}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>
              {lang === 'bn' ? 'প্রেডিক্টরে বিস্তারিত দেখুন' : 'Open in Pattern Predictor'}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeCell.totalHits === 0 ? (
          <p className="text-sm text-slate-500">
            {lang === 'bn'
              ? 'নির্বাচিত এই জোড়াটি এখনো আপলোড করা রেজাল্টে পাওয়া যায়নি।'
              : 'This 2-digit pair has 0 occurrences in your selected history window.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 pt-2">
            {rankedDigits.map((item) => {
              const meta = getDigitMeta(item.digit);
              return (
                <div
                  key={item.digit}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <DigitBall digit={item.digit} size="xs" />
                    <span className="text-xs font-mono-tabular font-semibold text-slate-900">
                      {item.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[11px] font-mono-tabular text-slate-600">
                    {item.count} hits · {meta.size === 'big' ? 'Big' : 'Small'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
