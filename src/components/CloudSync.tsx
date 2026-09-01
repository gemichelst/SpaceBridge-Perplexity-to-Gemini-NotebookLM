import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, Server, Clock, RefreshCw, HardDrive, LogOut, Trash2 } from 'lucide-react';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/auth';
import type { User } from 'firebase/auth';

export function CloudSync() {
  const [syncing, setSyncing] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => { setNeedsAuth(false); setUser(u); setToken(t); },
      () => { setNeedsAuth(true); setUser(null); setToken(null); }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDriveExport = async () => {
    if (!token) {
      alert("Please sign in to Google first.");
      return;
    }
    
    setSyncing(true);
    try {
      const allData = {
        history: localStorage.getItem('spacebridge-history'),
        drafts: localStorage.getItem('spacebridge-drafts'),
        rules: localStorage.getItem('spacebridge-rules'),
        schedules: localStorage.getItem('spacebridge-schedules'),
      };
      
      const fileMetadata = {
        name: `spacebridge-backup-${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json',
      };
      
      const fileData = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', fileData);
      
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      
      if (!res.ok) throw new Error("Failed to upload to Google Drive");
      
      const result = await res.json();
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem('spacebridge-lastsync', now);
      alert('Successfully backed up to Google Drive! File ID: ' + result.id);
    } catch (err: any) {
      alert("Google Drive Backup Error: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

    const [autoBackupEnabled, setAutoBackupEnabled] = useState(localStorage.getItem('spacebridge-autobackup') === 'true');
  const [autoBackups, setAutoBackups] = useState<{timestamp: string, data: string}[]>(() => {
    const s = localStorage.getItem('spacebridge-autobackups');
    return s ? JSON.parse(s) : [];
  });

  useEffect(() => {
    localStorage.setItem('spacebridge-autobackup', String(autoBackupEnabled));
    if (!autoBackupEnabled) return;
    
    const interval = setInterval(() => {
       const currentDrafts = localStorage.getItem('spacebridge-drafts');
       if (currentDrafts && currentDrafts.length > 10) {
         const timestamp = new Date().toLocaleString();
         setAutoBackups(prev => {
            const isDifferent = prev.length === 0 || prev[0].data !== currentDrafts;
            if (!isDifferent) return prev;
            const next = [{ timestamp, data: currentDrafts }, ...prev].slice(0, 5);
            localStorage.setItem('spacebridge-autobackups', JSON.stringify(next));
            return next;
         });
       }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [autoBackupEnabled]);

  const restoreAutoBackup = (backupStr: string) => {
    if(!confirm('Are you sure you want to restore this auto-backup? Current drafts will be replaced.')) return;
    localStorage.setItem('spacebridge-drafts', backupStr);
    window.location.reload();
  };

  const [lastSync, setLastSync] = useState(localStorage.getItem('spacebridge-lastsync') || 'Never');

  const handleBackup = () => {
    setSyncing(true);
    setTimeout(() => {
      const allData = {
        history: localStorage.getItem('spacebridge-history'),
        drafts: localStorage.getItem('spacebridge-drafts'),
        rules: localStorage.getItem('spacebridge-rules'),
        schedules: localStorage.getItem('spacebridge-schedules'),
      };
      const blob = new Blob([JSON.stringify(allData)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spacebridge-backup.json';
      a.click();
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem('spacebridge-lastsync', now);
      setSyncing(false);
    }, 1000);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSyncing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.history) localStorage.setItem('spacebridge-history', data.history);
        if (data.drafts) localStorage.setItem('spacebridge-drafts', data.drafts);
        if (data.rules) localStorage.setItem('spacebridge-rules', data.rules);
        if (data.schedules) localStorage.setItem('spacebridge-schedules', data.schedules);
        alert('Restore complete! Reloading app...');
        window.location.reload();
      } catch (err) {
        alert('Invalid backup file.');
        setSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500 dark:text-indigo-400">
          <Cloud className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Cloud & Backup Sync</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-6 text-center">
          <Server className="w-8 h-8 mx-auto mb-4 text-emerald-500" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-[#e4e4e7] mb-2">Export Local State</h3>
          <p className="text-sm text-zinc-500 dark:text-[#71717a] mb-6">Download a complete backup of all your drafts, history, and mapping rules.</p>
          <button 
            onClick={handleBackup}
            disabled={syncing}
            className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Backup Now
          </button>
        </div>

        <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-6 text-center">
          <Cloud className="w-8 h-8 mx-auto mb-4 text-indigo-500" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-[#e4e4e7] mb-2">Restore Backup</h3>
          <p className="text-sm text-zinc-500 dark:text-[#71717a] mb-6">Upload a previous spacebridge-backup.json file to restore your state.</p>
          <label className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Select File
            <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
          </label>
        </div>

        <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-6 text-center md:col-span-2 mt-4">
          <HardDrive className="w-8 h-8 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-[#e4e4e7] mb-2">Google Drive Cloud Sync</h3>
          <p className="text-sm text-zinc-500 dark:text-[#71717a] mb-6">Securely backup and restore your SpaceBridge state directly to your Google Drive account.</p>
          
          {needsAuth ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg transition-colors shadow-md"
            >
              {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-[#a1a1aa] bg-white dark:bg-[#27272a] px-4 py-2 rounded-full border border-zinc-200 dark:border-[#3f3f46]">
                <span>Connected as <strong>{user?.email || 'User'}</strong></span>
                <button onClick={logout} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={handleDriveExport}
                disabled={syncing}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-md w-full sm:w-auto"
              >
                <Cloud className="w-4 h-4" /> Save Backup to Drive
              </button>
            </div>
          )}
        </div>

      </div>
      
      <div className="mt-6 text-center text-xs text-zinc-500 dark:text-[#71717a]">
        Last manual backup: {lastSync}
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-[#27272a]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-[#e4e4e7] mb-1">Automated Backups</h3>
            <p className="text-sm text-zinc-500 dark:text-[#71717a]">Automatically save snapshots of your drafts every minute to local storage.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={autoBackupEnabled} onChange={() => setAutoBackupEnabled(!autoBackupEnabled)} />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-[#27272a] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
          </label>
        </div>

        <div className="space-y-3">
          {autoBackups.length === 0 ? (
            <div className="text-sm text-zinc-500 dark:text-[#71717a] py-4 text-center bg-zinc-50 dark:bg-[#18181b] rounded-lg border border-zinc-200 dark:border-[#27272a]">No auto-backups available yet. Enable and wait 1 minute.</div>
          ) : (
            autoBackups.map((bkp, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-[#e4e4e7]">{bkp.timestamp}</span>
                </div>
                <button onClick={() => restoreAutoBackup(bkp.data)} className="flex items-center gap-2 text-xs font-semibold bg-white dark:bg-[#27272a] border border-zinc-200 dark:border-[#3f3f46] hover:bg-zinc-50 dark:hover:bg-[#3f3f46] text-zinc-900 dark:text-white px-3 py-1.5 rounded transition-colors shadow-sm">
                  <RefreshCw className="w-3 h-3" /> Restore
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-[#27272a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl">
          <div>
            <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" /> Dynamic Cache Purge
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300/80">Clear all locally stored drafts, history, and settings. This action is irreversible.</p>
          </div>
          <button 
            onClick={() => {
              if(confirm('WARNING: This will permanently delete all local SpaceBridge data (drafts, history, schedules). Are you absolutely sure?')) {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key.startsWith('spacebridge-')) {
                    keysToRemove.push(key);
                  }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                alert('Cache purged successfully. Reloading.');
                window.location.reload();
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors shadow-md whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" /> Purge Cache
          </button>
        </div>
      </div>

    </div>
  );
}
