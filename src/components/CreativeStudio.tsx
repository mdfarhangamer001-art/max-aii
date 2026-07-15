import React, { useState, useEffect, useRef } from "react";
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
  Maximize2,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  RefreshCw
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
  narration?: string;
}

export function CreativeStudio({ user }: CreativeStudioProps) {
  // Core states
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

  // Multimodal Tab Selection
  // "photo" | "video" | "hologram" | "voice"
  const [chamberMode, setChamberMode] = useState<"photo" | "video" | "hologram" | "voice">("photo");

  // Voice Recognition states
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Cinematic Video Player states
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [particleTheme, setParticleTheme] = useState<"fireflies" | "matrix" | "stars" | "snow">("fireflies");
  const [showSubtitles, setShowSubtitles] = useState(true);
  
  // Voice synthesis & narration states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicePitch, setVoicePitch] = useState(0.9);
  const [voiceRate, setVoiceRate] = useState(0.85);
  const [synthSupported, setSynthSupported] = useState(false);
  const [subtitleWordIndex, setSubtitleWordIndex] = useState(-1);
  const utteranceRef = useRef<any>(null);

  // Interactive 3D Hologram state controls
  const [holoNodes, setHoloNodes] = useState(120);
  const [holoSpeed, setHoloSpeed] = useState(1.5);
  const [holoScale, setHoloScale] = useState(1.0);
  const [holoOrbitType, setHoloOrbitType] = useState<"sphere" | "torus" | "cyber" | "organic">("sphere");

  // Canvas Refs
  const holographicCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const micWaveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioVisualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Initialize features (speech recognition & voice synthesis support checks)
  useEffect(() => {
    // 1. Check Voice Recognition Support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setPartialTranscript(currentTranscript);
        setPrompt(currentTranscript);

        // Auto-cast if user says key commands like "banao", "create", "generate", "cast", "make"
        const lowerText = currentTranscript.toLowerCase();
        if (
          lowerText.includes("banao") || 
          lowerText.includes("create") || 
          lowerText.includes("generate") || 
          lowerText.includes("cast") || 
          lowerText.includes("visualize")
        ) {
          // Debounce slightly to allow user to complete sentence
          const triggerClean = currentTranscript
            .replace(/banao|create|generate|cast|visualize/gi, "")
            .trim();
          if (triggerClean.length > 5) {
            setPrompt(triggerClean);
            stopListening();
            setTimeout(() => {
              handleGenerate();
            }, 600);
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    // 2. Check Speech Synthesis
    if ("speechSynthesis" in window) {
      setSynthSupported(true);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync particle styles and 3D hologram type to preset
  useEffect(() => {
    if (stylePreset === "cinematic-3d" || stylePreset === "mystical-fantasy") {
      setParticleTheme("fireflies");
      setHoloOrbitType("organic");
    } else if (stylePreset === "vibrant-cyberpunk" || stylePreset === "sci-fi-concept") {
      setParticleTheme("matrix");
      setHoloOrbitType("cyber");
    } else if (stylePreset === "futuristic-hologram") {
      setParticleTheme("stars");
      setHoloOrbitType("torus");
    } else {
      setParticleTheme("snow");
      setHoloOrbitType("sphere");
    }
  }, [stylePreset]);

  // Load history from Firestore or LocalStorage
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
              timestamp: data.timestamp,
              narration: data.narration || ""
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

  // Handle Speech Recognition toggle
  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech synthesis error or already running:", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // 1. MIC ANIMATED SOUND WAVE CANVAS
  useEffect(() => {
    let animationId: number;
    const canvas = micWaveCanvasRef.current;
    if (!canvas || !isListening) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.85)"; // cyan-500
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";

      ctx.beginPath();
      for (let i = 0; i < canvas.width; i++) {
        // Draw 3 layers of glowing sinewaves
        const wave1 = Math.sin(i * 0.05 + offset) * 12;
        const wave2 = Math.cos(i * 0.02 - offset * 1.5) * 6;
        const y = canvas.height / 2 + wave1 + wave2;

        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();

      // Second purple wave layer
      ctx.strokeStyle = "rgba(168, 85, 247, 0.45)"; // purple-500
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i++) {
        const wave1 = Math.sin(i * 0.03 - offset * 0.8) * 8;
        const wave2 = Math.sin(i * 0.08 + offset * 1.2) * 5;
        const y = canvas.height / 2 + wave1 + wave2;

        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();

      offset += 0.15;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isListening]);

  // 2. AUDIO SYNTHESIS DYNAMIC SPECTRUM WAVEFORM (Voice Tab)
  useEffect(() => {
    let animationId: number;
    const canvas = audioVisualizerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 42;
      const spacing = 4;
      const barWidth = (canvas.width - spacing * barCount) / barCount;

      for (let i = 0; i < barCount; i++) {
        const multiplier = isSpeaking ? (Math.sin(i * 0.25 + offset) * 0.5 + 0.5) : 0.08;
        const heightNoise = Math.sin(i * 0.1 + offset * 2) * 10;
        const baseHeight = isSpeaking ? 30 : 4;
        const barHeight = Math.max(4, baseHeight * multiplier + Math.abs(heightNoise));

        const x = i * (barWidth + spacing);
        const y = canvas.height - barHeight;

        // Gradient for glowing rods
        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.85)"); // purple-500
        gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.7)"); // cyan-500
        gradient.addColorStop(1, "rgba(99, 102, 241, 0.2)"); // indigo-500

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      offset += isSpeaking ? 0.25 : 0.03;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isSpeaking]);

  // 3. CINEMATIC VIDEO PLAYER PARTICLES OVERLAY (Video Tab)
  useEffect(() => {
    let animationId: number;
    const canvas = particleCanvasRef.current;
    if (!canvas || chamberMode !== "video" || !isPlayingVideo) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set responsive dimensions
    canvas.width = canvas.parentElement?.clientWidth || 640;
    canvas.height = canvas.parentElement?.clientHeight || 360;

    interface Particle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      decay?: number;
      char?: string;
    }

    const particles: Particle[] = [];
    const maxParticles = particleTheme === "matrix" ? 80 : 50;

    // Initialize
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(canvas.width, canvas.height));
    }

    function createParticle(w: number, h: number, resetAtTop = false): Particle {
      const size = Math.random() * 3 + 1;
      let x = Math.random() * w;
      let y = resetAtTop ? 0 : Math.random() * h;
      let vx = Math.random() * 0.4 - 0.2;
      let vy = Math.random() * 0.8 + 0.2; // Falling down

      let color = "rgba(6, 182, 212, 0.4)"; // Default cyan
      if (particleTheme === "fireflies") {
        color = "rgba(234, 179, 8, 0.5)"; // yellow amber
        vy = Math.random() * -0.5 - 0.2; // float up
        vx = Math.random() * 0.6 - 0.3;
      } else if (particleTheme === "matrix") {
        color = "rgba(34, 197, 94, 0.6)"; // vibrant green
        vy = Math.random() * 2 + 1.5; // fast cascade
        vx = 0;
      } else if (particleTheme === "stars") {
        color = "rgba(168, 85, 247, 0.5)"; // mystical purple
        vy = Math.random() * 0.3 - 0.15;
        vx = Math.random() * 0.3 - 0.15;
      }

      return {
        x,
        y,
        size,
        vx,
        vy,
        color,
        alpha: Math.random() * 0.7 + 0.3,
        char: String.fromCharCode(33 + Math.floor(Math.random() * 93))
      };
    }

    const run = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Boundaries reset
        if (p.y < 0 || p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
          particles[idx] = createParticle(canvas.width, canvas.height, true);
        }

        ctx.save();
        if (particleTheme === "matrix") {
          // Matrix cascade text characters
          ctx.fillStyle = p.color;
          ctx.font = `${p.size + 9}px font-mono`;
          ctx.fillText(p.char || "", p.x, p.y);
          if (Math.random() > 0.95) p.char = String.fromCharCode(33 + Math.floor(Math.random() * 93));
        } else {
          // Classic circular glowing particles
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.shadowBlur = p.size * 2;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.restore();
      });

      animationId = requestAnimationFrame(run);
    };

    run();
    return () => cancelAnimationFrame(animationId);
  }, [chamberMode, isPlayingVideo, particleTheme]);

  // 4. INTERACTIVE 3D HOLOGRAM MODEL CANVAS (Hologram Tab)
  useEffect(() => {
    let animationId: number;
    const canvas = holographicCanvasRef.current;
    if (!canvas || chamberMode !== "hologram") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size responsiveness
    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = canvas.parentElement?.clientHeight || 400;

    interface Point3D {
      x: number;
      y: number;
      z: number;
    }

    interface Connection {
      a: number;
      b: number;
    }

    let points: Point3D[] = [];
    let connections: Connection[] = [];

    // Procedural 3D structures based on prompt or selected type
    function buildGeometry() {
      points = [];
      connections = [];

      if (holoOrbitType === "sphere") {
        // Starfield Sphere (Holographic Global Grid)
        const rings = 8;
        const ringPoints = Math.floor(holoNodes / rings);
        for (let r = 0; r < rings; r++) {
          const phi = (Math.PI / rings) * (r + 0.5);
          for (let p = 0; p < ringPoints; p++) {
            const theta = ((2 * Math.PI) / ringPoints) * p;
            const radius = 110 * holoScale;
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            points.push({ x, y, z });

            // Connecting lines
            const currentIdx = points.length - 1;
            if (p > 0) {
              connections.push({ a: currentIdx, b: currentIdx - 1 });
            } else {
              connections.push({ a: currentIdx, b: currentIdx + ringPoints - 1 });
            }
          }
        }
      } else if (holoOrbitType === "torus") {
        // Glowing Quantum Donut / Torus Knot
        const rOuter = 85 * holoScale;
        const rInner = 35 * holoScale;
        const uSteps = 12;
        const vSteps = Math.floor(holoNodes / uSteps);

        for (let u = 0; u < uSteps; u++) {
          const phi = ((2 * Math.PI) / uSteps) * u;
          for (let v = 0; v < vSteps; v++) {
            const theta = ((2 * Math.PI) / vSteps) * v;
            const x = (rOuter + rInner * Math.cos(theta)) * Math.cos(phi);
            const y = (rOuter + rInner * Math.cos(theta)) * Math.sin(phi);
            const z = rInner * Math.sin(theta);
            points.push({ x, y, z });

            const currentIdx = points.length - 1;
            // Toroidal wire connections
            if (v > 0) connections.push({ a: currentIdx, b: currentIdx - 1 });
            if (u > 0) connections.push({ a: currentIdx, b: currentIdx - vSteps });
          }
        }
      } else if (holoOrbitType === "cyber") {
        // High-Tech Cyber Grid City/Towers
        const columns = 5;
        const rows = 5;
        const spacing = 45 * holoScale;

        for (let c = 0; c < columns; c++) {
          for (let r = 0; r < rows; r++) {
            const height = (30 + Math.sin(c * 1.5 + r) * 70) * holoScale;
            const bx = (c - columns / 2) * spacing;
            const bz = (r - rows / 2) * spacing;

            // Generate building corners
            const baseIdx = points.length;
            points.push({ x: bx - 10, y: height, z: bz - 10 });
            points.push({ x: bx + 10, y: height, z: bz - 10 });
            points.push({ x: bx + 10, y: height, z: bz + 10 });
            points.push({ x: bx - 10, y: height, z: bz + 10 });

            points.push({ x: bx - 10, y: -20, z: bz - 10 });
            points.push({ x: bx + 10, y: -20, z: bz - 10 });
            points.push({ x: bx + 10, y: -20, z: bz + 10 });
            points.push({ x: bx - 10, y: -20, z: bz + 10 });

            // Wireframe linkages for tower box
            connections.push({ a: baseIdx, b: baseIdx + 1 });
            connections.push({ a: baseIdx + 1, b: baseIdx + 2 });
            connections.push({ a: baseIdx + 2, b: baseIdx + 3 });
            connections.push({ a: baseIdx + 3, b: baseIdx });

            connections.push({ a: baseIdx + 4, b: baseIdx + 5 });
            connections.push({ a: baseIdx + 5, b: baseIdx + 6 });
            connections.push({ a: baseIdx + 6, b: baseIdx + 7 });
            connections.push({ a: baseIdx + 7, b: baseIdx + 4 });

            connections.push({ a: baseIdx, b: baseIdx + 4 });
            connections.push({ a: baseIdx + 1, b: baseIdx + 5 });
            connections.push({ a: baseIdx + 2, b: baseIdx + 6 });
            connections.push({ a: baseIdx + 3, b: baseIdx + 7 });
          }
        }
      } else {
        // Organic Dragon/Phoenix Spiral Helix
        const spirals = 3;
        const steps = Math.floor(holoNodes / spirals);
        for (let s = 0; s < spirals; s++) {
          const startAngle = (s * Math.PI * 2) / spirals;
          for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            const theta = startAngle + progress * Math.PI * 4;
            const radius = progress * 110 * holoScale;
            const y = (progress * 160 - 80) * holoScale;
            const x = radius * Math.cos(theta);
            const z = radius * Math.sin(theta);
            points.push({ x, y, z });

            const currentIdx = points.length - 1;
            if (i > 0) connections.push({ a: currentIdx, b: currentIdx - 1 });
          }
        }
      }
    }

    buildGeometry();

    // Mouse / Touch Interaction (Orbit controls)
    let rotX = 0.5;
    let rotY = 0.4;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotY += dx * 0.01;
      rotX += dy * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Rotate with automatic idle spin + drag controls
      const autoSpinY = rotY + (isDragging ? 0 : 0.005 * holoSpeed);
      const autoSpinX = rotX;

      const cosX = Math.cos(autoSpinX);
      const sinX = Math.sin(autoSpinX);
      const cosY = Math.cos(autoSpinY);
      const sinY = Math.sin(autoSpinY);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Project points 3D -> 2D
      const projected = points.map((p) => {
        // Rotate Y axis
        let x = p.x * cosY - p.z * sinY;
        let z = p.z * cosY + p.x * sinY;

        // Rotate X axis
        let y = p.y * cosX - z * sinX;
        z = z * cosX + p.y * sinX;

        // Perspective scaling
        const dist = 300;
        const scale = dist / (dist + z);
        return {
          x: cx + x * scale,
          y: cy - y * scale,
          depth: z
        };
      });

      // Draw connections/edges
      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)"; // neon cyan wireframe
      ctx.lineWidth = 1;
      connections.forEach((conn) => {
        const ptA = projected[conn.a];
        const ptB = projected[conn.b];
        if (ptA && ptB) {
          ctx.beginPath();
          ctx.moveTo(ptA.x, ptA.y);
          ctx.lineTo(ptB.x, ptB.y);
          ctx.stroke();
        }
      });

      // Draw glowing particle nodes
      projected.forEach((p, idx) => {
        const nodeSize = Math.max(1, (2 + (p.depth < 0 ? 1.5 : -1)) * holoScale);
        ctx.fillStyle = p.depth < 0 ? "rgba(168, 85, 247, 0.9)" : "rgba(6, 182, 212, 0.6)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Holographic vertical laser grids
        if (idx % 24 === 0) {
          ctx.strokeStyle = "rgba(6, 182, 212, 0.05)";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, canvas.height - 40);
          ctx.stroke();
        }
      });

      // Draw circular floor platform grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.fillStyle = "rgba(6, 182, 212, 0.02)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, canvas.height - 40, 160 * holoScale, 30 * holoScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Horizontal rings on platform
      ctx.beginPath();
      ctx.ellipse(cx, canvas.height - 40, 100 * holoScale, 18 * holoScale, 0, 0, Math.PI * 2);
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [chamberMode, holoOrbitType, holoNodes, holoSpeed, holoScale]);

  // Handle generation action
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please write or speak what you want to visualize.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

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
        timestamp: Date.now(),
        narration: data.narration || `Successfully materializing your prompt: ${data.originalPrompt}`
      };

      // Save to Firestore
      if (user) {
        try {
          await addDoc(collection(db, "creative_generations"), {
            imageUrl: newGen.imageUrl,
            originalPrompt: newGen.originalPrompt,
            refinedPrompt: newGen.refinedPrompt,
            aspectRatio: newGen.aspectRatio,
            stylePreset: newGen.stylePreset,
            timestamp: newGen.timestamp,
            userId: user.uid,
            narration: newGen.narration
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

      // Play voiceover narration as soon as it finishes!
      if (newGen.narration && synthSupported) {
        setTimeout(() => {
          handlePlayVoiceover(newGen.narration);
        }, 1200);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during image generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger spoken narration
  const handlePlayVoiceover = (textToSpeak: string | undefined) => {
    if (!textToSpeak || !synthSupported) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setSubtitleWordIndex(-1);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
    
    // Choose nice voice (prefer Google English or standard high-fidelity voices)
    const voices = window.speechSynthesis.getVoices();
    const desiredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.lang.startsWith("en"));
    if (desiredVoice) utterance.voice = desiredVoice;

    utterance.pitch = voicePitch;
    utterance.rate = voiceRate;

    // Split text to trace words in real-time
    const words = textToSpeak.split(" ");
    utterance.onboundary = (event: any) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        // Find corresponding word index
        let totalChars = 0;
        let matchedIdx = -1;
        for (let i = 0; i < words.length; i++) {
          if (totalChars >= charIndex) {
            matchedIdx = i;
            break;
          }
          totalChars += words[i].length + 1; // plus space
        }
        if (matchedIdx !== -1) {
          setSubtitleWordIndex(matchedIdx);
        }
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSubtitleWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSubtitleWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoiceover = () => {
    if (synthSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSubtitleWordIndex(-1);
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
      <div className="lg:col-span-5 bg-slate-950/40 border border-white/10 rounded-3xl p-5 backdrop-blur-md flex flex-col gap-4">
        
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Sparkles className="text-cyan-400 animate-pulse" size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-white tracking-widest uppercase">Nova Multi-Studio</h2>
              <p className="text-[9px] font-mono text-slate-500 uppercase">IMAGEN 3.0 MULTIMODAL LAB</p>
            </div>
          </div>

          {/* Voice status marker */}
          {voiceSupported && (
            <span className="text-[8px] font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Voice Ready
            </span>
          )}
        </div>

        {/* PROMPT INPUT WITH INTEGRATED VOCAL RECEIVER */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Creative Prompt Core
            </label>
            {isListening && (
              <span className="text-[9px] font-mono text-rose-400 animate-pulse uppercase">
                &lt; Listening &amp; Transcribing &gt;
              </span>
            )}
          </div>
          
          <div className="relative group rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 p-3 flex flex-col gap-2">
            <div className="flex gap-2 items-start">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Describe your vision (e.g. "Cyborg ninja in futuristic Tokyo...") or click microphone to speak...'
                rows={3}
                className="w-full bg-transparent text-xs font-sans text-slate-200 placeholder-slate-500 focus:outline-none transition resize-none leading-relaxed"
              />
              
              {/* Vocal Receiver Button */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isListening
                      ? "bg-rose-500/20 border-rose-500 text-rose-400 scale-105 animate-pulse"
                      : "bg-slate-800 border-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40"
                  }`}
                  title={isListening ? "Mute Microphone" : "Speak to Generate (Hindi / English)"}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
            </div>

            {/* Listening Wave Visualizer Overlay inside text field */}
            {isListening && (
              <div className="h-8 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between px-3">
                <canvas ref={micWaveCanvasRef} width={280} height={20} className="w-full max-w-[280px]" />
                <span className="text-[8px] font-mono text-cyan-400">Transcribing...</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-white/5">
              <span className="text-[8px] text-slate-500 font-sans italic">
                *Try speaking: "banao realistic 3D model of futuristic sports car"
              </span>
              <button
                onClick={() => setPrompt("A gorgeous majestic phoenix rising from a lake of burning cyan fire, vibrant cyberpunk glow, high-fidelity 3D rendering")}
                className="text-[9px] font-mono text-slate-500 hover:text-cyan-400 hover:underline cursor-pointer"
              >
                Autofill Prompt
              </button>
            </div>
          </div>
        </div>

        {/* STYLE PRESETS */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Visual Matrix Style
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
            {stylePresets.map((preset) => {
              const Icon = preset.icon;
              const selected = stylePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setStylePreset(preset.id)}
                  className={`flex flex-col text-left p-2.5 rounded-2xl border transition cursor-pointer ${
                    selected 
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-200" 
                      : "border-white/5 bg-slate-900/30 text-slate-400 hover:border-white/10 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={11} className={selected ? "text-cyan-400" : "text-slate-500"} />
                    <span className="text-[10px] font-mono font-bold">{preset.label}</span>
                  </div>
                  <span className="text-[8px] text-slate-500 font-sans leading-tight">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RESOLUTION/ASPECT RATIOS */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Resolution Dimensions
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {aspectRatios.map((ratio) => {
              const selected = aspectRatio === ratio.id;
              return (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition cursor-pointer ${
                    selected 
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold" 
                      : "border-white/5 bg-slate-900/30 text-slate-500 hover:border-white/10"
                  }`}
                  title={ratio.desc}
                >
                  <span className="text-[10px] font-mono">{ratio.id}</span>
                  <span className="text-[8px] text-slate-600 font-sans scale-90">{ratio.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROMPT REFINEMENT ENHANCER */}
        <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-2xl">
          <div className="flex gap-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20 flex h-fit items-center justify-center">
              <Wand2 className="text-purple-400 animate-pulse" size={12} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-purple-300 font-bold block">Gemini Prompt Refiner</span>
              <span className="text-[8px] font-sans text-slate-500 block">
                Generates cinematic camera composition &amp; narration
              </span>
            </div>
          </div>
          <button
            onClick={() => setRefineWithGemini(!refineWithGemini)}
            className={`w-10 h-5 rounded-full transition p-0.5 cursor-pointer ${
              refineWithGemini ? "bg-purple-600 justify-end" : "bg-slate-800 justify-start"
            } flex items-center`}
          >
            <motion.div 
              layout 
              className="w-4 h-4 bg-white rounded-full shadow-md"
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
          className={`w-full py-3.5 rounded-2xl font-mono text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 transition ${
            isGenerating 
              ? "bg-slate-900 border border-white/5 text-slate-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 border border-cyan-400/20"
          }`}
        >
          {isGenerating ? (
            <>
              <RotateCw className="animate-spin text-cyan-400" size={14} />
              <span>Materializing Multi-Formats...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>CAST OMNI DIMENSION</span>
            </>
          )}
        </button>
      </div>

      {/* RIGHT PANEL: VISUALIZATION CHAMBER */}
      <div className="lg:col-span-7 bg-slate-950/40 border border-white/10 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between relative overflow-hidden min-h-[500px]">
        
        {/* Multimodal Output Mode Tabs Selector */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3 z-20 shrink-0 gap-3">
          <div className="flex gap-1 bg-black/40 border border-white/5 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setChamberMode("photo")}
              className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                chamberMode === "photo" 
                  ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Camera size={10} />
              <span>1. Photo</span>
            </button>
            <button
              onClick={() => setChamberMode("video")}
              className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                chamberMode === "video" 
                  ? "bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Film size={10} />
              <span>2. Video Clip</span>
            </button>
            <button
              onClick={() => setChamberMode("hologram")}
              className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                chamberMode === "hologram" 
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Box size={10} />
              <span>3. 3D Hologram</span>
            </button>
            <button
              onClick={() => setChamberMode("voice")}
              className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                chamberMode === "voice" 
                  ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Volume2 size={10} />
              <span>4. Voice Over</span>
            </button>
          </div>

          {activeImage && !isGenerating && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowPromptDetails(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-mono text-slate-300 hover:bg-white/10 cursor-pointer"
                title="View expanded system instructions"
              >
                <Info size={10} />
                <span className="hidden sm:inline">Blueprint</span>
              </button>
              <a
                href={activeImage.imageUrl}
                download={`nova_omni_${activeImage.id}.jpg`}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[9px] font-mono text-cyan-400 hover:bg-cyan-500/20 cursor-pointer"
              >
                <Download size={10} />
                <span className="hidden sm:inline">Download</span>
              </a>
            </div>
          )}
        </div>

        {/* Dynamic Inner Screen Workspace */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-10 my-3 min-h-[340px]">
          <AnimatePresence mode="wait">
            
            {isGenerating ? (
              /* LOADING SCREEN */
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-col items-center justify-center text-center gap-4 w-full"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-dashed border-cyan-400/40 animate-spin flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-4 border-dashed border-purple-400/60 animate-ping" />
                  </div>
                  <Sparkles className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={20} />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
                    Casting Reality Channels
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 animate-pulse uppercase tracking-wider">
                    {loadingLogs[loadingStep]}
                  </span>
                </div>
                {/* Visual rendering progress terminal */}
                <div className="w-full max-w-md bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[9px] text-slate-500 text-left h-[110px] overflow-y-auto mt-2 leading-relaxed">
                  <div className="text-cyan-500">[{new Date().toLocaleTimeString()}] COMMENCING MULTIMODAL PHOTON SYNTHESIS</div>
                  {loadingLogs.slice(0, loadingStep + 1).map((log, lIdx) => (
                    <div key={lIdx} className="text-slate-400 mt-0.5">
                      &gt; {log} <span className="text-emerald-400 font-bold">[READY]</span>
                    </div>
                  ))}
                  <div className="text-purple-400 animate-pulse mt-0.5">&gt; Compiling movie script &amp; holographic meshes...</div>
                </div>
              </motion.div>
            ) : activeImage ? (
              /* TAB RENDERS */
              <div className="w-full h-full flex flex-col items-center justify-center">
                
                {/* 1. PHOTO CHAMBER */}
                {chamberMode === "photo" && (
                  <motion.div
                    key="photo-render"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative max-w-full max-h-[380px] rounded-2xl border border-white/10 shadow-2xl shadow-black overflow-hidden flex items-center justify-center group"
                  >
                    <img
                      src={activeImage.imageUrl}
                      alt={activeImage.originalPrompt}
                      className="max-h-[360px] object-contain rounded-2xl transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => setShowFullImage(true)}
                        className="p-3 bg-black/80 text-white rounded-full border border-white/25 hover:border-white hover:bg-black transition-all cursor-pointer"
                        title="Fullscreen Lightbox"
                      >
                        <Maximize2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 2. CINEMATIC VIDEO PLAYBACK */}
                {chamberMode === "video" && (
                  <motion.div
                    key="video-render"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full flex flex-col gap-3 items-center"
                  >
                    {/* Simulated Cinematic Monitor */}
                    <div className="w-full max-w-lg aspect-video rounded-2xl border border-white/15 bg-black overflow-hidden relative shadow-2xl group flex items-center justify-center">
                      
                      {/* Image under smooth animation / Ken Burns zoom and pan */}
                      <img
                        src={activeImage.imageUrl}
                        alt="Cinematic frame"
                        className={`w-full h-full object-cover transition-all duration-1000 ${
                          isPlayingVideo ? "scale-110 translate-x-1 translate-y-1 animate-pulse" : "scale-100"
                        }`}
                        style={{
                          transform: isPlayingVideo ? "scale(1.14) translate(4px, -2px)" : "scale(1)",
                          transition: "transform 15s ease-in-out"
                        }}
                        referrerPolicy="no-referrer"
                      />

                      {/* Canvas overlays for animated particle effects */}
                      <canvas 
                        ref={particleCanvasRef} 
                        className="absolute inset-0 pointer-events-none mix-blend-screen"
                      />

                      {/* Cinematic Shading Overlay (Vignette + scanlines) */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35 pointer-events-none" />

                      {/* Cinematic Sound/Oscillator Active visualizer */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/75 border border-white/10 px-2.5 py-1 rounded-lg">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-[8px] font-mono text-slate-300 uppercase tracking-widest">CINEMATIC AUDIO ACTIVE</span>
                      </div>

                      {/* Dynamic Narrator Subtitles synced to speech synthesis */}
                      {showSubtitles && activeImage.narration && (
                        <div className="absolute bottom-4 inset-x-4 text-center z-10 bg-black/85 border border-white/5 py-2.5 px-4 rounded-xl backdrop-blur-md">
                          <p className="text-[10px] md:text-xs font-serif italic text-slate-200 leading-relaxed">
                            {activeImage.narration.split(" ").map((word, wIdx) => (
                              <span 
                                key={wIdx}
                                className={`mr-1 transition-all ${
                                  wIdx === subtitleWordIndex 
                                    ? "text-cyan-400 font-bold scale-105 shadow-glow" 
                                    : "text-slate-300"
                                }`}
                              >
                                {word}
                              </span>
                            ))}
                          </p>
                        </div>
                      )}

                      {/* Video Player Action Controls (Play/Pause overlays) */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                          className="p-4 bg-slate-900/90 hover:bg-black text-white rounded-full border border-white/15 transition cursor-pointer"
                        >
                          {isPlayingVideo ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Cinematic Video Controls Dashboard */}
                    <div className="w-full max-w-lg bg-slate-900/40 border border-white/5 rounded-2xl p-3 flex justify-between items-center text-[10px] font-mono">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                          className="p-1.5 bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/25 cursor-pointer"
                        >
                          {isPlayingVideo ? <Pause size={10} /> : <Play size={10} />}
                        </button>
                        <span className="text-slate-400 uppercase">
                          {isPlayingVideo ? "Rendering Cinematic Loop" : "Render Paused"}
                        </span>
                      </div>

                      {/* Particle selector options */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 uppercase scale-90 text-[8px]">Particle FX:</span>
                        {["fireflies", "matrix", "stars", "snow"].map((theme) => (
                          <button
                            key={theme}
                            onClick={() => setParticleTheme(theme as any)}
                            className={`px-2 py-0.5 rounded-md border text-[8px] uppercase tracking-wider cursor-pointer ${
                              particleTheme === theme 
                                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
                                : "bg-slate-800 border-white/5 text-slate-500 hover:text-white"
                            }`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. INTERACTIVE 3D HOLOGRAM MODEL GRID */}
                {chamberMode === "hologram" && (
                  <motion.div
                    key="3d-hologram"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full flex flex-col items-center gap-3"
                  >
                    <div className="relative w-full max-w-lg bg-slate-950/80 border border-cyan-500/10 rounded-2xl overflow-hidden flex flex-col items-center shadow-inner">
                      
                      {/* Real Dynamic 3D canvas */}
                      <canvas 
                        ref={holographicCanvasRef} 
                        className="w-full max-h-[330px] cursor-grab active:cursor-grabbing"
                      />

                      {/* Interactive floating HUD HUD */}
                      <div className="absolute top-3 left-3 bg-black/85 border border-cyan-500/20 px-3 py-1.5 rounded-xl font-mono text-[8px] text-cyan-300 flex flex-col gap-0.5 uppercase z-10 leading-tight">
                        <span className="font-bold tracking-widest text-[9px] text-white">Quantum 3D Core</span>
                        <span>GRID TYPE: {holoOrbitType}</span>
                        <span>PROMPT REF: {activeImage.originalPrompt.slice(0, 15)}...</span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 border border-white/5 px-2.5 py-1 rounded-lg text-[9px] text-slate-400 font-mono z-10">
                        <Sliders size={10} className="text-cyan-400 animate-spin" />
                        <span>Drag to rotate 360°</span>
                      </div>
                    </div>

                    {/* Interactive 3D Model Parameters Node Controls */}
                    <div className="w-full max-w-lg bg-slate-900/40 border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[9px] font-mono leading-relaxed text-slate-400">
                      
                      {/* Structure Type Select */}
                      <div className="flex flex-col gap-1">
                        <span className="text-cyan-400 uppercase tracking-wider font-semibold">Geometric Mesh</span>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {["sphere", "torus", "cyber", "organic"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setHoloOrbitType(type as any)}
                              className={`py-1 rounded border text-[8px] uppercase tracking-wider text-center cursor-pointer ${
                                holoOrbitType === type 
                                  ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold" 
                                  : "bg-slate-800 border-white/5 hover:text-white"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Nodes Count Range */}
                      <div className="flex flex-col gap-1 justify-center">
                        <div className="flex justify-between items-center text-cyan-400">
                          <span className="uppercase tracking-wider">Node Density</span>
                          <span className="text-white">{holoNodes}</span>
                        </div>
                        <input 
                          type="range" 
                          min="40" 
                          max="250" 
                          step="10" 
                          value={holoNodes}
                          onChange={(e) => setHoloNodes(parseInt(e.target.value))}
                          className="w-full mt-1.5 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                      {/* Rotational Speed Range */}
                      <div className="flex flex-col gap-1 justify-center">
                        <div className="flex justify-between items-center text-cyan-400">
                          <span className="uppercase tracking-wider">Aerospeed</span>
                          <span className="text-white">{holoSpeed}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.2" 
                          max="4" 
                          step="0.1" 
                          value={holoSpeed}
                          onChange={(e) => setHoloSpeed(parseFloat(e.target.value))}
                          className="w-full mt-1.5 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 4. VOICE OVER AND AUDIO SPECTRUM */}
                {chamberMode === "voice" && (
                  <motion.div
                    key="voice-over"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-lg bg-slate-900/40 border border-white/10 rounded-3xl p-5 flex flex-col gap-4 items-center"
                  >
                    <div className="w-full border border-white/5 rounded-2xl bg-black/60 p-5 flex flex-col items-center justify-center gap-4 relative">
                      
                      {/* Audio visualizer spectrum canvas */}
                      <canvas 
                        ref={audioVisualizerCanvasRef} 
                        width={380} 
                        height={60} 
                        className="w-full max-w-[380px]"
                      />

                      {/* Narration script quote block */}
                      <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl text-center leading-relaxed font-serif text-[11px] md:text-xs text-slate-200 italic max-w-sm relative">
                        "{activeImage.narration || "No vocal script generated for this layout."}"
                        {isSpeaking && (
                          <div className="absolute -top-2 left-3 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase animate-pulse">
                            Narrator Active
                          </div>
                        )}
                      </div>

                      {/* Voice synth audio triggers */}
                      <div className="flex items-center gap-3">
                        {isSpeaking ? (
                          <button
                            onClick={handleStopVoiceover}
                            className="px-6 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 text-rose-400 rounded-xl font-mono text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                          >
                            <VolumeX size={12} />
                            <span>Stop Voice</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePlayVoiceover(activeImage.narration)}
                            disabled={!activeImage.narration}
                            className="px-6 py-2 bg-indigo-600 border border-indigo-400/20 hover:opacity-90 text-white rounded-xl font-mono text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
                          >
                            <Volume2 size={12} />
                            <span>Play AI Narration</span>
                          </button>
                        )}
                        <button
                          onClick={() => handlePlayVoiceover(activeImage.narration)}
                          className="p-2 bg-slate-800 border border-white/5 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                          title="Regenerate Voice Wave"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Vocal Pitch and Speed Adjustment Nodes */}
                    <div className="w-full grid grid-cols-2 gap-4 text-[9px] font-mono leading-relaxed text-slate-400">
                      <div className="flex flex-col gap-1 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                        <div className="flex justify-between text-indigo-400 font-bold">
                          <span>VOICE PITCH</span>
                          <span>{voicePitch}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.05" 
                          value={voicePitch}
                          onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                          className="w-full mt-1.5 accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded"
                        />
                      </div>
                      <div className="flex flex-col gap-1 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                        <div className="flex justify-between text-indigo-400 font-bold">
                          <span>SPEAKING RATE</span>
                          <span>{voiceRate}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.05" 
                          value={voiceRate}
                          onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                          className="w-full mt-1.5 accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded"
                        />
                      </div>
                    </div>

                  </motion.div>
                )}

              </div>
            ) : (
              /* IDLE STATE */
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center gap-3 max-w-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mb-2 relative">
                  <Box size={22} className="animate-pulse" />
                  <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl animate-ping scale-110" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                  Multimodal Chamber Core
                </span>
                <p className="text-[10px] font-sans text-slate-500 leading-relaxed uppercase">
                  Design detailed 3D scenes on the left, and cast them. Your vocal inputs or written text will instantly compile a high-res photo, a panning movie video loop, interactive 3D model meshes, and custom-narrated voiceovers.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setPrompt("A realistic 3D render of a futuristic cyber-ninjutsu warrior wearing dark iron armor with gold glowing lines, standing in rain, marvel cinematic style");
                      setStylePreset("cinematic-3d");
                    }}
                    className="px-3.5 py-1.5 border border-white/10 bg-white/5 rounded-xl text-[9px] font-mono text-slate-400 hover:text-white hover:border-white/20 cursor-pointer"
                  >
                    Marvel 3D Template
                  </button>
                  <button
                    onClick={() => {
                      setPrompt("Retro futuristic cyberpunk cockpit inside a massive starship, controls glowing pink, electric blue starways ahead");
                      setStylePreset("vibrant-cyberpunk");
                    }}
                    className="px-3.5 py-1.5 border border-white/10 bg-white/5 rounded-xl text-[9px] font-mono text-slate-400 hover:text-white hover:border-white/20 cursor-pointer"
                  >
                    Cyber Cockpit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Details Banner for the active item */}
        {activeImage && !isGenerating && (
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 z-10 flex gap-2.5 items-center justify-between mt-1 shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20 shrink-0 animate-pulse">
                <Box size={14} />
              </div>
              <div className="overflow-hidden text-left">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Prompt Subject</span>
                <span className="text-[10px] text-slate-200 block truncate font-sans font-medium">
                  "{activeImage.originalPrompt}"
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
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
              <div className="flex flex-col gap-1.5 bg-slate-900/60 border border-white/5 p-4 rounded-2xl text-left">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Original Subject Input
                </span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{activeImage.originalPrompt}"
                </p>
              </div>

              {/* Gemini Expanded Rendering Prompt */}
              <div className="flex flex-col gap-1.5 bg-purple-950/20 border border-purple-500/15 p-4 rounded-2xl relative overflow-hidden text-left">
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

              {/* Movie script generated */}
              <div className="flex flex-col gap-1.5 bg-cyan-950/20 border border-cyan-500/15 p-4 rounded-2xl text-left">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  Cinematic voice narration
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-serif italic">
                  "{activeImage.narration}"
                </p>
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
