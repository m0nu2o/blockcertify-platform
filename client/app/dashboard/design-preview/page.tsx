"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  ArrowRight, 
  FileCheck2, 
  Workflow, 
  Globe2, 
  LockKeyhole,
  RefreshCw,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Terminal,
  Zap,
  Layers,
  MousePointerClick,
  Sliders,
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

// --- Helper Component: 3D Tilt & Spotlight Glow Card ---
function PremiumTiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !glowRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -(y - centerY) / (rect.height / 2) * 7;
    const rotateY = (x - centerX) / (rect.width / 2) * 7;
    
    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 1000,
      ease: "power2.out",
      duration: 0.3
    });

    gsap.to(glowRef.current, {
      left: `${x}px`,
      top: `${y}px`,
      opacity: 1,
      duration: 0.2
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !glowRef.current) return;
    
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      ease: "power3.out",
      duration: 0.6
    });

    gsap.to(glowRef.current, {
      opacity: 0,
      duration: 0.4
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-[28px] border border-border/15 bg-card/90 p-6 md:p-8 shadow-glass backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:border-accent/30 ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl opacity-0 transition-opacity"
        style={{
          width: '320px',
          height: '320px',
        }}
      />
      <div style={{ transform: 'translateZ(10px)' }}>
        {children}
      </div>
    </div>
  );
}

// Stepper Step Data with modern icon styles and distinctive color palettes
const PIPELINE_STEPS = [
  {
    id: 1,
    title: "PDF Metadata Parsing",
    subtitle: "Parse student & course fields",
    icon: FileCheck2,
    color: "cyan",
    badge: "STAGE 1",
    detail: "Extracting embedded student ID, degree, and institutional signatures from uploaded PDF buffer.",
    log: "[INFO] Parsing binary stream -> Student: 'Varsha Sharma' | ID: 'U-0514' | Degree: 'B.Tech ECE'"
  },
  {
    id: 2,
    title: "SHA-256 Hashing",
    subtitle: "Compute immutable digest",
    icon: Workflow,
    color: "indigo",
    badge: "STAGE 2",
    detail: "Computing 256-bit cryptographic digest of document bytes to prevent tampering or alteration.",
    log: "[HASH] SHA-256 Digest -> 0x7c49b8a3e5f29d1108c909e4f01488c521eb8391d4e082ef7a15993b4a20b7"
  },
  {
    id: 3,
    title: "IPFS Cluster Pinning",
    subtitle: "Decentralized storage pin",
    icon: Globe2,
    color: "emerald",
    badge: "STAGE 3",
    detail: "Uploading payload to distributed IPFS nodes and obtaining global content identifier (CID).",
    log: "[IPFS] Content pinned to IPFS Gateway -> CID: QmZtmD2qtWbpPyvWqBGfKqJ7V5s6jUu5c9gP4qN7b8L"
  },
  {
    id: 4,
    title: "Ethereum Smart Contract",
    subtitle: "Anchor on-chain registry",
    icon: LockKeyhole,
    color: "amber",
    badge: "STAGE 4",
    detail: "Calling `issueCertificate(bytes32,string)` on BlockCertify registry contract with authorizer key.",
    log: "[CHAIN] Block #1984210 confirmed | Tx: 0x5c52c8d20f633010603535bcc30a72cfa33efba3c52994ffd45d464222fda106"
  }
];

