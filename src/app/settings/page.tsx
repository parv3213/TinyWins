"use client";

import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [shareEnabled, setShareEnabled] = useState<boolean>(false);
    const [shareLoaded, setShareLoaded] = useState(false);
    const [shareSaving, setShareSaving] = useState(false);
    const [shareTooltipOpen, setShareTooltipOpen] = useState(false);

    const isAnonymous = !!user?.isAnonymous;
    const shareDisabledReason = useMemo(() => {
        if (!isAnonymous) return null;
        return "This is an anonymous account. This feature is not available for this account.";
    }, [isAnonymous]);

    useEffect(() => {
        let cancelled = false;
        async function loadShareFlag() {
            if (!user) return;
            setShareLoaded(false);
            try {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);
                const enabled = snap.exists() ? snap.data()?.shareEnabled === true : false;
                if (!cancelled) setShareEnabled(enabled);
            } catch (e) {
                console.error("Failed to load shareEnabled", e);
                if (!cancelled) setShareEnabled(false);
            } finally {
                if (!cancelled) setShareLoaded(true);
            }
        }
        loadShareFlag();
        return () => {
            cancelled = true;
        };
    }, [user]);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut();
            router.push("/");
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (!user) return;
        if (isAnonymous) return;
        if (!shareEnabled) return;
        const link = `${window.location.origin}/profile/${user.uid}`;
        navigator.clipboard.writeText(link);

        // Show toast
        const toast = document.getElementById("share-toast");
        if (toast) {
            toast.className = "toast show";
            setTimeout(() => {
                toast.className = "toast";
            }, 2500);
        }
    };

    const handleToggleShare = async (next: boolean) => {
        if (!user) return;
        if (isAnonymous) return;

        setShareSaving(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { shareEnabled: next }, { merge: true });
            setShareEnabled(next);
        } catch (e) {
            console.error("Failed to update shareEnabled", e);
        } finally {
            setShareSaving(false);
        }
    };

    if (!user) return null;

    const emailLabel = user.email ? user.email : user.isAnonymous ? "anon@habbit.invalid" : "No email";

    return (
        <PageShell>
            <Header title="Settings" showDate={false} />

            <main className="flex flex-col gap-6 mt-4">
                {/* Profile Card */}
                <div className="card-flat flex items-center gap-4 p-5">
                    {user.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-16 h-16 rounded-full border-2 border-[var(--border)]"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center text-xl text-[var(--muted-fg)]">
                            {user.displayName?.charAt(0).toUpperCase() || "?"}
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl mb-1">{user.displayName || "Anonymous Forester"}</h2>
                        <p className="text-sm text-[var(--muted-fg)]">{emailLabel}</p>
                    </div>
                </div>

                {/* Settings List */}
                <div className="card-flat p-0 overflow-hidden">
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
                        <h3 className="text-sm font-medium text-[var(--muted-fg)] uppercase tracking-wider">Account</h3>
                    </div>

                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between hover:bg-[var(--muted)]/20 transition-colors">
                        <div>
                            <p className="font-medium">Public Profile</p>
                            <p className="text-xs text-[var(--muted-fg)] mt-1">Let others view your tree and stats.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShareTooltipOpen((v) => !v)}
                                className="text-[var(--muted-fg)] hover:text-[var(--fg)] transition-colors"
                                aria-label="Public profile info"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </button>

                            <label
                                className="flex items-center gap-2 select-none"
                                title={shareDisabledReason ?? undefined}
                            >
                                <span className="text-xs text-[var(--muted-fg)]">Off</span>
                                <input
                                    type="checkbox"
                                    checked={shareEnabled}
                                    disabled={isAnonymous || shareSaving || !shareLoaded}
                                    onChange={(e) => handleToggleShare(e.target.checked)}
                                />
                                <span className="text-xs text-[var(--muted-fg)]">On</span>
                            </label>

                            <button
                                onClick={handleCopyLink}
                                className="btn btn-secondary btn-sm"
                                disabled={isAnonymous || !shareEnabled}
                                title={
                                    shareDisabledReason ??
                                    (!shareEnabled ? "Enable Public Profile to copy your link." : undefined)
                                }
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>

                    {shareTooltipOpen ? (
                        <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
                            <p className="text-xs text-[var(--muted-fg)]">
                                {shareDisabledReason ??
                                    "Turn this on to let anyone with your link view your tree and stats."}
                            </p>
                        </div>
                    ) : null}

                    <div
                        onClick={handleSignOut}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--danger-light)] transition-colors group"
                    >
                        <div>
                            <p className="font-medium text-[var(--danger)]">Sign Out</p>
                        </div>
                        {loading ? (
                            <div className="spinner w-5 h-5 border-[var(--danger)]"></div>
                        ) : (
                            <div className="text-[var(--danger)] opacity-50 group-hover:opacity-100 transition-opacity">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center mt-4">
                    <p className="text-xs text-[var(--muted-fg)]">TinyWins v1.0.0</p>
                    <p className="text-xs text-[var(--muted-fg)] mt-1">Built with Next.js & Firebase</p>
                </div>
            </main>

            <div id="share-toast" className="toast">
                Link copied to clipboard!
            </div>

            <BottomNav />
        </PageShell>
    );
}
