import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  HelpCircle,
  Play,
  Settings,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SetupWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function SetupWizard({ isOpen, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [keys, setKeys] = useState<Record<string, string>>({
    gemini: "",
    openai: "",
    anthropic: "",
    groq: ""
  });
  const [validationStates, setValidationStates] = useState<Record<string, "idle" | "testing" | "valid" | "error">>({
    gemini: "idle",
    openai: "idle",
    anthropic: "idle",
    groq: "idle"
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({
    gemini: "",
    openai: "",
    anthropic: "",
    groq: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill existing keys if present
  useEffect(() => {
    if (isOpen) {
      fetch("/api/keys")
        .then(res => res.json())
        .then(data => {
          // If we see keys already configured, we can let user skip or view them
          const newKeys = { ...keys };
          Object.keys(data).forEach(provider => {
            if (data[provider].configured) {
              newKeys[provider] = "********"; // placeholder indicating configured
            }
          });
          setKeys(newKeys);
        })
        .catch(err => console.log("Keys fetch error in setup wizard:", err));
    }
  }, [isOpen]);

  const handleKeyChange = (provider: string, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
    setValidationStates(prev => ({ ...prev, [provider]: "idle" }));
    setValidationErrors(prev => ({ ...prev, [provider]: "" }));
  };

  const handleTestKey = async (provider: string) => {
    const keyVal = keys[provider].trim();
    if (!keyVal || keyVal === "********") {
      setValidationStates(prev => ({ ...prev, [provider]: "error" }));
      setValidationErrors(prev => ({ ...prev, [provider]: "Please input a valid key first." }));
      return;
    }

    setValidationStates(prev => ({ ...prev, [provider]: "testing" }));
    setValidationErrors(prev => ({ ...prev, [provider]: "" }));

    try {
      const resp = await fetch("/api/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keyVal })
      });
      const data = await resp.json();
      if (resp.ok && (data.success || data.valid)) {
        setValidationStates(prev => ({ ...prev, [provider]: "valid" }));
      } else {
        setValidationStates(prev => ({ ...prev, [provider]: "error" }));
        setValidationErrors(prev => ({ ...prev, [provider]: data.error || "Key validation failed." }));
      }
    } catch (err: any) {
      setValidationStates(prev => ({ ...prev, [provider]: "error" }));
      setValidationErrors(prev => ({ ...prev, [provider]: err.message || "Failed connecting to local verification node." }));
    }
  };

  const handleSaveKeys = async () => {
    setIsSubmitting(true);
    try {
      // Save keys that are not placeholder
      for (const provider of ["gemini", "openai", "anthropic", "groq"]) {
        const keyVal = keys[provider].trim();
        if (keyVal && keyVal !== "********") {
          await fetch("/api/keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, key: keyVal, enabled: true })
          });
        }
      }
      setStep(3);
    } catch (e) {
      alert("Error saving API keys: " + e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSetup = () => {
    localStorage.setItem("setup_complete", "true");
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020206]/95 backdrop-blur-2xl">
      {/* Abstract atmospheric ambient bg glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 bg-cyan-500 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-15 bg-purple-500 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl border border-white/10 bg-slate-950/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Progress indicator */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/10">
            <ShieldCheck size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-mono tracking-widest text-cyan-400 font-bold uppercase">MAX AI SETUP PROTOCOL</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Interactive Companion Secure Synchronization Step {step}/3</p>
          </div>
          <div className="ml-auto flex gap-1">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`w-5 h-1 rounded-full transition-all duration-300 ${
                  step === s ? "bg-cyan-400 w-8" : step > s ? "bg-cyan-800" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="flex flex-col gap-5 text-left flex-1 overflow-y-auto pr-1">
            {/* Holographic Logo Emblem */}
            <div className="flex justify-center py-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse" />
                <img
                  src="/assets/icon.png"
                  alt="Max-AI Logo Emblem"
                  className="relative w-20 h-20 rounded-2xl border border-cyan-400/40 bg-black object-cover shadow-[0_0_25px_rgba(6,182,212,0.45)]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <h3 className="font-display font-light text-2xl text-white tracking-wide text-center">
              Initialize your hyper-intelligent Companion OS
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm font-sans leading-relaxed">
              Welcome to **Max-AI (2080 Edition)**. Max-AI is a responsive, multi-agent cognitive operating system modeled after futuristic conversational assistants.
            </p>
            
            {/* Corrected Owner & Project Badge */}
            <div className="p-3.5 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">👑</span>
                <div>
                  <span className="text-slate-400">Created by: </span>
                  <span className="text-white font-bold">mukimudeen76</span>
                </div>
              </div>
              <a 
                href="https://github.com/mukimudeen76/Max-AI" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition hover:underline flex items-center gap-1"
              >
                <span>GitHub Repository</span>
              </a>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  🎙️ Low Latency Voice
                </span>
                <span className="text-slate-400 text-xs font-sans leading-normal">
                  Real-time vocal conversation stream mapping raw audio inputs at 24kHz. Speak, interrupt, and converse completely naturally.
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <span className="text-purple-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  👁️ Screen-Sharing Vision
                </span>
                <span className="text-slate-400 text-xs font-sans leading-normal">
                  Shares dynamic browser webviews and complete system desktops for instant cognitive guidance, OCR, and visual parsing.
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  🧠 Non-volatile Memories
                </span>
                <span className="text-slate-400 text-xs font-sans leading-normal">
                  Learns from dialogue, remembering preferences, projects, active habits, and records with zero data leaks.
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  🖥️ Local Device Control
                </span>
                <span className="text-slate-400 text-xs font-sans leading-normal">
                  Launches apps, types texts, simulates hotkeys, triggers volume parameters, and runs complex multi-step user macros.
                </span>
              </div>
            </div>

            <div className="mt-auto pt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs uppercase font-bold tracking-widest flex items-center gap-2 transition cursor-pointer"
              >
                <span>Synchronize Providers</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROVIDERS KEYS */}
        {step === 2 && (
          <div className="flex flex-col gap-4 text-left flex-1 overflow-y-auto pr-1">
            <div>
              <h3 className="font-display font-medium text-xl text-white tracking-wide">
                Integrate AI Keys
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Keys are stored securely on your local device using high-grade client encryption. Leave blank to skip, but at least Google Gemini is recommended for core voice streaming.
              </p>
            </div>

            <div className="space-y-4 py-2">
              {[
                { id: "gemini", label: "Google Gemini API", placeholder: "AIzaSy..." },
                { id: "openai", label: "OpenAI API", placeholder: "sk-proj-..." },
                { id: "anthropic", label: "Anthropic Claude API", placeholder: "sk-ant-..." },
                { id: "groq", label: "xAI / Groq API Key", placeholder: "gsk_..." }
              ].map((provider) => {
                const status = validationStates[provider.id];
                const error = validationErrors[provider.id];
                return (
                  <div key={provider.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-300 font-bold uppercase flex items-center gap-1.5">
                        <KeyRound size={12} className="text-cyan-400" />
                        {provider.label}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">Secured Vault</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={keys[provider.id]}
                        onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                        placeholder={provider.placeholder}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl p-2 px-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        onClick={() => handleTestKey(provider.id)}
                        disabled={status === "testing"}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-mono rounded-xl transition text-slate-200 cursor-pointer font-bold shrink-0"
                      >
                        {status === "testing" ? "Testing..." : "Verify"}
                      </button>
                    </div>
                    {status === "valid" && (
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Endpoint verified and operational.
                      </span>
                    )}
                    {status === "error" && (
                      <span className="text-[9px] font-mono text-rose-400 leading-normal block">
                        Error: {error}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-4 flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="py-2 px-4 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer text-xs font-mono uppercase"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(3)}
                  className="py-2.5 px-4 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 text-slate-300 text-xs uppercase font-mono tracking-wider transition cursor-pointer"
                >
                  Skip All
                </button>
                <button
                  onClick={handleSaveKeys}
                  disabled={isSubmitting}
                  className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs uppercase font-bold tracking-widest transition disabled:opacity-55 cursor-pointer"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ACTIVATE BRIDGE */}
        {step === 3 && (
          <div className="flex flex-col gap-5 text-left flex-1 overflow-y-auto pr-1">
            <h3 className="font-display font-light text-2xl text-white tracking-wide">
              Launch Device Control Link
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm font-sans leading-relaxed">
              Max AI is ready for ignition! We've created an **All-in-One Automated Setup Suite** that configures python, installs dependencies (pyautogui, pillow, requests), and automatically downloads Android ADB tools for USB phone sync with a single click:
            </p>

            <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/40 space-y-3 font-mono text-xs text-slate-400 leading-normal">
              <div className="flex flex-col gap-1.5 text-[11px] bg-black/55 p-3.5 rounded-xl border border-white/15 text-slate-200 font-semibold">
                <span className="text-slate-500"># For Windows Users (Double-click file in app root):</span>
                <span className="text-cyan-400 select-all">setup_max_ai.bat</span>
                
                <span className="text-slate-500 mt-2.5"># For macOS / Linux Users (Execute in terminal):</span>
                <span className="text-emerald-400 select-all">chmod +x setup_max_ai.sh && ./setup_max_ai.sh</span>
              </div>
              <p className="text-[10px] uppercase text-amber-500 font-bold flex items-center gap-1 leading-normal pt-1">
                ⚠️ Fail-Safe: You are always in control. Shoving your physical mouse cursor into any corner of your computer screen instantly terminates all actions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/15 border border-emerald-500/10 text-emerald-300 flex flex-col gap-1 text-xs">
              <span className="font-bold flex items-center gap-1">✨ Configuration Complete</span>
              <span>All cryptographic models have initialized. We are ready to synchronise.</span>
            </div>

            <div className="mt-auto pt-6 flex justify-end">
              <button
                onClick={handleCompleteSetup}
                className="py-3 px-8 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs uppercase font-black tracking-widest flex items-center gap-2 transition cursor-pointer shadow-[0_0_25px_rgba(34,211,238,0.25)]"
              >
                <span>Launch Core OS</span>
                <Play size={13} fill="currentColor" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
