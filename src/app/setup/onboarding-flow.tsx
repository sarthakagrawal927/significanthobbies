"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { setUsername } from "~/lib/actions/user";

// ─── Decorative background emojis ──────────────────────────────────────────
const BG_EMOJIS = [
  { emoji: "🎸", top: "8%",  left: "6%",  size: "text-8xl",  rotate: "-12deg" },
  { emoji: "🎨", top: "15%", left: "82%", size: "text-7xl",  rotate: "8deg"   },
  { emoji: "📚", top: "72%", left: "5%",  size: "text-9xl",  rotate: "-6deg"  },
  { emoji: "🏔️", top: "60%", left: "88%", size: "text-8xl",  rotate: "14deg"  },
  { emoji: "🌱", top: "85%", left: "55%", size: "text-6xl",  rotate: "-20deg" },
  { emoji: "🎮", top: "30%", left: "92%", size: "text-7xl",  rotate: "6deg"   },
  { emoji: "🏊", top: "78%", left: "22%", size: "text-8xl",  rotate: "10deg"  },
  { emoji: "🎯", top: "5%",  left: "48%", size: "text-6xl",  rotate: "-8deg"  },
  { emoji: "✍️", top: "45%", left: "2%",  size: "text-7xl",  rotate: "16deg"  },
  { emoji: "🎭", top: "20%", left: "25%", size: "text-6xl",  rotate: "-18deg" },
  { emoji: "🎻", top: "90%", left: "78%", size: "text-7xl",  rotate: "4deg"   },
  { emoji: "🧩", top: "55%", left: "70%", size: "text-6xl",  rotate: "-10deg" },
];

// ─── Confetti pieces ────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "bg-amber-400", "bg-emerald-400", "bg-blue-400",
  "bg-pink-400",  "bg-purple-400",  "bg-orange-400",
  "bg-yellow-400","bg-teal-400",    "bg-red-400",
  "bg-indigo-400","bg-rose-400",    "bg-lime-400",
];

function ConfettiPiece({ color, delay, left, shape }: {
  color: string; delay: number; left: number; shape: "square" | "circle";
}) {
  return (
    <div
      className={`fixed top-0 ${color} ${shape === "circle" ? "rounded-full" : "rounded-sm"} pointer-events-none`}
      style={{
        left: `${left}%`,
        width: shape === "circle" ? "10px" : "8px",
        height: shape === "circle" ? "10px" : "14px",
        animation: `confettiFall 3.5s ease-in forwards`,
        animationDelay: `${delay}s`,
        zIndex: 50,
      }}
    />
  );
}

// ─── Progress dots ──────────────────────────────────────────────────────────
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "w-6 h-2 bg-emerald-600"
              : i < current
              ? "w-2 h-2 bg-emerald-300"
              : "w-2 h-2 bg-stone-200"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main OnboardingFlow ─────────────────────────────────────────────────────
