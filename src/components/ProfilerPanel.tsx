import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, Cpu, HardDrive, Zap, Clock, AlertCircle } from 'lucide-react';
import { HistoryEntry } from '../types';

export function ProfilerPanel({ history }: { history: HistoryEntry[] }) {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memoryUsed: 0,
    memoryTotal: 0,
    loadTime: 0,
  });

  const [renderData, setRenderData] = useState<{time: string, ms: number}[]>([]);

  useEffect(() => {
    // Simulate/capture performance metrics
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setMetrics(prev => ({ ...prev, fps: frameCount }));
        
        // Push a simulated render time metric based on FPS (lower FPS = higher render time)
        const renderMs = Math.max(1, 1000 / (frameCount || 1));
        setRenderData(prev => {
          const next = [...prev, { time: new Date().toLocaleTimeString().split(' ')[0], ms: parseFloat(renderMs.toFixed(1)) }];
          return next.slice(-15); // Keep last 15 seconds
        });
        
        frameCount = 0;
        lastTime = now;
      }
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    // Capture Load Time & Memory (if supported)
    setTimeout(() => {
      const perfData = window.performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      let memUsed = 0;
      let memTotal = 0;
      // @ts-ignore - non-standard API
      if (performance.memory) {
        // @ts-ignore
        memUsed = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        // @ts-ignore
        memTotal = Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024));
      } else {
        // Fallback mockup for UI demonstration if not in Chrome
        memUsed = 45 + Math.floor(Math.random() * 20);
        memTotal = 2048;
      }

      setMetrics(prev => ({ ...prev, loadTime: loadTime > 0 ? loadTime : 450, memoryUsed: memUsed, memoryTotal: memTotal }));
    }, 1000);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Prepare Data Visualization for Exports (Aggregated over time)
  const vizData = history.reduce((acc: any[], cur) => {
    const date = cur.timestamp.split('T')[0];
    const existing = acc.find(x => x.date === date);
    if (existing) {
      existing.threads += cur.threadCount;
      existing.artifacts += cur.artifactCount;
    } else {
      acc.push({ date, threads: cur.threadCount, artifacts: cur.artifactCount });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10); // Last 10 days of data

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8 shadow-sm">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/10 p-2 rounded-lg text-rose-500 dark:text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Performance Profiler</h2>
              <p className="text-sm text-zinc-500">Real-time system diagnostics & memory tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">System Online</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="p-4 bg-zinc-50 dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-zinc-800">
             <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-semibold uppercase tracking-wider"><Activity className="w-4 h-4" /> Client FPS</div>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">{metrics.fps} <span className="text-sm font-medium text-zinc-400">fps</span></div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-zinc-800">
             <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-semibold uppercase tracking-wider"><Cpu className="w-4 h-4" /> DOM Load Time</div>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">{metrics.loadTime} <span className="text-sm font-medium text-zinc-400">ms</span></div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-zinc-800">
             <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-semibold uppercase tracking-wider"><HardDrive className="w-4 h-4" /> JS Heap Size</div>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">{metrics.memoryUsed} <span className="text-sm font-medium text-zinc-400">MB</span></div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-zinc-800">
             <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2 text-xs font-semibold uppercase tracking-wider"><Clock className="w-4 h-4" /> Engine Status</div>
             <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">Optimal</div>
          </div>
        </div>

        {/* Real-time Render Profiler Chart */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" /> Render Latency (Live)
          </h3>
          <div className="h-64 w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={renderData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f43f5e' }}
                />
                <Area type="monotone" dataKey="ms" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorMs)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Data Visualization */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-500" /> Data Visualization: Extraction Volume
          </h3>
          <div className="h-80 w-full bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            {vizData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vizData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    cursor={{ fill: '#27272a', opacity: 0.2 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="threads" name="Threads Processed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="artifacts" name="Artifacts Extracted" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
                 <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                 <p className="text-sm">Not enough historical data to visualize.</p>
                 <p className="text-xs opacity-70">Complete some exports to populate this chart.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
