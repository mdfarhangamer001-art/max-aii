import React, { useState } from "react";
import { signInWithPopup, auth, googleProvider } from "../lib/firebase";
import { motion } from "motion/react";
import { ShieldCheck, Sparkles, AlertCircle, Database, Layout, RefreshCw } from "lucide-react";

interface GoogleOnboardingProps {
  onSignedIn: (user: any) => void;
  onContinueOffline?: () => void;
}

export function GoogleOnboarding({ onSignedIn, onContinueOffline }: GoogleOnboardingProps) {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        console.log("[GoogleOnboarding] Logged in successfully:", result.user);
        onSignedIn(result.user);
      }
    } catch (err: any) {
      console.error("[GoogleOnboarding] Google Sign-in error:", err);
      if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site or open it in a new tab.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020206] relative overflow-hidden">
      {/* Abstract atmospheric ambient bg glows */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full blur-[140px] opacity-25 bg-cyan-500 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full blur-[140px] opacity-20 bg-purple-500 pointer-events-none" />

      {/* Grid background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,47,73,0.15),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg border border-white/10 bg-slate-950/80 rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh] text-center backdrop-blur-2xl"
      >
        {/* Futuristic top bar decor */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />

        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <ShieldCheck size={28} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-mono tracking-[0.2em] text-cyan-400 font-bold uppercase">SECURE CLOUD DEPLOYMENT INITIALIZATION</span>
            <h1 className="text-3xl font-light text-white tracking-tight mt-1 font-sans">
              Max-AI
            </h1>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">Model Year: 2080 Edition</p>
          </div>
        </div>

        <div className="space-y-4 mb-8 text-left">
          <p className="text-slate-300 text-xs sm:text-sm font-sans leading-relaxed text-center">
            Max-AI is your hyper-intelligent holographic companion. Sign in with your Google Account to initialize high-grade secure cloud synchronization.
          </p>

          {/* Corrected Owner & Project Badge */}
          <div className="p-3 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">🎖️</span>
              <div>
                <span className="text-slate-400">Owner: </span>
                <span className="text-white font-bold">mukimudeen76-ops</span>
              </div>
            </div>
            <a 
              href="https://github.com/mukimudeen76-ops/Marya11" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[9px] text-cyan-400 hover:text-cyan-300 transition hover:underline flex items-center gap-1"
            >
              <span>GitHub Repository</span>
            </a>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex gap-3 items-start">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 mt-0.5">
                <Database size={13} />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">Cross-Device Synchronization</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  Store settings, voice selections, conversations, recollections, and macro protocols securely. Synchronize immediately when logged in from any other device.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-300 mt-0.5">
                <Layout size={13} />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">Interactive Customizations</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  Your personalized companion style, background, layout, and update profiles remain locked in your secure private vault.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 mt-0.5">
                <RefreshCw size={13} />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase">Continuous Offline Support</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  Use the applet fully offline. All inputs are safely cached locally and synchronised to the cloud when internet connection is detected.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 text-left font-mono leading-normal">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3.5 mt-auto">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-sans text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            <span>{loading ? "Authenticating session..." : "Continue with Google Account"}</span>
          </button>

          <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-wider text-center mt-2 animate-pulse">
            🔑 Cloud Authentication Required for Activation
          </p>
        </div>

        {/* Privacy check notice */}
        <p className="text-[9px] font-mono text-slate-600 mt-6 leading-normal">
          We respect your privacy: only profile & email scopes are requested. Stored cryptographically under strict Firestore rules. View or purge cloud assets at any time.
        </p>
      </motion.div>
    </div>
  );
}
