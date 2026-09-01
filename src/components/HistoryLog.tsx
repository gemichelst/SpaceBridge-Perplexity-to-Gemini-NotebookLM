import React, { useState, useMemo } from 'react';
import { History, Clock, FileJson, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { HistoryEntry } from '../types';

interface HistoryLogProps {
  history: HistoryEntry[];
  clearHistory: () => void;
}

export function HistoryLog({ history, clearHistory }: HistoryLogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'threads'>('newest');

  const filteredAndSortedHistory = useMemo(() => {
    let result = [...history];
    
    if (searchQuery) {
      result = result.filter(h => h.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    result.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortOrder === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortOrder === 'threads') return b.threadCount - a.threadCount;
      return 0;
    });
    
    return result;
  }, [history, searchQuery, sortOrder]);

  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500 dark:text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Migration History</h2>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-xs flex items-center gap-1.5 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors bg-red-500/10 px-3 py-1.5 rounded-md"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Log
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#71717a]" />
          <input 
            type="text" 
            placeholder="Search exports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-[#e4e4e7] focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#71717a]" />
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="appearance-none bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-900 dark:text-[#e4e4e7] focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="threads">Sort: Thread Count</option>
          </select>
        </div>
      </div>

      {filteredAndSortedHistory.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-[#27272a] rounded-xl bg-zinc-50 dark:bg-[#18181b]/50">
          <Clock className="w-8 h-8 text-zinc-300 dark:text-[#3f3f46] mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-[#71717a]">No migrations found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedHistory.map((entry) => (
            <div key={entry.id} className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-4 flex items-center justify-between hover:border-zinc-300 dark:hover:border-[#3f3f46] transition-colors">
              <div className="flex items-start gap-4">
                <div className="bg-white dark:bg-[#27272a] p-2 rounded-lg border border-zinc-200 dark:border-transparent">
                  <FileJson className="w-4 h-4 text-zinc-500 dark:text-[#a1a1aa]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-[#e4e4e7] mb-1">{entry.title}</h4>
                  <p className="text-xs text-zinc-500 dark:text-[#71717a] flex gap-3">
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>{entry.threadCount} Threads</span>
                    {entry.artifactCount > 0 && (
                      <>
                        <span>•</span>
                        <span>{entry.artifactCount} Artifacts</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded">
                Processed
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
