/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { SpaceData, MappingRules, HistoryEntry } from './types';
import { BookmarkletGuide } from './components/BookmarkletGuide';
import { Uploader } from './components/Uploader';
import { ExportOptions } from './components/ExportOptions';
import { MappingRulesPanel } from './components/MappingRules';
import { HistoryLog } from './components/HistoryLog';
import { Tutorial } from './components/Tutorial';
import { Dashboard } from './components/Dashboard';
import { ProfilerPanel } from './components/ProfilerPanel';
import { Scheduling } from './components/Scheduling';
import { BatchRename } from './components/BatchRename';
import { CloudSync } from './components/CloudSync';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, ShieldCheck, Activity, DownloadCloud, Sliders, History, BookOpen, Sun, Moon, BarChart, CalendarClock, Edit3, Cloud, AlertTriangle, GitMerge, Archive, Bell, ArchiveRestore, Trash2 } from 'lucide-react';

type Tab = 'dashboard' | 'profiler' | 'export' | 'rename' | 'archive' | 'rules' | 'history' | 'sync' | 'scheduling' | 'tutorial';

export default function App() {
  const [drafts, _setDrafts] = useState<SpaceData[]>(() => {
    const saved = localStorage.getItem('spacebridge-drafts');
    return saved ? JSON.parse(saved) : [];
  });
  
  
  const logActivity = (threadCount: number, artifactCount: number) => {
    setHistory(prev => [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        threadCount,
        artifactCount
      },
      ...prev
    ]);
  };
  
  const setDrafts = (newDrafts: SpaceData[] | ((prev: SpaceData[]) => SpaceData[])) => {
    _setDrafts(prev => {
      const next = typeof newDrafts === 'function' ? newDrafts(prev) : newDrafts;
      setDraftHistory(h => [...h.slice(-9), prev]); // Keep last 10 states
      return next;
    });
  };

  const undoDraftAction = () => {
    if (draftHistory.length === 0) return;
    const previous = draftHistory[draftHistory.length - 1];
    setDraftHistory(h => h.slice(0, -1));
    _setDrafts(previous);
  };

    const [activeTab, setActiveTab] = useState<Tab>('export');
  const [draftHistory, setDraftHistory] = useState<SpaceData[][]>([]);
  const [toasts, setToasts] = useState<{id: string, msg: string, type: 'success'|'error'|'info'}[]>([]);

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, {id, msg, type}]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const [conflictQueue, setConflictQueue] = useState<SpaceData[]>([]);
  
  // Session Timeout Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      // 15 minutes timeout
      timeout = setTimeout(() => {
         if (confirm('Your session has timed out due to inactivity. Would you like to lock the app and clear active memory?')) {
            setDrafts([]);
            showToast('Session locked and memory cleared.', 'info');
         }
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, []);

  const activeDrafts = drafts.filter(d => !d.isArchived);
  const archivedDrafts = drafts.filter(d => d.isArchived);

  const toggleArchive = (url: string) => {
    setDrafts(prev => prev.map(d => d.url === url ? { ...d, isArchived: !d.isArchived } : d));
    showToast('Space archiving status updated', 'info');
  };

  const deleteDraft = (url: string) => {
    if(confirm('Delete this space permanently?')) {
      setDrafts(prev => prev.filter(d => d.url !== url));
      showToast('Space deleted permanently', 'success');
    }
  };

  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('spacebridge-theme') as 'dark'|'light') || 'dark';
  });
  
  const [rules, setRules] = useState<MappingRules>(() => {
    const saved = localStorage.getItem('spacebridge-rules');
    if (saved) {
       const parsed = JSON.parse(saved);
       return {
         ...parsed,
         autoArchiveRules: parsed.autoArchiveRules || [],
         exportMacros: parsed.exportMacros || []
       };
    }
    return {
      includeInstructions: true,
      includeThreads: true,
      includeArtifacts: true,
      truncateLength: 5000,
      autoArchiveRules: [],
      exportMacros: []
    };
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('spacebridge-history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('spacebridge-history', JSON.stringify(history));
  }, [history]);
  
  useEffect(() => {
    localStorage.setItem('spacebridge-drafts', JSON.stringify(drafts));
  }, [drafts]);
  
  useEffect(() => {
    localStorage.setItem('spacebridge-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleDataLoaded = (loadedDataArray: SpaceData[]) => {
    const safe: SpaceData[] = [];
    const conflicts: SpaceData[] = [];
    loadedDataArray.forEach(incoming => {
      const isDuplicate = drafts.some(d => d.url === incoming.url || d.title === incoming.title);
      if (isDuplicate) conflicts.push(incoming);
      else safe.push(incoming);
    });

    if (safe.length > 0) {
      const finalSafe = safe.map(d => {
        let archive = false;
        for (const rule of rules.autoArchiveRules || []) {
          if (rule.condition === 'always') archive = true;
          if (rule.condition === 'title_contains' && rule.value && d.title?.toLowerCase().includes(rule.value.toLowerCase())) archive = true;
          if (rule.condition === 'has_tag' && rule.value && d.tags?.includes(rule.value)) archive = true;
          if (rule.condition === 'has_category' && rule.value && d.category === rule.value) archive = true;
        }
        return archive ? { ...d, isArchived: true } : d;
      });
      setDrafts(prev => [...prev, ...finalSafe]);
      const newEntries = finalSafe.map(d => ({
        id: Math.random().toString(36).substring(7),
        title: d.title || 'Untitled Space',
        timestamp: new Date().toISOString(),
        threadCount: d.threads?.length || 0,
        artifactCount: d.artifacts?.length || 0
      }));
      setHistory(prev => [...newEntries, ...prev]);
    }
    if (conflicts.length > 0) setConflictQueue(conflicts);
  };

  const resolveConflict = (action: 'replace' | 'merge' | 'skip', incoming: SpaceData) => {
    if (action !== 'skip') {
      setDrafts(prev => {
         const idx = prev.findIndex(d => d.url === incoming.url || d.title === incoming.title);
         if (idx === -1) return prev;
         const updated = [...prev];
         if (action === 'replace') {
           updated[idx] = incoming;
         } else if (action === 'merge') {
           const existing = updated[idx];
           updated[idx] = {
             ...existing,
             threads: [...existing.threads, ...incoming.threads.filter(it => !existing.threads.some(et => et.url === it.url))],
             artifacts: [...(existing.artifacts||[]), ...(incoming.artifacts||[])]
           };
         }
         return updated;
      });
    }
    setConflictQueue(prev => prev.slice(1));
  };
  
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-zinc-50 dark:bg-[#0c0c0e] font-sans text-zinc-900 dark:text-[#e4e4e7] overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 border-r border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#09090b] flex flex-col p-6 gap-8 overflow-y-auto">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-lg">Ω</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">SpaceBridge</h1>
          </div>
          
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717a] mb-4">Migration Tasks</h3>
          <ul className="space-y-3">
            {[
              { id: 'dashboard', label: 'Stats Dashboard', icon: BarChart },
              { id: 'export', label: 'Space Export', icon: DownloadCloud },
              { id: 'profiler', label: 'System Profiler', icon: Activity },
              { id: 'rename', label: 'Batch Rename', icon: Edit3 },
              { id: 'archive', label: 'Data Archive', icon: Archive },
              { id: 'rules', label: 'Mapping Rules', icon: Sliders },
              { id: 'history', label: 'History & Logs', icon: History },
              { id: 'sync', label: 'Cloud Sync', icon: Cloud },
              { id: 'scheduling', label: 'Scheduling', icon: CalendarClock },
              { id: 'tutorial', label: 'Tutorial', icon: BookOpen },
            ].map(tab => (
              <li 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-zinc-100 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-[#e4e4e7]' 
                    : 'bg-transparent border-transparent text-zinc-500 dark:text-[#71717a] hover:bg-zinc-100 hover:dark:bg-[#18181b]/50 hover:border-zinc-200 hover:dark:border-[#27272a]'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-500 dark:text-indigo-400' : 'text-zinc-500 dark:text-[#71717a]'}`} />
                <span className="text-sm font-medium">{tab.label}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-auto space-y-4">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-[#18181b] transition-colors"
          >
             {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-500 dark:text-[#71717a]" /> : <Moon className="w-4 h-4 text-indigo-500" />}
             <span className="text-sm font-medium text-zinc-600 dark:text-[#a1a1aa]">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-[#a1a1aa] bg-zinc-100 dark:bg-[#18181b] w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-[#27272a]">
             <ShieldCheck className="w-4 h-4 text-emerald-500" />
             Client-Side Processing
          </div>

          {draftHistory.length > 0 && (
            <button onClick={undoDraftAction} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors text-sm font-medium">
              <History className="w-4 h-4" /> Undo Last Action
            </button>
          )}
        </div>

      </aside>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col h-screen overflow-y-auto bg-zinc-50 dark:bg-[#0c0c0e]">
        <div className="max-w-4xl w-full mx-auto p-6 md:p-12">
          
          <AnimatePresence mode="wait">
            {activeTab === 'rename' && (
              <motion.div key="rename" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <BatchRename drafts={activeDrafts} setDrafts={setDrafts} />
              </motion.div>
            )}
            {activeTab === 'sync' && (
              <motion.div key="sync" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <CloudSync />
              </motion.div>
            )}
            
            {activeTab === 'archive' && (
              <motion.div key="archive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500 dark:text-indigo-400">
                      <Archive className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Data Archive</h2>
                  </div>
                  <p className="text-zinc-600 dark:text-[#a1a1aa] mb-6">Spaces you have archived will appear here. They are hidden from your main export workflows but are not permanently deleted.</p>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-xl mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Smart Cleanup</h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-300">Automatically identify and remove empty, broken, or old drafts.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const before = drafts.length;
                        const cleaned = drafts.filter(d => {
                          const hasThreads = d.threads && d.threads.length > 0;
                          const hasInstructions = d.instructions && d.instructions !== 'No explicit instructions found.';
                          const isOld = (Date.now() - new Date(d.timestamp).getTime()) > 30 * 24 * 60 * 60 * 1000;
                          if (isOld || (!hasThreads && !hasInstructions)) return false;
                          return true;
                        });
                        if(cleaned.length < before) {
                           setDrafts(cleaned);
                           showToast(`Smart Cleanup removed ${before - cleaned.length} broken or old spaces.`, 'success');
                        } else {
                           showToast('Your spaces are already clean!', 'info');
                        }
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors whitespace-nowrap"
                    >
                      Run Smart Cleanup
                    </button>
                  </div>

                  
                  <div className="space-y-4">
                    {archivedDrafts.length === 0 ? (
                      <div className="text-center p-8 text-zinc-500 bg-zinc-50 dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-[#27272a]">
                        No archived spaces found.
                      </div>
                    ) : (
                      archivedDrafts.map((d, i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-50 dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-[#27272a]">
                          <div className="mb-3 md:mb-0">
                            <h4 className="font-medium text-zinc-900 dark:text-white">{d.title}</h4>
                            <p className="text-xs text-zinc-500">{new Date(d.timestamp).toLocaleString()} • {d.threads?.length || 0} Threads</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => toggleArchive(d.url)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors">
                              <ArchiveRestore className="w-4 h-4" /> Restore
                            </button>
                            <button onClick={() => deleteDraft(d.url)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <Dashboard history={history} />
              </motion.div>
            )}
            
            {activeTab === 'scheduling' && (
              <motion.div key="scheduling" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <Scheduling />
              </motion.div>
            )}

            {activeTab === 'profiler' && (
              <motion.div key="profiler" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <header className="mb-8">
                  <h2 className="text-3xl font-light mb-2">System Performance</h2>
                  <p className="text-zinc-600 dark:text-[#a1a1aa]">Real-time telemetry and data visualization.</p>
                </header>
                <ProfilerPanel history={history} />
              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div key="export" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-8">
                <header className="mb-8">
                  <h2 className="text-3xl font-light mb-2">Export Configuration</h2>
                  <p className="text-zinc-600 dark:text-[#a1a1aa]">Extract and transform your Perplexity Space data.</p>
                </header>
                
                <BookmarkletGuide />
                <Uploader onDataLoaded={handleDataLoaded} />
                {drafts.length > 0 && (
                  <ExportOptions drafts={activeDrafts} setDrafts={setDrafts} rules={rules} onReset={() => setDrafts([])} showToast={showToast} toggleArchive={toggleArchive} logActivity={logActivity} />
                )}
              </motion.div>
            )}

            {activeTab === 'rules' && (
              <motion.div key="rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <MappingRulesPanel rules={rules} setRules={setRules} />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <HistoryLog history={history} clearHistory={() => setHistory([])} />
              </motion.div>
            )}

            {activeTab === 'tutorial' && (
              <motion.div key="tutorial" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <Tutorial />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      
      {conflictQueue.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] rounded-2xl w-full max-w-md p-6 shadow-2xl">
             <div className="flex items-center gap-3 mb-4 text-amber-500">
               <GitMerge className="w-6 h-6" />
               <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Conflict Detected</h3>
             </div>
             <p className="text-sm text-zinc-600 dark:text-[#a1a1aa] mb-6">
               A space named <strong>{conflictQueue[0].title}</strong> is already in your drafts. How would you like to handle this duplicate?
             </p>
             <div className="space-y-3">
               <button onClick={() => resolveConflict('merge', conflictQueue[0])} className="w-full text-left p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors">
                 <strong className="block text-indigo-500 dark:text-indigo-400 text-sm">Merge Data</strong>
                 <span className="text-xs text-zinc-500 dark:text-[#a1a1aa]">Combine new threads with the existing draft.</span>
               </button>
               <button onClick={() => resolveConflict('replace', conflictQueue[0])} className="w-full text-left p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
                 <strong className="block text-amber-600 dark:text-amber-500 text-sm">Replace Existing</strong>
                 <span className="text-xs text-zinc-500 dark:text-[#a1a1aa]">Overwrite the old draft with this new upload.</span>
               </button>
               <button onClick={() => resolveConflict('skip', conflictQueue[0])} className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] transition-colors">
                 <strong className="block text-zinc-900 dark:text-white text-sm">Skip</strong>
                 <span className="text-xs text-zinc-500 dark:text-[#a1a1aa]">Ignore this upload.</span>
               </button>
             </div>
          </div>
        </div>
      )}

      </section>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${t.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-400' : t.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-400' : 'bg-white dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-[#e4e4e7]'}`}>
             <Bell className="w-4 h-4 shrink-0" />
             <span className="text-sm font-medium">{t.msg}</span>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
