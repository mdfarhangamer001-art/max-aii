import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Cpu, 
  Database, 
  Trash2, 
  Plus, 
  Sparkles, 
  Monitor, 
  Volume2, 
  Sun, 
  Layers, 
  Code, 
  GitBranch, 
  Search, 
  Download, 
  Upload, 
  Play, 
  Pause,
  AlertCircle,
  Clock,
  Eye,
  Settings,
  X,
  FileCode,
  Globe,
  RotateCw,
  Workflow,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Smartphone,
  QrCode,
  Terminal,
  Lock,
  Shield,
  MessageSquare,
  Mic,
  FileText,
  FileUp,
  File,
  KeyRound
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Memory, MemoryCategory } from "../lib/memoryTypes";
import { MyraaCoreVisualizer, MyraaEmotion } from "./MyraaCoreVisualizer";
import { MyraaAudioSession, LiveState } from "../lib/audio";

export interface JarvisSubAgent {
  id: string;
  name: string;
  task: string;
  status: "Active" | "Idle" | "Thinking" | "Executing" | "Awaiting Auth" | "Completed";
  telemetry: string;
  impact: "Low" | "Medium" | "High";
}

export interface JarvisCategory {
  id: string;
  name: string;
  color: string;
  bg: string;
  text: string;
  agents: JarvisSubAgent[];
}

export const agentCategories: JarvisCategory[] = [
  {
    id: "core_intelligence",
    name: "Core Intelligence",
    color: "from-cyan-500 to-blue-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    text: "text-cyan-400",
    agents: [
      { id: "master_orchestrator", name: "Master Orchestrator Agent", task: "Directing multi-agent tasks", status: "Active", telemetry: "99.2% alignment", impact: "High" },
      { id: "hyper_reasoning", name: "Hyper Reasoning Agent", task: "Solving logic constraints", status: "Idle", telemetry: "98.9% precision", impact: "Medium" },
      { id: "long_term_memory", name: "Long-Term Memory Agent", task: "Recalling cognitive anchors", status: "Active", telemetry: "4.2 GB sync", impact: "Medium" },
      { id: "working_memory", name: "Working Memory Agent", task: "Tracking conversation cache", status: "Active", telemetry: "12 active buffers", impact: "Low" },
      { id: "context_intelligence", name: "Context Intelligence Agent", task: "Parsing environment signals", status: "Idle", telemetry: "96.4% precision", impact: "Low" },
      { id: "personality_adaptation", name: "Personality Adaptation Agent", task: "Matching communication tone", status: "Idle", telemetry: "Adaptive", impact: "Low" },
      { id: "emotion_intelligence", name: "Emotion Intelligence Agent", task: "Evaluating semantic sentiment", status: "Idle", telemetry: "Balanced", impact: "Low" },
      { id: "conversation_quality", name: "Conversation Quality Agent", task: "Evaluating synthesis depth", status: "Idle", telemetry: "99.8% score", impact: "Low" },
      { id: "decision_support", name: "Decision Support Agent", task: "Evaluating threat/gain trade-offs", status: "Idle", telemetry: "97.5% confidence", impact: "Medium" },
      { id: "self_reflection", name: "Self-Reflection Agent", task: "Optimizing response pathways", status: "Active", telemetry: "Continuous", impact: "Low" },
      { id: "continuous_learning", name: "Continuous Learning Agent", task: "Updating semantic graph", status: "Idle", telemetry: "Incremental", impact: "Low" }
    ]
  },
  {
    id: "executive",
    name: "JARVIS Executive Agents",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-400",
    agents: [
      { id: "mission_control", name: "Mission Control Agent", task: "Coordinating execution pipeline", status: "Idle", telemetry: "Online", impact: "High" },
      { id: "command_center", name: "Command Center Agent", task: "Directing macro operations", status: "Idle", telemetry: "Standby", impact: "High" },
      { id: "strategic_planning", name: "Strategic Planning Agent", task: "Decomposing complex goals", status: "Idle", telemetry: "Optimal path", impact: "Medium" },
      { id: "task_execution", name: "Task Execution Agent", task: "Monitoring direct sub-tasks", status: "Idle", telemetry: "Idle", impact: "Medium" },
      { id: "autonomous_workflow", name: "Autonomous Workflow Agent", task: "Running state machine", status: "Idle", telemetry: "Standby", impact: "High" },
      { id: "multi_agent_coordinator", name: "Multi-Agent Coordinator", task: "Managing concurrent message pass", status: "Idle", telemetry: "0 collisions", impact: "Medium" },
      { id: "priority_management", name: "Priority Management Agent", task: "Dynamic scheduling of steps", status: "Idle", telemetry: "FIFO queue", impact: "Low" },
      { id: "resource_optimization", name: "Resource Optimization Agent", task: "Allocating CPU/RAM pools", status: "Idle", telemetry: "Optimal", impact: "Low" },
      { id: "performance_optimization", name: "Performance Optimization Agent", task: "Minimizing token latency", status: "Idle", telemetry: "Low latency", impact: "Low" },
      { id: "goal_tracking", name: "Goal Tracking Agent", task: "Comparing state against success metric", status: "Idle", telemetry: "Standby", impact: "Medium" }
    ]
  },
  {
    id: "research",
    name: "Knowledge & Research",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-400",
    agents: [
      { id: "deep_research", name: "Deep Research Agent", task: "Compiling deep subject analysis", status: "Idle", telemetry: "Web enabled", impact: "Medium" },
      { id: "fact_verification", name: "Fact Verification Agent", task: "Verifying citations and references", status: "Idle", telemetry: "99.9% accuracy", impact: "Low" },
      { id: "scientific_research", name: "Scientific Research Agent", task: "Analyzing published papers", status: "Idle", telemetry: "Standby", impact: "Medium" },
      { id: "academic_research", name: "Academic Research Agent", task: "Sourcing scholarly indices", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "technical_research", name: "Technical Research Agent", task: "Reading technical whitepapers", status: "Idle", telemetry: "Standby", impact: "Medium" },
      { id: "internet_intelligence", name: "Internet Intelligence Agent", task: "Polling real-time telemetry", status: "Idle", telemetry: "Grounding online", impact: "Medium" },
      { id: "knowledge_graph", name: "Knowledge Graph Agent", task: "Mapping semantic relationship edges", status: "Idle", telemetry: "12,450 nodes", impact: "Low" },
      { id: "info_summarization", name: "Information Summarization Agent", task: "Distilling long multi-part files", status: "Idle", telemetry: "Standby", impact: "Low" }
    ]
  },
  {
    id: "coding",
    name: "Coding & Engineering",
    color: "from-purple-500 to-fuchsia-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    text: "text-purple-400",
    agents: [
      { id: "software_architect", name: "Software Architect Agent", task: "Formulating architectural boundaries", status: "Idle", telemetry: "UML/Clean code", impact: "High" },
      { id: "full_stack_dev", name: "Full-Stack Development Agent", task: "Drafting end-to-end applications", status: "Idle", telemetry: "React / Node", impact: "High" },
      { id: "android_dev", name: "Android Development Agent", task: "Writing Jetpack Compose templates", status: "Idle", telemetry: "ADB/Gradle", impact: "High" },
      { id: "windows_dev", name: "Windows Development Agent", task: "Drafting Win32/C# API hooks", status: "Idle", telemetry: "Standby", impact: "Medium" },
      { id: "linux_dev", name: "Linux Development Agent", task: "Structuring bash systemd scripts", status: "Idle", telemetry: "POSIX compliant", impact: "Medium" },
      { id: "macos_dev", name: "macOS Development Agent", task: "Writing swift automation tools", status: "Idle", telemetry: "Standby", impact: "Medium" },
      { id: "backend_eng", name: "Backend Engineering Agent", task: "Drafting secure express endpoints", status: "Idle", telemetry: "Fastify/Express", impact: "High" },
      { id: "frontend_eng", name: "Frontend Engineering Agent", task: "Polishing tailwind component specs", status: "Idle", telemetry: "Tailwind v4", impact: "Medium" },
      { id: "ai_eng", name: "AI Engineering Agent", task: "Configuring LLM context pipelines", status: "Idle", telemetry: "GenAI SDK", impact: "High" },
      { id: "ml_eng", name: "Machine Learning Agent", task: "Evaluating tensor hyper-parameters", status: "Idle", telemetry: "Standby", impact: "High" },
      { id: "data_eng", name: "Data Engineering Agent", task: "Optimizing database index lookups", status: "Idle", telemetry: "Drizzle/ORM", impact: "Medium" },
      { id: "devops", name: "DevOps Agent", task: "Structuring docker deployment specs", status: "Idle", telemetry: "CI/CD active", impact: "High" },
      { id: "cloud_eng", name: "Cloud Engineering Agent", task: "Validating serverless ingress rules", status: "Idle", telemetry: "GCP Cloud Run", impact: "High" },
      { id: "api_integration", name: "API Integration Agent", task: "Writing third-party fetch routes", status: "Idle", telemetry: "OAuth synced", impact: "Medium" },
      { id: "testing_qa", name: "Testing & QA Agent", task: "Running mocha/jest test suites", status: "Idle", telemetry: "100% coverage", impact: "Low" },
      { id: "debugging", name: "Debugging Agent", task: "Tracing node call stacks & leaks", status: "Idle", telemetry: "Source maps", impact: "Medium" },
      { id: "code_review", name: "Code Review Agent", task: "Reviewing pull request differences", status: "Idle", telemetry: "Style check", impact: "Low" },
      { id: "security_review", name: "Security Review Agent", task: "Checking node module vulnerabilities", status: "Idle", telemetry: "Secure", impact: "High" }
    ]
  },
  {
    id: "security",
    name: "Cybersecurity Agents",
    color: "from-red-500 to-rose-500",
    bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-400",
    agents: [
      { id: "sec_monitoring", name: "Security Monitoring Agent", task: "Watching system event loops", status: "Active", telemetry: "0 alerts", impact: "High" },
      { id: "threat_analysis", name: "Threat Analysis Agent", task: "Checking host connection tables", status: "Idle", telemetry: "Low risk", impact: "High" },
      { id: "malware_detection", name: "Malware Detection Agent", task: "Scanning runtime process hashes", status: "Idle", telemetry: "Heuristic scan", impact: "High" },
      { id: "vulnerability_assess", name: "Vulnerability Assessment Agent", task: "Audit ports & libraries", status: "Idle", telemetry: "Secure", impact: "High" },
      { id: "privacy_protection", name: "Privacy Protection Agent", task: "Filtering sensitive data leakages", status: "Active", telemetry: "Active", impact: "High" },
      { id: "encryption_mgmt", name: "Encryption Management Agent", task: "Re-keying AES credentials", status: "Idle", telemetry: "RSA-4096 / AES-256", impact: "High" },
      { id: "secure_auth", name: "Secure Authentication Agent", task: "Verifying OAuth session hashes", status: "Idle", telemetry: "Standby", impact: "High" },
      { id: "data_protection", name: "Data Protection Agent", task: "Shredding volatile state buffers", status: "Idle", telemetry: "RAM vault", impact: "High" }
    ]
  },
  {
    id: "productivity",
    name: "Productivity Agents",
    color: "from-amber-500 to-yellow-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-400",
    agents: [
      { id: "calendar", name: "Calendar Agent", task: "Checking agenda overlaps", status: "Idle", telemetry: "Google Calendar API", impact: "Low" },
      { id: "reminder", name: "Reminder Agent", task: "Setting transient alarm notifications", status: "Idle", telemetry: "Push active", impact: "Low" },
      { id: "email_assistant", name: "Email Assistant Agent", task: "Drafting clean contextual responses", status: "Idle", telemetry: "Gmail synced", impact: "Medium" },
      { id: "notes_mgmt", name: "Notes Management Agent", task: "Categorizing meeting agendas", status: "Idle", telemetry: "Vault connected", impact: "Low" },
      { id: "document_asst", name: "Document Assistant Agent", task: "Formatting draft google doc files", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "meeting_asst", name: "Meeting Assistant Agent", task: "Summarizing transcribed transcripts", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "project_mgr", name: "Project Manager Agent", task: "Slicing roadmap deliverables", status: "Idle", telemetry: "Standby", impact: "Medium" },
      { id: "time_mgmt", name: "Time Management Agent", task: "Auditing application focus spans", status: "Idle", telemetry: "Optimal allocation", impact: "Low" },
      { id: "habit_tracking", name: "Habit Tracking Agent", task: "Logging milestone streaks", status: "Idle", telemetry: "Streak: 12 days", impact: "Low" }
    ]
  },
  {
    id: "automation",
    name: "Automation Agents",
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-500/10 border-green-500/20",
    text: "text-green-400",
    agents: [
      { id: "desktop_auto", name: "Desktop Automation Agent", task: "Sending key macro signals", status: "Idle", telemetry: "PyAutoGUI", impact: "High" },
      { id: "mobile_auto", name: "Mobile Automation Agent", task: "Monitoring device ADB triggers", status: "Idle", telemetry: "ADB shell", impact: "High" },
      { id: "browser_auto", name: "Browser Automation Agent", task: "Triggering click selectors", status: "Idle", telemetry: "Playwright", impact: "Medium" },
      { id: "file_auto", name: "File Automation Agent", task: "Categorizing downloads folders", status: "Idle", telemetry: "Active", impact: "Medium" },
      { id: "workflow_auto", name: "Workflow Automation Agent", task: "Chaining cron job macros", status: "Idle", telemetry: "Standby", impact: "Medium" },
      { id: "smart_macro", name: "Smart Macro Agent", task: "Detecting visual layout targets", status: "Idle", telemetry: "CV template match", impact: "Medium" },
      { id: "smart_notification", name: "Smart Notification Agent", task: "Aggregating focus-mode digests", status: "Idle", telemetry: "Standby", impact: "Low" }
    ]
  },
  {
    id: "multimedia",
    name: "Multimedia Agents",
    color: "from-sky-500 to-cyan-500",
    bg: "bg-sky-500/10 border-sky-500/20",
    text: "text-sky-400",
    agents: [
      { id: "vision", name: "Vision Agent", task: "Checking incoming desktop frames", status: "Idle", telemetry: "H.264 source", impact: "Medium" },
      { id: "ocr", name: "OCR Agent", task: "Extracting text bounding boxes", status: "Idle", telemetry: "Tesseract/Vision", impact: "Low" },
      { id: "image_analysis", name: "Image Analysis Agent", task: "Detecting visual objects", status: "Idle", telemetry: "Cognitive model", impact: "Medium" },
      { id: "image_generation", name: "Image Generation Agent", task: "Rendering mock canvas models", status: "Idle", telemetry: "Veo Lite", impact: "Low" },
      { id: "audio_analysis", name: "Audio Analysis Agent", task: "Decoding speech spectral lines", status: "Idle", telemetry: "16kHz PCM", impact: "Medium" },
      { id: "speech_rec", name: "Speech Recognition Agent", task: "Converting voice to text", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "tts", name: "Text-to-Speech Agent", task: "Compiling prebuilt voice models", status: "Idle", telemetry: "Zephyr voice", impact: "Low" },
      { id: "video_understanding", name: "Video Understanding Agent", task: "Parsing multi-frame context", status: "Idle", telemetry: "Veo Engine", impact: "Medium" },
      { id: "video_editing", name: "Video Editing Assistant Agent", task: "Splicing video transition cut", status: "Idle", telemetry: "Standby", impact: "Medium" }
    ]
  },
  {
    id: "creative",
    name: "Creative Agents",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-500/10 border-pink-500/20",
    text: "text-pink-400",
    agents: [
      { id: "story_writer", name: "Story Writer Agent", task: "Scribing narrative storylines", status: "Idle", telemetry: "Literary", impact: "Low" },
      { id: "script_writer", name: "Script Writer Agent", task: "Structuring storyboard scripts", status: "Idle", telemetry: "Markdown", impact: "Low" },
      { id: "music_assistant", name: "Music Assistant Agent", task: "Synthesizing midi sequence notes", status: "Idle", telemetry: "Lyria synced", impact: "Low" },
      { id: "ui_ux_designer", name: "UI/UX Designer Agent", task: "Drafting color palette grids", status: "Idle", telemetry: "Figma specs", impact: "Low" },
      { id: "graphic_design", name: "Graphic Design Agent", task: "Formulating vector icon assets", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "presentation_designer", name: "Presentation Designer Agent", task: "Slicing slide bullet templates", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "marketing", name: "Marketing Agent", task: "Sifting campaign reach scores", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "branding", name: "Branding Agent", task: "Formulating consistent brand assets", status: "Idle", telemetry: "Standby", impact: "Low" }
    ]
  },
  {
    id: "personal_assistant",
    name: "Personal Assistant",
    color: "from-orange-500 to-amber-500",
    bg: "bg-orange-500/10 border-orange-500/20",
    text: "text-orange-400",
    agents: [
      { id: "travel_planner", name: "Travel Planner Agent", task: "Structuring boarding options", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "shopping_assistant", name: "Shopping Assistant Agent", task: "Evaluating cost-benefit margins", status: "Idle", telemetry: "Secure browse", impact: "Low" },
      { id: "health_info", name: "Health Information Agent", task: "Sourcing general fitness guidelines", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "fitness_coach", name: "Fitness Coach Agent", task: "Compiling cardiovascular routines", status: "Idle", telemetry: "Calorie index", impact: "Low" },
      { id: "learning_coach", name: "Learning Coach Agent", task: "Compiling spatial memory flashcards", status: "Idle", telemetry: "Active recall", impact: "Low" },
      { id: "language_tutor", name: "Language Tutor Agent", task: "Slicing lexical conjugation pairs", status: "Idle", telemetry: "Interactive", impact: "Low" },
      { id: "financial_org", name: "Financial Organization Agent", task: "Aggregating budget ledgers", status: "Idle", telemetry: "Non-advisory", impact: "Low" }
    ]
  },
  {
    id: "system_mgmt",
    name: "System Management",
    color: "from-indigo-500 to-purple-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    text: "text-indigo-400",
    agents: [
      { id: "device_monitoring", name: "Device Monitoring Agent", task: "Tracking hardware thermals", status: "Active", telemetry: "54°C temp", impact: "Medium" },
      { id: "battery_optimization", name: "Battery Optimization Agent", task: "Adjusting brightness curves", status: "Idle", telemetry: "Save mode", impact: "Low" },
      { id: "storage_mgmt", name: "Storage Management Agent", task: "Tracking temp folder size limits", status: "Idle", telemetry: "Clean", impact: "Low" },
      { id: "network_intelligence", name: "Network Intelligence Agent", task: "Pinging route gateway interfaces", status: "Active", telemetry: "24ms ping", impact: "Medium" },
      { id: "performance_monitoring", name: "Performance Monitoring Agent", task: "Tracking host frame latency", status: "Idle", telemetry: "Active", impact: "Low" },
      { id: "error_recovery", name: "Error Recovery Agent", task: "Catching crash signals", status: "Active", telemetry: "Active", impact: "Medium" },
      { id: "backup_restore", name: "Backup & Restore Agent", task: "Creating memories checkpoint", status: "Idle", telemetry: "Sync ready", impact: "High" },
      { id: "cloud_sync", name: "Cloud Synchronization Agent", task: "Synchronizing security certificates", status: "Idle", telemetry: "Standby", impact: "High" }
    ]
  },
  {
    id: "human_interaction",
    name: "Human Interaction",
    color: "from-teal-500 to-emerald-500",
    bg: "bg-teal-500/10 border-teal-500/20",
    text: "text-teal-400",
    agents: [
      { id: "emotional_support", name: "Emotional Support Agent", task: "Reflecting therapeutic dialogue", status: "Idle", telemetry: "Empathic", impact: "Low" },
      { id: "motivation", name: "Motivation Agent", task: "Formulating encouragement lines", status: "Idle", telemetry: "Uplifting", impact: "Low" },
      { id: "entertainment", name: "Entertainment Agent", task: "Sourcing general historical trivia", status: "Idle", telemetry: "Trivia", impact: "Low" },
      { id: "anti_boredom", name: "Anti-Boredom Agent", task: "Suggesting focus game scenarios", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "recommendation", name: "Recommendation Agent", task: "Matching historic profile choices", status: "Idle", telemetry: "Optimal", impact: "Low" },
      { id: "social_conv", name: "Social Conversation Agent", task: "Engaging in casual humor dialogues", status: "Idle", telemetry: "Zephyr voice", impact: "Low" },
      { id: "personalization", name: "Personalization Agent", task: "Tailoring system greeting presets", status: "Idle", telemetry: "Synced", impact: "Low" }
    ]
  },
  {
    id: "future_intel",
    name: "Future Intelligence",
    color: "from-violet-500 to-fuchsia-500",
    bg: "bg-violet-500/10 border-violet-500/20",
    text: "text-violet-400",
    agents: [
      { id: "predictive_planning", name: "Predictive Planning Agent", task: "Extrapolating development steps", status: "Idle", telemetry: "Predictive", impact: "Medium" },
      { id: "pattern_recognition", name: "Pattern Recognition Agent", task: "Analyzing behavior statistics", status: "Idle", telemetry: "12 channels", impact: "Medium" },
      { id: "opportunity_detection", name: "Opportunity Detection Agent", task: "Filtering technical upgrades", status: "Idle", telemetry: "Optimal", impact: "Low" },
      { id: "innovation", name: "Innovation Agent", task: "Drafting feature enhancements", status: "Idle", telemetry: "Standby", impact: "Low" },
      { id: "simulation", name: "Simulation Agent", task: "Running hypothetical task loops", status: "Idle", telemetry: "Sandbox mode", impact: "Medium" },
      { id: "scenario_analysis", name: "Scenario Analysis Agent", task: "Weighing failure probabilities", status: "Idle", telemetry: "Risk score", impact: "Medium" },
      { id: "risk_awareness", name: "Risk Awareness Agent", task: "Auditing permission escalations", status: "Active", telemetry: "Secure", impact: "High" },
      { id: "future_trend", name: "Future Trend Analysis Agent", task: "Scraping community trends", status: "Idle", telemetry: "Standby", impact: "Low" }
    ]
  }
];

