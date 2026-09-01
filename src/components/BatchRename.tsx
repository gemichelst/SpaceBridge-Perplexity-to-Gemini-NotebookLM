import React, { useState } from 'react';
import { Edit3, CheckCircle2, Save } from 'lucide-react';
import { SpaceData } from '../types';

interface BatchRenameProps {
  drafts: SpaceData[];
  setDrafts: React.Dispatch<React.SetStateAction<SpaceData[]>>;
}

export function BatchRename({ drafts, setDrafts }: BatchRenameProps) {
  const [editedDrafts, setEditedDrafts] = useState<SpaceData[]>([...drafts]);
  const [saved, setSaved] = useState(false);

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...editedDrafts];
    updated[index] = { ...updated[index], title: newTitle };
    setEditedDrafts(updated);
  };

  const handleThreadPrefix = (index: number, prefix: string) => {
    const updated = [...editedDrafts];
    updated[index].threads = updated[index].threads.map(t => ({
      ...t,
      title: t.title.replace(/^[.*?]s*/, '') // remove old prefix
    }));
    if (prefix.trim()) {
      updated[index].threads = updated[index].threads.map(t => ({
        ...t,
        title: `[${prefix}] ${t.title}`
      }));
    }
    setEditedDrafts(updated);
  };

  const handleSave = () => {
    setDrafts(editedDrafts);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (drafts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8 text-center text-zinc-500 dark:text-[#71717a]">
        No drafts available to rename. Upload a Space first.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500 dark:text-indigo-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Batch Rename Tool</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {editedDrafts.map((draft, i) => (
          <div key={i} className="bg-zinc-100 dark:bg-[#18181b] p-5 rounded-xl border border-zinc-200 dark:border-[#27272a]">
            <div className="mb-4">
              <label className="block text-xs font-medium text-zinc-500 dark:text-[#71717a] mb-1">Space Title</label>
              <input 
                type="text" 
                value={draft.title}
                onChange={e => handleTitleChange(i, e.target.value)}
                className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-[#e4e4e7] focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-[#71717a] mb-1">Batch Add Thread Prefix (e.g. [PROJ-A])</label>
              <input 
                type="text" 
                placeholder="Optional prefix"
                onChange={e => handleThreadPrefix(i, e.target.value)}
                className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-[#e4e4e7] focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
