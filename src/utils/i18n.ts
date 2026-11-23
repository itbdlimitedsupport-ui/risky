import { LanguageCode } from '../types/wingo';

export const COPY: Record<LanguageCode, {
  appName: string;
  navPredictor: string;
  navUpload: string;
  navMatrix: string;
  navMoney: string;
  signIn: string;
  signOut: string;
  window15d: string;
  window30d: string;
  windowAll: string;
  drawsLoaded: string;
  daysStored: string;
  bankrollLabel: string;
  todayPnlLabel: string;
  liveClockLabel: string;
  authPromptTitle: string;
  authPromptDesc: string;
  authPromptBtn: string;
  predictorTitle: string;
  predictorSubtitle: string;
  sequenceInputLabel: string;
  sequencePlaceholder: string;
  clearSeq: string;
  backspaceSeq: string;
  saveWatch: string;
  watchLabelPlaceholder: string;
  savedWatchesTitle: string;
  exactMatches: string;
  scannedDraws: string;
  topRecommendations: string;
  colorProbability: string;
  sizeProbability: string;
  digitTableTitle: string;
  occurrencesTitle: string;
  fallbackSuffixTitle: string;
  noDataTitle: string;
  noDataDesc: string;
  goUploadBtn: string;
  noMatchDesc: string;
  uploadTitle: string;
  uploadSubtitle: string;
  liveTapTitle: string;
  liveTapDesc: string;
  targetDate: string;
  startTimeLabel: string;
  undoLast: string;
  bulkTitle: string;
  bulkDesc: string;
  bulkPlaceholder: string;
  importFileBtn: string;
  saveBulkBtn: string;
  batchLabel: string;
  startPeriod: string;
  archivesTableTitle: string;
  matrixTitle: string;
  matrixSubtitle: string;
  matrixCellDetail: string;
  moneyTitle: string;
  moneySubtitle: string;
  riskProfileTitle: string;
  saveProfileBtn: string;
  progressionTitle: string;
  logTradeTitle: string;
  tradeLedgerTitle: string;
  green: string;
  red: string;
  purple: string;
  big: string;
  small: string;
  win: string;
  loss: string;
  timeAll: string;
  timeCurrentHour: string;
  timeMorning: string;
  timeAfternoon: string;
  timeEvening: string;
  timeNight: string;
  calendarTitle: string;
}> = {
  bn: {
    appName: 'WinGo Desk',
    navPredictor: 'কী আসবে? (জিজ্ঞেস করুন)',
    navUpload: '১ মাসের ডাটা আপডেট',
    navMatrix: '১০×১০ নোটবুক',
    navMoney: 'মানি ও রিস্ক',
    signIn: 'Google দিয়ে সাইন ইন',
    signOut: 'সাইন আউট',
    window15d: 'গত ১৫ দিন',
    window30d: 'গত ৩০ দিন',
    windowAll: 'সব ডাটা',
    drawsLoaded: 'মোট রেজাল্ট',
    daysStored: 'সেভ করা দিন',
    bankrollLabel: 'ব্যালেন্স',
    todayPnlLabel: 'আজকের লাভ/লস',
    liveClockLabel: '১-মিনিট টাইমার',
    authPromptTitle: 'আপনার রিয়েল ফায়ারবেস ডাটাবেজ কানেক্ট করুন',
    authPromptDesc:
      'পুরো ১ মাসের WinGo ১-মিনিট রেজাল্ট, কোন টাইমে কোন সংখ্যা আসছে তার রেকর্ড এবং মানি/রিস্ক ম্যানেজমেন্ট নিরাপদে সেভ রাখতে Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন।',
    authPromptBtn: 'Google দিয়ে চালু করুন',
    predictorTitle: 'এখন মার্কেটে কী কী আছে? জিজ্ঞেস করুন',
    predictorSubtitle:
      'বর্তমান মার্কেটে আসা সংখ্যাগুলো নিচে ট্যাপ করুন বা লিখুন, এবং চাইলে সময় (Time) সিলেক্ট করুন—আপনার ১ মাসের পূর্বের রেজাল্ট দেখে পরবর্তী কোন সংখ্যা ও কালার আসার সম্ভাবনা বেশি তা সাথে সাথে বলে দেবে।',
    sequenceInputLabel: 'মার্কেটে এখন এই সংখ্যাগুলো আসছে:',
    sequencePlaceholder: 'যেমন: 60 বা 389',
    clearSeq: 'সব মুছুন',
    backspaceSeq: 'একটি কাটুন',
    saveWatch: 'সেভ করুন',
    watchLabelPlaceholder: 'নাম দিন (যেমন: সন্ধ্যার 6→0)',
    savedWatchesTitle: 'সেভ করা প্যাটার্ন',
    exactMatches: 'মিলেছে',
    scannedDraws: 'মোট দেখা হয়েছে',
    topRecommendations: 'পূর্বের রেজাল্ট অনুযায়ী আসার সম্ভাবনা সবচেয়ে বেশি',
    colorProbability: 'কোন কালার আসার সম্ভাবনা বেশি',
    sizeProbability: 'Big না Small?',
    digitTableTitle: '০ থেকে ৯ সব সংখ্যার সম্ভাবনা',
    occurrencesTitle: 'পূর্বের কোন দিন ও কোন টাইমে এমন হয়েছিল',
    fallbackSuffixTitle: 'শেষ ২ সংখ্যার বিকল্প হিসাব',
    noDataTitle: 'এখনো কোনো রেজাল্ট আপলোড করা হয়নি',
    noDataDesc:
      'শুরু করতে "১ মাসের ডাটা আপডেট" ট্যাবে গিয়ে আপনার প্রতি মিনিটের রেজাল্ট বা ১ মাসের ডাটা তারিখ ও টাইমসহ আপলোড করে রাখুন।',
    goUploadBtn: 'ডাটা আপলোড করতে যান',
    noMatchDesc: 'নির্বাচিত টাইম ও প্যাটার্নে কোনো হুবহু মিল পাওয়া যায়নি। সময় পরিবর্তন করে "সব সময়" দিয়ে দেখুন অথবা শেষ ২ সংখ্যা চেষ্টা করুন।',
    uploadTitle: 'পুরো ১ মাসের রেজাল্ট ও টাইম আপডেট',
    uploadSubtitle:
      'প্রতি মিনিটের রেজাল্ট কোন টাইমে কী আসছে তা সহজে সেভ ও আপডেট করে রাখুন।',
    liveTapTitle: 'লাইভ ১-মিনিট কুইক এন্ট্রি (সময়সহ)',
    liveTapDesc: 'যে সংখ্যাটি আসছে সেটিতে ট্যাপ করুন—বর্তমান তারিখ ও সময় (HH:MM) সহ সরাসরি ফায়ারবেসে সেভ হবে।',
    targetDate: 'তারিখ',
    startTimeLabel: 'সময় (HH:MM)',
    undoLast: 'শেষেরটি মুছুন',
    bulkTitle: 'একসাথে অনেক রেজাল্ট বা ১ মাসের ডাটা আপলোড',
    bulkDesc:
      'সংখ্যা পেস্ট করুন (যেমন: 60491827 অথবা "18:30 6" প্রতি লাইনে অথবা CSV ফাইল)। তারিখ ও টাইম দিলে প্রতিটি মিনিটের হিসাবসহ ফায়ারবেসে সেভ হয়ে যাবে।',
    bulkPlaceholder: 'উদাহরণ:\n604918273501\nঅথবা টাইমসহ:\n18:30 6\n18:31 0\n18:32 9',
    importFileBtn: '.TXT / .CSV ফাইল নিন',
    saveBulkBtn: 'ফায়ারবেসে সেভ করুন',
    batchLabel: 'সেশন / ব্যাচের নাম',
    startPeriod: 'শুরুর Draw # (ঐচ্ছিক)',
    archivesTableTitle: 'ফায়ারবেসে সেভ থাকা ১ মাসের রেজাল্ট (দেখুন বা আপডেট করুন)',
    matrixTitle: 'ডিজিটাল ১০×১০ ট্রানজিশন নোটবুক (Prev2 / Prev1)',
    matrixSubtitle:
      'খাতার হিসাবের মতোই—প্রথম দুটি সংখ্যা (যেমন 6/0 বা 3/8) আসার পর পূর্বের রেজাল্টে পরের সংখ্যা কী কী এসেছে তার ১০×১০ টেবিল।',
    matrixCellDetail: 'নির্বাচিত জোড়ার বিস্তারিত',
    moneyTitle: 'মানি ম্যানেজমেন্ট ও রিস্ক কন্ট্রোল ডেস্ক',
    moneySubtitle:
      'আপনার মূলধন, ডেইলি স্টপ-লস, প্রফিট টার্গেট এবং স্টেপ-বাই-স্টেপ রিকভারি প্ল্যান অনুযায়ী নিরাপদ ট্রেড পরিচালনা করুন।',
    riskProfileTitle: 'ক্যাপিটাল ও রিস্ক প্রোফাইল (ফায়ারবেস সিঙ্ক)',
    saveProfileBtn: 'প্রোফাইল সেভ করুন',
    progressionTitle: 'স্টেপ-বাই-স্টেপ রিকভারি ও রিস্ক টেবিল',
    logTradeTitle: 'নতুন ট্রেড / বেট এন্ট্রি',
    tradeLedgerTitle: 'ট্রেড ও লাভ-লস লেজার',
    green: 'সবুজ (Green)',
    red: 'লাল (Red)',
    purple: 'বেগুনি (Purple)',
    big: 'বড় (Big 5-9)',
    small: 'ছোট (Small 0-4)',
    win: 'জয় (Win)',
    loss: 'লস (Loss)',
    timeAll: 'সব সময়',
    timeCurrentHour: 'এখনকার টাইম (±১ ঘণ্টা)',
    timeMorning: 'সকাল (০৬–১২)',
    timeAfternoon: 'দুপুর (১২–১৮)',
    timeEvening: 'সন্ধ্যা/রাত (১৮–২৪)',
    timeNight: 'গভীর রাত (০০–০৬)',
    calendarTitle: 'গত ৩০ দিনের ডাটা ক্যালেন্ডার (ক্লিক করে তারিখ সিলেক্ট করুন)',
  },
  en: {
    appName: 'WinGo Desk',
    navPredictor: 'Ask Predictor',
    navUpload: '1-Month Data',
    navMatrix: '10×10 Matrix',
    navMoney: 'Money & Risk',
    signIn: 'Sign In with Google',
    signOut: 'Sign Out',
    window15d: 'Last 15 Days',
    window30d: 'Last 30 Days',
    windowAll: 'All History',
    drawsLoaded: 'Results Loaded',
    daysStored: 'Days / Batches',
    bankrollLabel: 'Bankroll',
    todayPnlLabel: 'Today P&L',
    liveClockLabel: '1-Min Timer',
    authPromptTitle: 'Connect Your Real Firebase Cloud Database',
    authPromptDesc:
      'Sign in with Google to save your full 1-month WinGo 1-minute draw history with exact times, ask what comes next based on past market patterns, and enforce money & risk limits.',
    authPromptBtn: 'Continue with Google',
    predictorTitle: 'What Is in the Market Now? Ask for Next Prediction',
    predictorSubtitle:
      'Tap or type the numbers currently coming out in the market and optionally pick a time window—the engine scans your saved 1-month history to show which numbers and colors are most likely next.',
    sequenceInputLabel: 'Market currently has these numbers:',
    sequencePlaceholder: 'e.g. 60 or 389',
    clearSeq: 'Clear',
    backspaceSeq: 'Backspace',
    saveWatch: 'Save Watch',
    watchLabelPlaceholder: 'Label (e.g. Evening 6→0)',
    savedWatchesTitle: 'Saved Patterns',
    exactMatches: 'Matches',
    scannedDraws: 'Draws Scanned',
    topRecommendations: 'Most Likely Next Numbers (Based on Past Results)',
    colorProbability: 'Color Likelihood',
    sizeProbability: 'Big or Small?',
    digitTableTitle: 'All 0–9 Next-Number Probabilities',
    occurrencesTitle: 'Exact Past Dates & Times This Happened',
    fallbackSuffixTitle: 'Trailing 2-Digit Fallback',
    noDataTitle: 'No Historical Results Uploaded Yet',
    noDataDesc:
      'Go to the "1-Month Data" tab to log live 1-minute draws or upload your daily/monthly results with timestamps.',
    goUploadBtn: 'Go to 1-Month Data',
    noMatchDesc: 'No exact match found for this sequence in the chosen time filter. Try switching to "All Times" or a shorter 2-digit sequence.',
    uploadTitle: '1-Month Result & Time Updater',
    uploadSubtitle:
      'Record what came out at which time across all 30 days and update any day easily.',
    liveTapTitle: 'Live 1-Minute Quick Entry (With Time)',
    liveTapDesc: 'Tap each winning digit as it arrives—saved to Firestore with the current date and HH:MM clock time.',
    targetDate: 'Date',
    startTimeLabel: 'Time (HH:MM)',
    undoLast: 'Undo Last',
    bulkTitle: 'Bulk Paste / Multi-Day CSV Upload',
    bulkDesc:
      'Paste raw digits (60491827), time+digit lines ("18:30 6"), or import a .txt/.csv file. Auto-splits and saves cleanly into Firestore.',
    bulkPlaceholder: 'Example:\n604918273501\nOr with timestamps:\n18:30 6\n18:31 0\n18:32 9',
    importFileBtn: 'Import .TXT / .CSV',
    saveBulkBtn: 'Save to Firebase',
    batchLabel: 'Session / Batch Name',
    startPeriod: 'Start Draw # (Optional)',
    archivesTableTitle: 'Saved 1-Month Batches (Inspect or Update)',
    matrixTitle: 'Digital 10×10 Transition Notebook (Prev2 / Prev1)',
    matrixSubtitle:
      'Inspect what digits followed every two-step pair (A/B) across your 1-month database.',
    matrixCellDetail: 'Selected Pair Breakdown',
    moneyTitle: 'Money Management & Risk Control Desk',
    moneySubtitle:
      'Enforce capital preservation, daily stop-loss caps, profit targets, and structured recovery staking backed by Firebase.',
    riskProfileTitle: 'Capital & Risk Parameters',
    saveProfileBtn: 'Save Risk Profile',
    progressionTitle: 'Recovery Progression & Ruin-Check Table',
    logTradeTitle: 'Log Trade Execution',
    tradeLedgerTitle: 'Trade & P&L Ledger',
    green: 'Green',
    red: 'Red',
    purple: 'Purple',
    big: 'Big (5-9)',
    small: 'Small (0-4)',
    win: 'Win',
    loss: 'Loss',
    timeAll: 'All Times',
    timeCurrentHour: 'Around Now (±1h)',
    timeMorning: 'Morning (06–12)',
    timeAfternoon: 'Afternoon (12–18)',
    timeEvening: 'Evening (18–24)',
    timeNight: 'Night (00–06)',
    calendarTitle: '30-Day Data Coverage (Click any day to select)',
  },
};