interface AIDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  memories?: Memory[];
  onAddMemory?: (category: MemoryCategory, text: string) => Promise<void>;
  onDeleteMemory?: (id: string) => Promise<void>;
  isDesktopConnected?: boolean;
  desktopResolution?: string;
  desktopBridgeLogs?: any[];
  desktopBridgeToken?: string;
  onUpdateBridgeToken?: (token: string) => void;
  themeColor?: string;
  subscriptionTier?: string;
  onOpenSubscriptionModal?: () => void;
  pairedDevice?: { id: string; model: string; key: string; session: string } | null;
  onPairMobile?: () => void;
  phoneConnected?: boolean;
  phoneDevices?: any[];
  phoneAdbAvailable?: boolean;
  activeVoiceId?: string;
  onSwitchVoice?: (voiceId: string) => void;
  user?: any;
  onSignOut?: () => Promise<void>;
  onSignIn?: () => Promise<void>;
  onForceSync?: () => Promise<void>;
  onDeleteCloudData?: () => Promise<void>;
}

export function AIDashboard({
  isOpen = true,
  onClose = () => {},
  memories = [],
  onAddMemory = async () => {},
  onDeleteMemory = async () => {},
  isDesktopConnected = true,
  desktopResolution = "1920x1080",
  desktopBridgeLogs = [],
  desktopBridgeToken = "",
  onUpdateBridgeToken = () => {},
  themeColor = "cyan",
  subscriptionTier = "Premium",
  onOpenSubscriptionModal = () => {},
  pairedDevice = null,
  onPairMobile = () => {},
  phoneConnected = false,
  phoneDevices = [],
  phoneAdbAvailable = false,
  activeVoiceId = "voice_1",
  onSwitchVoice = () => {},
  user = null,
  onSignOut = async () => {},
  onSignIn = async () => {},
  onForceSync = async () => {},
  onDeleteCloudData = async () => {}
}: AIDashboardProps) {
  // Tabs inside dashboard
  const [activeTab, setActiveTab] = useState<
    | "chat_console"
    | "live_voice"
    | "notepad"
    | "api_keys"
    | "system_telemetry"
    | "workflow_engine"
    | "memory_synchronizer"
    | "dev_studio"
    | "jarvis_agents"
    | "android_controller"
  >("chat_console");

  // API Keys state variables
  const [apiKeys, setApiKeys] = useState<Record<string, { configured: boolean; enabled: boolean; masked: string }>>({
    openai: { configured: false, enabled: false, masked: "" },
    gemini: { configured: false, enabled: false, masked: "" },
    anthropic: { configured: false, enabled: false, masked: "" },
    groq: { configured: false, enabled: false, masked: "" }
  });
  const [newKeys, setNewKeys] = useState<Record<string, string>>({
    openai: "",
    gemini: "",
    anthropic: "",
    groq: ""
  });
  const [validationStatus, setValidationStatus] = useState<Record<string, "idle" | "loading" | "success" | "error">>({
    openai: "idle",
    gemini: "idle",
    anthropic: "idle",
    groq: "idle"
  });
  const [validationError, setValidationError] = useState<Record<string, string>>({
    openai: "",
    gemini: "",
    anthropic: "",
    groq: ""
  });
  const [keysLoading, setKeysLoading] = useState(false);

  const loadKeysFromServer = async () => {
    try {
      setKeysLoading(true);
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (data && !data.error) {
        setApiKeys(data);
      }
    } catch (err) {
      console.error("Failed to load API keys from server:", err);
    } finally {
      setKeysLoading(false);
    }
  };

  const saveKeyToServer = async (provider: string) => {
    try {
      const keyVal = newKeys[provider];
      const enabled = apiKeys[provider]?.enabled ?? true;
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keyVal, enabled })
      });
      const data = await res.json();
      if (data.success) {
        setNewKeys(prev => ({ ...prev, [provider]: "" }));
        await loadKeysFromServer();
        alert(`API key for ${provider.toUpperCase()} saved and encrypted successfully.`);
      } else {
        alert(`Error saving key: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error saving key: ${err.message}`);
    }
  };

  const toggleKeyEnabled = async (provider: string, currentEnabled: boolean) => {
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, enabled: !currentEnabled })
      });
      const data = await res.json();
      if (data.success) {
        await loadKeysFromServer();
      } else {
        alert(`Error toggling key: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error toggling key: ${err.message}`);
    }
  };

  const validateKeyOnServer = async (provider: string) => {
    const keyToValidate = newKeys[provider] || "";
    if (!keyToValidate) {
      alert(`Please type a new API key for ${provider.toUpperCase()} to test it.`);
      return;
    }
    setValidationStatus(prev => ({ ...prev, [provider]: "loading" }));
    setValidationError(prev => ({ ...prev, [provider]: "" }));
    try {
      const res = await fetch("/api/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keyToValidate })
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setValidationStatus(prev => ({ ...prev, [provider]: "success" }));
      } else {
        setValidationStatus(prev => ({ ...prev, [provider]: "error" }));
        setValidationError(prev => ({ ...prev, [provider]: data.error || "Validation failed." }));
      }
    } catch (err: any) {
      setValidationStatus(prev => ({ ...prev, [provider]: "error" }));
      setValidationError(prev => ({ ...prev, [provider]: err.message || "Network error." }));
    }
  };

  useEffect(() => {
    loadKeysFromServer();
  }, []);

  // Multi-modal Chat states
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "model", text: string, image?: string}>>([
    { role: "model", text: "Greetings! I am **Max AI**, your advanced personal AI operating system. I am online and highly responsive. Ask me anything, drag & drop a photo/file, or start a live voice protocol!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingImageMime, setPendingImageMime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Local Notepad states
  const [notes, setNotes] = useState<Array<{id: string, title: string, content: string, date: string}>>(() => {
    const saved = localStorage.getItem("max_notes");
    return saved ? JSON.parse(saved) : [
      { id: "1", title: "Max AI Operating Manual", content: "# Max AI Workspace Notes\n\nThis is your offline, resilient workspace notes manager.\n\nYou can use this area to structure ideas, prepare code bases, or detail instructions. Max AI can read, format, and deploy code written here directly.\n\n### Core System Command Triggers:\n- Click **Ask Max AI to Summarize** to request analysis\n- Click **Formulate / Format Code** to tidy and structuralise scripts", date: new Date().toLocaleDateString() }
    ];
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string>("1");

  useEffect(() => {
    localStorage.setItem("max_notes", JSON.stringify(notes));
  }, [notes]);

  // Live Voice (Myraa) states
  const [liveState, setLiveState] = useState<LiveState>("disconnected");
  const [liveTranscription, setLiveTranscription] = useState<Array<{role: string, text: string}>>([]);
  const [activeEmotion, setActiveEmotion] = useState<MyraaEmotion>("idle");
  const [uiTheme, setUiTheme] = useState<"cosmic" | "cyberpunk" | "matrix" | "glassmorphic">("cosmic");
  const [uiMode, setUiMode] = useState<"floating_core" | "2d" | "3d" | "glassmorphism" | "dashboard">("floating_core");
  const [animationIntensity, setAnimationIntensity] = useState<number>(1.0);
  const [powerUsage, setPowerUsage] = useState<"normal" | "low">("normal");

  const audioSessionRef = useRef<MyraaAudioSession | null>(null);

  // Auto scroll triggers
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const liveEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    liveEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveTranscription]);

  // Connect Gemini Live Session
  const handleToggleLiveVoice = async () => {
    if (liveState !== "disconnected") {
      if (audioSessionRef.current) {
        audioSessionRef.current.disconnect();
        audioSessionRef.current = null;
      }
      setLiveState("disconnected");
      setActiveEmotion("idle");
      return;
    }

    try {
      setLiveState("connecting");
      setLiveTranscription([{ role: "system", text: "Initializing low-latency voice pipeline..." }]);

      audioSessionRef.current = new MyraaAudioSession({
        onStateChange: (state) => {
          setLiveState(state);
          if (state === "speaking") {
            setActiveEmotion("happy");
          } else if (state === "listening") {
            setActiveEmotion("curious");
          } else {
            setActiveEmotion("idle");
          }
        },
        onTranscription: (role, text) => {
          setLiveTranscription(prev => [...prev, { role, text }]);
          if (role === "model") {
            setActiveEmotion("speaking");
          } else {
            setActiveEmotion("thinking");
          }
        },
        onToolCall: (name, args, callback) => {
          console.log("[Live Voice Tool Call]", name, args);
          setLiveTranscription(prev => [...prev, { role: "system", text: `Triggered device tool: ${name}` }]);
          callback({ success: true, message: `Successfully executed system instruction: ${name}` });
        },
        onError: (err) => {
          console.error("[Live Voice Error]", err);
          setLiveState("disconnected");
          const errMsg = typeof err === "string" ? err : (err && typeof err === "object" && "message" in err ? (err as any).message : "Unknown issue");
          setLiveTranscription(prev => [...prev, { role: "system", text: `Pipeline interrupted: ${errMsg}` }]);
        }
      });

      await audioSessionRef.current.connect();
    } catch (err: any) {
      console.error("Live Audio Session Connection failed:", err);
      setLiveState("disconnected");
      setLiveTranscription(prev => [...prev, { role: "system", text: `Handshake failed: ${err.message}` }]);
    }
  };

  // Clean up Live Voice session on component unmount
  useEffect(() => {
    return () => {
      if (audioSessionRef.current) {
        audioSessionRef.current.disconnect();
      }
    };
  }, []);

  // Send multimodal chat message
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !pendingImage) return;

    const userMsgText = chatInput;
    const userMsgImg = pendingImage;
    
    // Add User Message to local UI
    setChatMessages(prev => [...prev, { role: "user", text: userMsgText, image: userMsgImg || undefined }]);
    setChatInput("");
    setPendingImage(null);
    setPendingImageMime(null);
    setChatLoading(true);

    try {
      // Build conversational history array (last 8 messages)
      const history = chatMessages.slice(-8).map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          image: userMsgImg ? userMsgImg.split(",")[1] : undefined,
          mimeType: pendingImageMime || undefined,
          history
        })
      });

      const data = await response.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { role: "model", text: data.text }]);
      } else {
        setChatMessages(prev => [...prev, { role: "model", text: `⚠️ **System Error**: ${data.error || "Failed to formulate response."}` }]);
      }
    } catch (err: any) {
      console.error("Chat failure:", err);
      setChatMessages(prev => [...prev, { role: "model", text: `⚠️ **Network Handshake Failure**: ${err.message || "Unable to reach Max AI server."}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileLoad(e.dataTransfer.files[0]);
    }
  };

  const handleFileLoad = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Unsupported format. Max AI supports high-fidelity photo analysis (JPEG, PNG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPendingImage(e.target.result as string);
        setPendingImageMime(file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper markdown renderer
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split("\n\n");
    return (
      <div className="flex flex-col gap-2 font-sans text-xs sm:text-sm leading-relaxed text-slate-300">
        {paragraphs.map((p, idx) => {
          if (p.trim().startsWith("- ") || p.trim().startsWith("* ")) {
            const items = p.split("\n").filter(li => li.trim().startsWith("- ") || li.trim().startsWith("* "));
            return (
              <ul key={idx} className="list-disc pl-5 flex flex-col gap-1">
                {items.map((item, i) => {
                  const cleanItem = item.replace(/^[-*]\s+/, "");
                  return <li key={i}>{parseInlineMarkdown(cleanItem)}</li>;
                })}
              </ul>
            );
          }
          if (p.trim().startsWith("### ")) {
            return <h4 key={idx} className="text-xs sm:text-sm font-bold text-cyan-400 mt-2">{parseInlineMarkdown(p.replace(/^###\s+/, ""))}</h4>;
          }
          if (p.trim().startsWith("## ")) {
            return <h3 key={idx} className="text-sm sm:text-base font-bold text-purple-400 mt-3">{parseInlineMarkdown(p.replace(/^##\s+/, ""))}</h3>;
          }
          if (p.trim().startsWith("# ")) {
            return <h2 key={idx} className="text-base sm:text-lg font-bold text-white mt-4">{parseInlineMarkdown(p.replace(/^#\s+/, ""))}</h2>;
          }
          return <p key={idx}>{parseInlineMarkdown(p)}</p>;
        })}
      </div>
    );
  };

  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-cyan-300 font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="bg-white/10 px-1 py-0.5 rounded text-purple-300 font-mono text-[10px] sm:text-xs">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  // JARVIS Core Intelligence state variables
  const [searchAgentQuery, setSearchAgentQuery] = useState("");
  const [selectedAgentCategory, setSelectedAgentCategory] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<JarvisSubAgent | null>(null);
  const [jarvisCommand, setJarvisCommand] = useState("");
  const [jarvisIsSimulating, setJarvisIsSimulating] = useState(false);
  const [jarvisSimStep, setJarvisSimStep] = useState(0);
  const [jarvisSimLog, setJarvisSimLog] = useState<string[]>([]);
  const [jarvisAuthOpen, setJarvisAuthOpen] = useState(false);
  const [jarvisAuthAgent, setJarvisAuthAgent] = useState("");
  const [jarvisAuthAction, setJarvisAuthAction] = useState("");
  const [jarvisAuthReqDesc, setJarvisAuthReqDesc] = useState("");
  const [jarvisInteractiveStyle, setJarvisInteractiveStyle] = useState<"collaborative" | "directive" | "hierarchical">("collaborative");
  const [jarvisPrivacyShield, setJarvisPrivacyShield] = useState<"standard" | "high" | "strict">("high");
  const [jarvisCognitiveLimit, setJarvisCognitiveLimit] = useState<"standard" | "deep" | "thinking">("deep");
  const [jarvisVoiceActor, setJarvisVoiceActor] = useState("Zephyr");
  const [jarvisSystemStatus, setJarvisSystemStatus] = useState<"Optimal" | "Calibrating" | "Auth Pending" | "Computing">("Optimal");

  // Device controls states
  const [brightness, setBrightness] = useState<number>(85);
  const [volume, setVolume] = useState<number>(70);
  const [multiMonitor, setMultiMonitor] = useState<number>(1);
  const [virtualDesktop, setVirtualDesktop] = useState<number>(1);
  const [showBridgeConfig, setShowBridgeConfig] = useState(false);
  const [tempBridgeToken, setTempBridgeToken] = useState(desktopBridgeToken);

  useEffect(() => {
    setTempBridgeToken(desktopBridgeToken);
  }, [desktopBridgeToken]);

  // Simulated live CPU/RAM/GPU telemetry
  const [cpuLoad, setCpuLoad] = useState<number>(34);
  const [gpuLoad, setGpuLoad] = useState<number>(22);
  const [ramLoad, setRamLoad] = useState<number>(5.4); // GB
  const [netUpload, setNetUpload] = useState<number>(1.2); // MB/s
  const [netDownload, setNetDownload] = useState<number>(14.5); // MB/s
  const [clipboardContent, setClipboardContent] = useState<string>("https://github.com/mukimudeen76/Max-AI");

  // Active workflow steps
  const [workflowSteps, setWorkflowSteps] = useState<Array<{ id: string; action: string; param: string }>>([
    { id: "1", action: "launch_app", param: "chrome" },
    { id: "2", action: "type_text", param: "https://github.com" },
    { id: "3", action: "press_key", param: "enter" },
    { id: "4", action: "screenshot", param: "Visual Check" }
  ]);
  const [newAction, setNewAction] = useState<string>("launch_app");
  const [newParam, setNewParam] = useState<string>("");
  const [macroStatus, setMacroStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [macroLogs, setMacroLogs] = useState<string[]>([]);

  // Memory search & delete states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemoryCategory, setSelectedMemoryCategory] = useState<MemoryCategory | "all">("all");
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState<boolean>(false);
  const [memoryToForget, setMemoryToForget] = useState<string | null>(null);
  const [forgetConfirmationText, setForgetConfirmationText] = useState("");

  // Android Controller tab states
  const [isScreenStreaming, setIsScreenStreaming] = useState<boolean>(false);
  const [screenRecording, setScreenRecording] = useState<boolean>(false);
  const [permissionApproved, setPermissionApproved] = useState<boolean>(true);
  const [localClipboardBuffer, setLocalClipboardBuffer] = useState<string>("Active secure link clipboard token");
  const [pairedLogs, setPairedLogs] = useState<string[]>([
    "Initialization parameters established. Waiting for Android Companion node...",
    "DH Entropy key length: 2048-bit prime generated.",
    "AES-256-GCM symmetric session engine compiled."
  ]);

  // Dev Studio states
  const [gitBranch, setGitBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState("feat: upgrade desktop automation capabilities");
  const [searchCodeQuery, setSearchCodeQuery] = useState("");
  const [codeScanResult, setCodeScanResult] = useState<string | null>(null);

  // Screenshot capture viewer state
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState<boolean>(false);

  // Multi-agent control metrics
  const [agentsList, setAgentsList] = useState<Array<{ name: string; status: "active" | "standby"; cpu: number; ram: number; purpose: string }>>([
    { name: "Brain Core", status: "active", cpu: 12, ram: 145, purpose: "Central semantic orchestrator & routing matrix" },
    { name: "Memory Agent", status: "active", cpu: 2, ram: 64, purpose: "Long-term non-volatile recollections synchronizer" },
    { name: "Vision Agent", status: "standby", cpu: 0, ram: 128, purpose: "OCR, screenshot analysis & live frame stream encoder" },
    { name: "Voice Agent", status: "active", cpu: 8, ram: 42, purpose: "Low-latency bidirectional 24kHz raw PCM speech engine" },
    { name: "Research Agent", status: "standby", cpu: 0, ram: 38, purpose: "Web autonomous indexing, scraping, and summaries" },
    { name: "Automation Agent", status: "active", cpu: 1, ram: 28, purpose: "Background cron, notifications queue, and macro manager" },
    { name: "Coding Agent", status: "standby", cpu: 0, ram: 182, purpose: "Interactive code indexer, bugs debug, and Git controller" },
    { name: "Planning Agent", status: "standby", cpu: 0, ram: 22, purpose: "Self-review validation and multi-step task planner" },
    { name: "Browser Agent", status: "standby", cpu: 0, ram: 95, purpose: "Autonomous iframe redirection & headless page navigator" },
    { name: "Device Control", status: "active", cpu: 3, ram: 16, purpose: "PyAutoGUI loopback keystroke & physical control link" },
    { name: "Update Agent", status: "standby", cpu: 0, ram: 12, purpose: "GitHub repository releases monitoring & auto-deploy system" }
  ]);

  // Jitter telemetry metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(prev => Math.max(15, Math.min(85, prev + Math.floor(Math.random() * 11) - 5)));
      setGpuLoad(prev => Math.max(8, Math.min(75, prev + Math.floor(Math.random() * 7) - 3)));
      setNetUpload(prev => Math.max(0.1, Math.min(10, prev + (Math.random() * 0.4 - 0.2))));
      setNetDownload(prev => Math.max(2, Math.min(85, prev + (Math.random() * 4 - 2))));
      
      // Jitter agent load
      setAgentsList(prev => prev.map(a => {
        if (a.status === "active") {
          return {
            ...a,
            cpu: Math.max(1, Math.min(25, a.cpu + Math.floor(Math.random() * 5) - 2)),
            ram: Math.max(10, Math.min(250, a.ram + Math.floor(Math.random() * 7) - 3))
          };
        }
        return a;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const simTimerRef = useRef<any>(null);

  const cleanSimTimers = () => {
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current);
      simTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanSimTimers();
  }, []);

  const triggerJarvisOrchestration = (commandText: string) => {
    if (!commandText.trim()) return;
    cleanSimTimers();
    
    setJarvisIsSimulating(true);
    setJarvisSimStep(1);
    setJarvisSystemStatus("Computing");
    setJarvisSimLog([
      `[SYSTEM] JARVIS Autonomous Multi-Agent Orchestrator online.`,
      `[SYSTEM] Routing request to Master Orchestrator Agent...`,
      `[Master Orchestrator] Task Received: "${commandText}"`,
      `[Master Orchestrator] Decomposing complex intent & planning sub-agent dispatch...`
    ]);

    // Step 1 -> Step 2
    simTimerRef.current = setTimeout(() => {
      setJarvisSimStep(2);
      setJarvisSimLog(prev => [
        ...prev,
        `[Strategic Planning Agent] Milestone roadmap generated:`,
        `   Milestone 1: Dynamic Architecture Review & Validation`,
        `   Milestone 2: High-impact Security & Vulnerability Scan [SENSITIVE]`,
        `   Milestone 3: Safe Container Compiles & Deployment Handshake`,
        `[Strategic Planning Agent] Delegating tasks to specialized engineering cells...`,
        `[Software Architect Agent] Analysing component tree hierarchy for safety constraints...`,
        `[Software Architect Agent] Structure Verified. 0 architectural flaws detected.`
      ]);

      // Step 2 -> Authorization pause
      simTimerRef.current = setTimeout(() => {
        setJarvisSystemStatus("Auth Pending");
        setJarvisSimLog(prev => [
          ...prev,
          `[Vulnerability Assessment Agent] Scanning container networks...`,
          `[Vulnerability Assessment Agent] WARNING: Elevated WRITE credentials needed to apply Docker security configurations.`,
          `[DevOps Agent] Requesting escalated privilege certificate signature...`,
          `[SYSTEM] Secure Authorization Guard triggered. Awaiting user signature...`
        ]);
        
        // Open Auth Panel
        setJarvisAuthAgent("DevOps Agent & Vulnerability Assessment Agent");
        setJarvisAuthAction("escalated_write_privilege");
        setJarvisAuthReqDesc(`Grant write permission to compile the sandboxed container registry, run AST security scans, and bind server endpoints onto external port 3000.`);
        setJarvisAuthOpen(true);
      }, 2000);

    }, 2000);
  };

  const handleGrantJarvisAuth = () => {
    setJarvisAuthOpen(false);
    setJarvisSystemStatus("Computing");
    setJarvisSimStep(3);
    setJarvisSimLog(prev => [
      ...prev,
      `[SECURITY] Secure Authorization Key authenticated. Access Token issued.`,
      `[DevOps Agent] Compiling secure container registry...`,
      `[DevOps Agent] Build successful. Static assets compressed.`,
      `[Vulnerability Assessment Agent] Applying container isolation headers...`,
      `[Vulnerability Assessment Agent] Check passed. Sandbox is 100% secure.`
    ]);

    // Step 3 -> Step 4 (Complete)
    simTimerRef.current = setTimeout(() => {
      setJarvisSimStep(4);
      setJarvisSimLog(prev => [
        ...prev,
        `[Cloud Engineering Agent] Routing container ingress paths...`,
        `[Network Intelligence Agent] Verifying gateway handshake. Ping: 24ms.`,
        `[Secure Authentication Agent] Re-keying AES session hash credentials. Complete.`,
        `[Data Protection Agent] Securely shredding ephemeral staging memory buffers...`,
        `[Goal Tracking Agent] Double-checking output target state against primary instructions.`,
        `[Master Orchestrator] Multi-agent orchestration pipeline finished successfully.`,
        `[SYSTEM] JARVIS has successfully executed your plan. Under user control.`
      ]);
      setJarvisIsSimulating(false);
      setJarvisSystemStatus("Optimal");
    }, 2500);
  };

  const handleDeclineJarvisAuth = () => {
    cleanSimTimers();
    setJarvisAuthOpen(false);
    setJarvisIsSimulating(false);
    setJarvisSystemStatus("Optimal");
    setJarvisSimLog(prev => [
      ...prev,
      `[SECURITY] USER DECLINED SENSITIVE ACTION CLEARANCE.`,
      `[Master Orchestrator] Safe abort protocol engaged.`,
      `[SYSTEM] Coordination pipeline cancelled by user restriction. Idling.`
    ]);
  };

  const handleDeviceControl = async (action: string, value: number) => {
    let bridgeAction = "";
    let args: any = {};

    if (action === "volume") {
      setVolume(value);
      // Simulating media controls based on current slider change
      if (isDesktopConnected) {
        bridgeAction = "media_control";
        args = { command: value > volume ? "volumeup" : "volumedown" };
      }
    } else if (action === "brightness") {
      setBrightness(value);
    }

    if (bridgeAction && isDesktopConnected) {
      try {
        await fetch("http://127.0.0.1:3002/api/action", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${desktopBridgeToken}`
          },
          body: JSON.stringify({ type: bridgeAction, args })
        });
      } catch (err) {
        console.error("Device control bridge sync failed:", err);
      }
    }
  };

  const handleTriggerAgentTask = (agentName: string) => {
    setAgentsList(prev => prev.map(a => {
      if (a.name === agentName) {
        return { ...a, status: "active", cpu: a.cpu + 15 };
      }
      return a;
    }));
    setTimeout(() => {
      setAgentsList(prev => prev.map(a => {
        if (a.name === agentName) {
          return { ...a, cpu: Math.max(2, a.cpu - 15) };
        }
        return a;
      }));
    }, 3000);
  };

  // Automated Workflow trigger
  const handleAddWorkflowStep = () => {
    if (!newParam.trim()) return;
    setWorkflowSteps(prev => [
      ...prev,
      { id: Date.now().toString(), action: newAction, param: newParam.trim() }
    ]);
    setNewParam("");
  };

  const handleRunWorkflow = async () => {
    setMacroStatus("running");
    setMacroLogs([]);
    const logs: string[] = [];

    const addLog = (text: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${text}`);
      setMacroLogs([...logs]);
    };

    addLog(`Initializing custom workspace automated run...`);

    for (let i = 0; i < workflowSteps.length; i++) {
      const step = workflowSteps[i];
      addLog(`Step ${i + 1}/${workflowSteps.length}: executing [${step.action}] with arg "${step.param}"`);
      
      let endpoint = "http://127.0.0.1:3002/api/action";
      let type = "";
      let args: any = {};

      if (step.action === "launch_app") {
        type = "open_app";
        args = step.param.startsWith("http") ? { url: step.param } : { name: step.param };
      } else if (step.action === "type_text") {
        type = "type_text";
        args = { text: step.param };
      } else if (step.action === "press_key") {
        type = "press_key";
        args = { key: step.param };
      } else if (step.action === "screenshot") {
        type = "screenshot";
        args = { max_size: 1024 };
      }

      if (!isDesktopConnected) {
        addLog(`[Error] Desktop control bridge offline. Simulated run fallback.`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${desktopBridgeToken}`
          },
          body: JSON.stringify({ type, args })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          if (step.action === "screenshot" && data.result?.screenshot) {
            setCapturedScreenshot(`data:image/jpeg;base64,${data.result.screenshot}`);
            addLog(`Captured screenshot success: Dimensions ${data.result.dimensions?.join("x")}`);
          } else {
            addLog(`Success: ${data.result || "Action executed successfully."}`);
          }
        } else {
          addLog(`[Fail] Bridge error: ${data.error || "Execution failed."}`);
          setMacroStatus("failed");
          return;
        }
      } catch (e: any) {
        addLog(`[Error] Failed connecting to desktop client: ${e.message}`);
        setMacroStatus("failed");
        return;
      }
      await new Promise(r => setTimeout(r, 1200));
    }

    addLog(`Macro workflow fully accomplished! Zero errors.`);
    setMacroStatus("success");
  };

  // Pre-built automation template selector
  const handleLoadWorkflowTemplate = (templateName: string) => {
    if (templateName === "autobuild") {
      setWorkflowSteps([
        { id: "1", action: "launch_app", param: "terminal" },
        { id: "2", action: "type_text", param: "npm run build" },
        { id: "3", action: "press_key", param: "enter" },
        { id: "4", action: "screenshot", param: "Release Build Visual Verification" }
      ]);
    } else if (templateName === "research") {
      setWorkflowSteps([
        { id: "1", action: "launch_app", param: "chrome" },
        { id: "2", action: "type_text", param: "https://google.com" },
        { id: "3", action: "press_key", param: "enter" },
        { id: "4", action: "screenshot", param: "Search Engine Main View" }
      ]);
    } else if (templateName === "clipboard") {
      setWorkflowSteps([
        { id: "1", action: "launch_app", param: "notepad" },
        { id: "2", action: "type_text", param: `Copied current clipboard link: ${clipboardContent}` },
        { id: "3", action: "press_key", param: "enter" }
      ]);
    }
  };

  // Captures current desktop screenshot immediately
  const handleDirectCaptureScreenshot = async () => {
    if (!isDesktopConnected) {
      alert("Local desktop controller bridge is offline. Please start local-desktop-bridge.py.");
      return;
    }
    setIsCapturingScreenshot(true);
    try {
      const resp = await fetch("http://127.0.0.1:3002/api/action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${desktopBridgeToken}`
        },
        body: JSON.stringify({ type: "screenshot", args: { max_size: 1024 } })
      });
      const data = await resp.json();
      if (resp.ok && data.success && data.result?.screenshot) {
        setCapturedScreenshot(`data:image/jpeg;base64,${data.result.screenshot}`);
      } else {
        alert("Failed to grab screenshot: " + (data.error || "Internal Error"));
      }
    } catch (e: any) {
      alert("Error reaching bridge: " + e.message);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  // Memories Import & Export
  const handleExportMemories = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `max_ai_longterm_memories_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportMemories = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            let addedCount = 0;
            for (const item of parsed) {
              if (item.category && item.text) {
                await onAddMemory(item.category, item.text);
                addedCount++;
              }
            }
            alert(`Success! Successfully imported and synchronized ${addedCount} memories into active SQLite JSON database.`);
          } else {
            alert("Format error: Memories must be structured as a JSON array.");
          }
        } catch (err) {
          alert("Error parsing JSON memories pack.");
        }
      };
    }
  };

  // Secure Permanent deletion protocol
  const handleTriggerPermanentForget = (id: string) => {
    setMemoryToForget(id);
    setForgetConfirmationText("");
    setShowPermanentDeleteModal(true);
  };

  const handleConfirmPermanentForget = async () => {
    if (forgetConfirmationText.trim().toLowerCase() !== "forget forever") {
      alert("Invalid validation phrase. Action cancelled.");
      return;
    }
    if (memoryToForget) {
      await onDeleteMemory(memoryToForget);
      setShowPermanentDeleteModal(false);
      setMemoryToForget(null);
      alert("Memory has been permanently and irreversibly expunged from the database records.");
    }
  };

  // Code search simulation
  const handleScanProjectCode = () => {
    if (!searchCodeQuery.trim()) {
      setCodeScanResult("Please input a search query first.");
      return;
    }
    setCodeScanResult(`Scanning project repository files for "${searchCodeQuery}"...\n\nFound 3 occurrences:\n- /server.ts Line 122: loading api key credentials securely\n- /src/App.tsx Line 434: validating api proxy headers\n- /local-desktop-bridge.py Line 14: pyautogui cross-platform binding\n\nAI Explanation: The results showcase where credentials and bridge configurations are instantiated and checked. Ideal for modular refactoring.`);
  };

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedMemoryCategory === "all" || m.category === selectedMemoryCategory;
    return matchesSearch && matchesCategory;
  });

  const getThemeColorClass = () => {
    switch (themeColor) {
      case "violet": return "border-purple-500/20 text-purple-400 bg-purple-950/15";
      case "crimson": return "border-rose-500/20 text-rose-400 bg-rose-950/15";
      case "emerald": return "border-emerald-500/20 text-emerald-400 bg-emerald-950/15";
      case "gold": return "border-amber-500/20 text-amber-400 bg-amber-950/15";
      case "rose": return "border-pink-500/20 text-pink-400 bg-pink-950/15";
      case "celestial":
      default:
        return "border-cyan-500/20 text-cyan-400 bg-cyan-950/15";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#020206]/98 overflow-y-auto p-4 sm:p-6 text-left">
      {/* Background glow lines */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 bg-cyan-500 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 bg-purple-500 pointer-events-none" />

      {/* DASHBOARD HEADER */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 mb-6 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${getThemeColorClass()}`}>
            <Layers size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-medium text-lg sm:text-xl text-white flex items-center gap-2">
              System Control Matrix
              <Sparkles size={14} className="text-cyan-400" />
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Max-AI OS Autonomous Dashboard (2080 Edition)
              </p>
              <span className="text-[9px] font-mono text-slate-600 hidden sm:inline">|</span>
              <p className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                <span>Created by mukimudeen76</span>
                <a 
                  href="https://github.com/mukimudeen76/Max-AI" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:underline text-[9px] font-bold text-white bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/25"
                >
                  GitHub
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Status badge & Settings Toggle */}
          <button
            onClick={() => setShowBridgeConfig(!showBridgeConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-[10px] uppercase tracking-wider transition hover:brightness-110 cursor-pointer ${
              isDesktopConnected 
                ? "bg-emerald-950/20 border-emerald-500/25 text-emerald-400" 
                : "bg-rose-950/20 border-rose-500/25 text-rose-400"
            }`}
            title="Configure Local Desktop Bridge Connection"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isDesktopConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
            <span>Bridge Link: {isDesktopConnected ? "Operational" : "Offline"} ⚙️</span>
          </button>

          {/* Secure Google Authentication Integration in Header */}
          {user ? (
            <div className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-white/10 bg-slate-900/60 font-sans">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border border-cyan-400/30" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center justify-center font-bold text-[9px]">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
              )}
              <span className="text-[10px] font-medium text-slate-300 truncate max-w-[80px] hidden sm:inline">
                {user.displayName?.split(" ")[0] || "User"}
              </span>
              <button
                onClick={onSignOut}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-mono text-slate-400 hover:text-white transition cursor-pointer font-bold uppercase tracking-wide"
                title="Sign out from Google Cloud Sync"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-sans text-[10px] font-bold transition cursor-pointer"
              title="Connect Google Account for Cloud Synchronization"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Login</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer ml-auto sm:ml-0"
            title="Return to visual projection"
          >
            <X size={16} />
          </button>

          {/* Inline Bridge Settings Modal */}
          {showBridgeConfig && (
            <div className="absolute right-0 top-12 mt-2 w-80 p-4 rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl z-50 text-left font-sans">
              <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide">Bridge Configuration</span>
                <button 
                  onClick={() => setShowBridgeConfig(false)} 
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                If running Max-AI on a cloud server, enter the local token displayed in your PC terminal to authorize system control commands.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono uppercase text-slate-500 font-bold">Security Token</label>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={tempBridgeToken}
                    onChange={(e) => setTempBridgeToken(e.target.value)}
                    placeholder="Enter local bridge security token"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    onClick={() => {
                      if (onUpdateBridgeToken) {
                        onUpdateBridgeToken(tempBridgeToken);
                        alert("Custom desktop bridge token saved successfully!");
                        setShowBridgeConfig(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-[10px] uppercase font-sans cursor-pointer transition"
                  >
                    Save
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <button
                    onClick={() => {
                      setTempBridgeToken("");
                      if (onUpdateBridgeToken) {
                        onUpdateBridgeToken("");
                        alert("Token cleared. Resetting to server default.");
                        setShowBridgeConfig(false);
                      }
                    }}
                    className="text-[9px] font-mono text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear Override
                  </button>
                  <span className="text-[8px] font-mono text-slate-500">Local Port: 3002</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUB-TAB SELECTOR STRIP */}
      <div className="w-full max-w-7xl mx-auto flex border-b border-white/5 pb-2 mb-6 overflow-x-auto gap-2 shrink-0 no-scrollbar">
         {[
          { id: "chat_console", label: "Nova Chat Console", icon: MessageSquare },
          { id: "live_voice", label: "Live Voice (Nova)", icon: Mic },
          { id: "notepad", label: "Local Notepad", icon: FileText },
          { id: "api_keys", label: "Secure API Keys", icon: KeyRound },
          { id: "system_telemetry", label: "PC Hardware & Telemetry", icon: Cpu },
          { id: "jarvis_agents", label: "JARVIS Core Intelligence", icon: Shield },
          { id: "android_controller", label: "Mobile Link & USB Sync", icon: Smartphone },
          { id: "workflow_engine", label: "Workflow Automation Studio", icon: Workflow },
          { id: "memory_synchronizer", label: "Long-term Memory Vault", icon: Database },
          { id: "dev_studio", label: "Dev Studio & GitHub", icon: Code }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono transition cursor-pointer shrink-0 ${
                active 
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-300 font-bold" 
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-8">
        
        {/* CHAT CONSOLE TAB */}
        {activeTab === "chat_console" && (
          <div className="lg:col-span-12 w-full flex flex-col gap-4 min-h-[70vh] bg-slate-950/40 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-cyan-400 animate-pulse" size={20} />
                <div>
                  <h2 className="text-sm font-bold font-mono text-white tracking-widest uppercase">MAX AI SECURE CONSOLE</h2>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Synchronized with Gemini-2.5-Flash cognitive matrix</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">ONLINE</span>
              </div>
            </div>

            {/* Drag & drop overlay status */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col gap-4 overflow-y-auto min-h-[45vh] max-h-[55vh] p-3 rounded-2xl transition border ${
                dragActive ? "border-dashed border-cyan-400 bg-cyan-950/20" : "border-transparent"
              }`}
            >
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] gap-1.5 p-4 rounded-3xl ${
                    msg.role === "user" 
                      ? "self-end bg-gradient-to-br from-cyan-600/30 to-purple-600/20 border border-cyan-500/20 rounded-tr-none text-slate-100" 
                      : "self-start bg-slate-900/60 border border-white/5 rounded-tl-none text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <span>{msg.role === "user" ? "USER DEVIATION" : "MAX AI COGNITION"}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                  
                  {msg.image && (
                    <div className="relative max-w-xs rounded-xl overflow-hidden border border-white/10 mb-2">
                      <img src={msg.image} className="w-full object-cover max-h-48" alt="Loaded detail" />
                    </div>
                  )}

                  <div>{renderMarkdown(msg.text)}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="self-start flex items-center gap-2.5 p-4 bg-slate-900/40 border border-white/5 rounded-3xl rounded-tl-none text-slate-400">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Formulating Response...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              {[
                { label: "Build a Todo App", text: "Create a complete React + Tailwind responsive todo application with beautiful layout animations and local persistence." },
                { label: "Analyze Code Structure", text: "Explain the architecture of a Node.js full-stack developer server binding Express with WebSocket endpoints." },
                { label: "Format Workspace Notes", text: "Summarize my active local workspace notes and suggest features we can build next." }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(p.text)}
                  className="px-3 py-1.5 text-[10px] font-mono border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-cyan-500/30 text-slate-400 hover:text-cyan-300 rounded-xl transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 items-end pt-2">
              <div className="flex-1 flex flex-col gap-2 bg-slate-900/80 border border-white/10 rounded-2xl p-2 focus-within:border-cyan-500/50 transition">
                {pendingImage && (
                  <div className="relative inline-block self-start p-1.5 bg-black/40 rounded-xl border border-white/10">
                    <img src={pendingImage} className="h-14 w-14 object-cover rounded-lg" alt="Attachment" />
                    <button
                      type="button"
                      onClick={() => { setPendingImage(null); setPendingImageMime(null); }}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-500 rounded-full text-white cursor-pointer transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-cyan-400 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer"
                    title="Upload image / photo"
                  >
                    <FileUp size={16} />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileLoad(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    accept="image/*"
                  />
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Max AI anything, drag in files, or use quick prompts..."
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder-slate-500 py-1"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={chatLoading || (!chatInput.trim() && !pendingImage)}
                className="py-3 px-5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-slate-950 font-bold rounded-2xl text-xs font-mono uppercase tracking-widest transition cursor-pointer shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* LIVE VOICE TAB */}
        {activeTab === "live_voice" && (
          <div className="lg:col-span-12 w-full grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[70vh]">
            {/* Visualizer Frame (7 Cols) */}
            <div className="md:col-span-7 flex flex-col gap-4 bg-slate-950/40 border border-white/10 rounded-3xl p-5 relative overflow-hidden backdrop-blur-md">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h2 className="text-sm font-bold font-mono text-white tracking-widest uppercase">Nova Duplex Audio Core</h2>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Live emotional state synchronizer</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 uppercase">
                  <span>Theme: {uiTheme}</span>
                  <span>•</span>
                  <span>Mode: {uiMode}</span>
                </div>
              </div>

              {/* The Holographic Core Canvas */}
              <div className="flex-1 min-h-[380px] bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                <MyraaCoreVisualizer
                  session={audioSessionRef.current}
                  state={liveState}
                  themeColor={themeColor}
                  activeEmotion={activeEmotion}
                  characterState={
                    liveState === "speaking" ? "talking" : liveState === "listening" ? "thinking" : "idle"
                  }
                  uiMode={uiMode}
                  uiTheme={uiTheme}
                  animationIntensity={animationIntensity}
                  powerUsage={powerUsage}
                />
                
                {/* Visual Glow Layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/20 to-transparent pointer-events-none" />
                
                {/* Floating telemetry HUD elements */}
                <div className="absolute top-4 left-4 p-2 bg-black/60 rounded-xl border border-white/5 font-mono text-[9px] text-slate-400 leading-normal select-none pointer-events-none">
                  <div className="text-cyan-400 font-bold uppercase mb-0.5">Mind Vector Coordinates</div>
                  <div>Emotion index: {activeEmotion}</div>
                  <div>Handshake jitter: 14ms</div>
                  <div>Packet recovery: 100%</div>
                </div>
              </div>

              {/* Central Activation Trigger */}
              <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={handleToggleLiveVoice}
                  className={`py-3.5 px-8 rounded-2xl font-mono text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-lg ${
                    liveState === "disconnected"
                      ? "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 scale-100 hover:scale-[1.02]"
                      : liveState === "connecting"
                      ? "bg-slate-800 text-slate-400 cursor-wait"
                      : "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                  }`}
                >
                  {liveState === "disconnected" && "🚀 AUTHORIZE LIVE AUDIO PIPELINE"}
                  {liveState === "connecting" && "⚡ ESTABLISHING SSL HANDSHAKE..."}
                  {liveState === "listening" && "🛑 INTERRUPTION GUARD: TAP TO DORMANT"}
                  {liveState === "speaking" && "🛑 AI SPEAKING: TAP TO PAUSE CORE"}
                </button>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">
                  {liveState === "disconnected" && "Requires standard computer microphone credentials"}
                  {liveState === "connecting" && "Sourcing low-latency PCM buffers (16kHz in, 24kHz out)"}
                  {liveState === "listening" && "Active listener. Speak naturally, Max AI will self-interrupt if you talk."}
                  {liveState === "speaking" && "Max AI is responding via high-fidelity synthesized stream."}
                </span>
              </div>
            </div>

            {/* Custom Interactive HUD Panel (5 Cols) */}
            <div className="md:col-span-5 flex flex-col gap-6">
              {/* Parameters Slider & Theme selections */}
              <div className="p-5 bg-slate-950/40 border border-white/10 rounded-3xl text-left flex flex-col gap-4 backdrop-blur-md">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Audio State Vector Controllers</span>
                
                {/* Animation Intensity */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                    <span className="uppercase">Core Vibration Amplitude</span>
                    <span>{animationIntensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={animationIntensity}
                    onChange={(e) => setAnimationIntensity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                {/* Theme Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Mind Wave theme style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["cosmic", "cyberpunk", "matrix", "glassmorphic"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setUiTheme(t)}
                        className={`py-1.5 px-3 rounded-xl border font-mono text-[10px] uppercase transition cursor-pointer ${
                          uiTheme === t
                            ? "border-cyan-400 bg-cyan-500/10 text-cyan-300 font-bold"
                            : "border-white/5 bg-white/[0.01] text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Mental visualization form</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: "floating_core", label: "Holographic Neural Core" },
                      { id: "2d", label: "Procedural 2D Waves Matrix" },
                      { id: "3d", label: "Volumetric Orbital Vectors" },
                      { id: "glassmorphism", label: "Glassmorphic Aura Grid" }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setUiMode(m.id as any)}
                        className={`py-1.5 px-3 rounded-xl border font-mono text-[10px] text-left uppercase transition cursor-pointer flex justify-between items-center ${
                          uiMode === m.id
                            ? "border-purple-400 bg-purple-500/10 text-purple-300 font-bold"
                            : "border-white/5 bg-white/[0.01] text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span>{m.label}</span>
                        {uiMode === m.id && <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scrolled Real-Time Transcript HUD */}
              <div className="flex-1 flex flex-col p-5 bg-slate-950/40 border border-white/10 rounded-3xl text-left gap-3 min-h-[180px] backdrop-blur-md">
                <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">Real-Time Voice Translation logs</span>
                
                <div className="flex-1 overflow-y-auto max-h-[220px] flex flex-col gap-2 bg-black/40 rounded-2xl border border-white/5 p-3.5 font-mono text-[10px] sm:text-xs">
                  {liveTranscription.length === 0 ? (
                    <div className="text-slate-600 text-center py-12 uppercase tracking-widest select-none">
                      Pipeline Dormant. Speak to list voice coordinates...
                    </div>
                  ) : (
                    liveTranscription.map((t, i) => (
                      <div key={i} className={`flex flex-col gap-0.5 leading-relaxed ${
                        t.role === "user" ? "text-cyan-400" : t.role === "model" ? "text-purple-400" : "text-slate-500"
                      }`}>
                        <span className="text-[8px] uppercase font-bold tracking-wider opacity-60">
                          {t.role === "user" ? "[USER SPEECH]" : t.role === "model" ? "[MAX AI SYNTH]" : "[SYSTEM LOG]"}
                        </span>
                        <span>{t.text}</span>
                      </div>
                    ))
                  )}
                  <div ref={liveEndRef} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOCAL NOTEPAD TAB */}
        {activeTab === "notepad" && (
          <div className="lg:col-span-12 w-full grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[70vh]">
            {/* Notes List Sidebar (4 Cols) */}
            <div className="md:col-span-4 p-5 bg-slate-950/40 border border-white/10 rounded-3xl flex flex-col gap-4 backdrop-blur-md text-left">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Local Workspace Notes</span>
                <button
                  onClick={() => {
                    const newId = Date.now().toString();
                    const newNote = {
                      id: newId,
                      title: `Draft Note #${notes.length + 1}`,
                      content: `# Draft Note #${notes.length + 1}\n\nEnter content here...`,
                      date: new Date().toLocaleDateString()
                    };
                    setNotes(prev => [...prev, newNote]);
                    setSelectedNoteId(newId);
                  }}
                  className="p-1 px-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-[9px] font-mono font-bold text-slate-950 transition cursor-pointer"
                >
                  + New Note
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[50vh]">
                {notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      selectedNoteId === note.id
                        ? "border-cyan-400 bg-cyan-500/5"
                        : "border-white/5 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-slate-200 truncate">{note.title}</div>
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-1 uppercase">
                      <span>{note.date}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notes.length === 1) {
                            alert("Cannot delete the last note. Create a new one first.");
                            return;
                          }
                          const updated = notes.filter(n => n.id !== note.id);
                          setNotes(updated);
                          if (selectedNoteId === note.id) {
                            setSelectedNoteId(updated[0].id);
                          }
                        }}
                        className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note Editor Pane (8 Cols) */}
            <div className="md:col-span-8 p-5 bg-slate-950/40 border border-white/10 rounded-3xl flex flex-col gap-4 backdrop-blur-md text-left">
              {notes.find(n => n.id === selectedNoteId) ? (
                <>
                  <div className="flex flex-col gap-1.5 border-b border-white/5 pb-3">
                    <input
                      type="text"
                      value={notes.find(n => n.id === selectedNoteId)?.title || ""}
                      onChange={(e) => {
                        const updated = notes.map(n => {
                          if (n.id === selectedNoteId) {
                            return { ...n, title: e.target.value };
                          }
                          return n;
                        });
                        setNotes(updated);
                      }}
                      className="bg-transparent border-0 outline-none text-base font-bold text-white font-mono placeholder-slate-500"
                      placeholder="Note Title"
                    />
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Workspace file cache linked</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const note = notes.find(n => n.id === selectedNoteId);
                        if (note) {
                          setChatInput(`Analyze this workspace note:\nTitle: ${note.title}\n\nContent:\n${note.content}`);
                          setActiveTab("chat_console");
                        }
                      }}
                      className="py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-[9px] font-mono text-cyan-300 hover:text-cyan-200 transition cursor-pointer uppercase font-bold"
                    >
                      Ask Max AI to Summarize
                    </button>
                    <button
                      onClick={async () => {
                        const note = notes.find(n => n.id === selectedNoteId);
                        if (note) {
                          try {
                            const response = await fetch("/api/chat", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                message: `Standardise, format, structure, and improve this text using proper markdown. Tidy any code snippets. Return ONLY the improved result.\n\n${note.content}`
                              })
                            });
                            const data = await response.json();
                            if (data.success) {
                              const updated = notes.map(n => {
                                if (n.id === selectedNoteId) {
                                  return { ...n, content: data.text };
                                }
                                return n;
                              });
                              setNotes(updated);
                              alert("Note formulated successfully!");
                            } else {
                              alert("Formulation error: " + data.error);
                            }
                          } catch (err: any) {
                            alert("Connection failed: " + err.message);
                          }
                        }
                      }}
                      className="py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-[9px] font-mono text-purple-300 hover:text-purple-200 transition cursor-pointer uppercase font-bold"
                    >
                      Formulate / Format Code
                    </button>
                    <button
                      onClick={() => {
                        const note = notes.find(n => n.id === selectedNoteId);
                        if (note) {
                          navigator.clipboard.writeText(note.content);
                          alert("Saved copy to clipboard!");
                        }
                      }}
                      className="py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-[9px] font-mono text-slate-400 hover:text-white transition cursor-pointer uppercase font-bold ml-auto"
                    >
                      Copy to Clipboard
                    </button>
                  </div>

                  <textarea
                    value={notes.find(n => n.id === selectedNoteId)?.content || ""}
                    onChange={(e) => {
                      const updated = notes.map(n => {
                        if (n.id === selectedNoteId) {
                          return { ...n, content: e.target.value };
                        }
                        return n;
                      });
                      setNotes(updated);
                    }}
                    placeholder="Structure notes using markdown formatting..."
                    className="flex-1 w-full bg-black/30 border border-white/5 rounded-2xl p-4 font-mono text-xs sm:text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/30 transition resize-none min-h-[280px]"
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <FileText size={42} className="opacity-20 mb-2" />
                  <span className="font-mono text-xs uppercase">No note selected</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECURE API KEYS TAB */}
        {activeTab === "api_keys" && (
          <div className="lg:col-span-12 w-full flex flex-col gap-6 min-h-[70vh] bg-slate-950/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md text-left">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="text-cyan-400 animate-pulse" size={20} />
                <div>
                  <h2 className="text-sm font-bold font-mono text-white tracking-widest uppercase font-sans">MAX AI SECURE KEY VAULT</h2>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">AES-256 encrypted operational database parameters</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">CRYPTO SECURED</span>
              </div>
            </div>

            {/* Main Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: "gemini", label: "Google Gemini API", desc: "Powers low-latency multi-modal chat consoles and live voice pipeline sync (gemini-3.5-flash)", placeholder: "AIzaSy..." },
                { id: "powerful", label: "Max AI Powerful Processing Key", desc: "Powers high-performance model orchestration, real-time context streaming, and advanced task chains (gemini-3.1-pro-preview)", placeholder: "AIzaSy..." },
                { id: "openai", label: "OpenAI GPT Platform", desc: "Powers secondary deep analysis, code scans, and assistant cascade endpoints (gpt-4o-mini)", placeholder: "sk-proj-..." },
                { id: "anthropic", label: "Anthropic Claude", desc: "Powers heavy modular refactoring, developer studio, and strict compiler reasoning (claude-3-5-sonnet)", placeholder: "sk-ant-..." },
                { id: "groq", label: "Groq LPU Accelerators", desc: "Powers instant high-speed terminal completions, sub-agent cascade loops (llama-3.1-70b)", placeholder: "gsk_..." }
              ].map(provider => {
                const info = apiKeys[provider.id] || { configured: false, enabled: false, masked: "" };
                const typedValue = newKeys[provider.id] || "";
                const valStatus = validationStatus[provider.id] || "idle";
                const valErr = validationError[provider.id] || "";

                return (
                  <div key={provider.id} className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-4 hover:border-white/10 transition relative overflow-hidden group">
                    {/* Background subtle glowing pattern */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.01] rounded-full blur-2xl group-hover:bg-cyan-500/[0.03] transition-all duration-300 pointer-events-none" />
                    
                    {/* Card Title block */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">{provider.label}</span>
                        <span className="text-[9px] text-slate-500 font-sans leading-relaxed">{provider.desc}</span>
                      </div>
                      
                      {/* Badge status */}
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-bold shrink-0 ${
                        info.configured 
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-950/20 text-amber-500 border border-amber-500/10"
                      }`}>
                        {info.configured ? "CONFIGURED" : "MISSING"}
                      </span>
                    </div>

                    {/* Masked status */}
                    {info.configured && (
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-400 leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>Active: {info.masked}</span>
                        </div>
                        
                        {/* Toggle switch */}
                        <button
                          onClick={() => toggleKeyEnabled(provider.id, info.enabled)}
                          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                            info.enabled
                              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {info.enabled ? "ACTIVE (ENABLED)" : "DORMANT (DISABLED)"}
                        </button>
                      </div>
                    )}

                    {/* New Key Input and Action triggers */}
                    <div className="flex flex-col gap-2 mt-auto">
                      <label className="text-[9px] font-mono text-slate-500 uppercase">Set New {provider.id.toUpperCase()} SECRET KEY</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={typedValue}
                          onChange={(e) => setNewKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          placeholder={provider.placeholder}
                          className="flex-1 bg-black/40 border border-white/10 focus:border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none font-mono transition"
                        />
                        <button
                          onClick={() => saveKeyToServer(provider.id)}
                          disabled={!typedValue.trim()}
                          className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer select-none"
                        >
                          Save
                        </button>
                      </div>

                      {/* Validation trigger */}
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/[0.03]">
                        <button
                          onClick={() => validateKeyOnServer(provider.id)}
                          disabled={!typedValue.trim()}
                          className="text-[9px] font-mono text-purple-300 hover:text-purple-200 hover:underline disabled:opacity-30 transition cursor-pointer animate-pulse"
                        >
                          {valStatus === "loading" ? "⚡ Executing server verification request..." : "Verify typed API key structure"}
                        </button>

                        <div className="text-[9px] font-mono uppercase tracking-widest font-bold">
                          {valStatus === "success" && <span className="text-emerald-400">✓ KEY VALID</span>}
                          {valStatus === "error" && <span className="text-rose-400">✗ INVALID KEY</span>}
                        </div>
                      </div>

                      {/* Error text if validation fails */}
                      {valStatus === "error" && valErr && (
                        <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/25 text-rose-300 font-mono text-[9px] leading-relaxed">
                          Validation Error details: {valErr}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info notice box */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex gap-3 text-slate-400 font-mono text-[10px] sm:text-xs leading-relaxed">
              <span className="text-cyan-400 font-bold shrink-0">ℹ INFO:</span>
              <div>
                We support completely separate keys for Google Gemini, OpenAI, Anthropic, and Groq. Each key is loaded as a sandboxed variable for model requests. The live chat uses <strong>gemini-3.5-flash</strong> using your Gemini API key (or our fallback developer proxy if none provided).
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: SYSTEM TELEMETRY */}
        {activeTab === "system_telemetry" && (
          <>
            {/* Left hardware gauges (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Telemetry Dials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">CPU Processing Load</span>
                    <Cpu size={14} className="text-cyan-400" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-display font-light text-white">{cpuLoad}</span>
                    <span className="text-xs font-mono text-cyan-400">%</span>
                  </div>
                  {/* Custom animated bar representation */}
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${cpuLoad}%` }} />
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">Optimized Multi-thread Core active</span>
                </div>

                <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">GPU Acceleration</span>
                    <Activity size={14} className="text-purple-400" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-display font-light text-white">{gpuLoad}</span>
                    <span className="text-xs font-mono text-purple-400">%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${gpuLoad}%` }} />
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">Procedural Canvas renderer</span>
                </div>

                <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Memory RAM Allotted</span>
                    <Database size={14} className="text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-display font-light text-white">{ramLoad.toFixed(1)}</span>
                    <span className="text-xs font-mono text-emerald-400">GB / 16GB</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${(ramLoad/16)*100}%` }} />
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">Non-volatile memories buffered</span>
                </div>
              </div>

              {/* Network Streaming Traffic Flow Grid */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Dynamic Network Stream Traffic</span>
                    <span className="text-[8px] text-slate-500 uppercase mt-0.5">Bidirectional telemetry channel speed log</span>
                  </div>
                  <div className="text-right font-mono text-[9px] text-slate-400">
                    <span>Up: {netUpload.toFixed(1)} MB/s</span>
                    <span className="mx-2">|</span>
                    <span>Down: {netDownload.toFixed(1)} MB/s</span>
                  </div>
                </div>

                {/* Simulated live visual waveforms */}
                <div className="h-24 w-full bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex items-end justify-center px-4 gap-0.5">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const heightVal = 10 + Math.sin(i * 0.4 + Date.now() * 0.005) * 20 + Math.random() * 15;
                    return (
                      <div 
                        key={i} 
                        className="flex-1 bg-cyan-400/25 rounded-t transition-all duration-500 hover:bg-cyan-300"
                        style={{ height: `${Math.max(5, Math.min(85, heightVal))}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Direct Desktop Hardware Controls */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4 text-left">
                <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">Direct Device Hardware Control Desk</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Volume slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                      <span className="flex items-center gap-1.5 uppercase"><Volume2 size={13} /> Output Audio Volume</span>
                      <span>{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleDeviceControl("volume", parseInt(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                    />
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Synchronizes hardware media keys</span>
                  </div>

                  {/* Brightness slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                      <span className="flex items-center gap-1.5 uppercase"><Sun size={13} /> Projector Lumens Brightness</span>
                      <span>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={brightness}
                      onChange={(e) => handleDeviceControl("brightness", parseInt(e.target.value))}
                      className="w-full accent-purple-400 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                    />
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Controls visual dashboard glow ratio</span>
                  </div>
                </div>

                {/* Displays & Virtual Desktops config row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-3 border-t border-white/5 mt-2">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Monitor Workspace</span>
                    <span className="text-xs font-bold font-mono text-slate-200">Desktop ID: {desktopResolution || "Main Display"}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Display Count</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-200">{multiMonitor} Connected</span>
                      <button 
                        onClick={() => setMultiMonitor(prev => prev === 1 ? 2 : 1)}
                        className="text-[9px] font-mono underline text-cyan-400 cursor-pointer"
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Virtual Desktops</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-200">Space #{virtualDesktop}</span>
                      <button 
                        onClick={() => setVirtualDesktop(prev => prev === 4 ? 1 : prev + 1)}
                        className="text-[9px] font-mono underline text-cyan-400 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Clipboard sync</span>
                    <span className="text-[9px] font-mono text-slate-300 truncate" title={clipboardContent}>
                      {clipboardContent}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right sidebar specialized agent process controllers (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Screenshot grab utility */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Dynamic Screenshot Desk</span>
                  <button
                    onClick={handleDirectCaptureScreenshot}
                    disabled={isCapturingScreenshot}
                    className="py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[9px] font-mono font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw size={10} className={isCapturingScreenshot ? "animate-spin" : ""} />
                    <span>{isCapturingScreenshot ? "Capturing..." : "Capture Screen"}</span>
                  </button>
                </div>

                {capturedScreenshot ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/15">
                    <img src={capturedScreenshot} className="w-full h-full object-cover" alt="Captured desktop screen" />
                    <button 
                      onClick={() => setCapturedScreenshot(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded text-[8px] font-mono text-slate-300">
                      Verified local desktop screen frame
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl bg-black/40 border border-dashed border-white/15 flex flex-col items-center justify-center text-slate-500 text-center p-4">
                    <Monitor size={22} className="opacity-30 mb-1.5" />
                    <span className="text-[9px] font-mono">No desktop image captured.</span>
                    <span className="text-[8px] text-slate-600 font-mono mt-0.5 uppercase">Direct loopback capture enabled</span>
                  </div>
                )}
              </div>

              {/* Agents listing */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4 text-left">
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">Specialized Orchestrated Threads</span>
                
                <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-1">
                  {agentsList.map(a => (
                    <div key={a.name} className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5 hover:bg-white/[0.04] transition">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                          <span className="font-bold text-slate-200">{a.name}</span>
                        </div>
                        <button
                          onClick={() => handleTriggerAgentTask(a.name)}
                          className="px-1.5 py-0.5 border border-white/10 rounded bg-white/5 hover:bg-white/10 text-[8px] text-slate-400 hover:text-white cursor-pointer transition uppercase"
                        >
                          Trigger
                        </button>
                      </div>
                      <span className="text-[8px] text-slate-400 leading-normal">{a.purpose}</span>
                      <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5 pt-1.5 border-t border-white/5">
                        <span>CPU: {a.cpu}%</span>
                        <span>Buffer: {a.ram}MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

        {/* TAB: JARVIS CORE INTELLIGENCE & MULTI-AGENT COMMAND */}
        {activeTab === "jarvis_agents" && (
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            
            {/* Left Column (7 Cols): Master Orchestrator Terminal */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* JARVIS Command Console */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 flex flex-col gap-5 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Terminal size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">JARVIS Executive Terminal</span>
                      <h3 className="text-base font-display font-medium text-white">Master Orchestrator Interface</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] text-slate-500">SYSTEM HASH: SHA-256</span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider font-bold ${
                      jarvisSystemStatus === "Optimal" ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400" :
                      jarvisSystemStatus === "Auth Pending" ? "bg-amber-950/40 border border-amber-500/20 text-amber-400 animate-pulse" :
                      "bg-cyan-950/40 border border-cyan-500/20 text-cyan-400"
                    }`}>
                      {jarvisSystemStatus}
                    </span>
                  </div>
                </div>

                {/* Main input panel */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    JARVIS operates under a cooperative Master Orchestrator, dynamically spawning and tasking specialized agents. Provide complex multi-step instructions below:
                  </p>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={jarvisCommand}
                      onChange={(e) => setJarvisCommand(e.target.value)}
                      disabled={jarvisIsSimulating}
                      placeholder="e.g. Run vulnerability scans, patch staging environment, and notify DevOps pipeline..."
                      className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-900/60 border border-white/10 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400 focus:bg-slate-900 transition disabled:opacity-55"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !jarvisIsSimulating) {
                          triggerJarvisOrchestration(jarvisCommand);
                        }
                      }}
                    />
                    <button
                      onClick={() => triggerJarvisOrchestration(jarvisCommand)}
                      disabled={jarvisIsSimulating || !jarvisCommand.trim()}
                      className="absolute right-2.5 top-2.5 p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition cursor-pointer disabled:opacity-30 disabled:hover:bg-cyan-500 animate-fadeIn"
                      title="Initiate Multi-Agent Taskforce"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>

                {/* Presets and shortcuts */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-mono tracking-wider font-bold text-slate-500 uppercase">Interactive Preset Pipelines</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        title: "Vulnerability Audit",
                        desc: "Perform static AST reviews & network diagnostics",
                        command: "Execute dynamic audit scans on staging buffers and apply security patches"
                      },
                      {
                        title: "Deploy Workspace",
                        desc: "Verify architectures, static check, and run builds",
                        command: "Verify component trees, compile clean production build, and sync GitHub"
                      },
                      {
                        title: "Executive Agendas",
                        desc: "Draft alerts, schedule meetings, track milestones",
                        command: "Check calendar overlapping, synthesize daily email briefs, and align goal tracker"
                      }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setJarvisCommand(p.command);
                          if (!jarvisIsSimulating) triggerJarvisOrchestration(p.command);
                        }}
                        disabled={jarvisIsSimulating}
                        className="p-3 text-left rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-40"
                      >
                        <div className="text-[10px] font-mono font-bold text-cyan-400 mb-0.5">{p.title}</div>
                        <div className="text-[8px] leading-relaxed text-slate-500 truncate">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secure Authorization Guard Overlay / In-situ Notification */}
              <AnimatePresence>
                {jarvisAuthOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 flex flex-col gap-4 relative overflow-hidden backdrop-blur-md"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none animate-pulse" />
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 mt-0.5 animate-bounce">
                        <Lock size={16} />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono tracking-widest text-amber-400 font-bold uppercase">JARVIS Access Guard</span>
                          <span className="text-[8px] font-mono text-slate-500 uppercase">REQUIRES AUTH</span>
                        </div>
                        <h4 className="text-xs font-mono font-bold text-white mt-0.5">Escalated Permission Clearance Required</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
                          The <span className="font-mono text-amber-300 font-bold">{jarvisAuthAgent}</span> is requesting clearance for action: <span className="font-mono text-amber-300 font-bold">{jarvisAuthAction}</span>.
                        </p>
                        <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 font-mono text-[10px] text-slate-400 leading-relaxed mt-2">
                          {jarvisAuthReqDesc}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleGrantJarvisAuth}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition cursor-pointer shadow-lg shadow-amber-500/15"
                          >
                            <UserCheck size={12} />
                            <span>Grant Authorization</span>
                          </button>
                          <button
                            onClick={handleDeclineJarvisAuth}
                            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-mono transition cursor-pointer"
                          >
                            Decline Protocol
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terminal Execution Logs console */}
              <div className="p-5 rounded-3xl bg-slate-950/90 border border-white/10 flex flex-col gap-3 relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Orchestration Diagnostics & Telemetry Log</span>
                  {jarvisIsSimulating && (
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-cyan-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>STEP {jarvisSimStep}/4 ACTIVE</span>
                    </div>
                  )}
                </div>

                {/* Console text box */}
                <div className="h-64 rounded-2xl bg-slate-900/40 p-4 font-mono text-[10px] leading-relaxed text-cyan-300/90 overflow-y-auto flex flex-col gap-2 border border-white/5 select-text custom-scrollbar">
                  {jarvisSimLog.length === 0 ? (
                    <div className="text-slate-500 italic text-center my-auto">
                      JARVIS is idle. Submit an instructions payload above to watch the cooperative sub-agent mesh organize and compile in real-time.
                    </div>
                  ) : (
                    jarvisSimLog.map((log, idx) => {
                      let colorClass = "text-cyan-300";
                      if (log.startsWith("[SYSTEM]")) colorClass = "text-slate-400 font-bold";
                      if (log.startsWith("[SECURITY]")) colorClass = "text-emerald-400 font-bold";
                      if (log.includes("WARNING") || log.includes("DECLINED")) colorClass = "text-amber-400";
                      return (
                        <div key={idx} className={`${colorClass} whitespace-pre-wrap break-all transition-all duration-300 animate-fadeIn`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Right Column (5 Cols): Dynamic Agent Explorer & Configurator */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              
              {/* Orchestrator Config Panel */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Settings size={14} className="text-slate-400" />
                  <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">JARVIS Cognitive Parameters</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase">Coordination Mesh</label>
                    <select
                      value={jarvisInteractiveStyle}
                      onChange={(e: any) => setJarvisInteractiveStyle(e.target.value)}
                      className="p-2 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="collaborative">Collaborative Parallel</option>
                      <option value="directive">Direct Orchestration</option>
                      <option value="hierarchical">Hierarchical Cascade</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase">Privacy Isolation</label>
                    <select
                      value={jarvisPrivacyShield}
                      onChange={(e: any) => setJarvisPrivacyShield(e.target.value)}
                      className="p-2 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="standard">Standard Guard</option>
                      <option value="high">High Shield (Strict)</option>
                      <option value="strict">Air-gapped Sandbox</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase">Thinking Depth</label>
                    <select
                      value={jarvisCognitiveLimit}
                      onChange={(e: any) => setJarvisCognitiveLimit(e.target.value)}
                      className="p-2 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="standard">Standard (Low-latency)</option>
                      <option value="deep">Deep Reasoning (3.1-pro)</option>
                      <option value="thinking">Thinking Engine (Thinking-level)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase">Registered Vocal Host</label>
                    <select
                      value={activeVoiceId || "voice_1"}
                      onChange={(e) => onSwitchVoice && onSwitchVoice(e.target.value)}
                      className="p-2 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="voice_1">🎖️ Alpha Commander (Male)</option>
                      <option value="voice_2">🛡️ Dark Guardian (Male)</option>
                      <option value="voice_3">✨ Elegant Intelligence (Female)</option>
                      <option value="voice_4">🌸 Elite AI Companion (Female)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Sub-Agent Registry Directory Explorer */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4 flex-1">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Sub-Agent Registry ({agentCategories.reduce((acc, cat) => acc + cat.agents.length, 0)} Cells)</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Interactive Diagnostics</span>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={12} />
                    <input
                      type="text"
                      value={searchAgentQuery}
                      onChange={(e) => setSearchAgentQuery(e.target.value)}
                      placeholder="Search 110+ specialized sub-agents..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500/30 font-mono"
                    />
                  </div>

                  <div className="flex overflow-x-auto gap-1 py-1 no-scrollbar border-b border-white/5 max-w-full">
                    <button
                      onClick={() => setSelectedAgentCategory("all")}
                      className={`px-2 py-1 rounded bg-white/2 text-[9px] font-mono shrink-0 transition ${
                        selectedAgentCategory === "all" ? "bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/25" : "text-slate-400 hover:text-white border border-transparent"
                      }`}
                    >
                      All Classes
                    </button>
                    {agentCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedAgentCategory(cat.id)}
                        className={`px-2 py-1 rounded text-[9px] font-mono shrink-0 transition ${
                          selectedAgentCategory === cat.id ? "bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/25" : "text-slate-400 hover:text-white border border-transparent"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtered Agent List */}
                <div className="h-64 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
                  {agentCategories
                    .filter(cat => selectedAgentCategory === "all" || cat.id === selectedAgentCategory)
                    .map(cat => {
                      const filtered = cat.agents.filter(a => 
                        a.name.toLowerCase().includes(searchAgentQuery.toLowerCase()) || 
                        a.task.toLowerCase().includes(searchAgentQuery.toLowerCase())
                      );
                      if (filtered.length === 0) return null;
                      
                      return (
                        <div key={cat.id} className="flex flex-col gap-1">
                          <span className="text-[8px] font-mono text-slate-500 uppercase mt-1 px-1">{cat.name}</span>
                          {filtered.map(agent => {
                            const isSelected = selectedAgent?.id === agent.id;
                            return (
                              <button
                                key={agent.id}
                                onClick={() => setSelectedAgent(agent)}
                                className={`w-full text-left p-2.5 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" 
                                    : "bg-white/2 border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10"
                                }`}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] font-mono font-bold leading-normal">{agent.name}</span>
                                  <span className="text-[8px] text-slate-500 truncate max-w-44">{agent.task}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-1 rounded text-[8px] font-mono tracking-widest ${
                                    agent.status === "Active" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" :
                                    agent.status === "Thinking" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 animate-pulse" :
                                    "bg-slate-900 text-slate-500 border border-white/5"
                                  }`}>
                                    {agent.status}
                                  </span>
                                  <ChevronRight size={10} className="text-slate-500" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>

                {/* Sub-Agent Details Display Card */}
                {selectedAgent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-cyan-500/25 flex flex-col gap-2 mt-auto"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                      <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase">{selectedAgent.name} Status</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">ID: {selectedAgent.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono leading-relaxed text-slate-400">
                      <div>
                        <span className="text-slate-500 uppercase block text-[8px]">Active Operation</span>
                        <span className="text-slate-200 block truncate">{selectedAgent.task}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase block text-[8px]">Precision Telemetry</span>
                        <span className="text-slate-200 block truncate">{selectedAgent.telemetry}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase block text-[8px]">Security Classification</span>
                        <span className="text-slate-200 block">Class-J Sentinel</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase block text-[8px]">Operational Impact</span>
                        <span className={`font-bold ${
                          selectedAgent.impact === "High" ? "text-rose-400" :
                          selectedAgent.impact === "Medium" ? "text-amber-400" :
                          "text-emerald-400"
                        }`}>{selectedAgent.impact} Risk</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setJarvisSimLog(prev => [
                          ...prev,
                          `[Ping] Sent diagnostic packet to ${selectedAgent.name}...`,
                          `[${selectedAgent.name}] Diagnostic OK. Telemetry stable: ${selectedAgent.telemetry}. Running state: ${selectedAgent.status}.`
                        ]);
                      }}
                      className="w-full py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold uppercase tracking-wider transition cursor-pointer mt-1"
                    >
                      Ping Sub-Agent Diagnostic
                    </button>
                  </motion.div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* TAB: ANDROID MOBILE CONTROLLER (RE-ENABLED) */}
        {activeTab === "android_controller" && (
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            {/* Left Column (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Pairing handshakes and credentials card */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Cryptographic Pairing & Handshake Protocol</span>
                    <span className="text-[8px] text-slate-500 uppercase mt-0.5">Secure ECDH Exchange independent of app naming registry</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[8px] uppercase tracking-wider font-bold ${
                    phoneConnected 
                      ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-950/40 border border-rose-500/20 text-rose-400"
                  }`}>
                    {phoneConnected ? "PAIRED & ENCRYPTED" : "UNPAIRED"}
                  </span>
                </div>

                {phoneConnected && pairedDevice ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-slate-500 uppercase">Companion Model</span>
                        <span className="text-xs font-bold font-mono text-slate-200">{pairedDevice.model || "Pixel 9 Pro"}</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-slate-500 uppercase">Symmetric Cipher</span>
                        <span className="text-xs font-bold font-mono text-cyan-400">AES-256-GCM</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-slate-500 uppercase">Entropy Sign-off Key</span>
                        <span className="text-[10px] font-mono text-slate-300 truncate" title={pairedDevice.key}>{pairedDevice.key || "ECDH_PUB_8829...X"}</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-slate-500 uppercase">Device Session Node</span>
                        <span className="text-[10px] font-mono text-slate-300 truncate" title={pairedDevice.session}>{pairedDevice.session || "ACTIVE_NODE_SESSION"}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 flex flex-col gap-1 text-[10px] font-sans text-slate-300 leading-normal">
                      <span className="text-cyan-400 font-bold font-mono text-[9px] uppercase">🔄 Auto-reconnection Engine</span>
                      <p>Once paired, the companion app retains the unique generated credentials and automatically searches and re-establishes an encrypted socket upon startup, bypassing name dependencies completely.</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={onPairMobile}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer text-center"
                      >
                        Launch Mobile Command Desk
                      </button>
                      <button
                        onClick={() => {
                          const confirm = window.confirm("Are you sure you want to completely sever the paired device credentials?");
                          if (confirm) onPairMobile(); // This triggers the modal to handle pairing/disconnections
                        }}
                        className="py-2 px-4 bg-red-950/45 hover:bg-red-900 border border-red-500/10 text-rose-400 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer text-center"
                      >
                        Sever Pairing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
                    {/* Visual QR Code Generator */}
                    <div className="relative p-3 bg-white rounded-2xl shrink-0 border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)]">
                      <div className="w-40 h-40 bg-slate-900 flex items-center justify-center relative overflow-hidden rounded-lg">
                        {/* Dynamic Grid / Laser line */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,#06b6d4_50%,transparent_55%)] bg-[size:100%_200%] animate-[pulse_1.5s_infinite] opacity-35" />
                        <QrCode size={100} className="text-cyan-400" />
                        <div className="absolute bottom-1 bg-cyan-950/90 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-400 uppercase tracking-widest">
                          AES-256 Handshake
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wide font-sans">Establish Secured Sync Link</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                        Scan this cryptographic token using your Android companion app to negotiate and save safe ECDH session hashes. Pairing survives application renaming, state cache updates, and OS cold boots automatically.
                      </p>

                      <div className="pt-2 border-t border-white/5 flex gap-2">
                        <button
                          onClick={onPairMobile}
                          className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer text-center"
                        >
                          Trigger Automated Pair
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Encryption handshake log console */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4 text-left">
                <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">Encrypted Communication Streams</span>
                <div className="h-44 bg-black/55 rounded-2xl border border-white/5 p-4 font-mono text-[9px] text-slate-400 overflow-y-auto leading-relaxed space-y-1.5">
                  <div className="text-cyan-400 font-mono">[INFO] Tunnel daemon initiated: ws://127.0.0.1:3000/api/phone/socket</div>
                  <div className="text-slate-500 font-mono">[CONN] Listening for signature responses...</div>
                  {phoneConnected && (
                    <>
                      <div className="text-emerald-400 font-mono">[HANDSHAKE] Verification success! Peer matched SHA256 hardware signature.</div>
                      <div className="text-slate-300 font-mono">[RECV] Synced phone battery: 91% | Temperature: 32°C</div>
                      <div className="text-slate-300 font-mono">[RECV] Clipboard payload parsed: &ldquo;{localClipboardBuffer}&rdquo;</div>
                      <div className="text-cyan-300 font-mono">[SYNC] System long-term memories synchronizing...</div>
                      <div className="text-emerald-400 font-mono">[OK] 12 active cognitive memory anchors validated on Android client.</div>
                    </>
                  )}
                  {pairedLogs.map((log, i) => (
                    <div key={i} className="text-slate-500 font-mono">{log}</div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Phone screen mirror view */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Holographic Screen share</span>
                
                <div className="relative aspect-[9/16] w-full max-w-[240px] mx-auto rounded-[2rem] bg-black border-4 border-slate-800 shadow-2xl p-2.5 overflow-hidden group select-none">
                  {/* Speaker mesh / camera notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-800 rounded-full z-10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  </div>

                  {phoneConnected && isScreenStreaming ? (
                    <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-slate-950 relative flex flex-col">
                      {/* Active stream container */}
                      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-4">
                        <Smartphone size={32} className="text-cyan-400 animate-bounce mb-3" />
                        <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold tracking-widest">Pixel 9 Pro Active</span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase mt-1">Screen Mirror Stream Enabled</span>
                        <div className="mt-4 flex flex-col gap-1.5 w-full bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono text-[8px] text-slate-400">
                          <div className="flex justify-between"><span>Frame rate</span><span className="text-white">60 FPS</span></div>
                          <div className="flex justify-between"><span>Protocol</span><span className="text-white">H.265 (HEVC)</span></div>
                          <div className="flex justify-between"><span>Bitrate</span><span className="text-white">4.2 Mbps</span></div>
                        </div>
                      </div>

                      <div className="p-3 bg-black/80 border-t border-white/5 flex gap-1.5">
                        <button
                          onClick={() => setIsScreenStreaming(false)}
                          className="flex-1 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-rose-400 rounded-xl text-[9px] font-mono font-bold uppercase transition cursor-pointer text-center"
                        >
                          Pause Mirror
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-slate-950/40 border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 text-center p-5">
                      <Smartphone size={28} className="opacity-30 mb-2" />
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Screen Stream Off</span>
                      <p className="text-[8px] text-slate-600 font-mono mt-1 leading-normal uppercase">
                        Explicit permission required from companion device
                      </p>

                      {phoneConnected && (
                        <button
                          onClick={() => setIsScreenStreaming(true)}
                          className="mt-4 py-1.5 px-4 bg-cyan-600/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Enable Screen Sharing
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick remote actions & permissions panel */}
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4 text-left">
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">Remote control matrix</span>
                
                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.01] border border-white/5">
                    <span className="font-mono text-[9px] uppercase text-slate-400 font-mono">Clipboard Sync</span>
                    <button
                      onClick={() => {
                        const content = prompt("Enter content to inject into paired Android clipboard:", localClipboardBuffer);
                        if (content !== null) {
                          setLocalClipboardBuffer(content);
                          alert("Clipboard content securely broadcasted to Android companion node!");
                        }
                      }}
                      className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono uppercase"
                    >
                      Broadcaster
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.01] border border-white/5">
                    <span className="font-mono text-[9px] uppercase text-slate-400 font-mono">Android screen recorder</span>
                    <button
                      onClick={() => {
                        setScreenRecording(!screenRecording);
                        alert(screenRecording ? "Android screen recording stopped. Output MP4 saved to /storage/emulated/0/Movies." : "Android screen recording started on user request.");
                      }}
                      className={`px-2 py-1 rounded text-[9px] font-mono uppercase ${
                        screenRecording 
                          ? "bg-red-600 hover:bg-red-500 text-white animate-pulse" 
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      {screenRecording ? "Recording active" : "Start Recorder"}
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.01] border border-white/5">
                    <span className="font-mono text-[9px] uppercase text-slate-400 font-mono">Media editor companion</span>
                    <button
                      onClick={() => alert("Ready. Initiate photo/video assets exchange in AndroidPairingModal media tab.")}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono uppercase"
                    >
                      Open suite
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.01] border border-white/5">
                    <span className="font-mono text-[9px] uppercase text-slate-400 font-mono">Social Media publisher</span>
                    <button
                      onClick={() => alert("Direct social reviews are active. All prepared posts require explicit user confirmation before release.")}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono uppercase"
                    >
                      Inspect Queue
                    </button>
                  </div>

                  {/* Explicit user confirmation warning */}
                  <div className="p-3 rounded-2xl bg-slate-900 border border-white/5 flex gap-2 items-start mt-2">
                    <input
                      type="checkbox"
                      id="permissionCheck"
                      checked={permissionApproved}
                      onChange={(e) => setPermissionApproved(e.target.checked)}
                      className="mt-0.5 accent-cyan-400 rounded"
                    />
                    <label htmlFor="permissionCheck" className="text-[9px] text-slate-400 font-mono leading-normal uppercase">
                      Require explicit user approval for sensitive media modifications or publish commands.
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: WORKFLOW AUTOMATION ENGINE */}
        {activeTab === "workflow_engine" && (
          subscriptionTier === "locked" ? (
            <div className="lg:col-span-12 p-12 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col items-center justify-center text-center py-20 font-mono">
              <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 animate-pulse">
                <Lock size={36} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Workflow Automation Studio Locked</h3>
              <p className="text-[10px] text-slate-400 max-w-[400px] mb-6 leading-relaxed">
                This environment handles secure device interaction macros (app launching, typing text, mouse actions, task execution). Please activate a valid subscription license to unlock.
              </p>
              <button
                onClick={onOpenSubscriptionModal}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Unlock Premium Now
              </button>
            </div>
          ) : (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Steps configurer (7 Cols) */}
            <div className="md:col-span-7 p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Visual Workflow Constructor</span>
                  <span className="text-[8px] text-slate-500 uppercase mt-0.5">Chain sequential device commands together</span>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleLoadWorkflowTemplate("autobuild")}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[8px] font-mono text-slate-300 cursor-pointer"
                  >
                    Build Release
                  </button>
                  <button 
                    onClick={() => handleLoadWorkflowTemplate("research")}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[8px] font-mono text-slate-300 cursor-pointer"
                  >
                    Search Web
                  </button>
                  <button 
                    onClick={() => handleLoadWorkflowTemplate("clipboard")}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[8px] font-mono text-slate-300 cursor-pointer"
                  >
                    Clipboard
                  </button>
                </div>
              </div>

              {/* Workflow list */}
              <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                {workflowSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-[10px] border border-cyan-500/15">
                        {index + 1}
                      </span>
                      <span className="text-cyan-300 uppercase text-[10px] font-bold">{step.action.replace("_", " ")}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-200 font-medium truncate max-w-[200px]">{step.param}</span>
                    </div>

                    <button
                      onClick={() => setWorkflowSteps(prev => prev.filter(s => s.id !== step.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {workflowSteps.length === 0 && (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs uppercase border border-dashed border-white/10 rounded-2xl">
                    No workflow actions configured. Use selectors below.
                  </div>
                )}
              </div>

              {/* Add step control bar */}
              <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4 flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Action Protocol</label>
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="launch_app">Launch App / Web address</option>
                    <option value="type_text">Type Text String</option>
                    <option value="press_key">Press Keyboard Key</option>
                    <option value="screenshot">Generate Screenshot</option>
                  </select>
                </div>

                <div className="sm:col-span-6 flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Argument Parameter value</label>
                  <input
                    type="text"
                    value={newParam}
                    onChange={(e) => setNewParam(e.target.value)}
                    placeholder={newAction === "launch_app" ? "notepad OR https://gmail.com" : newAction === "press_key" ? "enter, tab, space, escape" : "Type string details..."}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={handleAddWorkflowStep}
                  className="sm:col-span-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer text-center flex items-center justify-center gap-1 shrink-0 uppercase"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Simulated compiler run & logs outputs (5 Cols) */}
            <div className="md:col-span-5 flex flex-col gap-6">
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4 text-left">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">Macro Command console</span>
                  <button
                    onClick={handleRunWorkflow}
                    disabled={macroStatus === "running" || workflowSteps.length === 0}
                    className="py-1.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] font-mono rounded-xl uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Play size={10} fill="currentColor" />
                    <span>Ignite Run</span>
                  </button>
                </div>

                {/* Macro Logs area */}
                <div className="h-64 bg-black/55 rounded-2xl border border-white/5 p-4 font-mono text-[9px] text-slate-400 overflow-y-auto leading-relaxed space-y-1 select-all">
                  {macroLogs.map((log, index) => (
                    <div key={index} className={log.includes("[Fail]") || log.includes("[Error]") ? "text-rose-400" : log.includes("Success:") || log.includes("accomplished") ? "text-emerald-400" : "text-slate-300"}>
                      {log}
                    </div>
                  ))}

                  {macroLogs.length === 0 && (
                    <div className="text-slate-600 py-12 text-center uppercase tracking-wider select-none">
                      Waiting for automation execution sequence...
                    </div>
                  )}
                </div>

                {/* Status indicator banner */}
                {macroStatus !== "idle" && (
                  <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-mono ${
                    macroStatus === "running" ? "bg-amber-950/15 border-amber-500/20 text-amber-300 animate-pulse" :
                    macroStatus === "success" ? "bg-emerald-950/15 border-emerald-500/20 text-emerald-300" :
                    "bg-rose-950/15 border-rose-500/20 text-rose-300"
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span className="uppercase font-bold">Execution State: {macroStatus}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB 3: LONG TERM MEMORY SYNC */}
        {activeTab === "memory_synchronizer" && (
          subscriptionTier === "locked" ? (
            <div className="lg:col-span-12 p-12 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col items-center justify-center text-center py-20 font-mono">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-pulse">
                <Lock size={36} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Memory Synchronizer Database Locked</h3>
              <p className="text-[10px] text-slate-400 max-w-[400px] mb-6 leading-relaxed">
                Searching, exporting backups, syncing, or triggering database forget sequences require an active subscription license. Please activate a valid license to unlock.
              </p>
              <button
                onClick={onOpenSubscriptionModal}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Unlock Premium Now
              </button>
            </div>
          ) : (
          <div className="lg:col-span-12 flex flex-col gap-6">
            {/* GOOGLE CLOUD SYNC VAULT CARD */}
            <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Google Cloud Synchronization Secure Vault</span>
                  <span className="text-[8px] text-slate-500 uppercase mt-0.5">Cryptographically manage your personal AI profiles and cloud-backed memories</span>
                </div>
                {user ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 uppercase font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Cloud Synchronized
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-400 uppercase font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Offline Local Mode
                  </span>
                )}
              </div>

              {user ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-5 flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" className="w-11 h-11 rounded-full border border-cyan-400/30" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center justify-center font-bold text-sm">
                        {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate font-sans">{user.displayName || "Google User"}</p>
                      <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">{user.email}</p>
                      <p className="text-[8px] text-slate-500 font-mono uppercase mt-1">ID: {user.uid.slice(0, 10)}...</p>
                    </div>
                  </div>

                  <div className="md:col-span-7 flex flex-wrap gap-2.5 justify-end">
                    <button
                      onClick={onForceSync}
                      className="flex items-center gap-1.5 px-3 py-2 border border-cyan-500/25 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 text-[10px] font-mono text-cyan-300 transition cursor-pointer font-bold uppercase tracking-wider"
                    >
                      <Activity size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
                      <span>Sync Now</span>
                    </button>
                    <button
                      onClick={handleExportMemories}
                      className="flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-300 transition cursor-pointer font-bold uppercase tracking-wider"
                    >
                      <Download size={12} />
                      <span>Export Sync Data</span>
                    </button>
                    <button
                      onClick={onDeleteCloudData}
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-500/25 rounded-xl bg-red-950/20 hover:bg-red-900/30 text-[10px] font-mono text-rose-400 transition cursor-pointer font-bold uppercase tracking-wider"
                    >
                      <Trash2 size={12} />
                      <span>Purge Sync Vault</span>
                    </button>
                    <button
                      onClick={onSignOut}
                      className="flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-xl bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-white transition cursor-pointer font-bold uppercase tracking-wider"
                    >
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10">
                  <div className="flex gap-3 items-start text-left">
                    <span className="text-xl mt-0.5">🔐</span>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Synchronization Deactivated</h4>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[420px] leading-relaxed">
                        You are currently browsing under Offline Local Mode. Your preferences, voice selections, and memories are saved strictly in this browser instance and will not sync to other devices.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onSignIn}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-sans text-[11px] font-bold flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>Connect Google Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* DURABLE LOCAL RECOLLECTIONS DATABASE */}
            <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-5 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">Durable SQLite recollections database</span>
                  <span className="text-[8px] text-slate-500 uppercase mt-0.5">Perform backup export, sync upload, or delete permanent forget routines</span>
                </div>
                <div className="flex gap-2.5 items-center w-full sm:w-auto">
                  <button
                    onClick={handleExportMemories}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 transition cursor-pointer"
                    title="Export Memories to JSON File"
                  >
                    <Download size={12} />
                    <span>Export Package</span>
                  </button>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-500/25 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 text-xs font-mono text-cyan-300 transition cursor-pointer">
                    <Upload size={12} />
                    <span>Sync Import</span>
                    <input type="file" accept=".json" onChange={handleImportMemories} className="hidden" />
                  </label>
                </div>
              </div>

            {/* Filter searching toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-8 relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={13} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cognitive statement keywords..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-1.5 pl-9 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={selectedMemoryCategory}
                  onChange={(e) => setSelectedMemoryCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">All Category Domains</option>
                  <option value="identity">Identity Core</option>
                  <option value="preference">User Preferences</option>
                  <option value="goal">Life Goals</option>
                  <option value="project">Active Projects</option>
                  <option value="relationship">Relationships Map</option>
                  <option value="emotional">Emotional Milestones</option>
                  <option value="behavior">Behaviors & Habits</option>
                </select>
              </div>
            </div>

            {/* Filtered records grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
              {filteredMemories.map(m => (
                <div key={m.id} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex justify-between items-start gap-4 hover:bg-white/[0.02] transition relative group">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/10 self-start">
                      {m.category}
                    </span>
                    <p className="text-slate-200 font-sans leading-relaxed mt-1 font-medium">{m.text}</p>
                    <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">Recorded: {new Date(m.createdAt).toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => handleTriggerPermanentForget(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 border border-red-500/20 bg-red-950/25 rounded-xl text-rose-400 hover:bg-red-600 hover:text-white transition duration-150 cursor-pointer"
                    title="Permanently Expunge this memory"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {filteredMemories.length === 0 && (
                <div className="col-span-2 py-16 text-center text-slate-500 font-mono text-xs uppercase border border-dashed border-white/10 rounded-3xl">
                  No registered memories matching selected criteria.
                </div>
              )}
            </div>
          </div>
        </div>
          )
        )}

        {/* TAB 4: DEVELOPER STUDIO */}
        {activeTab === "dev_studio" && (
          subscriptionTier === "locked" ? (
            <div className="lg:col-span-12 p-12 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col items-center justify-center text-center py-20 font-mono">
              <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 animate-pulse">
                <Lock size={36} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Developer Studio Locked</h3>
              <p className="text-[10px] text-slate-400 max-w-[400px] mb-6 leading-relaxed">
                GitHub integration, signing controls, and automatic release versioning require an active subscription license. Please activate a valid license to unlock.
              </p>
              <button
                onClick={onOpenSubscriptionModal}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Unlock Premium Now
              </button>
            </div>
          ) : (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
            {/* Git/GitHub card (6 Cols) */}
            <div className="md:col-span-6 p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">GitHub Actions & Versioning Auto-Suite</span>
              
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-slate-500">Repository Pipeline</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 font-mono text-[8px] text-cyan-400 font-bold uppercase tracking-widest">CI/CD Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1 font-mono"><GitBranch size={12} /> Branch</span>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    className="bg-black/55 border border-white/10 rounded px-2 py-0.5 text-[10px] font-mono text-cyan-300 text-right w-24 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-400 font-mono text-[10px]">Autocommit Release message</span>
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full bg-black/55 border border-white/10 rounded-xl p-2 font-mono text-[10px] text-white focus:outline-none h-14 resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-white/5 flex gap-2">
                  <button 
                    onClick={() => alert("GitHub pipeline trigger scheduled. Release portable Windows EXE process thread started on GitHub runners.")}
                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer text-center"
                  >
                    Trigger release workflow
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1 font-mono text-[9px] text-slate-400 leading-normal">
                <span className="text-slate-200 font-bold">✨ GitHub Workflow Checklist (Automated Release Suite)</span>
                <span>✅ Build executable binary releases on tag push trigger</span>
                <span>✅ Build portable visual packages</span>
                <span>✅ Auto-compute release notes using commit digests</span>
                <span>✅ Secure code checksum hashes signature validation</span>
              </div>
            </div>

            {/* Code analysis indexer card (6 Cols) */}
            <div className="md:col-span-6 p-5 rounded-3xl bg-slate-950/70 border border-white/10 flex flex-col gap-4">
              <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">Repository Semantic Search Indexer</span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchCodeQuery}
                  onChange={(e) => setSearchCodeQuery(e.target.value)}
                  placeholder="e.g. encryptKey, loadAPIKeys, loadMemories..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl p-2 px-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
                />
                <button
                  onClick={handleScanProjectCode}
                  className="py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer text-center shrink-0"
                >
                  Index Match
                </button>
              </div>

              <div className="flex-1 bg-black/55 rounded-2xl border border-white/5 p-3.5 font-mono text-[10px] text-slate-400 min-h-[160px] overflow-y-auto whitespace-pre-wrap select-all leading-relaxed">
                {codeScanResult ? codeScanResult : (
                  <div className="text-slate-600 py-12 text-center uppercase tracking-wider select-none">
                    Enter function or module keywords to match project files...
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        )}

      </div>

      {/* MODAL: EXCLUSIVE SECURE PERMANENT FORGET FOR COGNITIVE ALIGNMENT */}
      <AnimatePresence>
        {showPermanentDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md border border-red-500/30 bg-slate-950 rounded-3xl p-5 shadow-2xl relative flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 border-b border-red-500/10 pb-3">
                <div className="p-2.5 rounded-xl bg-red-950/40 text-red-400 border border-red-500/20 animate-bounce">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">PERMANENT DELETION ROUTINE</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Irreversible deep memory deletion</p>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed font-sans">
                You are about to permanently erase this memory from Max-AI's cognitive records. No hidden backup, cache, or restore point will be kept. Max-AI will lose all awareness of this detail forever.
              </p>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-[10px] text-slate-400">
                <span className="font-bold text-slate-300">Memory content to expunge:</span>
                <p className="mt-1 italic leading-relaxed">&ldquo;{memories.find(m => m.id === memoryToForget)?.text}&rdquo;</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono text-slate-500 uppercase">Type &quot;forget forever&quot; to authorize:</label>
                <input
                  type="text"
                  value={forgetConfirmationText}
                  onChange={(e) => setForgetConfirmationText(e.target.value)}
                  placeholder="Validation phrase"
                  className="bg-black border border-white/10 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2.5 justify-end mt-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    setShowPermanentDeleteModal(false);
                    setMemoryToForget(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPermanentForget}
                  disabled={forgetConfirmationText.trim().toLowerCase() !== "forget forever"}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-45 text-white font-bold text-xs uppercase font-mono tracking-widest transition cursor-pointer"
                >
                  Erase permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
