"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
    title?: string;
    showDate?: boolean;
}

export default function Header({ title, showDate = true }: HeaderProps) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMenuOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        setIsMenuOpen(false);
        try {
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Failed to sign out", error);
        } finally {
            setIsSigningOut(false);
        }
    };

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    return (
        <header className="flex items-center justify-between py-4 mb-2">
            <div>
                {title ? (
                    <h1 className="text-2xl">{title}</h1>
                ) : (
                    <h1 className="text-2xl text-[var(--primary)] flex items-center gap-2">
                        <span className="text-3xl">🌳</span> TinyWins
                    </h1>
                )}
                {showDate && <p className="text-sm font-medium text-[var(--muted-fg)] mt-1">{today}</p>}
            </div>

            <div className="relative flex items-center gap-3">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    aria-label="Open profile menu"
                >
                    {user?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-10 h-10 rounded-full border border-[var(--border)] shadow-sm transition-transform duration-200 hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-fg)] font-medium transition-transform duration-200 hover:scale-[1.03]">
                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "?"}
                        </div>
                    )}
                </button>

                <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Profile menu"
                    className={`absolute right-0 top-12 min-w-[180px] origin-top-right rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-lg transition-all duration-200 ${
                        isMenuOpen
                            ? "pointer-events-auto translate-y-0 opacity-100"
                            : "pointer-events-none -translate-y-1 opacity-0"
                    }`}
                    style={{ zIndex: "var(--z-dropdown)" }}
                >
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                        role="menuitem"
                        disabled={isSigningOut}
                    >
                        {isSigningOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </div>
        </header>
    );
}
