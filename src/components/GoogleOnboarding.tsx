import React, { useState } from "react";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, auth, googleProvider } from "../lib/firebase";
import { motion } from "motion/react";
import { ShieldCheck, Database, Sliders, WifiOff, AlertCircle, Sparkles } from "lucide-react";

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
      const isElectron = typeof window !== "undefined" && window.navigator.userAgent.toLowerCase().includes("electron");

      if (isElectron) {
        console.log("[GoogleOnboarding] Electron environment detected. Running desktop OAuth loopback flow.");
        const { ipcRenderer } = (window as any).require("electron");
        const { idToken } = await ipcRenderer.invoke("google-signin");

        if (!idToken) {
          throw new Error("No authorization token was returned from Google Desktop Sign-In.");
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        if (result.user) {
          console.log("[GoogleOnboarding] Logged in successfully via Electron:", result.user);
          onSignedIn(result.user);
        }
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          console.log("[GoogleOnboarding] Logged in successfully via Web:", result.user);
          onSignedIn(result.user);
        }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030308] relative overflow-hidden">
      {/* Sci-fi backdrop grids & neon visual assets */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,18,45,0.4),transparent_80%)] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[400px] h-[400px] rounded-full blur-[160px] opacity-20 bg-cyan-500/30 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full blur-[160px] opacity-15 bg-violet-500/30 pointer-events-none" />

      {/* Futuristic digital grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[500px] border border-white/5 bg-slate-950/70 rounded-[24px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col backdrop-blur-3xl"
        id="max-signin-container"
      >
        {/* Subtle high-tech highlight line on top border */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)] mb-4">
            <ShieldCheck size={26} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-400/80 font-bold uppercase block mb-1">
              SECURE DEPLOYMENT PROTOCOL
            </span>
            <h1 className="text-4xl font-extralight text-white tracking-tight font-sans">
              Max-AI
            </h1>
            <p className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
              Model Year: 2088 Edition
            </p>
          </div>
        </div>

        {/* Body Content Description */}
        <p className="text-slate-300 text-sm font-sans leading-relaxed text-center mb-8 px-2">
          Max-AI is your hyper-intelligent holographic companion. Sign in with your Google Account to initialize high-grade secure cloud synchronization.
        </p>

        {/* Features Section */}
        <div className="space-y-5 mb-8" id="max-features-section">
          {/* Feature 1 */}
          <div className="flex gap-4 items-start p-3.5 rounded-xl border border-white/[0.02] bg-white/[0.01] hover:bg-white/[0.02] transition-colors duration-300">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 shrink-0 mt-0.5">
              <Database size={16} />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Cross-Device Synchronization
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Store settings, voice selections, conversations, recollections, and macro protocols securely. Synchronize immediately when logged in from any other device.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4 items-start p-3.5 rounded-xl border border-white/[0.02] bg-white/[0.01] hover:bg-white/[0.02] transition-colors duration-300">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/10 shrink-0 mt-0.5">
              <Sliders size={16} />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Interactive Customizations
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Your personalized companion style, background, layout, and update profiles remain locked in your secure private vault.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4 items-start p-3.5 rounded-xl border border-white/[0.02] bg-white/[0.01] hover:bg-white/[0.02] transition-colors duration-300">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shrink-0 mt-0.5">
              <WifiOff size={16} />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Continuous Offline Support
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Use the applet fully offline. All inputs are safely cached locally and synchronised to the cloud when internet connection is detected.
              </p>
            </div>
          </div>
        </div>

        {/* Error notice if sign-in fails */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 text-left font-mono leading-relaxed">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col gap-4 mt-auto">
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-sans text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] cursor-pointer disabled:opacity-50 select-none"
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
            <span>{loading ? "Initializing Secure Bridge..." : "Continue with Google Account"}</span>
          </button>

          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider text-center">
              Awaiting Quantum Cloud Authentication
            </p>
          </div>
        </div>

        {/* Security & Cryptographic Notice */}
        <p className="text-[9px] font-mono text-slate-600 mt-6 text-center leading-normal">
          Authorized access only. System parameters and network traffic are monitored under secure quantum encryption protocols. All user settings are cryptographically secured.
        </p>
      </motion.div>
    </div>
  );
}
