"use client";

import { LucideIcon } from 'lucide-react';
import { motion, useMotionTemplate, useSpring } from 'framer-motion';

export function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  const mouseX = useSpring(0, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 100 });

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={onMouseMove}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-card border border-border/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--accent), 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative p-8 h-full flex flex-col bg-card/40 backdrop-blur-3xl z-10">
        <div className="mb-6 inline-flex rounded-2xl bg-accent/10 border border-accent/20 p-3.5 text-accent shadow-glow w-fit transition-transform duration-500 group-hover:scale-110">
          <Icon className="size-6" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground/60">{description}</p>
      </div>
      
      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-[2rem] border-2 border-accent/0 transition-colors duration-500 group-hover:border-accent/10 pointer-events-none z-20" />
    </div>
  );
}
