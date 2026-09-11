
"use client";

const particles = Array.from({ length: 14 }).map((_, index) => ({
  id: index,
  left: `${(index * 13) % 100}%`,
  top: `${(index * 17) % 100}%`,
  duration: `${6 + (index % 4) * 2}s`,
  delay: `${(index * 0.3).toFixed(1)}s`,
  size: `${6 + (index % 4) * 2}px`,
}));

export function ParticleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
      <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)' }} />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(232,121,249,0.06) 0%, transparent 70%)' }} />
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-foreground/10 animate-pulse pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
