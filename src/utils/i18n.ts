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
}> = {
  bn: {
    appName: 'WinGo Desk',
    navPredictor: 'প্যাটার্ন প্রেডিক্টর',
    navUpload: 'রেজাল্ট আপলোড',
    navMatrix: '১০×১০ নোটবুক ম্যাট্রিক্স',
    navMoney: 'মানি ও রিস্ক ম্যানেজমেন্ট',
    signIn: 'Google দিয়ে সাইন ইন',
    signOut: 'সাইন আউট',
    window15d: 'গত ১৫ দিন',
    window30d: 'গত ৩০ দিন',
    windowAll: 'সব ডাটা',
    drawsLoaded: 'মোট ড্র',
    daysStored: 'মোট দিন/ব্যাচ',
    bankrollLabel: 'বর্তমান ব্যালেন্স',
    todayPnlLabel: 'আজকের লাভ/লস',
    liveClockLabel: '১-মিনিট টাইমার',
    authPromptTitle: 'আপনার রিয়েল ফায়ারবেস ডাটাবেজ কানেক্ট করুন',
    authPromptDesc:
      'গত ১৫ দিন বা ১ মাসের WinGo ১-মিনিট রেজাল্ট, ১০×১০ প্যাটার্ন নোটবুক এবং মানি/রিস্ক ম্যানেজমেন্ট লগ সুরক্ষিতভাবে সেভ রাখতে Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন।',
    authPromptBtn: 'Google দিয়ে চালু করুন',
    predictorTitle: 'মার্কেট প্যাটার্ন ও পরবর্তী সংখ্যা বিশ্লেষক',
    predictorSubtitle:
      'এখন মার্কেটে যে সংখ্যাগুলো পরপর আসছে তা নিচে লিখুন বা ট্যাপ করুন—আপনার ১৫–৩০ দিনের সেভ করা রেজাল্ট থেকে পরবর্তী কোন সংখ্যা ও কালার আসার সম্ভাবনা বেশি তা সাথে সাথে দেখুন।',
    sequenceInputLabel: 'বর্তমান মার্কেটের ধারাবাহিক সংখ্যা (সর্বশেষ ১–৮টি)',
    sequencePlaceholder: 'যেমন: 60 বা 389',
    clearSeq: 'মুছুন',
    backspaceSeq: 'একটি কাটুন',
    saveWatch: 'প্যাটার্ন সেভ করুন',
    watchLabelPlaceholder: 'প্যাটার্নের নাম (যেমন: 6→0 রিভার্সাল)',
    savedWatchesTitle: 'সেভ করা প্যাটার্নসমূহ',
    exactMatches: 'মোট মিলেছে',
    scannedDraws: 'বিশ্লেষিত ড্র',
    topRecommendations: 'সম্ভাব্য সেরা সংখ্যা (পুর্বের রেজাল্ট অনুযায়ী)',
    colorProbability: 'কালার সম্ভাবনা',
    sizeProbability: 'Big / Small সম্ভাবনা',
    digitTableTitle: '০ থেকে ৯ প্রতিটি সংখ্যার বিস্তারিত সম্ভাবনা',
    occurrencesTitle: 'পূর্বের রেকর্ডে এই প্যাটার্নটি যখন এসেছিল',
    fallbackSuffixTitle: 'শেষ ২ সংখ্যার বিকল্প রেফারেন্স',
    noDataTitle: 'এখনো কোনো রেজাল্ট আপলোড করা হয়নি',
    noDataDesc:
      'প্যাটার্ন বিশ্লেষণ করতে প্রথমে "রেজাল্ট আপলোড" ট্যাব থেকে আপনার প্রতি মিনিটের রেজাল্ট বা গত ১৫–৩০ দিনের হিস্ট্রি আপলোড করুন।',
    goUploadBtn: 'রেজাল্ট আপলোড করতে যান',
    noMatchDesc: 'এই নির্দিষ্ট লম্বা প্যাটার্নটি নির্বাচিত সময়ে পাওয়া যায়নি। নিচে ছোট সিকোয়েন্স দিয়ে চেষ্টা করুন।',
    uploadTitle: 'প্রতি মিনিটের রেজাল্ট ও ১৫–৩০ দিনের হিস্ট্রি আপলোড',
    uploadSubtitle:
      'লাইভ ১-মিনিটের রেজাল্ট এক ট্যাপে যোগ করুন অথবা একবারে হাজার হাজার পুরোনো রেজাল্ট পেস্ট / CSV ফাইল আপলোড করে ফায়ারবেসে সেভ রাখুন।',
    liveTapTitle: 'লাইভ ১-মিনিট কুইক এন্ট্রি',
    liveTapDesc: 'প্রতি মিনিটের রেজাল্ট আসা মাত্র নিচের সংখ্যায় ট্যাপ করুন—সরাসরি ফায়ারবেসে সেভ হবে।',
    targetDate: 'তারিখ নির্বাচন',
    undoLast: 'শেষেরটি বাতিল',
    bulkTitle: '১৫ দিন / ১ মাসের রেজাল্ট একসাথে আপলোড (Bulk / CSV)',
    bulkDesc:
      'আপনার কাছে থাকা সংখ্যাগুলো পেস্ট করুন (যেমন: 60491827 অথবা 6, 0, 4, 9 বা CSV ফাইল)। ১,৪৪০ ড্র-এর বেশি হলে স্বয়ংক্রিয়ভাবে আলাদা ব্যাচে ভাগ হয়ে সেভ হবে।',
    bulkPlaceholder: 'এখানে সংখ্যা পেস্ট করুন... যেমন: 6049182735019283...',
    importFileBtn: '.TXT / .CSV ফাইল ইমপোর্ট',
    saveBulkBtn: 'ফায়ারবেসে সেভ করুন',
    batchLabel: 'ব্যাচের নাম',
    startPeriod: 'শুরুর Draw # (ঐচ্ছিক)',
    archivesTableTitle: 'ফায়ারবেসে সেভ থাকা ডেইলি রেজাল্টসমূহ',
    matrixTitle: 'ডিজিটাল ১০×১০ ট্রানজিশন নোটবুক (Prev2 / Prev1)',
    matrixSubtitle:
      'আপনার খাতার হিসাবের মতোই—প্রথম দুটি সংখ্যা (যেমন 6/0 বা 3/8) আসার পর পূর্বের রেজাল্টে পরের সংখ্যা কী কী এসেছে তার সম্পূর্ণ ১০×১০ টেবিল।',
    matrixCellDetail: 'নির্বাচিত জোড়ার বিস্তারিত',
    moneyTitle: 'মানি ম্যানেজমেন্ট ও রিস্ক কন্ট্রোল ডেস্ক',
    moneySubtitle:
      'আপনার মূলধন, স্টপ-লস, ডেইলি প্রফিট টার্গেট এবং স্টেপ-বাই-স্টেপ রিকভারি প্ল্যান অনুযায়ী নিরাপদ ট্রেড পরিচালনা করুন।',
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
  },
  en: {
    appName: 'WinGo Desk',
    navPredictor: 'Pattern Predictor',
    navUpload: 'Upload Results',
    navMatrix: '10×10 Matrix',
    navMoney: 'Money & Risk',
    signIn: 'Sign In with Google',
    signOut: 'Sign Out',
    window15d: 'Last 15 Days',
    window30d: 'Last 30 Days',
    windowAll: 'All History',
    drawsLoaded: 'Draws Loaded',
    daysStored: 'Batches Stored',
    bankrollLabel: 'Active Bankroll',
    todayPnlLabel: 'Today Net P&L',
    liveClockLabel: '1-Min Cycle',
    authPromptTitle: 'Connect Your Real Firebase Cloud Database',
    authPromptDesc:
      'Sign in with Google to permanently store 15–30 days of WinGo 1-minute draw results, query live market patterns, and enforce your money & risk management rules.',
    authPromptBtn: 'Continue with Google',
    predictorTitle: 'Market Sequence & Next-Number Predictor',
    predictorSubtitle:
      'Enter or tap the consecutive numbers currently appearing in the market to compute exact next-digit, color, and Big/Small probabilities from your uploaded 15–30 day history.',
    sequenceInputLabel: 'Current Market Sequence (Last 1–8 Digits)',
    sequencePlaceholder: 'e.g. 60 or 389',
    clearSeq: 'Clear',
    backspaceSeq: 'Backspace',
    saveWatch: 'Save Pattern',
    watchLabelPlaceholder: 'Pattern label (e.g. 6→0 Reversal)',
    savedWatchesTitle: 'Saved Pattern Watches',
    exactMatches: 'Exact Matches',
    scannedDraws: 'Draws Scanned',
    topRecommendations: 'Highest-Probability Next Numbers',
    colorProbability: 'Color Distribution',
    sizeProbability: 'Big / Small Bias',
    digitTableTitle: 'Complete 0–9 Next-Digit Breakdown',
    occurrencesTitle: 'Historical Match Audit Trail',
    fallbackSuffixTitle: 'Trailing 2-Digit Fallback Reference',
    noDataTitle: 'No Historical Results Uploaded Yet',
    noDataDesc:
      'Upload your 1-minute WinGo results or paste 15–30 days of draw history in the Upload Results tab to activate pattern analysis.',
    goUploadBtn: 'Go to Upload Results',
    noMatchDesc: 'No exact match found for this long sequence in the selected date window. Try a shorter 2–3 digit suffix below.',
    uploadTitle: 'Live 1-Minute Logger & 15–30 Day Bulk Uploader',
    uploadSubtitle:
      'Tap incoming 1-minute draw results in real time or paste/import multi-day sequences into Firebase Firestore.',
    liveTapTitle: 'Live 1-Minute Quick Tap',
    liveTapDesc: 'Tap each winning digit (0–9) as the 1-minute timer closes to append directly to Firestore.',
    targetDate: 'Target Date',
    undoLast: 'Undo Last Digit',
    bulkTitle: 'Bulk Sequence & CSV Importer (15–30 Days)',
    bulkDesc:
      'Paste raw digits (e.g. 60491827), comma/space lists, or import a .txt/.csv file. Sequences over 1,440 draws auto-split cleanly into daily Firestore batches.',
    bulkPlaceholder: 'Paste sequence digits here... e.g. 6049182735019283...',
    importFileBtn: 'Import .TXT / .CSV',
    saveBulkBtn: 'Save to Firebase',
    batchLabel: 'Batch Label',
    startPeriod: 'Start Draw # (Optional)',
    archivesTableTitle: 'Saved Historical Batches in Firestore',
    matrixTitle: 'Digital 10×10 Transition Notebook (Prev2 / Prev1)',
    matrixSubtitle:
      'Inspired by manual transition sheets: inspect what digits followed every two-step pair (A/B) across your 15–30 day database.',
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
  },
};
