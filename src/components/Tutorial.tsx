import React from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';

export function Tutorial() {
  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Export Tutorial & Guide</h2>
      </div>

      <div className="prose prose-invert prose-zinc max-w-none">
        <p className="text-zinc-600 dark:text-[#a1a1aa] leading-relaxed mb-6">
          Transferring knowledge from walled-garden AI environments requires a reliable bridge. 
          SpaceBridge uses a local-first client script to authenticate using your existing browser session and deep-fetch your data without requiring API keys or risking bans.
        </p>

        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-4 mb-8 text-amber-200/80 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <p>
            Do not share the generated JSON file publicly. It contains your private threads, AI interactions, and potentially sensitive prompt instructions.
          </p>
        </div>

        <h3 className="text-zinc-900 dark:text-[#e4e4e7] font-medium mb-4 text-lg">Step-by-step Workflow</h3>
        
        <ol className="space-y-6 text-sm text-zinc-600 dark:text-[#a1a1aa] list-decimal list-inside">
          <li className="bg-zinc-100 dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-[#27272a]">
            <strong className="text-zinc-900 dark:text-[#e4e4e7]">Setup the Bookmarklet:</strong> Go to the "Space Export" tab. Drag the "Copy Code" button to your bookmarks bar, or manually create a bookmark and paste the javascript code into the URL field.
          </li>
          
          <li className="bg-zinc-100 dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-[#27272a]">
            <strong className="text-zinc-900 dark:text-[#e4e4e7]">Execute Extraction:</strong> Open Perplexity.ai and navigate into the specific Space you want to migrate. Click the bookmark you created. The script will run in the background, discover all threads, and fetch their contents individually.
          </li>
          
          <li className="bg-zinc-100 dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-[#27272a]">
            <strong className="text-zinc-900 dark:text-[#e4e4e7]">Upload & Map:</strong> Bring the downloaded <code>.json</code> file back to this application. Use the Custom Mapping Rules tab to define what gets included in the final output (e.g. ignoring Artifacts, truncating overly long threads).
          </li>
          
          <li className="bg-zinc-100 dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-[#27272a]">
            <strong className="text-zinc-900 dark:text-[#e4e4e7]">Import to Google AI:</strong>
            <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
              <li>For <strong>NotebookLM</strong>: Choose "Download .md", create a new Notebook, and drop the markdown file into the Sources panel.</li>
              <li>For <strong>Gemini Gems</strong>: Choose "Copy Prompt", create a new Gem, and paste the entire clipboard into the "Instructions" text area to instantly teach the Gem your context.</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
}
