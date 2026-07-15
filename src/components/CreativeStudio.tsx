import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Download, 
  Eye, 
  RotateCw, 
  Compass, 
  Wand2, 
  Grid, 
  Layers, 
  Film, 
  Box, 
  Camera, 
  AlertCircle, 
  Info, 
  Clock, 
  Check,
  ChevronRight,
  Maximize2,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, doc } from "firebase/firestore";

interface CreativeStudioProps {
  user: any;
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  originalPrompt: string;
  refinedPrompt: string;
  aspectRatio: string;
  stylePreset: string;
  timestamp: number;
}

export function CreativeStudio({ user }: CreativeStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [stylePreset, setStylePreset] = useState("cinematic-3d");
  const [refineWithGemini, setRefineWithGemini] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loading simulation logs
  const loadingLogs = [
    "Initializing neural quantum core...",
    "Contacting Gemini Flash for prompt refinement...",
    "Injecting 3D volumetric lighting matrices...",
    "Aligning camera depth-of-field and aperture...",
    "Materializing 3D polygons & texture nodes...",
    "Compiling ray-tracing & global illumination...",
    "Rasterizing final 4K dimensions..."
  ];

  // Load history from Firestore (if user is logged in) or LocalStorage
  useEffect(() => {
    async function fetchHistory() {
      if (user) {
        try {
          const q = query(
            collection(db, "creative_generations"),
            orderBy("timestamp", "desc"),
            limit(16)
          );
          const querySnapshot = await getDocs(q);
          const items: GeneratedImage[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              imageUrl: data.imageUrl,
              originalPrompt: data.originalPrompt,
              refinedPrompt: data.refinedPrompt,
              aspectRatio: data.aspectRatio,
              stylePreset: data.stylePreset,
              timestamp: data.timestamp
            });
          });
          setGeneratedImages(items);
          if (items.length > 0) {
            setActiveImage(items[0]);
          }
        } catch (err: any) {
          console.error("Failed to load firestore generation history:", err);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
    }

    fetchHistory();
  }, [user]);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("nova_image_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        setGeneratedImages(parsed);
        if (parsed.length > 0) {
          setActiveImage(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Local storage history load failed:", e);
    }
  };

  // Step indicator loop during generation
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingLogs.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle generation action
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please write down what you want to visualize.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          stylePreset,
          refineWithGemini
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Generation request failed on the AI server.");
      }

      const newGen: GeneratedImage = {
        id: `img_${Date.now()}`,
        imageUrl: data.imageUrl,
        originalPrompt: data.originalPrompt,
        refinedPrompt: data.refinedPrompt,
        aspectRatio,
        stylePreset,
        timestamp: Date.now()
      };

      // Save to Database / LocalStorage
      if (user) {
        try {
          await addDoc(collection(db, "creative_generations"), {
            imageUrl: newGen.imageUrl,
            originalPrompt: newGen.originalPrompt,
            refinedPrompt: newGen.refinedPrompt,
            aspectRatio: newGen.aspectRatio,
            stylePreset: newGen.stylePreset,
            timestamp: newGen.timestamp,
            userId: user.uid
          });
        } catch (dbErr) {
          console.error("Failed to persist in firestore:", dbErr);
        }
      }

      // Update local state
      const updatedList = [newGen, ...generatedImages].slice(0, 16);
      setGeneratedImages(updatedList);
      setActiveImage(newGen);

      try {
        localStorage.setItem("nova_image_history", JSON.stringify(updatedList));
      } catch (storeErr) {
        console.warn("Could not save to localStorage (quota limit reached):", storeErr);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during image generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete an image from history
  const handleDeleteImage = async (imgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = generatedImages.filter((img) => img.id !== imgId);
    setGeneratedImages(updated);
    try {
      localStorage.setItem("nova_image_history", JSON.stringify(updated));
    } catch (_) {}

    if (activeImage?.id === imgId) {
      setActiveImage(updated[0] || null);
    }

    if (user && imgId.startsWith("img_") === false) {
      // It is a real Firestore document ID
      try {
        await deleteDoc(doc(db, "creative_generations", imgId));
      } catch (err) {
        console.error("Failed to delete from Firestore:", err);
      }
    }
  };

  const stylePresets = [
    { id: "cinematic-3d", label: "Cinematic 3D", desc: "Volumetric light, deep contrast, Marvel style", icon: Film },
    { id: "vibrant-cyberpunk", label: "Vibrant Cyberpunk", desc: "Neon, wet streets, high-tech aesthetics", icon: Layers },
    { id: "mystical-fantasy", label: "Mystical Fantasy", desc: "Ancient runes, warm magical aura, forest dust", icon: Compass },
    { id: "futuristic-hologram", label: "Holo Grid 3D", desc: "Light blue vector beams, digital wireframe", icon: Box },
    { id: "sci-fi-concept", label: "Sci-Fi Concept", desc: "Colossal spaceships, sleek metal plates", icon: Grid },
    { id: "photorealistic", label: "Hyper-Real Studio", desc: "Softbox lighting, ultra sharp materials", icon: Camera },
  ];

  const aspectRatios = [
    { id: "1:1", label: "Square", ratio: "aspect-square", desc: "1:1 Feed" },
    { id: "9:16", label: "Instagram", ratio: "aspect-[9/16]", desc: "9:16 Vertical" },
    { id: "16:9", label: "Landscape", ratio: "aspect-[16/9]", desc: "16:9 Movie" },
    { id: "4:3", label: "Classic Wide", ratio: "aspect-[4/3]", desc: "4:3 Standard" },
    { id: "3:4", label: "Portrait", ratio: "aspect-[3/4]", desc: "3:4 Card" },
  ];

  return (
    <div className="lg:col-span-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
      
      {/* LEFT PANEL: DIMENSIONAL ENGINE CONTROLS */}
      <div className="lg:col-span-5 bg-slate-950/40 border border-white/10 rounded-3xl p-5 backdrop-blur-md flex flex-col gap-5">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <Sparkles className="text-cyan-400" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-white tracking-widest uppercase">3D Dimension Engine</h2>
            <p className="text-[9px] font-mono text-slate-500 uppercase">Powered by Imagen 3.0 Real-Time Studio</p>
          </div>
        </div>

        {/* PROMPT INPUT */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Raw Creative Core
          </label>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Doctor Strange floating inside a gold burning ring of mystic magic, casting red sparks, highly detailed cinematic 3D render..."
              rows={4}
              className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 text-xs font-sans text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition resize-none leading-relaxed"
            />
            <button
              onClick={() => setPrompt("A futuristic cyber-doctor character, wearing sleek nanotech armor with glowing green patterns, holographic HUD in eyes, high-fidelity 3D digital art, masterpiece render")}
              className="absolute right-3 bottom-3 text-[9px] font-mono text-slate-500 hover:text-cyan-400 hover:underline cursor-pointer"
            >
              Autofill Example
            </button>
          </div>
        </div>

        {/* STYLE PRESETS */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Style Dimensions Preset
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto no-scrollbar">
            {stylePresets.map((preset) => {
              const Icon = preset.icon;
              const selected = stylePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setStylePreset(preset.id)}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition cursor-pointer ${
                    selected 
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-200" 
                      : "border-white/5 bg-slate-900/30 text-slate-400 hover:border-white/10 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className={selected ? "text-cyan-400" : "text-slate-500"} />
                    <span className="text-[11px] font-mono font-bold">{preset.label}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-sans leading-tight">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ASPECT RATIOS */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Resolution Framework
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {aspectRatios.map((ratio) => {
              const selected = aspectRatio === ratio.id;
              return (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition cursor-pointer ${
                    selected 
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold" 
                      : "border-white/5 bg-slate-900/30 text-slate-500 hover:border-white/10"
                  }`}
                  title={ratio.desc}
                >
                  <span className="text-[10px] font-mono">{ratio.id}</span>
                  <span className="text-[8px] text-slate-600 font-sans mt-0.5 scale-90">{ratio.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROMPT REFINEMENT ENHANCER */}
        <div className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-white/5 rounded-2xl">
          <div className="flex gap-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20 flex h-fit items-center justify-center">
              <Wand2 className="text-purple-400 animate-pulse" size={13} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-purple-300 font-bold block">Gemini 3D Prompt Refiner</span>
              <span className="text-[8px] font-sans text-slate-500 leading-tight block">
                Expands prompt with expert cinematic camera details
              </span>
            </div>
          </div>
          <button
            onClick={() => setRefineWithGemini(!refineWithGemini)}
            className={`w-11 h-6 rounded-full transition p-0.5 cursor-pointer ${
              refineWithGemini ? "bg-purple-600 justify-end" : "bg-slate-800 justify-start"
            } flex items-center`}
          >
            <motion.div 
              layout 
              className="w-5 h-5 bg-white rounded-full shadow-md"
            />
          </button>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-2 text-[10px] font-mono leading-relaxed">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* CAST BUTTON */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-4 rounded-2xl font-mono text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 transition ${
            isGenerating 
              ? "bg-slate-900 border border-white/5 text-slate-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 border border-cyan-400/20"
          }`}
        >
          {isGenerating ? (
            <>
              <RotateCw className="animate-spin text-cyan-400" size={14} />
              <span>Casting Photon Matrix...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>CAST 3D DIMENSION</span>
            </>
          )}
        </button>
      </div>

      {/* RIGHT PANEL: VISUALIZATION CHAMBER */}
      <div className="lg:col-span-7 bg-slate-950/40 border border-white/10 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between relative overflow-hidden min-h-[500px]">
        
        {/* Header Indicator */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3 z-10 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGenerating ? "bg-purple-400" : "bg-emerald-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isGenerating ? "bg-purple-500" : "bg-emerald-500"}`}></span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              {isGenerating ? "DIMENSION CHAMBER CASTING" : "DIMENSION CHAMBER LOCKED"}
            </span>
          </div>

          {activeImage && !isGenerating && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPromptDetails(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-mono text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                <Info size={10} />
                <span>Refined Blueprint</span>
              </button>
              <a
                href={activeImage.imageUrl}
                download={`nova_3d_${activeImage.id}.jpg`}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[9px] font-mono text-cyan-400 hover:bg-cyan-500/20 cursor-pointer"
              >
                <Download size={10} />
                <span>Download JPG</span>
              </a>
            </div>
          )}
        </div>

        {/* Center Screen */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-10 my-4 min-h-[300px]">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              /* GENERATING LOADER */
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center text-center gap-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-dashed border-cyan-400/40 animate-spin flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-4 border-dashed border-purple-400/60 animate-ping" />
                  </div>
                  <Sparkles className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={20} />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
                    Casting Reality Particles
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 animate-pulse uppercase tracking-wider">
                    {loadingLogs[loadingStep]}
                  </span>
                </div>
                {/* Simulated Console Logs inside Chamber */}
                <div className="w-full max-w-md bg-black/60 border border-white/5 rounded-xl p-3 font-mono text-[8px] text-slate-500 text-left h-[100px] overflow-y-auto mt-2 leading-relaxed">
                  <span className="text-cyan-500">[{new Date().toLocaleTimeString()}] INCOMING SPARK MATRIX DETECTED</span>
                  {loadingLogs.slice(0, loadingStep + 1).map((log, lIdx) => (
                    <div key={lIdx} className="text-slate-400 mt-0.5">
                      &gt; {log} <span className="text-emerald-400 font-bold">SUCCESS</span>
                    </div>
                  ))}
                  <div className="text-purple-400 animate-pulse mt-0.5">&gt; Finalizing photon render layers...</div>
                </div>
              </motion.div>
            ) : activeImage ? (
              /* IMAGE RENDERED */
              <motion.div
                key="rendered"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative max-w-full max-h-[420px] rounded-2xl border border-white/10 shadow-2xl shadow-black overflow-hidden flex items-center justify-center group"
              >
                <img
                  src={activeImage.imageUrl}
                  alt={activeImage.originalPrompt}
                  className="max-h-[400px] object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                
                {/* Hover Maximize Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowFullImage(true)}
                    className="p-3 bg-black/80 text-white rounded-full border border-white/25 hover:border-white hover:bg-black transition-all cursor-pointer"
                    title="Fullscreen"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button
                    onClick={() => setShowPromptDetails(true)}
                    className="p-3 bg-black/80 text-white rounded-full border border-white/25 hover:border-white hover:bg-black transition-all cursor-pointer"
                    title="View Refined Blueprint"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* IDLE / EMPTY STATE */
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center gap-3 max-w-xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mb-2 relative">
                  <Box size={22} className="animate-pulse" />
                  <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl animate-ping scale-110" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                  Visual Hologram Engine
                </span>
                <p className="text-[10px] font-sans text-slate-500 leading-relaxed uppercase">
                  Design detailed 3D characters, objects, or environments on the left panel, and cast them directly into this light-well.
                </p>
                <button
                  onClick={() => {
                    setPrompt("A realistic 3D render of a futuristic cyber-ninjutsu warrior wearing dark iron armor with gold glowing lines, standing in rain, marvel cinematic style");
                    setStylePreset("cinematic-3d");
                  }}
                  className="mt-3 px-3.5 py-1.5 border border-white/10 bg-white/5 rounded-xl text-[9px] font-mono text-slate-400 hover:text-white hover:border-white/20 cursor-pointer"
                >
                  Load Marvel 3D Template
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Details Banner */}
        {activeImage && !isGenerating && (
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 z-10 flex gap-2.5 items-center justify-between mt-2 shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20 shrink-0">
                <Box size={14} />
              </div>
              <div className="overflow-hidden">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Prompt Subject</span>
                <span className="text-[10px] text-slate-200 block truncate font-sans font-medium">
                  "{activeImage.originalPrompt}"
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[8px] font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {activeImage.stylePreset}
              </span>
              <span className="text-[8px] font-mono bg-slate-800 border border-white/5 text-slate-400 px-2 py-0.5 rounded-md uppercase">
                {activeImage.aspectRatio}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM SECTION: HISTORY PANEL (BENTO-GRID) */}
      <div className="lg:col-span-12 bg-slate-950/40 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
        <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="text-purple-400" size={14} />
            <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase">DIMENSIONAL ARCHIVE</h3>
          </div>
          <span className="text-[9px] font-mono text-slate-500">
            {generatedImages.length} of 16 slots occupied
          </span>
        </div>

        {generatedImages.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl text-center text-slate-500">
            <Grid size={20} className="text-slate-600 mb-1" />
            <span className="text-[10px] font-mono uppercase">Archive Empty</span>
            <span className="text-[9px] font-sans max-w-xs mt-0.5">Generations from this session will be recorded here automatically.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {generatedImages.map((img) => (
              <div
                key={img.id}
                onClick={() => setActiveImage(img)}
                className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all aspect-square ${
                  activeImage?.id === img.id 
                    ? "border-cyan-400 scale-[1.02] shadow-md shadow-cyan-500/10" 
                    : "border-white/5 bg-slate-900/40 hover:border-white/20 hover:scale-[1.01]"
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.originalPrompt}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Micro Overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <button
                    onClick={(e) => handleDeleteImage(img.id, e)}
                    className="self-end p-1 bg-black/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-md border border-white/10 transition cursor-pointer"
                    title="Expunge from archive"
                  >
                    <Trash2 size={10} />
                  </button>
                  <div className="text-[8px] font-mono text-slate-300 truncate">
                    {img.originalPrompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULLSCREEN IMAGE DIALOG MODAL */}
      <AnimatePresence>
        {showFullImage && activeImage && (
          <div 
            id="fullscreen-dialog-overlay"
            onClick={() => setShowFullImage(false)}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setShowFullImage(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white p-3 hover:bg-white/5 rounded-full border border-white/10 cursor-pointer"
            >
              Close Window [ESC]
            </button>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-5xl max-h-screen relative flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeImage.imageUrl}
                alt={activeImage.originalPrompt}
                className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REFINED BLUEPRINT DETAILS MODAL */}
      <AnimatePresence>
        {showPromptDetails && activeImage && (
          <div 
            onClick={() => setShowPromptDetails(false)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-3xl p-6 relative flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="text-purple-400" size={16} />
                  <h3 className="text-sm font-bold font-mono text-white tracking-widest uppercase">Refined 3D Blueprint</h3>
                </div>
                <button 
                  onClick={() => setShowPromptDetails(false)}
                  className="text-slate-500 hover:text-white font-mono text-xs hover:underline cursor-pointer"
                >
                  [Dismiss]
                </button>
              </div>

              {/* Original User Request */}
              <div className="flex flex-col gap-1.5 bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Original Subject Input
                </span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{activeImage.originalPrompt}"
                </p>
              </div>

              {/* Gemini Expanded Rendering Prompt */}
              <div className="flex flex-col gap-1.5 bg-purple-950/20 border border-purple-500/15 p-4 rounded-2xl relative overflow-hidden">
                <div className="absolute top-2 right-3 flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider animate-pulse">
                  <Sparkles size={8} />
                  <span>AI Refinement Active</span>
                </div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">
                  Expanded Rendering Blueprint
                </span>
                <p className="text-xs text-slate-100 font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 select-all">
                  {activeImage.refinedPrompt}
                </p>
                <div className="text-[8px] font-sans text-slate-500 mt-1 leading-snug">
                  *This expanded description was fed to Imagen 3 to construct the volumetric depth, camera focal distance, and realistic 3D lighting mapping.
                </div>
              </div>

              <button
                onClick={() => setShowPromptDetails(false)}
                className="w-full py-3 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 rounded-xl font-mono text-xs cursor-pointer text-center uppercase tracking-wider"
              >
                Return to Visual Chamber
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
