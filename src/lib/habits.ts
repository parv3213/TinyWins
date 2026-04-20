import {
    collection,
    doc,
    documentId,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    runTransaction,
    setDoc,
    startAfter,
    updateDoc,
    where,
} from "firebase/firestore";
import { applyDailyScoreToHealth, normalizeDailyScore } from "./analytics";
import { db } from "./firebase";
import { getStreakXpMultiplier, getXpToNextLevel, normalizeTreeLevelAndXp } from "./treeProgression";
import { DayLog, Habit, UserStats } from "./types";

// Constants
export const MAX_HABITS = 25;

// Generic helper to get today's date string in YYYY-MM-DD
export function getTodayStr() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// --- CRUD for Habits ---

export async function getHabits(uid: string): Promise<Habit[]> {
    const habitsRef = collection(db, "users", uid, "habits");
    const q = query(habitsRef, where("archived", "==", false), orderBy("order", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Habit[];
}

export async function createHabit(uid: string, habit: Omit<Habit, "id" | "createdAt" | "archived">): Promise<string> {
    const habitsRef = collection(db, "users", uid, "habits");
    // Check limit (should also be enforced on client)
    const currentHabits = await getHabits(uid);
    if (currentHabits.length >= MAX_HABITS) {
        throw new Error("Cannot create more habits.");
    }

    const newDocRef = doc(habitsRef);
    await setDoc(newDocRef, {
        ...habit,
        createdAt: new Date().toISOString(),
        archived: false,
    });

    return newDocRef.id;
}

export async function updateHabit(uid: string, habitId: string, data: Partial<Habit>): Promise<void> {
    const habitRef = doc(db, "users", uid, "habits", habitId);
    await updateDoc(habitRef, data);
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
    // We use soft delete for habits so past logs don't break
    const habitRef = doc(db, "users", uid, "habits", habitId);
    await updateDoc(habitRef, { archived: true });
}

// --- Day Logs ---

export async function getDayLog(uid: string, dateStr: string): Promise<DayLog | null> {
    const logRef = doc(db, "users", uid, "logs", dateStr);
    const snap = await getDoc(logRef);
    if (!snap.exists()) return null;
    return snap.data() as DayLog;
}

export async function saveDayLog(
    uid: string,
    dateStr: string,
    entries: DayLog["entries"],
    treeScore: number,
    habitCount: number,
): Promise<void> {
    const logRef = doc(db, "users", uid, "logs", dateStr);
    // Guard against editing a finalized day even if UI state is stale.
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(logRef);
        const data = snap.exists() ? (snap.data() as DayLog) : null;
        if (data?.finalizedAt) {
            throw new Error("Day is finalized.");
        }

        tx.set(
            logRef,
            {
                entries,
                treeScore,
                habitCount,
                loggedAt: new Date().toISOString(),
            },
            { merge: true },
        );
    });
}

export type DayLogWithDate = { dateStr: string; log: DayLog };

export async function getRecentDayLogs(uid: string, maxDays: number): Promise<DayLogWithDate[]> {
    const logsRef = collection(db, "users", uid, "logs");
    const q = query(logsRef, orderBy(documentId(), "desc"), limit(maxDays));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
        dateStr: d.id,
        log: d.data() as DayLog,
    }));
}

export async function getRecentDayLogsBefore(
    uid: string,
    beforeDateStr: string,
    maxDays: number,
): Promise<DayLogWithDate[]> {
    const logsRef = collection(db, "users", uid, "logs");
    // Using `startAfter` avoids requiring a composite index for `where(documentId(), '<', ...)`.
    // With descending order, `startAfter(beforeDateStr)` returns docs with IDs < beforeDateStr.
    const q = query(logsRef, orderBy(documentId(), "desc"), startAfter(beforeDateStr), limit(maxDays));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
        dateStr: d.id,
        log: d.data() as DayLog,
    }));
}

export async function finalizeDayLog(uid: string, dateStr: string): Promise<void> {
    const logRef = doc(db, "users", uid, "logs", dateStr);
    await setDoc(
        logRef,
        {
            finalizedAt: new Date().toISOString(),
        },
        { merge: true },
    );
}

export type FinalizeResult = { applied: boolean; newHealth: number; newLevel: number; newXp: number };

function dayHasActivity(entries: DayLog["entries"] | undefined): boolean {
    if (!entries) return false;
    return Object.values(entries).some((status) => status === "completed" || status === "failed");
}