export function OnboardingFlow() {
  const { data: session } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [username, setUsernameValue] = useState("");
  const [birthYear, setBirthYear] = useState<number>(new Date().getFullYear() - 25);
  const [loading, setLoading] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const avatarUrl = session?.user?.image;
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const isUsernameValid = /^[a-z0-9-]{3,30}$/.test(username);

  async function handleFinish(skipBirthYear = false) {
    if (!isUsernameValid) return;
    setLoading(true);
    try {
      await setUsername(username, skipBirthYear ? undefined : birthYear);
      setStep(3);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Global styles for animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(5,150,105,0.15), 0 0 0 8px rgba(5,150,105,0.06); }
          50%       { box-shadow: 0 0 0 6px rgba(5,150,105,0.25), 0 0 0 14px rgba(5,150,105,0.08); }
        }
        .animate-slide-in-up {
          animation: slideInUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .avatar-glow {
          animation: glowPulse 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Full-screen warm cream background */}
      <div
        className="fixed inset-0"
        style={{ background: "linear-gradient(135deg, #FEFDF8 0%, #FDF8EE 50%, #FEFCF3 100%)" }}
      />

      {/* Decorative background emojis */}
      {BG_EMOJIS.map(({ emoji, top, left, size, rotate }, i) => (
        <div
          key={i}
          className={`fixed pointer-events-none select-none ${size}`}
          style={{
            top,
            left,
            transform: `rotate(${rotate})`,
            opacity: 0.06,
            zIndex: 0,
          }}
        >
          {emoji}
        </div>
      ))}

      {/* Confetti on step 3 (done) */}
      {step === 3 &&
        CONFETTI_COLORS.map((color, i) => (
          <ConfettiPiece
            key={i}
            color={color}
            delay={i * 0.15}
            left={5 + i * 8}
            shape={i % 2 === 0 ? "square" : "circle"}
          />
        ))}

      {/* Center the card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div
          key={step}
          className="animate-slide-in-up w-full max-w-md"
        >
          <div
            className="rounded-3xl bg-white px-8 py-10"
            style={{
              boxShadow:
                "0 20px 60px rgba(251,191,36,0.12), 0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            {/* ── Step 0: Welcome ─────────────────────────────────────── */}
            {step === 0 && (
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="mb-6">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={session?.user?.name ?? "Avatar"}
                      className="avatar-glow h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="avatar-glow flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                <h1 className="text-3xl font-bold" style={{ color: "#1C1917" }}>
                  Hey, {firstName}! 👋
                </h1>
                <p className="mt-2 text-xl font-semibold" style={{ color: "#1C1917" }}>
                  Your hobby journey starts here.
                </p>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "#78716C" }}>
                  Map the hobbies that shaped who you are, discover patterns,
                  and find what to explore next.
                </p>

                <button
                  onClick={() => setStep(1)}
                  className="mt-8 w-full rounded-2xl py-3.5 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
                  }}
                >
                  Let's begin →
                </button>
              </div>
            )}

            {/* ── Step 1: Username ─────────────────────────────────────── */}
            {step === 1 && (
              <div>
                <ProgressDots current={0} total={2} />

                <div className="mb-8 text-center">
                  <div className="mb-3 text-4xl">✨</div>
                  <h2 className="text-2xl font-bold" style={{ color: "#1C1917" }}>
                    Claim your space
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: "#78716C" }}>
                    Your profile lives at{" "}
                    <span className="font-medium" style={{ color: "#059669" }}>
                      significanthobbies.com/u/yourname
                    </span>
                  </p>
                </div>

                {/* Username input */}
                <div className="mb-2">
                  <div
                    className="flex items-center rounded-2xl border bg-white px-4 py-1 transition-all duration-200 focus-within:shadow-md"
                    style={{
                      borderColor: isUsernameValid
                        ? "#059669"
                        : username.length > 0
                        ? "#E7E5E4"
                        : "#E7E5E4",
                      boxShadow: isUsernameValid
                        ? "0 0 0 3px rgba(5,150,105,0.12)"
                        : undefined,
                    }}
                  >
                    <span
                      className="select-none text-base font-medium pr-0.5"
                      style={{ color: "#A8A29E" }}
                    >
                      @
                    </span>
                    <input
                      value={username}
                      onChange={(e) =>
                        setUsernameValue(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        )
                      }
                      placeholder="yourname"
                      maxLength={30}
                      className="flex-1 bg-transparent py-3 text-base outline-none placeholder:text-stone-300"
                      style={{ color: "#1C1917" }}
                      autoFocus
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    {isUsernameValid && (
                      <span className="text-emerald-500 text-lg">✓</span>
                    )}
                  </div>

                  {/* Validation message */}
                  {username.length > 0 && !isUsernameValid && (
                    <p className="mt-1.5 text-xs" style={{ color: "#EF4444" }}>
                      {username.length < 3
                        ? "At least 3 characters required"
                        : "Lowercase letters, numbers, and hyphens only"}
                    </p>
                  )}
                  {username.length === 0 && (
                    <p className="mt-1.5 text-xs" style={{ color: "#A8A29E" }}>
                      Lowercase letters, numbers, and hyphens only
                    </p>
                  )}
                </div>

                {/* Live URL preview */}
                <div
                  className="mb-8 flex items-center gap-1.5 rounded-xl px-3 py-2.5"
                  style={{ background: "#F5F5F4" }}
                >
                  <span className="text-xs" style={{ color: "#A8A29E" }}>
                    significanthobbies.com/u/
                  </span>
                  <span
                    className="text-xs font-semibold transition-colors duration-200"
                    style={{ color: isUsernameValid ? "#059669" : "#C7C3BF" }}
                  >
                    {username.length > 0 ? username : "yourname"}
                  </span>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!isUsernameValid}
                  className="w-full rounded-2xl py-3.5 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    boxShadow: isUsernameValid
                      ? "0 4px 14px rgba(5,150,105,0.35)"
                      : undefined,
                  }}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* ── Step 2: Birth Year ───────────────────────────────────── */}
            {step === 2 && (
              <div>
                <ProgressDots current={1} total={2} />

                <div className="mb-8 text-center">
                  <div className="mb-3 text-4xl">🎂</div>
                  <h2 className="text-2xl font-bold" style={{ color: "#1C1917" }}>
                    When were you born?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "#78716C" }}>
                    We'll automatically calculate the year for each life phase —
                    so you don't have to.
                  </p>
                </div>

                {/* Year stepper */}
                <div className="mb-8 flex items-center justify-center gap-4">
                  <button
                    onClick={() =>
                      setBirthYear((y) => Math.max(1940, y - 1))
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border text-xl font-bold transition-all duration-150 hover:scale-105 hover:shadow-md active:scale-95"
                    style={{
                      borderColor: "#E7E5E4",
                      color: "#78716C",
                      background: "#FAFAF9",
                    }}
                  >
                    −
                  </button>

                  <div className="relative">
                    <input
                      type="number"
                      value={birthYear}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1940 && val <= currentYear) {
                          setBirthYear(val);
                        }
                      }}
                      min={1940}
                      max={currentYear}
                      className="w-32 rounded-2xl border-2 bg-white py-4 text-center text-3xl font-bold outline-none transition-all duration-200 focus:shadow-md [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      style={{
                        borderColor: "#059669",
                        color: "#1C1917",
                        boxShadow: "0 0 0 3px rgba(5,150,105,0.10)",
                      }}
                    />
                  </div>

                  <button
                    onClick={() =>
                      setBirthYear((y) => Math.min(currentYear, y + 1))
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border text-xl font-bold transition-all duration-150 hover:scale-105 hover:shadow-md active:scale-95"
                    style={{
                      borderColor: "#E7E5E4",
                      color: "#78716C",
                      background: "#FAFAF9",
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Age display */}
                <p className="mb-8 text-center text-sm" style={{ color: "#A8A29E" }}>
                  That makes you{" "}
                  <span className="font-semibold" style={{ color: "#059669" }}>
                    {currentYear - birthYear} years old
                  </span>{" "}
                  — looking good!
                </p>

                <button
                  onClick={() => handleFinish(false)}
                  disabled={loading}
                  className="w-full rounded-2xl py-3.5 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Setting up...
                    </span>
                  ) : (
                    "Finish setup →"
                  )}
                </button>

                <button
                  onClick={() => handleFinish(true)}
                  disabled={loading}
                  className="mt-3 w-full rounded-2xl py-2.5 text-sm font-medium transition-colors duration-200 hover:underline disabled:opacity-50"
                  style={{ color: "#A8A29E" }}
                >
                  Skip for now
                </button>
              </div>
            )}

            {/* ── Step 3: Done! ─────────────────────────────────────────── */}
            {step === 3 && (
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 text-6xl" style={{ animation: "slideInUp 0.5s 0.1s both" }}>
                  🎉
                </div>

                <h2
                  className="mt-4 text-2xl font-bold"
                  style={{ color: "#1C1917" }}
                >
                  You're all set,{" "}
                  <span style={{ color: "#059669" }}>@{username}</span>!
                </h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "#78716C" }}>
                  Your profile is ready. Time to map your hobby journey.
                </p>

                <div className="mt-8 flex w-full flex-col gap-3">
                  <Link
                    href="/timeline/new"
                    className="block w-full rounded-2xl py-3.5 text-center text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
                    }}
                  >
                    Build my first timeline →
                  </Link>

                  <Link
                    href={`/u/${username}`}
                    className="block w-full rounded-2xl border py-3.5 text-center text-base font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
                    style={{
                      borderColor: "#E7E5E4",
                      color: "#78716C",
                      background: "#FAFAF9",
                    }}
                  >
                    View my profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
