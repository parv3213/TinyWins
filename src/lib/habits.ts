import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  documentId
} from 'firebase/firestore';
import { Habit, DayLog, UserStats } from './types';

// Constants
export const MAX_HABITS = 10;

// Generic helper to get today's date string in YYYY-MM-DD
export function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- CRUD for Habits ---

export async function getHabits(uid: string): Promise<Habit[]> {
  const habitsRef = collection(db, 'users', uid, 'habits');
  const q = query(habitsRef, where('archived', '==', false), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Habit[];
}

export async function createHabit(uid: string, habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>): Promise<string> {
  const habitsRef = collection(db, 'users', uid, 'habits');
  // Check limit (should also be enforced on client)
  const currentHabits = await getHabits(uid);
  if (currentHabits.length >= MAX_HABITS) {
    throw new Error(`Cannot create more than ${MAX_HABITS} habits.`);
  }

  const newDocRef = doc(habitsRef);
  await setDoc(newDocRef, {
    ...habit,
    createdAt: new Date().toISOString(),
    archived: false
  });

  return newDocRef.id;
}

export async function updateHabit(uid: string, habitId: string, data: Partial<Habit>): Promise<void> {
  const habitRef = doc(db, 'users', uid, 'habits', habitId);
  await updateDoc(habitRef, data);
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  // We use soft delete for habits so past logs don't break
  const habitRef = doc(db, 'users', uid, 'habits', habitId);
  await updateDoc(habitRef, { archived: true });
}

// --- Day Logs ---

export async function getDayLog(uid: string, dateStr: string): Promise<DayLog | null> {
  const logRef = doc(db, 'users', uid, 'logs', dateStr);
  const snap = await getDoc(logRef);
  if (!snap.exists()) return null;
  return snap.data() as DayLog;
}

export async function saveDayLog(
  uid: string,
  dateStr: string,
  entries: DayLog['entries'],
  treeScore: number,
  habitCount: number
): Promise<void> {
  const logRef = doc(db, 'users', uid, 'logs', dateStr);
  await setDoc(logRef, {
    entries,
    treeScore,
    habitCount,
    loggedAt: new Date().toISOString()
  }, { merge: true });
}

export type DayLogWithDate = { dateStr: string; log: DayLog };

export async function getRecentDayLogs(uid: string, maxDays: number): Promise<DayLogWithDate[]> {
  const logsRef = collection(db, 'users', uid, 'logs');
  const q = query(logsRef, orderBy(documentId(), 'desc'), limit(maxDays));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    dateStr: d.id,
    log: d.data() as DayLog
  }));
}

export async function getRecentDayLogsBefore(uid: string, beforeDateStr: string, maxDays: number): Promise<DayLogWithDate[]> {
  const logsRef = collection(db, 'users', uid, 'logs');
  const q = query(
    logsRef,
    where(documentId(), '<', beforeDateStr),
    orderBy(documentId(), 'desc'),
    limit(maxDays)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    dateStr: d.id,
    log: d.data() as DayLog
  }));
}

export async function finalizeDayLog(uid: string, dateStr: string): Promise<void> {
  const logRef = doc(db, 'users', uid, 'logs', dateStr);
  await setDoc(logRef, {
    finalizedAt: new Date().toISOString()
  }, { merge: true });
}

// --- Stats ---
export async function getUserStats(uid: string): Promise<UserStats | null> {
  const statsRef = doc(db, 'users', uid, 'stats', 'overview');
  const snap = await getDoc(statsRef);
  
  if (!snap.exists()) {
    // Return default stats
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDaysLogged: 0,
      treeHealth: 50
    };
  }
  
  return snap.data() as UserStats;
}

export async function updateUserStats(uid: string, stats: Partial<UserStats>) {
  const statsRef = doc(db, 'users', uid, 'stats', 'overview');
  await setDoc(statsRef, stats, { merge: true });
}
