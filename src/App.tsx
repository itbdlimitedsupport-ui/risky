import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Database, LogIn, LogOut } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import {
  DrawArchive,
  HistoryWindow,
  LanguageCode,
  RiskProfile,
  SavedPattern,
  TradeLog,
} from './types/wingo';
import {
  appendLiveDraw,
  createPatternWatch,
  ensureUserAndRiskProfile,
  recordTradeLog,
  removeArchive,
  removePatternWatch,
  removeTradeLog,
  saveBulkArchives,
  saveRiskProfile,
  subscribeArchives,
  subscribeRiskProfile,
  subscribeSavedPatterns,
  subscribeTrades,
  undoLastDrawInArchive,
} from './services/firestoreService';
import { COPY } from './utils/i18n';
import {
  createDefaultRiskProfile,
  evaluateDailyRiskStatus,
  filterArchivesByWindow,
  getCurrencySymbol,
  getTodayDateKey,
} from './utils/wingoEngine';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PatternPredictorView } from './components/PatternPredictorView';
import { UploadHistoryView } from './components/UploadHistoryView';
import { NotebookMatrixView } from './components/NotebookMatrixView';
import { MoneyRiskView } from './components/MoneyRiskView';

type ActiveTab = 'predictor' | 'upload' | 'matrix' | 'money';

function WinGoDeskApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  const [lang, setLang] = useState<LanguageCode>('bn');
  const [activeTab, setActiveTab] = useState<ActiveTab>('predictor');
  const [windowMode, setWindowMode] = useState<HistoryWindow>('30d');
  const [querySequence, setQuerySequence] = useState<string>('60');

  const [archives, setArchives] = useState<DrawArchive[]>([]);
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);

  const [secondsLeft, setSecondsLeft] = useState<number>(() => 60 - new Date().getSeconds());
  const [authError, setAuthError] = useState<string>('');

  const t = COPY[lang];

  // Live 1-minute WinGo round countdown clock
  useEffect(() => {
    const timer = window.setInterval(() => {
      const s = new Date().getSeconds();
      setSecondsLeft(s === 0 ? 60 : 60 - s);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const initUserSession = async (nextUser: User) => {
    setAuthError('');
    try {
      await ensureUserAndRiskProfile(nextUser);
      setProfileReady(true);
    } catch (err) {
      setProfileReady(false);
      setAuthError(err instanceof Error ? err.message : 'Failed to initialize profile');
    }
  };

  // Auth listener & user initialization
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        await initUserSession(nextUser);
      } else {
        setProfileReady(false);
        setAuthError('');
        setArchives([]);
        setTrades([]);
        setSavedPatterns([]);
        setRiskProfile(null);
      }
    });
    return () => unsub();
  }, []);

  // Real-time Firestore subscriptions (attached only when authenticated & ready)
  useEffect(() => {
    if (!user || !profileReady) return;
    const unsubProfile = subscribeRiskProfile(user.uid, setRiskProfile);
    const unsubArchives = subscribeArchives(user.uid, setArchives);
    const unsubTrades = subscribeTrades(user.uid, setTrades);
    const unsubPatterns = subscribeSavedPatterns(user.uid, setSavedPatterns);
    return () => {
      unsubProfile();
      unsubArchives();
      unsubTrades();
      unsubPatterns();
    };
  }, [user, profileReady]);

  const handleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in cancelled or failed');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const filteredArchives = useMemo(
    () => filterArchivesByWindow(archives, windowMode),
    [archives, windowMode]
  );

  const totalDrawsInWindow = useMemo(
    () => filteredArchives.reduce((sum, a) => sum + a.sequence.length, 0),
    [filteredArchives]
  );

  const effectiveProfile = useMemo(
    () => riskProfile || createDefaultRiskProfile(user?.uid || 'guest'),
    [riskProfile, user]
  );

  const dailyRisk = useMemo(
    () => evaluateDailyRiskStatus(effectiveProfile, trades, getTodayDateKey()),
    [effectiveProfile, trades]
  );

  const sym = getCurrencySymbol(effectiveProfile.currency);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: Exactly 3 zones separated by gap-8 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('predictor');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            {t.appName}
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {(
              [
                ['predictor', t.navPredictor],
                ['upload', t.navUpload],
                ['matrix', t.navMatrix],
                ['money', t.navMoney],
              ] as [ActiveTab, string][]
            ).map(([tabId, label]) => (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveTab(tabId)}
                className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tabId
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center shrink-0">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t.signOut}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                {t.signIn}
              </button>
            )}
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {(
            [
              ['predictor', t.navPredictor],
              ['upload', t.navUpload],
              ['matrix', t.navMatrix],
              ['money', t.navMoney],
            ] as [ActiveTab, string][]
          ).map(([tabId, label]) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tabId
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Workspace Toolbar: History Window, Language Toggle, and Live Metrics */}
      {user && profileReady && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            {/* Segmented Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    ['15d', t.window15d],
                    ['30d', t.window30d],
                    ['all', t.windowAll],
                  ] as [HistoryWindow, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWindowMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      windowMode === mode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    lang === 'bn'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    lang === 'en'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Clean Unboxed Tabular Metrics */}
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 font-mono-tabular">
              <span>
                {t.drawsLoaded}:{' '}
                <strong className="text-slate-900">{totalDrawsInWindow.toLocaleString()}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t.daysStored}:{' '}
                <strong className="text-slate-900">{filteredArchives.length}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t.bankrollLabel}:{' '}
                <strong className="text-slate-900">
                  {sym}
                  {effectiveProfile.currentBankroll.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t.todayPnlLabel}:{' '}
                <strong
                  className={dailyRisk.todayNetPnl >= 0 ? 'text-green-700' : 'text-red-700'}
                >
                  {dailyRisk.todayNetPnl >= 0 ? '+' : ''}
                  {sym}
                  {dailyRisk.todayNetPnl.toFixed(2)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t.liveClockLabel}:{' '}
                <strong className="text-slate-900">
                  00:{String(secondsLeft).padStart(2, '0')}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {!authReady ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 max-w-lg mx-auto my-12 space-y-4">
            <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-40 bg-slate-100 rounded animate-pulse" />
          </div>
        ) : !user ? (
          <section className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 max-w-xl mx-auto my-10 space-y-5">
            <div className="flex items-center justify-between">
              <Database className="w-8 h-8 text-slate-900" />
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    lang === 'bn' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    lang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t.authPromptTitle}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">{t.authPromptDesc}</p>
            {authError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {authError}
              </p>
            )}
            <button
              type="button"
              onClick={handleSignIn}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogIn className="w-4 h-4" />
              {t.authPromptBtn}
            </button>
          </section>
        ) : !profileReady ? (
          authError ? (
            <section className="bg-white border border-red-200 rounded-xl p-8 max-w-xl mx-auto my-10 space-y-4">
              <h2 className="text-lg font-semibold text-red-900">
                {lang === 'bn'
                  ? 'ফায়ারবেস প্রোফাইল লোড করতে সমস্যা হয়েছে'
                  : 'Unable to initialize Firebase profile'}
              </h2>
              <p className="text-xs font-mono-tabular text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 break-words">
                {authError}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => user && initUserSession(user)}
                  className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.signOut}
                </button>
              </div>
            </section>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
              <div className="h-6 w-64 bg-slate-100 rounded animate-pulse" />
              <div className="h-32 w-full bg-slate-100 rounded animate-pulse" />
            </div>
          )
        ) : activeTab === 'predictor' ? (
          <PatternPredictorView
            lang={lang}
            archives={filteredArchives}
            savedPatterns={savedPatterns}
            querySequence={querySequence}
            onChangeQuery={setQuerySequence}
            onSavePattern={(seq, label) => createPatternWatch(user.uid, seq, label)}
            onDeletePattern={(id) => removePatternWatch(user.uid, id)}
            onGoToUpload={() => setActiveTab('upload')}
          />
        ) : activeTab === 'upload' ? (
          <UploadHistoryView
            lang={lang}
            archives={archives}
            onAppendLiveDigit={(dateKey, digit, startPeriod) =>
              appendLiveDraw(user.uid, dateKey, digit, archives, startPeriod)
            }
            onUndoLastDigit={(arc) => undoLastDrawInArchive(user.uid, arc)}
            onSaveBulk={(dateKey, label, digits, startPeriod, source) =>
              saveBulkArchives(user.uid, dateKey, label, digits, startPeriod, source)
            }
            onDeleteArchive={(id) => removeArchive(user.uid, id)}
          />
        ) : activeTab === 'matrix' ? (
          <NotebookMatrixView
            lang={lang}
            archives={filteredArchives}
            onOpenInPredictor={(seq) => {
              setQuerySequence(seq);
              setActiveTab('predictor');
            }}
            onGoToUpload={() => setActiveTab('upload')}
          />
        ) : (
          <MoneyRiskView
            lang={lang}
            profile={effectiveProfile}
            trades={trades}
            onSaveProfile={(next) => saveRiskProfile(user.uid, next)}
            onRecordTrade={(payload) => recordTradeLog(user.uid, payload)}
            onDeleteTrade={(id) => removeTradeLog(user.uid, id)}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WinGoDeskApp />
    </ErrorBoundary>
  );
}
