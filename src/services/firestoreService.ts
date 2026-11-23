import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ArchiveSource,
  DrawArchive,
  RiskProfile,
  SavedPattern,
  TradeLog,
} from '../types/wingo';
import { createDefaultRiskProfile, sanitizeSequenceInput } from '../utils/wingoEngine';

export async function ensureUserAndRiskProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const cleanName = (user.displayName || user.email?.split('@')[0] || 'Trader').slice(0, 100);
    const cleanEmail = user.email ? user.email.slice(0, 160) : undefined;
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: cleanName,
        ...(cleanEmail ? { email: cleanEmail } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName: cleanName,
        ...(cleanEmail ? { email: cleanEmail } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }

  const profilePath = `users/${user.uid}/settings/riskProfile`;
  const profileRef = doc(db, 'users', user.uid, 'settings', 'riskProfile');
  try {
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      const defaults = createDefaultRiskProfile(user.uid);
      await setDoc(profileRef, {
        ...defaults,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, profilePath);
  }
}

export function subscribeRiskProfile(
  uid: string,
  onData: (profile: RiskProfile | null) => void
): Unsubscribe {
  const path = `users/${uid}/settings/riskProfile`;
  return onSnapshot(
    doc(db, 'users', uid, 'settings', 'riskProfile'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as RiskProfile);
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeArchives(
  uid: string,
  onData: (archives: DrawArchive[]) => void
): Unsubscribe {
  const path = `users/${uid}/archives`;
  const q = query(collection(db, 'users', uid, 'archives'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: DrawArchive[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DrawArchive, 'id'>),
        }))
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.id.localeCompare(b.id));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeTrades(
  uid: string,
  onData: (trades: TradeLog[]) => void
): Unsubscribe {
  const path = `users/${uid}/trades`;
  const q = query(collection(db, 'users', uid, 'trades'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: TradeLog[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TradeLog, 'id'>),
        }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? Date.now();
          const tb = b.createdAt?.toMillis?.() ?? Date.now();
          return tb - ta || b.id.localeCompare(a.id);
        });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeSavedPatterns(
  uid: string,
  onData: (patterns: SavedPattern[]) => void
): Unsubscribe {
  const path = `users/${uid}/patterns`;
  const q = query(collection(db, 'users', uid, 'patterns'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedPattern[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SavedPattern, 'id'>),
        }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? Date.now();
          const tb = b.createdAt?.toMillis?.() ?? Date.now();
          return tb - ta || b.id.localeCompare(a.id);
        });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveRiskProfile(uid: string, profile: RiskProfile): Promise<void> {
  const path = `users/${uid}/settings/riskProfile`;
  const ref = doc(db, 'users', uid, 'settings', 'riskProfile');
  try {
    await updateDoc(ref, {
      currency: profile.currency,
      startingCapital: Math.max(1, Math.min(100000000, Number(profile.startingCapital) || 10000)),
      currentBankroll: Math.max(0, Math.min(1000000000, Number(profile.currentBankroll) || 0)),
      baseBet: Math.max(1, Math.min(10000000, Number(profile.baseBet) || 10)),
      strategy: profile.strategy,
      maxSteps: Math.max(1, Math.min(20, Math.trunc(Number(profile.maxSteps) || 6))),
      dailyStopLossPct: Math.max(1, Math.min(100, Number(profile.dailyStopLossPct) || 15)),
      dailyTakeProfitPct: Math.max(1, Math.min(1000, Number(profile.dailyTakeProfitPct) || 20)),
      colorOdds: Math.max(1, Math.min(10, Number(profile.colorOdds) || 1.96)),
      purpleOdds: Math.max(1, Math.min(20, Number(profile.purpleOdds) || 4.5)),
      numberOdds: Math.max(1, Math.min(50, Number(profile.numberOdds) || 9.0)),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function appendLiveDraw(
  uid: string,
  dateKey: string,
  digit: number,
  existingArchives: DrawArchive[],
  startPeriod = ''
): Promise<void> {
  const cleanDigit = String(Math.max(0, Math.min(9, Math.trunc(digit))));
  const cleanPeriod = startPeriod.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 40);

  // Find latest manual archive for this dateKey that still has room (< 1440 draws)
  const target = [...existingArchives]
    .filter((a) => a.dateKey === dateKey && a.source === 'manual' && a.drawCount < 1440)
    .sort((a, b) => b.id.localeCompare(a.id))[0];

  if (target) {
    const path = `users/${uid}/archives/${target.id}`;
    const nextSeq = target.sequence + cleanDigit;
    try {
      await updateDoc(doc(db, 'users', uid, 'archives', target.id), {
        sequence: nextSeq,
        drawCount: nextSeq.length,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  } else {
    const docId = `live_${dateKey.replace(/-/g, '')}_${Date.now()}`;
    const path = `users/${uid}/archives/${docId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'archives', docId), {
        userId: uid,
        dateKey,
        label: `Live ${dateKey}`.slice(0, 80),
        sequence: cleanDigit,
        drawCount: 1,
        startPeriod: cleanPeriod,
        source: 'manual',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }
}

export async function undoLastDrawInArchive(uid: string, archive: DrawArchive): Promise<void> {
  const path = `users/${uid}/archives/${archive.id}`;
  const ref = doc(db, 'users', uid, 'archives', archive.id);
  try {
    if (archive.sequence.length <= 1) {
      await deleteDoc(ref);
    } else {
      const nextSeq = archive.sequence.slice(0, -1);
      await updateDoc(ref, {
        sequence: nextSeq,
        drawCount: nextSeq.length,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveBulkArchives(
  uid: string,
  dateKey: string,
  labelBase: string,
  rawDigits: string,
  startPeriod: string,
  source: ArchiveSource
): Promise<number> {
  const cleanDigits = sanitizeSequenceInput(rawDigits);
  if (!cleanDigits) return 0;

  const CHUNK_SIZE = 1440;
  const chunks: string[] = [];
  for (let i = 0; i < cleanDigits.length; i += CHUNK_SIZE) {
    chunks.push(cleanDigits.slice(i, i + CHUNK_SIZE));
  }

  const cleanLabelBase = (labelBase.trim() || `Batch ${dateKey}`).slice(0, 64);
  const cleanPeriod = startPeriod.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 40);
  const ts = Date.now();

  const batch = writeBatch(db);
  chunks.forEach((seq, idx) => {
    const docId = `${source}_${dateKey.replace(/-/g, '')}_${ts}_${idx + 1}`;
    const docRef = doc(db, 'users', uid, 'archives', docId);
    const label = chunks.length > 1 ? `${cleanLabelBase} (${idx + 1}/${chunks.length})` : cleanLabelBase;
    batch.set(docRef, {
      userId: uid,
      dateKey,
      label: label.slice(0, 80),
      sequence: seq,
      drawCount: seq.length,
      startPeriod: cleanPeriod,
      source,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  try {
    await batch.commit();
    return chunks.length;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/archives`);
  }
}

export async function removeArchive(uid: string, archiveId: string): Promise<void> {
  const path = `users/${uid}/archives/${archiveId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'archives', archiveId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function recordTradeLog(
  uid: string,
  payload: Omit<TradeLog, 'id' | 'userId' | 'createdAt'>
): Promise<void> {
  const tradeId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tradeRef = doc(db, 'users', uid, 'trades', tradeId);
  const profileRef = doc(db, 'users', uid, 'settings', 'riskProfile');
  const safeBankroll = Math.max(0, Math.min(1000000000, Number(payload.bankrollAfter.toFixed(2))));

  const batch = writeBatch(db);
  batch.set(tradeRef, {
    userId: uid,
    dateKey: payload.dateKey,
    periodId: (payload.periodId.trim() || 'LIVE').slice(0, 40),
    betType: payload.betType,
    selection: payload.selection.slice(0, 16),
    resultDigit: Math.max(0, Math.min(9, Math.trunc(payload.resultDigit))),
    stake: Math.max(0.01, Math.min(100000000, Number(payload.stake))),
    stepNumber: Math.max(1, Math.min(20, Math.trunc(payload.stepNumber))),
    odds: Math.max(1, Math.min(50, Number(payload.odds))),
    outcome: payload.outcome,
    netPnl: Number(payload.netPnl.toFixed(2)),
    bankrollAfter: safeBankroll,
    note: payload.note.slice(0, 200),
    createdAt: serverTimestamp(),
  });
  batch.update(profileRef, {
    currentBankroll: safeBankroll,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/trades/${tradeId}`);
  }
}

export async function removeTradeLog(uid: string, tradeId: string): Promise<void> {
  const path = `users/${uid}/trades/${tradeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'trades', tradeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function createPatternWatch(
  uid: string,
  sequence: string,
  label: string
): Promise<void> {
  const cleanSeq = sanitizeSequenceInput(sequence).slice(0, 8);
  if (!cleanSeq) return;
  const patternId = `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `users/${uid}/patterns/${patternId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'patterns', patternId), {
      userId: uid,
      sequence: cleanSeq,
      label: (label.trim() || `Pattern ${cleanSeq}`).slice(0, 80),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function removePatternWatch(uid: string, patternId: string): Promise<void> {
  const path = `users/${uid}/patterns/${patternId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'patterns', patternId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
