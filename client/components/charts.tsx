
"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlassCard } from '@/components/ui/glass-card';

const monthlyData = [
  { month: 'Jan', issued: 420, verified: 390 },
  { month: 'Feb', issued: 510, verified: 470 },
  { month: 'Mar', issued: 650, verified: 602 },
  { month: 'Apr', issued: 730, verified: 690 },
  { month: 'May', issued: 920, verified: 860 },
  { month: 'Jun', issued: 1100, verified: 1040 },
];

const pieData = [
  { name: 'Issued', value: 68, color: '#38bdf8' },
  { name: 'Verified', value: 24, color: '#22c55e' },
  { name: 'Revoked', value: 8, color: '#ef4444' },
];

export function AnalyticsCharts() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <GlassCard>
        <div className="mb-4 text-lg font-semibold">Issuance velocity</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="issued" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="month" stroke="currentColor" strokeOpacity={0.5} />
              <YAxis stroke="currentColor" strokeOpacity={0.5} />
              <Tooltip />
              <Area type="monotone" dataKey="issued" stroke="#38bdf8" fill="url(#issued)" strokeWidth={2} />
              <Line type="monotone" dataKey="verified" stroke="#22c55e" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="mb-4 text-lg font-semibold">Verification mix</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={4}>
                {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="mb-4 text-lg font-semibold">Institution rankings</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="month" stroke="currentColor" strokeOpacity={0.5} />
              <YAxis stroke="currentColor" strokeOpacity={0.5} />
              <Tooltip />
              <Bar dataKey="issued" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="mb-4 text-lg font-semibold">Verification heat</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="month" stroke="currentColor" strokeOpacity={0.5} />
              <YAxis stroke="currentColor" strokeOpacity={0.5} />
              <Tooltip />
              <Line type="monotone" dataKey="verified" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
