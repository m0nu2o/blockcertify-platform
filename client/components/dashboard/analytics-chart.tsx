"use client";

import { useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { GlassCard } from '@/components/ui/glass-card';

const dataSets = {
  '1M': [
    { date: 'Week 1', issued: 120, verified: 450 },
    { date: 'Week 2', issued: 250, verified: 600 },
    { date: 'Week 3', issued: 400, verified: 850 },
    { date: 'Week 4', issued: 750, verified: 1200 },
  ],
  '3M': [
    { date: 'Apr', issued: 750, verified: 1200 },
    { date: 'May', issued: 1100, verified: 1800 },
    { date: 'Jun', issued: 1650, verified: 2600 },
  ],
  '1Y': [
    { date: 'Jan', issued: 120, verified: 450 },
    { date: 'Feb', issued: 250, verified: 600 },
    { date: 'Mar', issued: 400, verified: 850 },
    { date: 'Apr', issued: 750, verified: 1200 },
    { date: 'May', issued: 1100, verified: 1800 },
    { date: 'Jun', issued: 1650, verified: 2600 },
    { date: 'Jul', issued: 2400, verified: 3900 },
    { date: 'Aug', issued: 3100, verified: 5100 },
    { date: 'Sep', issued: 4200, verified: 7200 },
    { date: 'Oct', issued: 5500, verified: 9800 },
  ]
};

export function AnalyticsChart() {
  const [timeFilter, setTimeFilter] = useState<'1M' | '3M' | '1Y'>('1Y');
  
  // High contrast glowing colors
  const accentColor = '#60a5fa'; // Blue-ish
  const secondaryColor = '#a78bfa'; // Purple-ish

  return (
    <GlassCard className="p-6 md:p-8 border-border/10 shadow-glass-lg relative overflow-hidden group">
      {/* Ambient background glow behind chart */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-accent/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent/10 transition-colors duration-1000" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            Platform Adoption Lifecycle
          </h2>
          <p className="text-sm font-medium text-foreground/50 mt-1.5">Tracking global issuance versus independent verifications.</p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1 bg-foreground/[0.03] p-1 rounded-xl border border-border/5 self-start sm:self-auto shadow-sm">
          {(['1M', '3M', '1Y'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                timeFilter === filter 
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border/10 scale-100' 
                  : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-[350px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataSets[timeFilter]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
            
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'var(--foreground)', opacity: 0.5, fontWeight: 600 }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'var(--foreground)', opacity: 0.5, fontWeight: 600 }}
              tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
              dx={-10}
            />
            
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">{label}</p>
                      <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.8)]" style={{ background: secondaryColor }} />
                            <span className="text-white/80 text-xs font-semibold">Network Verifications</span>
                          </div>
                          <span className="font-bold text-white font-mono text-sm">{(payload[0]?.value ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]" style={{ background: accentColor }} />
                            <span className="text-white/80 text-xs font-semibold">Certificates Anchored</span>
                          </div>
                          <span className="font-bold text-white font-mono text-sm">{(payload[1]?.value ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Area
              type="monotone"
              dataKey="verified"
              stroke={secondaryColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVerified)"
              filter="url(#glow)"
              activeDot={{ r: 6, strokeWidth: 0, fill: secondaryColor, style: { filter: 'drop-shadow(0px 0px 5px rgba(167,139,250,0.8))' } }}
            />
            <Area
              type="monotone"
              dataKey="issued"
              stroke={accentColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorIssued)"
              filter="url(#glow)"
              activeDot={{ r: 6, strokeWidth: 0, fill: accentColor, style: { filter: 'drop-shadow(0px 0px 5px rgba(96,165,250,0.8))' } }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
