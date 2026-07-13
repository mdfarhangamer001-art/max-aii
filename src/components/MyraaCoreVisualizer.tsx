import React, { useEffect, useRef, useState } from "react";
import { MyraaAudioSession, LiveState } from "../lib/audio";
import { Sparkles, Terminal } from "lucide-react";

export type MyraaEmotion = 
  | "idle" 
  | "happy" 
  | "excited" 
  | "curious" 
  | "thinking" 
  | "proud" 
  | "sad" 
  | "confused" 
  | "surprised" 
  | "embarrassed" 
  | "playful";

export type UITheme = "cosmic" | "cyberpunk" | "matrix" | "glassmorphic";
export type UIMode = "2d" | "3d" | "floating_core" | "glassmorphism" | "dashboard";

interface MyraaCoreVisualizerProps {
  session: MyraaAudioSession | null;
  state: LiveState;
  themeColor: string; // Violet, crimson, emerald, celestial, gold, rose, charcoal
  activeEmotion?: MyraaEmotion;
  characterState: "idle" | "thinking" | "talking";
  uiMode: UIMode;
  uiTheme: UITheme;
  animationIntensity: number; // 0.5, 1.0, 2.0
  powerUsage: "normal" | "low";
}

export const MyraaCoreVisualizer: React.FC<MyraaCoreVisualizerProps> = ({
  session,
  state,
  themeColor,
  activeEmotion = "idle",
  characterState,
  uiMode,
  uiTheme,
  animationIntensity,
  powerUsage
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Video element refs for character state machine
  const idleVideoRef = useRef<HTMLVideoElement | null>(null);
  const thinkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const talkingVideoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleVideoError = (videoName: string) => {
    console.warn(`[Max-AI OS Video] Video source offline for: ${videoName}. Running procedurally generated high-fidelity visualizer.`);
    setHasError(true);
  };

  // Cursor position tracking
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.4 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.4 });
  
  // Audio state
  const speechVolumeRef = useRef<number>(0);

  // Floating scardust particles array
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    speed: number;
    size: number;
    opacity: number;
    angle?: number;
    spinSpeed?: number;
  }>>([]);

  // Matrix falling columns
  const matrixColumnsRef = useRef<Array<{
    x: number;
    y: number;
    speed: number;
    chars: string[];
  }>>([]);

  // Futuristic circuit pathways for premium aesthetic
  const circuitsRef = useRef<Array<{
    points: Array<{ x: number; y: number }>;
    opacity: number;
    speed: number;
    pulsePos: number;
    size: number;
  }>>([]);

  // Synchronized video crossfade
  useEffect(() => {
    const playVideo = (videoEl: HTMLVideoElement | null) => {
      if (!videoEl) return;
      try {
        videoEl.currentTime = 0;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn("Autoplay blocked, retrying muted feed:", error);
          });
        }
      } catch (err) {}
    };

    const pauseVideo = (videoEl: HTMLVideoElement | null) => {
      if (!videoEl) return;
      try {
        videoEl.pause();
      } catch (err) {}
    };

    if (characterState === "idle") {
      playVideo(idleVideoRef.current);
      pauseVideo(thinkingVideoRef.current);
      pauseVideo(talkingVideoRef.current);
    } else if (characterState === "thinking") {
      playVideo(thinkingVideoRef.current);
      pauseVideo(idleVideoRef.current);
      pauseVideo(talkingVideoRef.current);
    } else if (characterState === "talking") {
      playVideo(talkingVideoRef.current);
      pauseVideo(idleVideoRef.current);
      pauseVideo(thinkingVideoRef.current);
    }
  }, [characterState]);

  // Track cursor position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Theme-color color mapper
  const getGlowColors = () => {
    // If matrix theme is set, enforce pure matrix neon green override
    if (uiTheme === "matrix") {
      return { primary: "rgba(0, 255, 70, 1)", secondary: "rgba(0, 120, 30, 0.8)", glow: "rgba(0, 255, 70, 0.7)" };
    }
    // If cyberpunk theme is set, enforce electric violet & hot pink override
    if (uiTheme === "cyberpunk") {
      return { primary: "rgba(255, 0, 128, 1)", secondary: "rgba(0, 240, 255, 0.8)", glow: "rgba(255, 0, 128, 0.7)" };
    }
    // If glassmorphic is active, ice blue and frosted white
    if (uiTheme === "glassmorphic") {
      return { primary: "rgba(224, 242, 254, 1)", secondary: "rgba(186, 230, 253, 0.8)", glow: "rgba(56, 189, 248, 0.6)" };
    }

    switch (themeColor) {
      case "violet":
        return { primary: "rgba(147, 51, 234, 1)", secondary: "rgba(192, 38, 211, 0.8)", glow: "rgba(168, 85, 247, 0.7)" };
      case "crimson":
        return { primary: "rgba(225, 29, 72, 1)", secondary: "rgba(234, 88, 12, 0.8)", glow: "rgba(244, 63, 94, 0.7)" };
      case "emerald":
        return { primary: "rgba(5, 150, 105, 1)", secondary: "rgba(13, 148, 136, 0.8)", glow: "rgba(16, 185, 129, 0.7)" };
      case "celestial":
        return { primary: "rgba(2, 132, 199, 1)", secondary: "rgba(8, 145, 178, 0.8)", glow: "rgba(14, 165, 233, 0.7)" };
      case "gold":
        return { primary: "rgba(202, 138, 4, 1)", secondary: "rgba(217, 119, 6, 0.8)", glow: "rgba(234, 179, 8, 0.7)" };
      case "rose":
        return { primary: "rgba(219, 39, 119, 1)", secondary: "rgba(220, 38, 38, 0.8)", glow: "rgba(236, 72, 153, 0.7)" };
      default:
        return { primary: "rgba(34, 211, 238, 1)", secondary: "rgba(79, 70, 229, 0.8)", glow: "rgba(6, 182, 212, 0.7)" };
    }
  };

  // Main high-performance Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Generate background floating particles
    const generateParticles = () => {
      const count = Math.min(80, Math.floor(width / 18));
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: (Math.random() * 0.3 + 0.1) * (powerUsage === "low" ? 0.4 : 1.0),
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.5 + 0.2,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() * 0.02 - 0.01) * (powerUsage === "low" ? 0.2 : 1.0)
      }));
    };

    // Generate PCB circuits
    const generateCircuits = () => {
      const circuits: Array<any> = [];
      const count = 14;
      const scale = Math.max(0.8, Math.min(1.6, height / 500));
      const cx = width / 2;
      const cy = height * 0.45;

      for (let i = 0; i < count; i++) {
        const startRad = 100 * scale;
        // Distribute angles evenly radiating outwards
        const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.15 - 0.075);
        
        const startX = cx + Math.cos(angle) * startRad;
        const startY = cy + Math.sin(angle) * startRad;
        
        const points = [{ x: startX, y: startY }];
        
        // Step 1: Radiate outwards
        const len1 = (70 + Math.random() * 60) * scale;
        const p1x = startX + Math.cos(angle) * len1;
        const p1y = startY + Math.sin(angle) * len1;
        points.push({ x: p1x, y: p1y });
        
        // Step 2: 45 or 90-degree turn
        let turnAngle = angle + (Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4);
        if (Math.random() > 0.6) {
          // Snap turn
          turnAngle = Math.abs(Math.cos(angle)) > 0.5 
            ? (angle > Math.PI ? Math.PI : 0) 
            : (angle > Math.PI/2 && angle < 3*Math.PI/2 ? 3*Math.PI/2 : Math.PI/2);
        }
        const len2 = (50 + Math.random() * 70) * scale;
        const p2x = p1x + Math.cos(turnAngle) * len2;
        const p2y = p1y + Math.sin(turnAngle) * len2;
        points.push({ x: p2x, y: p2y });

        // Step 3: Optional final short snap
        if (Math.random() > 0.4) {
          const finalAngle = turnAngle + (Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4);
          const len3 = 30 * scale;
          const p3x = p2x + Math.cos(finalAngle) * len3;
          const p3y = p2y + Math.sin(finalAngle) * len3;
          points.push({ x: p3x, y: p3y });
        }
        
        circuits.push({
          points,
          opacity: Math.random() * 0.18 + 0.08,
          speed: 0.004 + Math.random() * 0.006,
          pulsePos: Math.random(),
          size: 0.8 + Math.random() * 1.2
        });
      }
      circuitsRef.current = circuits;
    };

    // Generate Matrix Rain columns
    const generateMatrixColumns = () => {
      const colWidth = 14;
      const colCount = Math.floor(width / colWidth);
      matrixColumnsRef.current = Array.from({ length: colCount }, (_, idx) => ({
        x: idx * colWidth,
        y: Math.random() * -height - 100,
        speed: (Math.random() * 2.5 + 1.5) * (powerUsage === "low" ? 0.5 : 1.0),
        chars: Array.from({ length: Math.floor(Math.random() * 8 + 6) }, () => 
          String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))
        )
      }));
    };

    generateParticles();
    generateCircuits();
    if (uiTheme === "matrix") {
      generateMatrixColumns();
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      generateParticles();
      generateCircuits();
      if (uiTheme === "matrix") {
        generateMatrixColumns();
      }
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const systemTime = performance.now();
      const colors = getGlowColors();

      // Dynamic Audio analyser data
      let audioLevel = 0;
      let bufferLength = 64;
      const dataArray = new Uint8Array(bufferLength);
      let activeAnalyser = null;

      if (state === "speaking" && session?.outputAnalyser) {
        activeAnalyser = session.outputAnalyser;
      } else if (state === "listening" && session?.inputAnalyser) {
        activeAnalyser = session.inputAnalyser;
      }

      if (activeAnalyser) {
        try {
          activeAnalyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          audioLevel = sum / bufferLength; // 0 to 255
        } catch (e) {}
      }

      // Smooth amplitude tracking
      speechVolumeRef.current += (audioLevel / 255 - speechVolumeRef.current) * 0.2;

      const s = Math.max(0.9, Math.min(1.8, height / 450)); // Scale factor
      const centerX = width / 2;
      const centerY = height * 0.45; // Center point for core projections

      // Cursor lag tracking
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.05;

      // ==========================================
      // 1. DRAW CORE THEME BACKGROUND CANVAS EFFECTS
      // ==========================================

      // A. DIGITAL MATRIX RAIN EFFECT
      if (uiTheme === "matrix") {
        ctx.save();
        ctx.font = "bold 11px monospace";
        matrixColumnsRef.current.forEach((col) => {
          col.y += col.speed * animationIntensity;
          if (col.y > height) {
            col.y = Math.random() * -100 - 50;
          }

          col.chars.forEach((char, idx) => {
            const charY = col.y + idx * 13;
            if (charY > 0 && charY < height) {
              const alpha = 0.15 + (idx / col.chars.length) * 0.75;
              ctx.fillStyle = idx === col.chars.length - 1 ? "#fff" : `rgba(0, 255, 70, ${alpha * (powerUsage === "low" ? 0.5 : 1.0)})`;
              ctx.fillText(char, col.x, charY);
            }
          });

          // Jitter character values
          if (Math.random() < 0.02) {
            col.chars[Math.floor(Math.random() * col.chars.length)] = 
              String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
          }
        });
        ctx.restore();
      }

      // B. CYBERPUNK BACKGROUND LASER GRID SCANLINE
      if (uiTheme === "cyberpunk") {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
        ctx.lineWidth = 1;
        const gridGap = 40;
        const scanOffset = (systemTime * 0.05 * animationIntensity) % gridGap;

        // Draw horizontal grid lines
        for (let y = scanOffset; y < height; y += gridGap) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Horizontal scanning hot pink line
        const scannerY = (systemTime * 0.1 * animationIntensity) % height;
        ctx.strokeStyle = "rgba(255, 0, 128, 0.12)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, scannerY);
        ctx.lineTo(width, scannerY);
        ctx.stroke();
        ctx.restore();
      }

      // C. FUTURISTIC PCB GLOWING CIRCUITS (Universal Premium Style Background Overlay)
      if (powerUsage !== "low") {
        ctx.save();
        circuitsRef.current.forEach((circuit) => {
          // Increase path opacity and thickness slightly when voice is active
          const voiceFactor = speechVolumeRef.current * 0.55;
          const currentOpacity = Math.min(0.35, circuit.opacity * (0.6 + voiceFactor));
          
          ctx.beginPath();
          circuit.points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          
          ctx.strokeStyle = colors.primary.replace("1)", `${currentOpacity})`);
          ctx.lineWidth = circuit.size * s;
          ctx.stroke();

          // Draw small terminal pads/nodes at the start and end of the path
          circuit.points.forEach((pt, idx) => {
            if (idx === 0 || idx === circuit.points.length - 1) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, (idx === 0 ? 2 : 3) * s * circuit.size, 0, Math.PI * 2);
              ctx.fillStyle = idx === 0 
                ? colors.secondary.replace("0.8)", `${currentOpacity * 1.5})`)
                : colors.primary.replace("1)", `${currentOpacity * 2.2})`);
              ctx.fill();
              
              if (idx === circuit.points.length - 1 && Math.random() > 0.95) {
                // Microscopic glowing halos on nodes
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 6 * s * circuit.size, 0, Math.PI * 2);
                ctx.strokeStyle = colors.primary.replace("1)", "0.2");
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          });

          // Draw pulsating electric current traveling along the circuit pathway!
          circuit.pulsePos += circuit.speed * animationIntensity;
          if (circuit.pulsePos > 1) {
            circuit.pulsePos = 0;
          }

          // Calculate current position along the multi-segment path
          const totalSegments = circuit.points.length - 1;
          const segmentIndex = Math.floor(circuit.pulsePos * totalSegments);
          const segmentProgress = (circuit.pulsePos * totalSegments) - segmentIndex;
          
          if (segmentIndex >= 0 && segmentIndex < totalSegments) {
            const startPt = circuit.points[segmentIndex];
            const endPt = circuit.points[segmentIndex + 1];
            
            const pulseX = startPt.x + (endPt.x - startPt.x) * segmentProgress;
            const pulseY = startPt.y + (endPt.y - startPt.y) * segmentProgress;
            
            // Draw glowing signal bead
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 3.2 * s, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = colors.glow;
            ctx.shadowBlur = 12;
            ctx.fill();
            
            // Subtle trail behind the pulse
            ctx.beginPath();
            const trailProgress = Math.max(0, segmentProgress - 0.15);
            const trailX = startPt.x + (endPt.x - startPt.x) * trailProgress;
            const trailY = startPt.y + (endPt.y - startPt.y) * trailProgress;
            ctx.moveTo(pulseX, pulseY);
            ctx.lineTo(trailX, trailY);
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 2 * s;
            ctx.stroke();
          }
        });
        ctx.restore();
      }

      // ==========================================
      // 2. DRAW PRIMARY CORE COMPONENT VISUALIZERS
      // ==========================================

      // A. 2D FLAT SOUNDWAVE RING MODE
      if (uiMode === "2d") {
        ctx.save();
        const nodeCount = 120;
        const baseRadius = 110 * s;
        ctx.translate(centerX, centerY);

        // Sub-outer glow ring
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = colors.primary.replace("1)", "0.15)");
        ctx.lineWidth = 12 * s;
        ctx.stroke();

        // Reactive waveform ring
        ctx.beginPath();
        for (let i = 0; i <= nodeCount; i++) {
          const angle = (i / nodeCount) * Math.PI * 2;
          const frequencyIndex = Math.floor((i % (nodeCount / 2)) / (nodeCount / 2) * bufferLength);
          const rawAmp = dataArray[frequencyIndex] || 0;
          const amp = (rawAmp / 255) * 28 * s * animationIntensity;
          
          const r = baseRadius + amp * (state === "disconnected" ? 0.1 : 1.0);
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.primary;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();
      }

      // B. 3D ROTATING HOLOGRAPHIC SPHERE MODE (Our flagship Jarvis visualizer!)
      else if (uiMode === "3d") {
        ctx.save();
        const sphereRadius = 115 * s * (1 + speechVolumeRef.current * 0.35);
        const pointCount = powerUsage === "low" ? 60 : 130;
        const rotationSpeedY = systemTime * 0.0006 * animationIntensity;
        const rotationSpeedX = systemTime * 0.0003 * animationIntensity;

        for (let i = 0; i < pointCount; i++) {
          // Uniform distribute points on sphere surface
          const phi = Math.acos(-1 + (2 * i) / pointCount);
          const theta = Math.sqrt(pointCount * Math.PI) * phi;

          // Orbit rotation matrices
          const ry = theta + rotationSpeedY;
          const rx = phi + rotationSpeedX;

          const x3d = sphereRadius * Math.sin(rx) * Math.cos(ry);
          const y3d = sphereRadius * Math.sin(rx) * Math.sin(ry);
          const z3d = sphereRadius * Math.cos(rx);

          // Standard 3D perspective projection
          const focalLength = 280;
          const projectionScale = focalLength / (focalLength - z3d);
          const projX = centerX + x3d * projectionScale;
          const projY = centerY + y3d * projectionScale;

          // Depth-based sorting shading (front particles are brighter, rear are dim)
          const depthAlpha = (z3d + sphereRadius) / (2 * sphereRadius); // 0 to 1
          const alpha = (0.2 + depthAlpha * 0.8) * (state === "disconnected" ? 0.35 : 0.95);

          // Draw node connector wire lines occasionally to make it look like a neural net
          if (i > 0 && i % 8 === 0 && powerUsage !== "low") {
            const nextPhi = Math.acos(-1 + (2 * (i - 1)) / pointCount);
            const nextTheta = Math.sqrt(pointCount * Math.PI) * nextPhi;
            const nry = nextTheta + rotationSpeedY;
            const nrx = nextPhi + rotationSpeedX;

            const nx = centerX + sphereRadius * Math.sin(nrx) * Math.cos(nry) * projectionScale;
            const ny = centerY + sphereRadius * Math.sin(nrx) * Math.sin(nry) * projectionScale;

            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(nx, ny);
            ctx.strokeStyle = colors.secondary.replace("0.8)", `${alpha * 0.14})`);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          // Node star point
          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(1, 2.2 * projectionScale * s), 0, Math.PI * 2);
          ctx.fillStyle = colors.primary.replace("1)", `${alpha})`);
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = depthAlpha > 0.7 ? 8 : 0;
          ctx.fill();
        }
        ctx.restore();
      }

      // C. FLOATING MULTI-RING ORBITAL CORE
      else if (uiMode === "floating_core") {
        ctx.save();
        ctx.translate(centerX, centerY);

        const coreRadius = 45 * s * (1 + Math.sin(systemTime * 0.005) * 0.12 + speechVolumeRef.current * 0.4);
        
        // Central glowing core energy star
        const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 1.5);
        coreGlow.addColorStop(0, colors.primary);
        coreGlow.addColorStop(0.3, colors.secondary.replace("0.8)", "0.8)"));
        coreGlow.addColorStop(0.8, colors.primary.replace("1)", "0.08)"));
        coreGlow.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // 3 Orbital rings spinning on different perspectives
        const ringCount = powerUsage === "low" ? 2 : 3;
        for (let r = 0; r < ringCount; r++) {
          ctx.save();
          const angleY = systemTime * 0.001 * (r + 1) * 0.4 * animationIntensity;
          const angleZ = systemTime * 0.0005 * (r + 1) * animationIntensity;
          ctx.rotate(angleZ);
          
          ctx.beginPath();
          // Draw ellipse to simulate rotated circular ring
          ctx.ellipse(
            0, 
            0, 
            (75 + r * 28) * s, 
            (75 + r * 28) * s * Math.cos(0.8 + r * 0.3), 
            angleY, 
            0, 
            Math.PI * 2
          );
          
          ctx.strokeStyle = r === 0 ? colors.primary : colors.secondary.replace("0.8)", "0.55)");
          ctx.lineWidth = r === 0 ? 2.2 : 1.2;
          ctx.stroke();

          // Draw orbital payload satellite bead
          const satelliteAngle = (systemTime * 0.0015 / (r + 1)) % (Math.PI * 2);
          const satX = Math.cos(satelliteAngle) * (75 + r * 28) * s;
          const satY = Math.sin(satelliteAngle) * (75 + r * 28) * s * Math.cos(0.8 + r * 0.3);

          ctx.beginPath();
          ctx.arc(satX, satY, 4.5 * s, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = 10;
          ctx.fill();

          ctx.restore();
        }
        ctx.restore();
      }

      // ==========================================
      // 3. DRAW CONICAL UPWARD PROJECTOR LIGHT BEAMS
      // ==========================================
      if (uiMode !== "2d" && powerUsage !== "low") {
        ctx.save();
        const beamHeight = height + 40;
        const beamWidth = 240 * s;

        const volumetricGrad = ctx.createLinearGradient(centerX, height * 0.1, centerX, height);
        volumetricGrad.addColorStop(0, "rgba(0,0,0,0)");
        volumetricGrad.addColorStop(0.3, colors.primary.replace("1)", "0.03)"));
        volumetricGrad.addColorStop(0.7, colors.primary.replace("1)", "0.07)"));
        volumetricGrad.addColorStop(1, colors.secondary.replace("0.8)", "0.15)"));

        ctx.fillStyle = volumetricGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - beamWidth * 0.4, beamHeight - 150);
        ctx.lineTo(centerX + beamWidth * 0.4, beamHeight - 150);
        ctx.lineTo(centerX + beamWidth * 1.6, height);
        ctx.lineTo(centerX - beamWidth * 1.6, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // ==========================================
      // 4. DRAW FLOATING RISING COGNITIVE PARTICLES
      // ==========================================
      particlesRef.current.forEach((p) => {
        const speedMultiplier = 1 + speechVolumeRef.current * 1.5;
        p.y -= p.speed * speedMultiplier * animationIntensity;
        
        if (p.angle !== undefined && p.spinSpeed !== undefined) {
          p.angle += p.spinSpeed;
          p.x += Math.sin(p.angle) * 0.3;
        }

        const opacityModifier = p.opacity * Math.max(0, p.y / height);

        // Recirculate particle
        if (p.y < height * 0.05) {
          p.y = height + Math.random() * 30;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * s, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary.replace("1)", `${opacityModifier * 0.45})`);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [session, state, themeColor, activeEmotion, characterState, uiMode, uiTheme, animationIntensity, powerUsage]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent select-none">
      
      {/* 1. Behind Overlay Ambient Backlight Atmospheric Glow */}
      <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none z-0">
        <div className={`w-[520px] h-[520px] rounded-full blur-[140px] opacity-25 bg-gradient-to-tr transition-all duration-1000 ${
          uiTheme === "matrix" ? "from-emerald-600/30 to-green-950/5" :
          uiTheme === "cyberpunk" ? "from-fuchsia-600/35 to-cyan-500/10" :
          uiTheme === "glassmorphic" ? "from-sky-300/20 to-slate-100/5" :
          themeColor === "violet" ? "from-purple-600/30 to-fuchsia-600/5" :
          themeColor === "crimson" ? "from-rose-600/30 to-orange-600/5" :
          themeColor === "emerald" ? "from-emerald-600/30 to-teal-600/5" :
          themeColor === "celestial" ? "from-sky-600/30 to-cyan-600/5" :
          themeColor === "gold" ? "from-amber-600/30 to-yellow-600/5" :
          themeColor === "rose" ? "from-rose-600/30 to-pink-600/5" :
          "from-indigo-600/30 to-cyan-600/5"
        }`} />
      </div>

      {/* 2. State-machine AI loops crossfade manager (Z-index 10) - Hidden in floating_core/2d modes */}
      {(uiMode === "glassmorphism" || uiMode === "dashboard") && (
        <div 
          id="maxai-character-stage"
          className="absolute z-10 w-full h-full flex items-center justify-center pointer-events-auto transition-all duration-700"
        >
          <div className="relative w-full max-w-4xl aspect-[16/9] flex items-center justify-center scale-[0.95] sm:scale-110 select-none pointer-events-none md:max-h-[72vh] max-h-[62vh]">
            <div className="absolute inset-0 rounded-[2.5rem] blur-[30px] opacity-20 bg-cyan-600/15 pointer-events-none mix-blend-screen" />

            {/* IDLE VIDEO */}
            <video
              ref={idleVideoRef}
              src="/assets/idle.mp4"
              loop
              muted
              playsInline
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover rounded-[2.5rem] transition-opacity duration-700 ease-in-out ${
                characterState === "idle" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
              }`}
              style={{
                maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
              }}
              onError={() => handleVideoError("idle")}
            />

            {/* THINKING VIDEO */}
            <video
              ref={thinkingVideoRef}
              src="/assets/thinking.mp4"
              loop
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover rounded-[2.5rem] transition-opacity duration-700 ease-in-out ${
                characterState === "thinking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
              }`}
              style={{
                maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
              }}
              onError={() => handleVideoError("thinking")}
            />

            {/* TALKING VIDEO */}
            <video
              ref={talkingVideoRef}
              src="/assets/talking.mp4"
              loop
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover rounded-[2.5rem] transition-opacity duration-700 ease-in-out ${
                characterState === "talking" ? "opacity-100 z-10 animate-fade-in" : "opacity-0 z-0"
              }`}
              style={{
                maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 80%)",
              }}
              onError={() => handleVideoError("talking")}
            />

            {/* Faint edge grid guide */}
            <div className="absolute inset-0 rounded-[2.5rem] border border-white/5 pointer-events-none bg-radial-gradient from-transparent to-black/35" />

            {/* Video Fallback Procedural Overlay */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020205]/95 backdrop-blur-md rounded-3xl p-6 text-center z-50 pointer-events-auto border border-white/5 shadow-2xl">
                <Terminal className="text-cyan-400 mb-2 animate-pulse" size={28} />
                <h3 className="text-xs font-bold tracking-widest font-mono text-cyan-400 uppercase select-none">Procedural Neural Visualizer Active</h3>
                <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed font-mono">
                  No video assets detected. Max Core mathematical generator has automatically initialized a clean glowing visualizer loop.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. High performance rendering canvas (Z-index 20) */}
      <canvas
        id="maxai-primary-living-canvas"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />
    </div>
  );
};
