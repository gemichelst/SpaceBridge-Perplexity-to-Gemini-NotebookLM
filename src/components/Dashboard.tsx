import React from 'react';
import { BarChart, Activity, Zap, HardDrive, Share2, TrendingUp, Sparkles } from 'lucide-react';
import { HistoryEntry } from '../types';

export function Dashboard({ history }: { history: HistoryEntry[] }) {
  const totalExports = history.length;
  const totalThreads = history.reduce((acc, cur) => acc + cur.threadCount, 0);
  const totalArtifacts = history.reduce((acc, cur) => acc + cur.artifactCount, 0);
  
  // Quick pseudo-chart calculation
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  const chartData = last7Days.map(dateStr => {
    const dayHistory = history.filter(h => h.timestamp.startsWith(dateStr));
    return dayHistory.reduce((acc, cur) => acc + cur.threadCount, 0);
  });
    
  const maxChartValue = Math.max(...chartData, 1);
  const weeklyGrowth = chartData[6] - chartData[0];
  const isPositiveGrowth = weeklyGrowth >= 0;

  return (
    <div className="space-y-6">
      <div className="bg-white/50 dark:bg-[#09090b]/80 backdrop-blur-xl border border-zinc-200/50 dark:border-[#27272a]/50 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-32 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
              <BarChart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">Export Analytics</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Real-time insights into your SpaceBridge pipeline.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">SpaceBridge Pro Analytics</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
          <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-16 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
             <div className="flex items-center justify-between text-zinc-500 dark:text-[#71717a] mb-4 text-sm font-medium">
               <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Total Exports</span>
               <span className={`text-xs px-2 py-1 rounded-full ${isPositiveGrowth ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                 {isPositiveGrowth ? '+' : ''}{weeklyGrowth} this week
               </span>
             </div>
             <p className="text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">{totalExports}</p>
          </div>
          
          <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-16 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
             <div className="flex items-center justify-between text-zinc-500 dark:text-[#71717a] mb-4 text-sm font-medium">
               <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Threads Processed</span>
             </div>
             <p className="text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">{totalThreads}</p>
          </div>
          
          <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-16 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
             <div className="flex items-center justify-between text-zinc-500 dark:text-[#71717a] mb-4 text-sm font-medium">
               <span className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-purple-500" /> Artifacts Extracted</span>
             </div>
             <p className="text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">{totalArtifacts}</p>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Activity Last 7 Days
            </h3>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">Measured in threads</span>
          </div>
          
          <div className="flex items-end gap-3 h-48">
            {chartData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full bg-zinc-200/50 dark:bg-zinc-900/50 rounded-lg relative flex items-end justify-center h-full overflow-hidden">
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-900 dark:to-indigo-500 hover:opacity-80 transition-all rounded-lg relative"
                    style={{ height: `${(val / maxChartValue) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                  </div>
                  <div className="absolute -top-8 text-xs font-bold text-zinc-700 dark:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 bg-white dark:bg-zinc-800 px-2 py-1 rounded shadow-sm border border-zinc-200 dark:border-zinc-700">
                    {val}
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(last7Days[i]).getDay()]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
