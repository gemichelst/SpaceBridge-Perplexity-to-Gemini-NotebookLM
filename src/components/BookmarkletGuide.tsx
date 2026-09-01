import React, { useRef, useEffect } from 'react';
import { Copy, CheckCircle2, Bookmark, Terminal, AlertTriangle, ShieldCheck, Download } from 'lucide-react';

const BOOKMARKLET_CODE = "javascript:(function(){ async function run(){ alert('SpaceBridge: Starting Deep Extraction. Please stay on this tab and DO NOT CLICK AWAY. Fetching may take 10-20 seconds...'); for(let i=0; i<3; i++) { window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 1500)); } let data = { title: document.title.replace(/ - Perplexity/i, '').trim() || 'Extracted Space', url: window.location.href, timestamp: new Date().toISOString(), instructions: 'No explicit instructions found.', threads: [], artifacts: [], apps: [] }; try { const textareas = Array.from(document.querySelectorAll('textarea')); if (textareas.length > 0) { data.instructions = textareas.map(t => t.value).filter(v => v.length > 0).join('\\n\\n'); } else { const match = document.body.innerText.match(/Instructions[\\s\\S]*?(?=\\n\\n|$)/i); if (match) data.instructions = match[0]; } const uniqueThreads = new Map(); Array.from(document.querySelectorAll('a')).forEach(a => { if (!a.href) return; if (a.href.includes('/search/') || a.href.includes('perplexity.ai/search') || a.href.match(/[0-9a-f]{8}-[0-9a-f]{4}/i)) { const title = a.innerText.trim() || a.getAttribute('aria-label') || 'Untitled Thread'; if (title.length > 2 && !uniqueThreads.has(a.href)) uniqueThreads.set(a.href, { title, url: a.href, content: '' }); } }); if (uniqueThreads.size === 0) { Array.from(document.querySelectorAll('div')).filter(d => (typeof d.className === 'string' && d.className.includes('cursor-pointer')) || d.getAttribute('role') === 'button' || d.getAttribute('role') === 'link').forEach((d, i) => { const title = d.innerText.split('\\n')[0].trim(); if (title.length > 3 && title.length < 150) uniqueThreads.set('local-' + i, { title, url: window.location.href, content: d.innerText }); }); } data.threads = Array.from(uniqueThreads.values()); if (data.threads.length === 0) { data.threads.push({ title: 'Main Page Content (Fallback)', url: window.location.href, content: document.body.innerText.substring(0, 50000) }); } if (data.threads.length === 0 && data.instructions === 'No explicit instructions found.' && document.body.innerText.length < 1000) { alert('SpaceBridge Error: No data found! Are you on a valid Space page?'); return; } let fetchCount = 0; const maxFetch = 20; for (let i = 0; i < Math.min(data.threads.length, maxFetch); i++) { if (!data.threads[i].url.startsWith('http')) continue; let success = false; for(let retry=0; retry<3; retry++) { try { const res = await fetch(data.threads[i].url, { cache: 'no-store' }); if(!res.ok) throw new Error('HTTP '+res.status); const html = await res.text(); const nextDataMatch = html.match(/<script id=\"__NEXT_DATA__\" type=\"application\\/json\">([\\s\\S]*?)<\\/script>/); if (nextDataMatch && nextDataMatch[1]) { const nextData = JSON.parse(nextDataMatch[1]); data.threads[i].content = JSON.stringify(nextData.props || nextData, null, 2).substring(0, 15000) + '\\n\\n... [State Extracted]'; } else { const parser = new DOMParser(); const doc = parser.parseFromString(html, 'text/html'); let textContent = Array.from(doc.querySelectorAll('.prose, main, [class*=\"prose\"], article')).map(e => e.innerText).join('\\n\\n'); if (!textContent || textContent.length < 50) textContent = doc.body.innerText.replace(/\\n{3,}/g, '\\n\\n').substring(0, 15000); data.threads[i].content = textContent || 'Empty content retrieved.'; } fetchCount++; success = true; break; } catch(err) { if(retry === 2) data.threads[i].content = 'Failed after 3 retries: ' + err.message; await new Promise(r => setTimeout(r, 1000)); } } } const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}); const urlObj = URL.createObjectURL(blob); const aObj = document.createElement('a'); aObj.href = urlObj; aObj.download = 'spacebridge-export-' + Date.now() + '.json'; document.body.appendChild(aObj); aObj.click(); document.body.removeChild(aObj); URL.revokeObjectURL(urlObj); alert('SpaceBridge Complete! Extracted ' + data.threads.length + ' threads (' + fetchCount + ' deep-fetched).'); } catch (mainErr) { alert('SpaceBridge Extraction Failed: ' + mainErr.message); } } run(); })();";

export function BookmarkletGuide() {
  const [copied, setCopied] = React.useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.setAttribute('href', BOOKMARKLET_CODE);
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500 dark:text-indigo-400">
          <Bookmark className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Step 1: Extract the Space</h2>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
          <strong>Extraction Validation & Retries Enabled:</strong> The script now validates DOM structures before downloading and automatically retries network requests up to 3 times to bypass rate-limits or transient failures.
        </p>
      </div>

      <p className="text-zinc-600 dark:text-[#a1a1aa] mb-6 leading-relaxed">
        Perplexity spaces are private. To securely extract your data directly from your authenticated browser session, install the extraction bookmarklet.
      </p>

      <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-xl mb-8">
        <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Auto-Installer (Fastest)</h3>
        <p className="text-sm text-zinc-600 dark:text-[#a1a1aa] mb-4">Click and drag the button below into your browser's Bookmarks Bar.</p>
        <a 
          ref={linkRef} 
          onClick={(e) => { e.preventDefault(); alert('Please drag this button to your bookmarks bar! Do not click it here.'); }}
          className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-medium px-4 py-2 rounded-lg shadow-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-105"
        >
          <Download className="w-4 h-4" /> SpaceBridge Extractor
        </a>
      </div>

      <div className="bg-zinc-100 dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-[#27272a] p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-[#71717a]">
            <Terminal className="w-4 h-4" />
            <span>Manual Install (Copy Code)</span>
          </div>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-sm bg-zinc-200 dark:bg-[#27272a] hover:bg-zinc-300 dark:hover:bg-[#3f3f46] text-zinc-900 dark:text-[#e4e4e7] px-3 py-1.5 rounded-md transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>
        
        <pre className="text-xs text-zinc-600 dark:text-[#a1a1aa] font-mono overflow-x-auto p-4 bg-zinc-50 dark:bg-[#0c0c0e] rounded-lg whitespace-pre-wrap max-h-40">
          {BOOKMARKLET_CODE}
        </pre>
      </div>

      <div className="space-y-4 text-sm text-zinc-600 dark:text-[#a1a1aa]">
        <h4 className="text-zinc-900 dark:text-[#e4e4e7] font-medium">How to use:</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>Drag the "SpaceBridge Extractor" button to your bookmarks bar.</li>
          <li>Navigate to your Perplexity Space.</li>
          <li>Click the bookmark. <strong className="text-zinc-900 dark:text-zinc-200">Wait 10-20 seconds</strong> without clicking away. A <code className="bg-zinc-200 dark:bg-[#27272a] px-1 py-0.5 rounded text-zinc-900 dark:text-[#e4e4e7]">.json</code> file will download automatically.</li>
        </ol>
      </div>
    </div>
  );
}