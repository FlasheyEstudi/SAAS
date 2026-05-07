'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

interface ChartData {
  label: string;
  value: number;
}

interface AIChartProps {
  type: 'bar' | 'pie' | 'line' | 'area';
  data: ChartData[];
  title?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export const AIChart: React.FC<AIChartProps> = ({ type, data, title }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-[300px] my-6 p-4 bg-card/50 rounded-2xl border border-border/50 flex items-center justify-center">
        <p className="text-xs text-muted-foreground italic">Datos insuficientes para generar la gráfica.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] my-6 p-4 bg-card/80 rounded-2xl border border-border shadow-2xl backdrop-blur-md">
      {title && <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
        <div className="w-1 h-3 bg-primary rounded-full" />
        {title}
      </h4>}
      
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/30" vertical={false} />
            <XAxis dataKey="label" stroke="currentColor" className="text-muted-foreground/80" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="currentColor" className="text-muted-foreground/80" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
              cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }}
            />
            <Bar 
              dataKey="value" 
              fill="#f97316" 
              radius={[6, 6, 0, 0]} 
              barSize={32}
              isAnimationActive={false}
            />
          </BarChart>
        ) : type === 'pie' ? (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={8}
              dataKey="value"
              nameKey="label"
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '12px' }}
            />
          </PieChart>
        ) : type === 'area' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '12px' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#f97316" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#f97316" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: 'white' }} 
              activeDot={{ r: 8 }} 
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
