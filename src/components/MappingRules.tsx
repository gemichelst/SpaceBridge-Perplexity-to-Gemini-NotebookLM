import React from 'react';
import { Sliders, Save, CheckCircle2 } from 'lucide-react';
import { MappingRules } from '../types';

interface MappingRulesProps {
  rules: MappingRules;
  setRules: React.Dispatch<React.SetStateAction<MappingRules>>;
}

export function MappingRulesPanel({ rules, setRules }: MappingRulesProps) {
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    localStorage.setItem('spacebridge-rules', JSON.stringify(rules));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
          <Sliders className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Custom Mapping Rules</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-[#e4e4e7] mb-4">Export Inclusions</h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-zinc-600 dark:text-[#a1a1aa]">Include Space Instructions / Prompts</span>
              <input 
                type="checkbox" 
                checked={rules.includeInstructions}
                onChange={e => setRules({...rules, includeInstructions: e.target.checked})}
                className="accent-indigo-500 w-4 h-4 cursor-pointer" 
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-zinc-600 dark:text-[#a1a1aa]">Include Deep-Fetched Threads</span>
              <input 
                type="checkbox" 
                checked={rules.includeThreads}
                onChange={e => setRules({...rules, includeThreads: e.target.checked})}
                className="accent-indigo-500 w-4 h-4 cursor-pointer" 
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-zinc-600 dark:text-[#a1a1aa]">Include Artifacts & Apps references</span>
              <input 
                type="checkbox" 
                checked={rules.includeArtifacts}
                onChange={e => setRules({...rules, includeArtifacts: e.target.checked})}
                className="accent-indigo-500 w-4 h-4 cursor-pointer" 
              />
            </label>
          </div>
        </div>

        <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-5">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-[#e4e4e7] mb-4">Formatting Limits</h3>
          <label className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-[#a1a1aa]">Max length per thread (characters)</span>
              <span className="text-indigo-400 font-mono">{rules.truncateLength}</span>
            </div>
            <input 
              type="range" 
              min="1000" max="20000" step="1000"
              value={rules.truncateLength}
              onChange={e => setRules({...rules, truncateLength: parseInt(e.target.value)})}
              className="accent-indigo-500 cursor-pointer" 
            />
            <span className="text-xs text-zinc-500 dark:text-[#71717a]">Prevents Gemini prompt context overflow limits.</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-900 dark:text-[#e4e4e7] text-sm font-medium rounded-lg transition-colors"
          >
            {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            {saved ? 'Rules Saved' : 'Save as Default'}
          </button>
        </div>
      </div>
    </div>
  );
}