export function shiftDateStrByDays(dateStr: string, deltaDays: number): string {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/**
 * Atomically finalizes a day (once) and applies its score to the user's tree health.
 * This prevents double-finalize/double-apply even if the client state is stale.
 */
export async function finalizeDayWithHealth(
    uid: string,
    dateStr: string,
    habits: Habit[] | null,
    habitCountFallback: number,
): Promise<FinalizeResult> {
    const logRef = doc(db, "users", uid, "logs", dateStr);
    const statsRef = doc(db, "users", uid, "stats", "overview");
    const logsRef = collection(db, "users", uid, "logs");

    // Use the streak that applied on `dateStr`, not today's streak, for deterministic catch-up XP.
    const previousLogsQ = query(logsRef, orderBy(documentId(), "desc"), startAfter(dateStr), limit(365));
    const previousLogsSnap = await getDocs(previousLogsQ);
    const previousActivityByDate = new Map<string, boolean>(
        previousLogsSnap.docs.map((d) => [d.id, dayHasActivity((d.data() as DayLog).entries)]),
    );

    let streakForDate = 0;
    let cursorDate = dateStr;
    for (let i = 0; i < 365; i++) {
        const isActive = cursorDate === dateStr ? true : previousActivityByDate.get(cursorDate) === true;
        if (!isActive) break;
        streakForDate += 1;
        cursorDate = shiftDateStrByDays(cursorDate, -1);
    }

    return runTransaction(db, async (tx) => {
        const [logSnap, statsSnap] = await Promise.all([tx.get(logRef), tx.get(statsRef)]);
        const log = logSnap.exists() ? (logSnap.data() as DayLog) : null;
        const stats = statsSnap.exists() ? (statsSnap.data() as UserStats) : null;

        const currentHealth = stats?.treeHealth ?? 50;
        const currentLevel = stats?.treeLevel ?? 1;
        const currentXp = stats?.treeXp ?? 0;

        // If there is nothing logged, do not finalize.
        if (!log?.loggedAt) {
            return { applied: false, newHealth: currentHealth, newLevel: currentLevel, newXp: currentXp };
        }

        // Already finalized: idempotent no-op.
        if (log.finalizedAt) {
            return { applied: false, newHealth: currentHealth, newLevel: currentLevel, newXp: currentXp };
        }

        // Keep finalization aligned with "active day" semantics used for streak/day counts.
        if (!dayHasActivity(log.entries)) {
            return { applied: false, newHealth: currentHealth, newLevel: currentLevel, newXp: currentXp };
        }

        const habitCount = log.habitCount ?? habitCountFallback;
        const dailyScore = log.treeScore || 0;
        const newHealth = applyDailyScoreToHealth(currentHealth, dailyScore, habits, habitCount);

        // Level/XP progression (user-facing, no hard cap like % health).
        const rolled = normalizeTreeLevelAndXp(currentLevel, currentXp);
        const normalizedLevel = rolled.treeLevel;
        const normalizedXp = rolled.treeXp;

        const quality = (normalizeDailyScore(dailyScore, habits, habitCount) + 1) / 2; // 0..1
        const baseXpGain = Math.round(8 + quality * 16); // 8..24 per day
        const streakMultiplier = getStreakXpMultiplier(streakForDate);
        const xpGain = Math.round(baseXpGain * streakMultiplier);

        let nextLevel = normalizedLevel;
        let nextXp = normalizedXp + xpGain;

        while (nextXp >= getXpToNextLevel(nextLevel)) {
            nextXp -= getXpToNextLevel(nextLevel);
            nextLevel += 1;
        }

        const finalizedAt = new Date().toISOString();

        tx.set(statsRef, { treeHealth: newHealth, treeLevel: nextLevel, treeXp: nextXp }, { merge: true });
        tx.set(logRef, { finalizedAt }, { merge: true });

        return { applied: true, newHealth, newLevel: nextLevel, newXp: nextXp };
    });
}

// --- Stats ---
export async function getUserStats(uid: string): Promise<UserStats | null> {
    const statsRef = doc(db, "users", uid, "stats", "overview");
    const snap = await getDoc(statsRef);

    const defaults: UserStats = {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysLogged: 0,
        treeHealth: 50,
        treeLevel: 1,
        treeXp: 0,
    };

    if (!snap.exists()) {
        return defaults;
    }

    const data = snap.data() as Partial<UserStats> & Record<string, unknown>;
    const merged = { ...defaults, ...data } as UserStats;

    // Defensive normalization: Firestore can contain strings if a legacy write happened.
    merged.treeHealth = Number.isFinite(Number(merged.treeHealth)) ? Number(merged.treeHealth) : defaults.treeHealth;
    merged.treeLevel = Number.isFinite(Number(merged.treeLevel)) ? Number(merged.treeLevel) : defaults.treeLevel;
    merged.treeXp = Number.isFinite(Number(merged.treeXp)) ? Number(merged.treeXp) : defaults.treeXp;

    const norm = normalizeTreeLevelAndXp(merged.treeLevel ?? 1, merged.treeXp ?? 0);
    merged.treeLevel = norm.treeLevel;
    merged.treeXp = norm.treeXp;

    return merged;
}

export async function updateUserStats(uid: string, stats: Partial<UserStats>) {
    const statsRef = doc(db, "users", uid, "stats", "overview");
    await setDoc(statsRef, stats, { merge: true });
}