export default function DesignPreviewPage() {
  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);
  const [isRunningAuto, setIsRunningAuto] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    "[SYSTEM] Ready for verification pipeline simulation. Click 'Run Stepper Demo' or select any node."
  ]);

  // Interactive Button Bench State
  const [primaryClicks, setPrimaryClicks] = useState(0);
  const [secondaryClicks, setSecondaryClicks] = useState(0);
  const [buttonLoading, setButtonLoading] = useState(false);

  // Counter Metric Animation
  const [metricValue, setMetricValue] = useState(0);

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: 28430,
      duration: 2,
      ease: "power3.out",
      onUpdate: () => setMetricValue(Math.floor(obj.val))
    });
  }, []);

  // Run Auto Stepper Simulation
  const runAutoSimulation = () => {
    if (isRunningAuto) return;
    setIsRunningAuto(true);
    setCurrentStep(1);
    
    setExecutionLogs([
      `[${new Date().toLocaleTimeString()}] Pipeline started...`,
      PIPELINE_STEPS[0].log
    ]);

    let step = 1;
    const interval = setInterval(() => {
      step++;
      if (step <= 4) {
        setCurrentStep(step);
        setExecutionLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Step ${step} executed:`,
          PIPELINE_STEPS[step - 1].log
        ]);
      } else {
        clearInterval(interval);
        setIsRunningAuto(false);
        setExecutionLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ Lifecycle complete! Certificate is anchored and valid.`
        ]);
        toast.success("Stepper simulation completed successfully!");
      }
    }, 1200);
  };

  const handleStepSelect = (stepNumber: number) => {
    if (isRunningAuto) return;
    setCurrentStep(stepNumber);
    setExecutionLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Manual jump to Step ${stepNumber}:`,
      PIPELINE_STEPS[stepNumber - 1].log
    ]);
  };

  const handleResetStepper = () => {
    setIsRunningAuto(false);
    setCurrentStep(1);
    setExecutionLogs([
      `[${new Date().toLocaleTimeString()}] Pipeline reset to Step 1.`
    ]);
    toast.info("Stepper reset to initial state");
  };

  // Button Action Handlers
  const handlePrimaryClick = () => {
    setPrimaryClicks(prev => prev + 1);
    toast.success(`Primary button clicked! (Count: ${primaryClicks + 1})`, {
      description: "Neon glow active scale micro-interaction triggered."
    });
  };

  const handleSecondaryClick = () => {
    setSecondaryClicks(prev => prev + 1);
    toast.info(`Secondary button clicked! (Count: ${secondaryClicks + 1})`, {
      description: "Glass frosted hover state micro-interaction triggered."
    });
  };

  const handleLoadingToggle = () => {
    setButtonLoading(true);
    toast.loading("Simulating cryptographic network request...", { id: 'btn-load' });
    setTimeout(() => {
      setButtonLoading(false);
      toast.success("Transaction resolved successfully!", { id: 'btn-load' });
    }, 1500);
  };

  return (
    <DashboardShell title="Design & Motion Lab">
      <div className="space-y-8">
        
        {/* Header Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[32px] border border-border/15 bg-gradient-to-br from-accent/15 via-card to-background p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden shadow-glass-lg"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="max-w-2xl z-10">
            <Badge className="mb-4 border-accent/40 bg-accent/15 text-accent font-bold tracking-[0.2em] px-3.5 py-1.5 shadow-sm">
              AWWWARDS MOTION & UX LAB
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Interactive Component Lab
            </h2>
            <p className="mt-4 text-sm sm:text-base text-foreground/75 leading-relaxed font-medium">
              Real-time GSAP physics, micro-interactions, and cryptographic state pipelines designed for institutional-grade blockchain UX.
            </p>
          </div>
          <div className="z-10">
            <Button 
              onClick={runAutoSimulation} 
              disabled={isRunningAuto}
              className="rounded-2xl h-12 px-6 text-sm font-bold flex items-center gap-2.5 shadow-glow hover:scale-105 transition-all duration-300"
            >
              {isRunningAuto ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}
              {isRunningAuto ? "Simulating Pipeline..." : "Run Stepper Demo"}
            </Button>
          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* 1. INTERACTIVE BLOCKCHAIN STEPPER PIPELINE */}
        {/* ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard className="p-6 md:p-8 rounded-[32px] border-border/15 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/10">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="border-accent/30 bg-accent/10 text-accent font-semibold px-2.5 py-0.5 text-xs">
                    PIPELINE LIFECYCLE
                  </Badge>
                  <span className="text-xs font-mono text-foreground/50">Stage {currentStep} of 4</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-1.5">
                  Blockchain Certificate Issuance Stepper
                </h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Click any node to inspect that stage, or use the interactive controls to step through.
                </p>
              </div>

              {/* Step Navigation Controls with Clean Reset Position */}
              <div className="flex items-center gap-2 bg-foreground/[0.03] p-1.5 rounded-2xl border border-border/12">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetStepper}
                  disabled={isRunningAuto}
                  className="rounded-xl h-9 px-3 text-xs gap-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/[0.08]"
                  title="Reset to Step 1"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
                <div className="h-4 w-px bg-border/20" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStepSelect(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1 || isRunningAuto}
                  className="rounded-xl h-9 px-3 text-xs gap-1 border-border/15"
                >
                  <ChevronLeft className="size-3.5" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStepSelect(Math.min(4, currentStep + 1))}
                  disabled={currentStep === 4 || isRunningAuto}
                  className="rounded-xl h-9 px-3 text-xs gap-1 border-border/15"
                >
                  Next <ChevronRight className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={runAutoSimulation}
                  disabled={isRunningAuto}
                  className="rounded-xl h-9 px-3.5 text-xs gap-1.5 font-bold shadow-sm"
                >
                  {isRunningAuto ? <RefreshCw className="size-3 animate-spin" /> : <Zap className="size-3.5" />}
                  Auto Play
                </Button>
              </div>
            </div>

            {/* Stepper Graphic Nodes with Modern Dual-Ring Glowing Badges */}
            <div className="py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
                {PIPELINE_STEPS.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div
                      key={step.id}
                      onClick={() => handleStepSelect(step.id)}
                      className={`cursor-pointer group relative rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                        isActive
                          ? 'border-accent bg-accent/[0.08] shadow-glow scale-[1.02] ring-2 ring-accent/30'
                          : isCompleted
                          ? 'border-success/35 bg-success/[0.03] hover:border-success/60'
                          : 'border-border/12 bg-foreground/[0.02] hover:border-border/30 hover:bg-foreground/[0.04]'
                      }`}
                    >
                      {/* Ambient corner highlight */}
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity ${
                        isActive ? 'bg-accent/20 opacity-100' : isCompleted ? 'bg-success/15 opacity-80' : 'opacity-0'
                      }`} />

                      <div className="flex items-center justify-between mb-4 relative z-10">
                        {/* Dual-Ring Glowing Icon Badge */}
                        <div className={`size-13 p-3 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                          isActive
                            ? 'border-accent/50 bg-accent text-white shadow-glow ring-4 ring-accent/20 scale-110'
                            : isCompleted
                            ? 'border-success/40 bg-success/15 text-success ring-2 ring-success/15'
                            : 'border-border/20 bg-card/80 text-foreground/50 group-hover:text-foreground/80 group-hover:border-border/40'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="size-6 text-success animate-in zoom-in-50 duration-200" />
                          ) : (
                            <StepIcon className="size-6 transition-transform duration-300 group-hover:scale-110" />
                          )}
                        </div>

                        <Badge className={`text-[10px] font-mono font-bold tracking-wider ${
                          isActive
                            ? 'border-accent/40 bg-accent/20 text-accent'
                            : isCompleted
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-border/12 bg-foreground/[0.04] text-foreground/40'
                        }`}>
                          {isCompleted ? "COMPLETED" : step.badge}
                        </Badge>
                      </div>

                      <div className="relative z-10">
                        <h4 className={`text-sm font-bold transition-colors ${
                          isActive ? 'text-foreground font-extrabold' : isCompleted ? 'text-foreground' : 'text-foreground/75'
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                          {step.subtitle}
                        </p>
                      </div>

                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="mt-4 pt-3 border-t border-accent/20 flex items-center gap-1.5 text-[11px] font-bold text-accent">
                          <span className="size-1.5 rounded-full bg-accent animate-ping" />
                          Active Stage
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Stage Detail & Live Console Box */}
            <div className="grid md:grid-cols-2 gap-6 pt-2">
              {/* Active Stage Breakdown */}
              <div className="p-5 rounded-2xl border border-border/12 bg-foreground/[0.02] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-2">
                    <ShieldCheck className="size-4" /> Stage {currentStep} Specifications
                  </div>
                  <h4 className="text-base font-bold text-foreground">
                    {PIPELINE_STEPS[currentStep - 1].title}
                  </h4>
                  <p className="text-xs text-foreground/70 leading-relaxed mt-2">
                    {PIPELINE_STEPS[currentStep - 1].detail}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between text-xs text-foreground/50">
                  <span>Cryptographic Status:</span>
                  <Badge className="border-accent/30 bg-accent/10 text-accent font-mono text-[10px]">
                    {currentStep === 4 ? 'IMMUTABLE_ON_CHAIN' : 'IN_PROGRESS'}
                  </Badge>
                </div>
              </div>

              {/* Real-time Execution Console */}
              <div className="p-5 rounded-2xl border border-border/15 bg-black/80 font-mono text-xs text-emerald-400 overflow-hidden flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 text-emerald-500/80 mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-3.5" />
                    <span className="text-[11px] font-bold tracking-wider">LIVE EXECUTION LOGS</span>
                  </div>
                  <span className="text-[10px] text-emerald-500/50">SHA-256 Engine</span>
                </div>
                <div className="space-y-1.5 overflow-y-auto max-h-32 scrollbar-hide text-[11px]">
                  {executionLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed break-all">
                      {log}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-500/20 text-[10px] text-emerald-500/50 flex justify-between">
                  <span>Status: {isRunningAuto ? 'Streaming blocks...' : 'Ready'}</span>
                  <span>Port: 8545 (EVM)</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ======================================================== */}
        {/* 2. PRIMARY & SECONDARY BUTTON TEST BENCH */}
        {/* ======================================================== */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Primary Buttons Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <PremiumTiltCard className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Badge className="border-accent/30 bg-accent/10 text-accent font-semibold px-2.5 py-0.5">
                    PRIMARY BUTTON ARCHITECTURE
                  </Badge>
                  <span className="text-xs font-mono text-foreground/50">Clicked: {primaryClicks}x</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Tactile Primary Actions
                </h3>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  Primary actions use bold visual hierarchy with neon accent halos, active scale spring feedback, and micro-motion arrow transitions.
                </p>
              </div>

              {/* Interactive Primary Button Bench */}
              <div className="mt-8 space-y-4">
                <div className="flex flex-wrap gap-3">
                  {/* 1. Aura Glow Primary */}
                  <Button
                    onClick={handlePrimaryClick}
                    className="rounded-2xl h-11 px-5 font-bold shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    Primary Action <ArrowRight className="size-4 ml-1" />
                  </Button>

                  {/* 2. Loading State Primary */}
                  <Button
                    onClick={handleLoadingToggle}
                    disabled={buttonLoading}
                    className="rounded-2xl h-11 px-5 font-bold bg-gradient-to-r from-accent to-blue-600 shadow-glow active:scale-95 transition-all duration-200"
                  >
                    {buttonLoading ? <RefreshCw className="size-4 animate-spin mr-1.5" /> : <Zap className="size-4 mr-1.5" />}
                    {buttonLoading ? 'Processing...' : 'Simulate API Call'}
                  </Button>
                </div>

                <div className="p-3 rounded-xl border border-accent/20 bg-accent/5 text-[11px] text-foreground/70 flex items-center justify-between">
                  <span>Live Feedback:</span>
                  <span className="font-semibold text-accent font-mono">
                    {primaryClicks > 0 ? `Registered ${primaryClicks} primary clicks` : 'Click above to test'}
                  </span>
                </div>
              </div>
            </PremiumTiltCard>
          </motion.div>

          {/* Secondary Buttons Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PremiumTiltCard className="h-full flex flex-col justify-between border-violet-500/15 hover:border-violet-500/35">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-400 font-semibold px-2.5 py-0.5">
                    SECONDARY BUTTON ARCHITECTURE
                  </Badge>
                  <span className="text-xs font-mono text-foreground/50">Clicked: {secondaryClicks}x</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Frosted Glass & Outline Controls
                </h3>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  Secondary buttons feature frosted glassmorphism, razor-thin borders, and smooth backdrop-blur hover states for contextual actions.
                </p>
              </div>

              {/* Interactive Secondary Button Bench */}
              <div className="mt-8 space-y-4">
                <div className="flex flex-wrap gap-3">
                  {/* 1. Frosted Glass Secondary */}
                  <Button
                    variant="secondary"
                    onClick={handleSecondaryClick}
                    className="rounded-2xl h-11 px-5 font-semibold border-border/20 bg-foreground/[0.05] hover:bg-foreground/[0.1] active:scale-95 transition-all duration-200"
                  >
                    Secondary Action
                  </Button>

                  {/* 2. Neon Outline Secondary */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast.info("Outline action triggered!");
                    }}
                    className="rounded-2xl h-11 px-5 font-semibold border-accent/40 text-accent hover:bg-accent/10 active:scale-95 transition-all duration-200"
                  >
                    <Sliders className="size-4 mr-1.5" />
                    Configure Settings
                  </Button>
                </div>

                <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 text-[11px] text-foreground/70 flex items-center justify-between">
                  <span>Live Feedback:</span>
                  <span className="font-semibold text-violet-400 font-mono">
                    {secondaryClicks > 0 ? `Registered ${secondaryClicks} secondary clicks` : 'Click above to test'}
                  </span>
                </div>
              </div>
            </PremiumTiltCard>
          </motion.div>

        </div>

      </div>
    </DashboardShell>
  );
}
