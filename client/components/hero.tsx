"use client";

import { useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Blocks, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { useLanguage } from '@/contexts/language-provider';

export function Hero() {
  // containerRef removed — was declared but never used
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !glowRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -(y - centerY) / (rect.height / 2) * 8;
    const rotateY = (x - centerX) / (rect.width / 2) * 8;

    gsap.to(card, {
      rotateX,
      rotateY,
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
      duration: 0.7
    });
    gsap.to(glowRef.current, { opacity: 0, duration: 0.4 });
  };

  return (
    <section className="relative px-4 pb-24 pt-16 sm:pt-24 overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-accent/8 blur-[120px] pointer-events-none" />
      <div className="absolute right-[15%] bottom-[10%] h-80 w-80 rounded-full bg-violet-500/5 blur-[130px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr,0.85fr] relative z-10"
      >
        {/* Left Info Column */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Badge className="border-accent/30 bg-accent/10 text-accent font-semibold tracking-wider px-3.5 py-1 text-xs">
              {t('hero.badge')}
            </Badge>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-balance text-5xl font-black tracking-tight text-foreground sm:text-7xl leading-[1.05]"
          >
            {t('hero.title.part1')}{' '}
            <span className="bg-gradient-to-r from-accent via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t('hero.title.part2')}
            </span>.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-xl text-base sm:text-lg leading-relaxed text-foreground/70 font-medium"
          >
            {t('hero.description')}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <Button asChild size="lg" className="rounded-full shadow-glow font-semibold px-8 gap-2 hover:gap-3 transition-all h-12 focus-visible:ring-2 focus-visible:ring-accent">
              <Link href="/register">
                {t('hero.cta.start')} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full font-semibold px-8 h-12 focus-visible:ring-2 focus-visible:ring-accent bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30 shadow-sm">
              <Link href="/verify">
                {t('hero.cta.verify')} <ShieldCheck className="size-4 ml-1.5 text-accent" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-2.5 pt-6 mt-4 border-t border-border/10 text-xs font-semibold text-foreground/60"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-foreground/[0.04] px-4 py-2">
              <BadgeCheck className="size-4 text-success" /> Tamper detection
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-foreground/[0.04] px-4 py-2">
              <Blocks className="size-4 text-accent" /> Smart contract anchored
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-foreground/[0.04] px-4 py-2">
              <ShieldCheck className="size-4 text-accent" /> Enterprise RBAC security
            </span>
          </motion.div>
        </div>

        {/* Right 3D Interactive Card Column */}
        <motion.div variants={itemVariants} className="relative">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative overflow-hidden rounded-2xl border border-border/10 bg-card/40 p-6 shadow-glass backdrop-blur-xl transition-shadow duration-300"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              ref={glowRef}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-0"
              style={{ 
                width: '320px', 
                height: '320px',
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)'
              }}
            />

            <div style={{ transform: 'translateZ(15px)' }} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <GlassCard className="border border-border/10 bg-foreground/[0.03] p-5 rounded-xl flex flex-col justify-between h-full">
                  <div>
                    <div className="mb-3 inline-flex rounded-lg bg-accent/15 p-2.5 text-accent">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="text-xs font-semibold text-foreground/50">Certificates Issued</div>
                    <div className="mt-2 text-3xl font-black text-foreground">12.4K</div>
                  </div>
                  <div className="mt-3 text-xs font-semibold text-success">+18.2% vs last month</div>
                </GlassCard>

                <GlassCard className="border border-border/10 bg-foreground/[0.03] p-5 rounded-xl flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground/50">System Health</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success font-semibold">
                        <span className="size-1.5 rounded-full bg-success animate-pulse" /> 99.9%
                      </span>
                    </div>
                    <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-foreground/10" title="99.9% Uptime">
                      <div className="h-full w-[99.9%] rounded-full bg-gradient-to-r from-accent to-cyan-400" />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-foreground/60 flex justify-between items-center border-t border-border/10 pt-2.5">
                    <span>Verification Speed</span>
                    <span className="text-foreground font-bold">&lt; 800ms</span>
                  </div>
                </GlassCard>
              </div>

              <div className="rounded-xl border border-border/10 bg-foreground/[0.03] p-5">
                <div className="mb-3 flex items-center justify-between text-xs font-bold text-foreground/60">
                  <span>Blockchain Issuance Pipeline</span>
                  <span className="text-accent text-[11px] font-semibold">4 Steps Verifiable</span>
                </div>
                <div className="grid gap-3 grid-cols-4">
                  {['PDF Upload', 'SHA-256', 'IPFS Pin', 'Ethereum'].map((step, index) => (
                    <div key={step} className="rounded-lg border border-border/10 bg-foreground/[0.02] p-2.5 text-center">
                      <div className="mx-auto mb-1.5 grid size-6 place-items-center rounded-full bg-accent/15 text-accent text-xs font-bold">{index + 1}</div>
                      <div className="text-[10px] font-bold text-foreground leading-tight">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
