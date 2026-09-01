import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Sparkles, BookOpen, RefreshCw, Copy, Loader2, X, Filter, CheckSquare, Square, Palette, Activity, LayoutTemplate, AlertTriangle, CheckCircle2, Shield, Layers, Archive, Search } from 'lucide-react';
import { SpaceData, MappingRules } from '../types';

interface ExportOptionsProps {
  drafts: SpaceData[];
  rules: MappingRules;
  onReset: () => void;
  showToast?: (msg: string, type: 'success'|'error'|'info') => void;
  toggleArchive?: (url: string) => void;
  setDrafts?: React.Dispatch<React.SetStateAction<SpaceData[]>>;
  logActivity?: (threads: number, artifacts: number) => void;
}

export function ExportOptions({ drafts, rules, onReset, showToast, toggleArchive, setDrafts, logActivity }: ExportOptionsProps) {
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'markdown' | 'gemini'>('idle');
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'markdown' | 'gemini' | null>(null);
  
  
  const [bulkActionModal, setBulkActionModal] = useState<{
    isOpen: boolean;
    type: 'tag' | 'category' | 'preset' | 'delete' | 'macro' | null;
    inputValue: string;
  }>({ isOpen: false, type: null, inputValue: '' });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [hiddenThreads, setHiddenThreads] = useState<Set<string>>(new Set());
  const [previewTheme, setPreviewTheme] = useState<'system'|'light'|'terminal'>('system');
  const [exportTemplate, setExportTemplate] = useState<'standard'|'minimal'|'threads_only'>('standard');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [generationTimeMs, setGenerationTimeMs] = useState<number | null>(null);
  const [savedPresets, setSavedPresets] = useState<{name: string, config: any}[]>(() => {
    const saved = localStorage.getItem('spacebridge-presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [activePreset, setActivePreset] = useState<string>('');
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, active: false });
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [inlinePreviewMode, setInlinePreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [integrityReport, setIntegrityReport] = useState<{issues: string[], totalWords: number, score: number} | null>(null);

  
  const savePreset = () => {
    setBulkActionModal({ isOpen: true, type: 'preset', inputValue: '' });
  };

  const loadPreset = (name: string) => {
    if(!name) { setActivePreset(''); return; }
    const preset = savedPresets.find(p => p.name === name);
    if (preset) {
      // Note: we can't directly update 'rules' here because they belong to App.tsx
      // but we can update exportTemplate and privacyMode. To make it perfect, we'd need a setRules prop.
      // We will just update our local ones for now.
      setExportTemplate(preset.config.exportTemplate || 'standard');
      setPrivacyMode(preset.config.privacyMode || false);
      setActivePreset(name);
      if(showToast) showToast('Preset loaded: ' + name, 'info');
    }
  };

  
  
  const toggleSelection = (url: string) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedUrls(next);
  };

  const selectAll = () => {
    if (selectedUrls.size === drafts.length) setSelectedUrls(new Set());
    else setSelectedUrls(new Set(drafts.map(d => d.url)));
  };

  const handleBulkArchive = () => {
    if (setDrafts) {
      setDrafts(prev => prev.map(d => selectedUrls.has(d.url) ? { ...d, isArchived: true } : d));
      if (showToast) showToast(`Archived ${selectedUrls.size} spaces`, 'info');
      setSelectedUrls(new Set());
    }
  };

  const handleBulkDelete = () => {
    setBulkActionModal({ isOpen: true, type: 'delete', inputValue: '' });
  };

  const handleBulkTag = () => {
    setBulkActionModal({ isOpen: true, type: 'tag', inputValue: '' });
  };

  const handleBulkCategorize = () => {
    setBulkActionModal({ isOpen: true, type: 'category', inputValue: '' });
  };
  
  const submitBulkAction = () => {
    const val = bulkActionModal.inputValue.trim();
    const type = bulkActionModal.type;
    
    if (type === 'preset' && val) {
      const config = { rules, exportTemplate, privacyMode };
      const next = [...savedPresets, {name: val, config}];
      setSavedPresets(next);
      localStorage.setItem('spacebridge-presets', JSON.stringify(next));
      setActivePreset(val);
      if(showToast) showToast('Preset saved successfully', 'success');
    } else if (type === 'delete' && setDrafts) {
      setDrafts(prev => prev.filter(d => !selectedUrls.has(d.url)));
      if (showToast) showToast(`Deleted ${selectedUrls.size} spaces`, 'success');
      setSelectedUrls(new Set());
    } else if (type === 'tag' && val && setDrafts) {
      setDrafts(prev => prev.map(d => {
        if (selectedUrls.has(d.url)) {
          const newTags = Array.from(new Set([...(d.tags || []), val]));
          return { ...d, tags: newTags };
        }
        return d;
      }));
      if (showToast) showToast(`Tagged ${selectedUrls.size} spaces`, 'success');
      setSelectedUrls(new Set());
    } else if (type === 'category' && val && setDrafts) {
      setDrafts(prev => prev.map(d => selectedUrls.has(d.url) ? { ...d, category: val } : d));
      if (showToast) showToast(`Categorized ${selectedUrls.size} spaces`, 'success');
      setSelectedUrls(new Set());
    } else if (type === 'macro' && val && setDrafts) {
      if (val === 'macro_1') {
        setDrafts(prev => prev.map(d => {
          if (selectedUrls.has(d.url)) {
            const newTags = Array.from(new Set([...(d.tags || []), 'Exported']));
            return { ...d, tags: newTags, isArchived: true };
          }
          return d;
        }));
        handleProgressiveBatchExport();
        if (showToast) showToast('Macro complete: Exported, tagged, and archived.', 'success');
        setSelectedUrls(new Set());
      } else if (val === 'macro_2') {
        setDrafts(prev => prev.map(d => {
          if (selectedUrls.has(d.url)) {
            return { ...d, category: 'Done', isArchived: true };
          }
          return d;
        }));
        if (showToast) showToast('Macro complete: Marked Done and archived.', 'success');
        setSelectedUrls(new Set());
      }
    }
    
    setBulkActionModal({ isOpen: false, type: null, inputValue: '' });
  };
  
  const getIntegrityScore = (d: SpaceData) => {
    const issues: string[] = [];
    if (!d.instructions || d.instructions === 'No explicit instructions found.') issues.push('Missing instructions');
    if (!d.threads || d.threads.length === 0) issues.push('No threads');
    d.threads?.forEach((t, i) => {
      if ((t.content || '').split(/\s+/).length < 10) issues.push(`Thread ${i+1} is very short`);
    });
    return { score: Math.max(0, 100 - (issues.length * 15)), issues };
  };

  const runIntegrityCheck = () => {
    const issues: string[] = [];
    let totalWords = 0;
    drafts.forEach(d => {
      if (!d.instructions || d.instructions === 'No explicit instructions found.') issues.push(`"${d.title}" is missing instructions.`);
      if (!d.threads || d.threads.length === 0) issues.push(`"${d.title}" has no threads.`);
      d.threads?.forEach((t, i) => {
        const words = (t.content || '').split(/\s+/).length;
        totalWords += words;
        if (words < 10) issues.push(`Thread ${i+1} in "${d.title}" is suspiciously short or empty.`);
      });
    });
    const score = Math.max(0, 100 - (issues.length * 15));
    setIntegrityReport({ issues, totalWords, score });
  };

  const toggleThread = (id: string) => {
    setHiddenThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  
  const applyPrivacy = (text: string) => {
    if (!privacyMode || !text) return text;
    return text.replace(/https?:\/\/[^\s\)]+/g, '[REDACTED_URL]')
               .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  };

  const generateMarkdown = (specificDrafts = drafts) => {
    let md = ``;
    
    specificDrafts.forEach((data, draftIndex) => {
      if (draftIndex > 0) md += `

=========================================

`;
      md += `# ${data.title || 'Exported Perplexity Space'}

`;
      md += `*Extracted on: ${new Date(data.timestamp!).toLocaleString()}*
`;
      md += `*Original Source: ${data.url}*

`;
      md += `---

`;
      
      if (exportTemplate !== 'threads_only' && rules.includeInstructions && data.instructions) {
        md += `## Space Instructions (System Prompt)

`;
        md += `${applyPrivacy(data.instructions).substring(0, rules.truncateLength)}

---

`;
      }
      
      if (exportTemplate !== 'minimal' && rules.includeThreads && data.threads && data.threads.length > 0) {
        data.threads.forEach((thread, index) => {
          const threadId = `${draftIndex}-${index}`;
          if (hiddenThreads.has(threadId)) return;
          md += `## Thread: ${thread.title || `Thread ${index + 1}`}

`;
          md += `*Source: ${thread.url || 'No URL'}*

`;
          md += `${applyPrivacy(thread.content || '').substring(0, rules.truncateLength) || 'No content fetched.'}

`;
          md += `---

`;
        });
      }
      
      if (rules.includeArtifacts && data.artifacts && data.artifacts.length > 0) {
        md += `## Attached Artifacts

`;
        data.artifacts.forEach((art, index) => {
          md += `- **${art.title || `Artifact ${index + 1}`}** (${art.url || 'No URL'})
`;
        });
        md += `
---

`;
      }
    });
    
    return md;
  };

  const generateGeminiPrompt = (specificDrafts = drafts) => {
    let prompt = `I am transferring my knowledge base into this Gem. Below is a structured export of my previous working space(s). Please internalize all threads, artifacts, and instructions provided.

`;
    
    specificDrafts.forEach((data, draftIndex) => {
      prompt += `# Context Source: ${data.title || 'Perplexity Space'}

`;
      
      if (exportTemplate !== 'threads_only' && rules.includeInstructions && data.instructions) {
        prompt += `### Core Instructions:
${applyPrivacy(data.instructions).substring(0, rules.truncateLength)}

`;
      }
      
      if (exportTemplate !== 'minimal' && rules.includeThreads && data.threads) {
        prompt += `### Memory Threads:
`;
        data.threads.forEach((thread, index) => {
          const threadId = `${draftIndex}-${index}`;
          if (hiddenThreads.has(threadId)) return;
          prompt += `#### ${thread.title}
${applyPrivacy(thread.content || '').substring(0, rules.truncateLength) || ''}

`;
        });
      }
      
      if (rules.includeArtifacts && data.artifacts) {
        prompt += `### Associated Files/Artifacts:
`;
        data.artifacts.forEach((art) => {
          prompt += `- ${art.title} (URL: ${art.url})
`;
        });
      }
      prompt += `
---

`;
    });
    
    return prompt;
  };

  
  
  const handleProgressiveBatchExport = async () => {
    const toExport = selectedUrls.size > 0 ? drafts.filter(d => selectedUrls.has(d.url)) : drafts;
    if (toExport.length === 0) return;
    setProcessingStatus('markdown');
    setBatchProgress({ current: 0, total: toExport.length, active: true });
    
    for (let i = 0; i < toExport.length; i++) {
      setBatchProgress({ current: i + 1, total: toExport.length, active: true });
      const d = toExport[i];
      const md = generateMarkdown([d]);
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SpaceBridge_${d.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'space'}_${i+1}.md`;
      a.click();
      URL.revokeObjectURL(url);
      if (logActivity) {
        logActivity(d.threads?.length || 0, d.artifacts?.length || 0);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    setBatchProgress({ current: 0, total: 0, active: false });
    setProcessingStatus('idle');
    if (showToast) showToast('Batch export complete!', 'success');
  };


  const handlePreviewMarkdown = () => {
    const start = performance.now();
    setProcessingStatus('markdown');
    setTimeout(() => {
      setPreviewContent(generateMarkdown());
      setPreviewType('markdown');
      setProcessingStatus('idle');
      setGenerationTimeMs(Math.round(performance.now() - start));
      if(showToast) showToast('Markdown generated in ' + Math.round(performance.now() - start) + 'ms', 'success');
    }, 800);
  };

  const handlePreviewGemini = () => {
    const start = performance.now();
    setProcessingStatus('gemini');
    setTimeout(() => {
      setPreviewContent(generateGeminiPrompt());
      setPreviewType('gemini');
      setProcessingStatus('idle');
      setGenerationTimeMs(Math.round(performance.now() - start));
      if(showToast) showToast('Gemini Prompt generated in ' + Math.round(performance.now() - start) + 'ms', 'success');
    }, 800);
  };

  const confirmDownload = () => {
    if (!previewContent) return;
    const blob = new Blob([previewContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NotebookLM_batch_export.md`;
    if (drafts.length === 1) {
      a.download = `NotebookLM_${drafts[0].title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'space'}.md`;
    }
    a.click();
    URL.revokeObjectURL(url);
    
    setPreviewContent(null);
    setPreviewType(null);
  };

  const confirmCopy = () => {
    if (!previewContent) return;
    navigator.clipboard.writeText(previewContent);
    setPreviewContent(null);
    setPreviewType(null);
    
    setTimeout(() => {
      alert('Gemini System Prompt copied to clipboard! Paste this into the instructions of your new Gem.');
    }, 50);
  };

  const closePreview = () => {
    setPreviewContent(null);
    setPreviewType(null);
  };

  const totalThreads = drafts.reduce((acc, d) => acc + (d.threads?.length || 0), 0);
  const healthScore = Math.max(0, Math.round(100 - drafts.reduce((acc, d) => acc + (d.threads?.length === 0 ? 40 : d.threads.filter(t => !t.content || t.content.length < 50).length / d.threads.length * 30 + (!d.instructions || d.instructions.length < 10 ? 10 : 0)), 0) / Math.max(1, drafts.length)));
  const totalArtifacts = drafts.reduce((acc, d) => acc + (d.artifacts?.length || 0), 0);

  const filteredDrafts = drafts.filter(d => 
    d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
       <div className="absolute top-0 right-0 p-40 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Step 3: Ready for Import</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 text-sm font-medium border border-indigo-500/30 px-3 py-1.5 rounded-lg bg-indigo-500/10"
          >
            <Filter className="w-4 h-4" /> Filter Export
          </button>
          <button 
            onClick={onReset}
            className="text-zinc-500 dark:text-[#71717a] hover:text-zinc-600 dark:hover:text-[#a1a1aa] transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Start Over
          </button>
        </div>
      </div>

      <div className="bg-zinc-100 dark:bg-[#18181b]/50 border border-zinc-200 dark:border-[#27272a] rounded-xl p-5 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-zinc-600 dark:text-[#a1a1aa] text-sm font-medium">Extracted Source Data (${drafts.length} File${drafts.length>1?'s':''})</span>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 bg-zinc-200 dark:bg-[#27272a] text-zinc-900 dark:text-[#e4e4e7] rounded-full border border-zinc-300 dark:border-[#3f3f46]">
              ${totalThreads - hiddenThreads.size} Threads
            </span>
            <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${healthScore > 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'}`}>
              <Activity className="w-3 h-3" /> ${healthScore}% Health
            </span>
            <span className="text-xs px-2 py-1 bg-zinc-200 dark:bg-[#27272a] text-zinc-900 dark:text-[#e4e4e7] rounded-full border border-zinc-300 dark:border-[#3f3f46]">
              ${totalArtifacts} Artifacts
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-6 mb-3">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={selectedUrls.size === drafts.length && drafts.length > 0} 
              onChange={selectAll}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-500 focus:ring-indigo-500 bg-white dark:bg-zinc-900 cursor-pointer"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{selectedUrls.size} Selected</span>
          </div>
          <button 
            onClick={() => setInlinePreviewMode(!inlinePreviewMode)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${inlinePreviewMode ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-[#27272a] border-zinc-200 dark:border-[#3f3f46] text-zinc-600 dark:text-zinc-400'}`}
          >
            {inlinePreviewMode ? 'Close Preview' : 'Export Preview Mode'}
          </button>
        </div>

        {selectedUrls.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg animate-in slide-in-from-top-2">
             <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mr-2 uppercase tracking-wider">Bulk Actions:</span>
             <button onClick={handleBulkTag} className="px-3 py-1 text-xs font-medium bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-500/30 transition-colors">Add Tag</button>
             <button onClick={handleBulkCategorize} className="px-3 py-1 text-xs font-medium bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors">Set Category</button>
             <button onClick={handleBulkArchive} className="px-3 py-1 text-xs font-medium bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-50 dark:hover:bg-emerald-500/30 transition-colors">Archive</button>
                          <button onClick={() => setBulkActionModal({ isOpen: true, type: 'macro', inputValue: '' })} className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-pink-500 to-orange-400 text-white border border-transparent rounded hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm">Run Macro</button>
             <button onClick={handleBulkDelete} className="px-3 py-1 text-xs font-medium bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-500/30 transition-colors">Delete</button>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
          {filteredDrafts.map((d, i) => {
            const integrity = getIntegrityScore(d);
            return (
            <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden', padding: 0, margin: 0 }} transition={{ duration: 0.2 }} key={d.url} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${selectedUrls.has(d.url) ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-zinc-50 dark:bg-[#0c0c0e] border-zinc-200 dark:border-[#27272a]'}`}>
              <div className="flex items-center gap-4 min-w-0">
                 <input 
                   type="checkbox" 
                   checked={selectedUrls.has(d.url)} 
                   onChange={() => toggleSelection(d.url)}
                   className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-500 focus:ring-indigo-500 bg-white dark:bg-zinc-900 cursor-pointer flex-shrink-0"
                 />
                 <div className="flex flex-col min-w-0">
                   <div className="flex items-center gap-2">
                     <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{d.title || "Untitled Space"}</h4>
                     {d.category && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full">{d.category}</span>}
                     {d.tags?.map(t => <span key={t} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full">#{t}</span>)}
                     <div className="group relative flex items-center">
                       {integrity.score === 100 ? (
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       ) : (
                         <AlertTriangle className={`w-4 h-4 ${integrity.score > 50 ? 'text-amber-500' : 'text-red-500'}`} />
                       )}
                       <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-zinc-900 dark:bg-black text-white text-xs rounded shadow-xl z-10">
                         <div className="font-bold mb-1">Integrity Score: {integrity.score}%</div>
                         {integrity.issues.length > 0 ? (
                           <ul className="list-disc list-inside space-y-0.5">
                             {integrity.issues.map((iss, idx) => <li key={idx} className="truncate">{iss}</li>)}
                           </ul>
                         ) : <span>All checks passed!</span>}
                         <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-black"></div>
                       </div>
                     </div>
                   </div>
                   <span className="text-xs text-zinc-500">{d.threads?.length || 0} Threads • {new Date(d.timestamp).toLocaleString()}</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {toggleArchive && (
                  <button onClick={() => toggleArchive(d.url)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors" title="Send to Archive Tab">
                    <Archive className="w-3 h-3" /> Archive
                  </button>
                )}
              </div>
            </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
        
        {inlinePreviewMode && (
          <div className="mt-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-300 font-mono text-xs overflow-auto max-h-96 shadow-inner">
            <pre className="whitespace-pre-wrap">
              {generateMarkdown(selectedUrls.size > 0 ? filteredDrafts.filter(d => selectedUrls.has(d.url)) : filteredDrafts)}
            </pre>
          </div>
        )}
      </div>

      
      {healthScore < 70 && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-500 dark:text-red-400 mb-8 items-start">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Data Health Alert ({healthScore}%):</strong> We detected missing threads, very short content, or missing instructions. 
            The extraction might have been blocked. 
            <strong>Recommendation:</strong> Use the updated bookmarklet script, do not click away while fetching, and retry the extraction.
          </div>
        </div>
      )}

      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-100 dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-[#27272a] mb-8">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <div className="flex-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-[#71717a] uppercase tracking-wider block mb-1">Export Template</label>
            <select 
              value={exportTemplate}
              onChange={(e) => setExportTemplate(e.target.value as any)}
              className="w-full bg-transparent text-sm text-zinc-900 dark:text-[#e4e4e7] font-medium focus:outline-none cursor-pointer"
            >
              <option value="standard">Standard Full Export (Everything)</option>
              <option value="minimal">Minimal / Metadata Summary (No Threads)</option>
              <option value="threads_only">Threads & Memory Only (No Instructions)</option>
            </select>
          </div>
        </div>
        
        <div className="h-8 w-px bg-zinc-200 dark:bg-[#27272a] hidden sm:block"></div>
        
        
        <div className="flex items-center gap-3">
          <select 
            value={activePreset} 
            onChange={e => loadPreset(e.target.value)}
            className="text-sm bg-transparent border border-zinc-200 dark:border-[#3f3f46] text-zinc-700 dark:text-[#a1a1aa] rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="">Load Preset...</option>
            {savedPresets.map((p, i) => (
              <option key={i} value={p.name}>{p.name}</option>
            ))}
          </select>
          <button onClick={savePreset} className="text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors">
            Save Preset
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`flex items-center gap-2 text-sm font-medium border px-4 py-2 rounded-lg transition-colors ${privacyMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-[#27272a] border-zinc-200 dark:border-[#3f3f46] text-zinc-600 dark:text-[#a1a1aa] hover:bg-zinc-50 dark:hover:bg-[#3f3f46]'}`}
          >
            <Shield className="w-4 h-4" /> Privacy Mode {privacyMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notebook LM Export */}
        <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] transition-colors p-5 rounded-xl flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4 text-zinc-900 dark:text-[#e4e4e7] font-medium">
            <div className="bg-emerald-500/20 p-1.5 rounded text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            NotebookLM Markdown
          </div>
          <p className="text-sm text-zinc-500 dark:text-[#71717a] mb-6 flex-1">
            Downloads a clean, structured Markdown (.md) file optimized for Google NotebookLM's source limit.
          </p>
          
          <div className="flex gap-2">
            <button 
              onClick={handlePreviewMarkdown}
              disabled={processingStatus !== 'idle'}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingStatus === 'markdown' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gen...</>
              ) : (
                <><Download className="w-4 h-4" /> Preview & DL</>
              )}
            </button>
            {drafts.length > 1 && (
              <button 
                onClick={handleProgressiveBatchExport}
                disabled={processingStatus !== 'idle'}
                title="Download as separate files (Batch Export)"
                className="px-4 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <Layers className="w-4 h-4" /> Batch
              </button>
            )}
          </div>

        </div>

        {/* Gemini Prompt Export */}
        <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] transition-colors p-5 rounded-xl flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4 text-zinc-900 dark:text-[#e4e4e7] font-medium">
            <div className="bg-indigo-500/20 p-1.5 rounded text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            Gemini System Prompt
          </div>
          <p className="text-sm text-zinc-500 dark:text-[#71717a] mb-6 flex-1">
            Copies a structured context prompt designed to be pasted as the core Knowledge/System Instructions of a custom Gem.
          </p>
          <button 
            onClick={handlePreviewGemini}
            disabled={processingStatus !== 'idle'}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingStatus === 'gemini' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Formatting...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Preview & Copy
              </>
            )}
          </button>
        </div>
      </div>

      {previewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-200 dark:border-[#27272a]">
               <h3 className="text-lg font-semibold text-zinc-900 dark:text-[#e4e4e7] flex items-center gap-2">
                 {previewType === 'markdown' ? <BookOpen className="w-5 h-5 text-emerald-400" /> : <Sparkles className="w-5 h-5 text-indigo-400" />}
                 {previewType === 'markdown' ? 'NotebookLM Export Preview' : 'Gemini Prompt Preview'}
               </h3>
               
               <div className="flex gap-2 items-center">
                 {generationTimeMs !== null && (
                   <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] px-2 py-1 rounded-md hidden sm:block">
                     Generated in {generationTimeMs}ms
                   </span>
                 )}

                 <button onClick={() => setPreviewTheme(p => p==='system'?'light':p==='light'?'terminal':'system')} className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-[#a1a1aa] hover:text-indigo-500 transition-colors p-1.5 rounded-lg border border-zinc-200 dark:border-[#27272a]">
                   <Palette className="w-4 h-4" /> Theme: {previewTheme}
                 </button>
                 <button onClick={closePreview} className="text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#e4e4e7] transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#27272a]">
                   <X className="w-5 h-5" />
                 </button>
               </div>
            </div>
            
            <div className={`flex-1 overflow-auto p-4 md:p-6 ${previewTheme === 'terminal' ? 'bg-black text-green-400' : previewTheme === 'light' ? 'bg-white text-black' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-600 dark:text-[#a1a1aa]'}`}>
               <pre className="text-xs md:text-sm font-mono whitespace-pre-wrap break-words">
                 {previewContent}
               </pre>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#0c0c0e]">
               <button 
                 onClick={closePreview}
                 className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#e4e4e7] hover:bg-zinc-100 dark:hover:bg-[#27272a] transition-colors"
               >
                 Cancel
               </button>
               {previewType === 'markdown' ? (
                 <button 
                   onClick={confirmDownload}
                   className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                 >
                   <Download className="w-4 h-4" /> Confirm Download
                 </button>
               ) : (
                 <button 
                   onClick={confirmCopy}
                   className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                 >
                   <Copy className="w-4 h-4" /> Confirm Copy
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-200 dark:border-[#27272a]">
               <h3 className="text-lg font-semibold text-zinc-900 dark:text-[#e4e4e7] flex items-center gap-2">
                 <Filter className="w-5 h-5 text-indigo-400" />
                 Filter Threads for Export
               </h3>
               <button onClick={() => setIsFilterModalOpen(false)} className="text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#e4e4e7] transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#27272a]">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-zinc-50 dark:bg-[#09090b] space-y-6">
               {drafts.map((d, draftIndex) => (
                 <div key={draftIndex} className="space-y-3">
                   <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{d.title || "Untitled Space"}</h4>
                   {d.threads?.map((thread, index) => {
                     const threadId = `${draftIndex}-${index}`;
                     const isHidden = hiddenThreads.has(threadId);
                     return (
                       <div 
                         key={threadId} 
                         onClick={() => toggleThread(threadId)}
                         className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${isHidden ? 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-[#27272a] opacity-60' : 'bg-white dark:bg-[#18181b] border-indigo-500/30'}`}
                       >
                         <div className="flex items-center gap-3">
                           {isHidden ? <Square className="w-4 h-4 text-zinc-400" /> : <CheckSquare className="w-4 h-4 text-indigo-400" />}
                           <span className="text-sm font-medium text-zinc-900 dark:text-[#e4e4e7] truncate">{thread.title || `Thread ${index + 1}`}</span>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ))}
            </div>
            
            <div className="flex items-center justify-between p-4 md:p-6 border-t border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#0c0c0e]">
               <span className="text-xs text-zinc-500 dark:text-[#71717a]">{hiddenThreads.size} threads filtered out</span>
               <button 
                 onClick={() => setIsFilterModalOpen(false)}
                 className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)]"
               >
                 Done
               </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Batch Status Monitor */}
      <AnimatePresence>
        {batchProgress.active && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }} 
            className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-zinc-900 dark:bg-black border border-zinc-800 rounded-xl p-5 shadow-2xl z-50"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                Processing Batch Export...
              </h4>
              <span className="text-zinc-400 text-xs">{batchProgress.current} / {batchProgress.total}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
              <motion.div 
                className="bg-indigo-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-zinc-500 text-right">Please do not close the window.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Modal */}
      {bulkActionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-zinc-200 dark:border-zinc-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                {bulkActionModal.type === 'tag' ? 'Add Tag' : 
                 bulkActionModal.type === 'category' ? 'Set Category' : 
                 bulkActionModal.type === 'preset' ? 'Save Preset' : 
                 bulkActionModal.type === 'macro' ? 'Run Export Macro' : 'Confirm Deletion'}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                {bulkActionModal.type === 'tag' ? `Add a tag to ${selectedUrls.size} selected space(s).` : 
                 bulkActionModal.type === 'category' ? `Set a category for ${selectedUrls.size} selected space(s).` : 
                 bulkActionModal.type === 'preset' ? 'Enter a name for your current export settings.' : bulkActionModal.type === 'macro' ? `Select an automated sequence to run on ${selectedUrls.size} space(s).` : `Are you sure you want to permanently delete ${selectedUrls.size} space(s)?`}
              </p>
              
              {bulkActionModal.type !== 'delete' && bulkActionModal.type !== 'macro' && (
                <input
                  autoFocus
                  type="text"
                  placeholder={bulkActionModal.type === 'tag' ? 'e.g. project-x' : bulkActionModal.type === 'category' ? 'e.g. Research' : 'Preset Name'}
                  value={bulkActionModal.inputValue}
                  onChange={e => setBulkActionModal(prev => ({ ...prev, inputValue: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') submitBulkAction(); }}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                />
              )}
              {bulkActionModal.type === 'macro' && (
                <select
                  value={bulkActionModal.inputValue}
                  onChange={e => setBulkActionModal(prev => ({ ...prev, inputValue: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                >
                  <option value="" disabled>Select a macro...</option>
                  <option value="macro_1">Tag "Exported", Export Markdown, and Archive</option>
                  <option value="macro_2">Categorize as "Done" and Archive</option>
                </select>
              )}

            </div>
            <div className="bg-zinc-50 dark:bg-[#121214] px-6 py-4 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setBulkActionModal({ isOpen: false, type: null, inputValue: '' })}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitBulkAction}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm ${bulkActionModal.type === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {bulkActionModal.type === 'delete' ? 'Delete' : bulkActionModal.type === 'macro' ? 'Run Macro' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
