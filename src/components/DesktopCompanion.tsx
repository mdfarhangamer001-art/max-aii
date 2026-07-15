import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Move, 
  Play, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Smile, 
  Compass, 
  Tv, 
  ChevronRight, 
  AlertCircle 
} from "lucide-react";

export interface CustomCharacter {
  id: string;
  name: string;
  isBuiltIn?: boolean;
  type: "vector" | "image";
  scale: number;
  opacity: number;
  autoMove: boolean;
  clickThrough: boolean;
  states: {
    idle: string;       // Image URL or Vector type
    walking: string;
    talking: string;
    thinking: string;
    listening: string;
    happy: string;
    sad: string;
    surprised: string;
    error: string;
  };
}

interface DesktopCompanionProps {
  state: "disconnected" | "connecting" | "listening" | "speaking";
  characterState: "idle" | "thinking" | "talking";
  activeEmotion: string;
  modelCaption: string;
  isEmbedded?: boolean; // if true, runs inside the main window, else inside the standalone transparent window
  onClose?: () => void;
}

export function DesktopCompanion({
  state,
  characterState,
  activeEmotion,
  modelCaption,
  isEmbedded = false,
  onClose
}: DesktopCompanionProps) {
  // Coordinates for draggable on-screen widget (browser preview)
  const [position, setPosition] = useState({ x: 300, y: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Floating companion active character states
  const [characters, setCharacters] = useState<CustomCharacter[]>([]);
  const [activeCharId, setActiveCharId] = useState<string>("robo_spark");
  const [showConfig, setShowConfig] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState("");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-movement coordinates target
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null);
  const [isWalking, setIsWalking] = useState(false);

  // New custom character form state
  const [newCharName, setNewCharName] = useState("");
  const [newCharType, setNewCharType] = useState<"image">("image");
  const [newCharStates, setNewCharStates] = useState({
    idle: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif",
    walking: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif",
    talking: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif",
    thinking: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif",
    listening: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif",
    happy: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif",
    sad: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif",
    surprised: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif",
    error: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyMTcxczE4MDZrbDRmN2dqNHRkNWc2bTF6ZDF5dWU1M3EwdzRwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Xg59as4T0DPrVbS9Sp/giphy.gif"
  });

  const activeChar = characters.find(c => c.id === activeCharId) || characters[0];

  // Initialize companion data
  useEffect(() => {
    // 3 Built-in interactive companions
    const defaultCharacters: CustomCharacter[] = [
      {
        id: "robo_spark",
        name: "Robo Spark",
        isBuiltIn: true,
        type: "vector",
        scale: 1.0,
        opacity: 0.95,
        autoMove: true,
        clickThrough: false,
        states: {
          idle: "spark_orb_idle",
          walking: "spark_orb_walking",
          talking: "spark_orb_talking",
          thinking: "spark_orb_thinking",
          listening: "spark_orb_listening",
          happy: "spark_orb_happy",
          sad: "spark_orb_sad",
          surprised: "spark_orb_surprised",
          error: "spark_orb_error"
        }
      },
      {
        id: "wandering_ghost",
        name: "Cosmic Ghost",
        isBuiltIn: true,
        type: "image",
        scale: 1.1,
        opacity: 0.85,
        autoMove: true,
        clickThrough: false,
        states: {
          idle: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif",
          walking: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif",
          talking: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif",
          thinking: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif",
          listening: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif",
          happy: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif",
          sad: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif",
          surprised: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif",
          error: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTV2ZHh2bjI2N2MxbGtkNWRwdXU2eHpsaG53cXdqMTBlMHlyMG9pZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3or0vC8uPZfWc5V9e0/giphy.gif"
        }
      }
    ];

    const savedChars = localStorage.getItem("myraa_desktop_companions");
    const savedActive = localStorage.getItem("myraa_active_companion_id");
    const savedPos = localStorage.getItem("myraa_companion_position");

    if (savedChars) {
      try {
        setCharacters(JSON.parse(savedChars));
      } catch (e) {
        setCharacters(defaultCharacters);
      }
    } else {
      setCharacters(defaultCharacters);
      localStorage.setItem("myraa_desktop_companions", JSON.stringify(defaultCharacters));
    }

    if (savedActive) {
      setActiveCharId(savedActive);
    }

    if (savedPos) {
      try {
        setPosition(JSON.parse(savedPos));
      } catch (e) {}
    }
  }, []);

  // Update caption & speech bubble
  useEffect(() => {
    if (modelCaption && modelCaption.trim().length > 0) {
      setSpeechBubbleText(modelCaption);
      setBubbleVisible(true);

      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
      // Auto dismiss after 8 seconds of no speaking
      bubbleTimeoutRef.current = setTimeout(() => {
        setBubbleVisible(false);
      }, 8000);
    }
  }, [modelCaption]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, []);

  // Determine current display animation state
  const getAnimationState = (): keyof CustomCharacter["states"] => {
    if (isWalking) return "walking";
    if (state === "listening") return "listening";
    if (characterState === "thinking") return "thinking";
    if (characterState === "talking") return "talking";
    
    // Emotion mapping
    if (activeEmotion === "happy" || activeEmotion === "excited" || activeEmotion === "playful") return "happy";
    if (activeEmotion === "sad" || activeEmotion === "embarrassed") return "sad";
    if (activeEmotion === "surprised" || activeEmotion === "curious" || activeEmotion === "confused") return "surprised";
    
    return "idle";
  };

  const currentAnimState = getAnimationState();

  // Dragging logic for browser widget
  const handleMouseDown = (e: React.MouseEvent) => {
    if (showConfig) return; // disable dragging when configuration HUD is open
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const nextX = e.clientX - dragOffset.current.x;
      const nextY = e.clientY - dragOffset.current.y;
      
      // Keep inside screen viewport
      const boundedX = Math.max(10, Math.min(window.innerWidth - 160, nextX));
      const boundedY = Math.max(10, Math.min(window.innerHeight - 160, nextY));

      const newPos = { x: boundedX, y: boundedY };
      setPosition(newPos);
      localStorage.setItem("myraa_companion_position", JSON.stringify(newPos));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Handle auto-movement (Wandering around when idle)
  useEffect(() => {
    if (!activeChar?.autoMove || showConfig || isDragging || state === "listening" || characterState === "talking") {
      setIsWalking(false);
      setTargetPosition(null);
      return;
    }

    const moveInterval = setInterval(() => {
      // 15% chance to wander every 8 seconds
      if (Math.random() < 0.20 && !isWalking) {
        const deltaX = (Math.random() - 0.5) * 300;
        const deltaY = (Math.random() - 0.5) * 150;
        const newX = Math.max(50, Math.min(window.innerWidth - 200, position.x + deltaX));
        const newY = Math.max(50, Math.min(window.innerHeight - 200, position.y + deltaY));
        
        setTargetPosition({ x: newX, y: newY });
        setIsWalking(true);
      }
    }, 8000);

    return () => clearInterval(moveInterval);
  }, [activeChar, showConfig, isDragging, position, state, characterState, isWalking]);

  // Smoothly walk towards target position
  useEffect(() => {
    if (!targetPosition || !isWalking) return;

    const walkTimeout = setTimeout(() => {
      const dx = targetPosition.x - position.x;
      const dy = targetPosition.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        setIsWalking(false);
        setTargetPosition(null);
      } else {
        // Move 2px per step towards target
        const stepX = (dx / dist) * 2.5;
        const stepY = (dy / dist) * 2.5;
        const nextPos = { x: position.x + stepX, y: position.y + stepY };
        setPosition(nextPos);
        localStorage.setItem("myraa_companion_position", JSON.stringify(nextPos));
      }
    }, 20);

    return () => clearTimeout(walkTimeout);
  }, [position, targetPosition, isWalking]);

  // Save changes to local characters
  const handleSaveCharacters = (updated: CustomCharacter[]) => {
    setCharacters(updated);
    localStorage.setItem("myraa_desktop_companions", JSON.stringify(updated));
  };

  // Add custom companion action
  const handleAddCustomCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    const newCharId = "custom_" + Date.now();
    const newChar: CustomCharacter = {
      id: newCharId,
      name: newCharName.trim(),
      type: "image",
      scale: 1.0,
      opacity: 0.95,
      autoMove: true,
      clickThrough: false,
      states: { ...newCharStates }
    };

    const updated = [...characters, newChar];
    handleSaveCharacters(updated);
    setActiveCharId(newCharId);
    localStorage.setItem("myraa_active_companion_id", newCharId);
    
    // reset form
    setNewCharName("");
    setShowConfig(false);
  };

  // Remove custom companion action
  const handleDeleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === activeCharId) {
      setActiveCharId("robo_spark");
      localStorage.setItem("myraa_active_companion_id", "robo_spark");
    }
    const updated = characters.filter(c => c.id !== id);
    handleSaveCharacters(updated);
  };

  // Toggle state
  const handleToggleAutoMove = () => {
    const updated = characters.map(c => c.id === activeCharId ? { ...c, autoMove: !c.autoMove } : c);
    handleSaveCharacters(updated);
  };

  const handleToggleClickThrough = () => {
    const updated = characters.map(c => c.id === activeCharId ? { ...c, clickThrough: !c.clickThrough } : c);
    handleSaveCharacters(updated);
  };

  const handleScaleChange = (val: number) => {
    const updated = characters.map(c => c.id === activeCharId ? { ...c, scale: val } : c);
    handleSaveCharacters(updated);
  };

  const handleOpacityChange = (val: number) => {
    const updated = characters.map(c => c.id === activeCharId ? { ...c, opacity: val } : c);
    handleSaveCharacters(updated);
  };

  // Render Vector Built-In character (Robo Spark)
  const renderVectorSpark = (stateName: keyof CustomCharacter["states"]) => {
    let color = "from-cyan-400 via-blue-500 to-indigo-600";
    let speed = "2s";
    let pulseClass = "animate-pulse";
    let scaleVal = 1;

    if (stateName === "talking") {
      color = "from-purple-400 via-fuchsia-500 to-indigo-600";
      speed = "1.1s";
      pulseClass = "animate-bounce";
      scaleVal = 1.08;
    } else if (stateName === "thinking") {
      color = "from-amber-400 via-orange-500 to-amber-600";
      speed = "0.7s";
      pulseClass = "animate-pulse";
      scaleVal = 0.95;
    } else if (stateName === "listening") {
      color = "from-emerald-400 via-teal-500 to-cyan-500";
      speed = "1.5s";
      pulseClass = "animate-ping";
      scaleVal = 1.05;
    } else if (stateName === "happy") {
      color = "from-pink-400 via-rose-500 to-amber-400";
      speed = "1.2s";
      pulseClass = "animate-bounce";
      scaleVal = 1.1;
    } else if (stateName === "sad") {
      color = "from-blue-700 via-slate-600 to-slate-800";
      speed = "3s";
      pulseClass = "";
      scaleVal = 0.9;
    }

    return (
      <div 
        className="relative flex items-center justify-center w-24 h-24"
        style={{ transform: `scale(${scaleVal})`, transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
      >
        {/* Core Outer Aura Ring */}
        <div className={`absolute w-20 h-20 rounded-full bg-gradient-to-tr ${color} opacity-40 blur-lg ${pulseClass}`} />
        
        {/* Swirling orbiting electron paths */}
        <svg className="absolute w-28 h-28 animate-spin" style={{ animationDuration: speed }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" fill="none" strokeDasharray="10 20" />
          <circle cx="50" cy="50" r="34" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" fill="none" strokeDasharray="60 30" />
          <circle cx="90" cy="50" r="4" fill="#06b6d4" className="animate-ping" />
          <circle cx="16" cy="50" r="3" fill="#a855f7" />
        </svg>

        {/* Central Core Sphere */}
        <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${color} shadow-[0_0_25px_rgba(6,182,212,0.6)] border border-white/20 flex items-center justify-center overflow-hidden`}>
          <div className="absolute top-1 right-1 w-3 h-1.5 rounded-full bg-white/40 rotate-12" />
          {/* Facial expression inside the core */}
          <div className="flex gap-1 items-center justify-center mt-1">
            {stateName === "sad" ? (
              <>
                <span className="text-[10px] text-white/85 font-mono select-none font-bold">;_;</span>
              </>
            ) : stateName === "listening" ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </>
            ) : stateName === "thinking" ? (
              <>
                <span className="text-[11px] text-white/90 font-mono font-black select-none animate-bounce">●_●</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </>
            )}
          </div>
        </div>

        {/* Active listening mic bar glow */}
        {stateName === "listening" && (
          <div className="absolute -bottom-2 flex gap-0.5 items-center justify-center bg-cyan-950/80 border border-cyan-500/50 py-0.5 px-2 rounded-full">
            <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
            <span className="w-1 h-4 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
            <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
          </div>
        )}
      </div>
    );
  };

  if (!activeChar) return null;

  return (
    <div
      ref={dragRef}
      id="desktop-ai-companion"
      className="fixed z-50 select-none flex flex-col items-center"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: activeChar.clickThrough ? "none" : "auto",
        opacity: activeChar.opacity,
        cursor: isDragging ? "grabbing" : "grab"
      }}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {bubbleVisible && speechBubbleText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            className="absolute bottom-full mb-3.5 max-w-[200px] bg-slate-950/90 border border-white/10 hover:border-cyan-500/25 p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.65)] backdrop-blur-md text-slate-200 text-[11px] font-mono select-text cursor-default leading-relaxed"
            style={{ pointerEvents: "auto" }}
          >
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-950 border-r border-b border-white/10 rotate-45" />
            <div className="flex items-center justify-between gap-1 mb-1 border-b border-white/5 pb-0.5 text-[8px] uppercase font-bold tracking-widest text-cyan-400">
              <span>Nova AI</span>
              <button 
                onClick={() => setBubbleVisible(false)} 
                className="opacity-40 hover:opacity-100 transition cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
            <p className="line-clamp-5 break-words">{speechBubbleText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Character Body Wrapper */}
      <div 
        onMouseDown={handleMouseDown}
        className="relative group flex flex-col items-center justify-center p-3"
      >
        {/* Mini quick overlay controls */}
        {!showConfig && !isDragging && (
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition duration-150 flex gap-1 z-30" style={{ pointerEvents: "auto" }}>
            <button
              onClick={() => setShowConfig(true)}
              title="Companion Settings"
              className="p-1 rounded-full bg-slate-900 border border-white/10 hover:border-cyan-500 text-slate-300 hover:text-white transition cursor-pointer shadow-lg"
            >
              <Settings className="w-3 h-3" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                title="Hide Companion"
                className="p-1 rounded-full bg-slate-900 border border-white/10 hover:border-rose-500 text-slate-300 hover:text-white transition cursor-pointer shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Character Render */}
        <div 
          className="relative transition duration-300"
          style={{ transform: `scale(${activeChar.scale})` }}
        >
          {activeChar.type === "vector" ? (
            renderVectorSpark(currentAnimState)
          ) : (
            <div className="relative">
              {/* Outer shadow/glow behind sprite */}
              <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-200" />
              <img
                src={activeChar.states[currentAnimState] || activeChar.states.idle}
                alt={activeChar.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 object-contain select-none pointer-events-none"
              />
            </div>
          )}
        </div>

        {/* Character Title Label (Visible on hover) */}
        {!isDragging && !showConfig && (
          <span className="absolute -bottom-1 opacity-0 group-hover:opacity-100 text-[8px] font-bold font-mono tracking-widest text-slate-400 bg-slate-950/80 border border-white/5 py-0.5 px-1.5 rounded-full transition duration-150 uppercase shadow-md select-none">
            {activeChar.name}
          </span>
        )}
      </div>

      {/* Floating Configuration HUD */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-1/2 left-full ml-4 -translate-y-1/2 w-64 bg-[#090e18]/95 border border-white/10 p-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl z-50 text-slate-200 font-mono"
            style={{ pointerEvents: "auto" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Companion Manager</span>
              </div>
              <button 
                onClick={() => setShowConfig(false)}
                className="p-0.5 opacity-60 hover:opacity-100 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Character Selector Dropdown */}
            <div className="mb-3">
              <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Select Actor</label>
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                {characters.map(char => (
                  <div
                    key={char.id}
                    onClick={() => {
                      setActiveCharId(char.id);
                      localStorage.setItem("myraa_active_companion_id", char.id);
                    }}
                    className={`flex items-center justify-between p-1.5 rounded text-[9px] cursor-pointer transition ${
                      activeCharId === char.id 
                        ? "bg-cyan-950/50 border border-cyan-500/30 text-cyan-200" 
                        : "bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span>{char.name}</span>
                    <div className="flex items-center gap-1">
                      {char.isBuiltIn && (
                        <span className="text-[7px] bg-slate-800 text-slate-400 px-1 rounded">SYSTEM</span>
                      )}
                      {!char.isBuiltIn && (
                        <button
                          onClick={(e) => handleDeleteCharacter(char.id, e)}
                          className="p-0.5 text-rose-400 hover:text-rose-300 transition"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings Toggles */}
            <div className="space-y-2 mb-3 border-t border-b border-white/5 py-2.5">
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Compass className="w-3 h-3 text-cyan-500/70" />
                  <span>Wander Automatically</span>
                </div>
                <button
                  onClick={handleToggleAutoMove}
                  className={`w-7 h-4 rounded-full p-0.5 transition cursor-pointer ${
                    activeChar.autoMove ? "bg-cyan-500" : "bg-white/10"
                  }`}
                >
                  <div className={`bg-white w-3 h-3 rounded-full transform transition duration-150 ${activeChar.autoMove ? "translate-x-3" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <EyeOff className="w-3 h-3 text-purple-500/70" />
                  <span>Click-Through Mode</span>
                </div>
                <button
                  onClick={handleToggleClickThrough}
                  className={`w-7 h-4 rounded-full p-0.5 transition cursor-pointer ${
                    activeChar.clickThrough ? "bg-purple-500" : "bg-white/10"
                  }`}
                >
                  <div className={`bg-white w-3 h-3 rounded-full transform transition duration-150 ${activeChar.clickThrough ? "translate-x-3" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Scale Slider */}
              <div className="flex flex-col gap-1 text-[9px]">
                <div className="flex justify-between text-slate-400">
                  <span>Scale Multiplier</span>
                  <span className="text-cyan-400 font-bold">{activeChar.scale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={activeChar.scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Opacity Slider */}
              <div className="flex flex-col gap-1 text-[9px]">
                <div className="flex justify-between text-slate-400">
                  <span>Window Opacity</span>
                  <span className="text-cyan-400 font-bold">{Math.round(activeChar.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={activeChar.opacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Import Custom Character Section */}
            <div className="border-t border-white/5 pt-2">
              <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1.5">Import Companion</span>
              <form onSubmit={handleAddCustomCharacter} className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Companion Name"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] placeholder-slate-600 focus:outline-none focus:border-cyan-500/45 text-white font-mono"
                />
                
                <div className="flex flex-col gap-1">
                  <label className="text-[7px] text-slate-500 block">Idle State Animated URL (GIF/APNG)</label>
                  <input
                    type="text"
                    value={newCharStates.idle}
                    onChange={(e) => setNewCharStates({ ...newCharStates, idle: e.target.value, walking: e.target.value, talking: e.target.value, thinking: e.target.value, listening: e.target.value, happy: e.target.value, sad: e.target.value, surprised: e.target.value, error: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[8px] focus:outline-none focus:border-cyan-500/45 text-slate-300 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newCharName.trim()}
                  className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded text-[9px] text-white font-bold transition flex items-center justify-center gap-1 cursor-pointer mt-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Register Companion</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
