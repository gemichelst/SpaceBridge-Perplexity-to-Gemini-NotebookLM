import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, Bell, Trash2 } from 'lucide-react';

interface Schedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
}

export function Scheduling() {
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const s = localStorage.getItem('spacebridge-schedules');
    return s ? JSON.parse(s) : [];
  });

  const [newName, setNewName] = useState('');
  const [newFreq, setNewFreq] = useState<'daily'|'weekly'|'monthly'>('weekly');
  const [newTime, setNewTime] = useState('17:00');

  useEffect(() => {
    localStorage.setItem('spacebridge-schedules', JSON.stringify(schedules));
  }, [schedules]);

  const addSchedule = () => {
    if (!newName) return;
    setSchedules([...schedules, {
      id: Math.random().toString(36).substring(7),
      name: newName,
      frequency: newFreq,
      time: newTime,
      enabled: true
    }]);
    setNewName('');
  };

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };
  
  const toggleSchedule = (id: string) => {
    setSchedules(schedules.map(s => s.id === id ? {...s, enabled: !s.enabled} : s));
  };

  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500 dark:text-indigo-400">
          <CalendarClock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-[#e4e4e7]">Export Scheduling & Reminders</h2>
      </div>

      <p className="text-sm text-zinc-600 dark:text-[#a1a1aa] mb-8 leading-relaxed">
        Because SpaceBridge operates entirely client-side (for your security), it cannot automatically pull from Perplexity while you are away. Set up schedules here to receive browser notifications reminding you to run the export bookmarklet.
      </p>

      <div className="bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-5 mb-8">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-[#e4e4e7] mb-4">Add Reminder Schedule</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" 
            placeholder="e.g. My Main Project Workspace"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-[#e4e4e7] focus:outline-none focus:border-indigo-500"
          />
          <select 
            value={newFreq}
            onChange={(e) => setNewFreq(e.target.value as any)}
            className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-[#e4e4e7] focus:outline-none focus:border-indigo-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input 
            type="time" 
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-[#e4e4e7] focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={addSchedule}
            disabled={!newName}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-[#e4e4e7] mb-4">Active Reminders</h3>
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500 dark:text-[#71717a]">No schedules set up yet.</div>
        ) : (
          schedules.map(schedule => (
            <div key={schedule.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${schedule.enabled ? 'bg-white dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a]' : 'bg-zinc-50 dark:bg-[#0c0c0e] border-zinc-200 dark:border-[#27272a] opacity-60'}`}>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleSchedule(schedule.id)} className={`p-2 rounded-full ${schedule.enabled ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400' : 'bg-zinc-200 dark:bg-[#27272a] text-zinc-400 dark:text-[#71717a]'}`}>
                  <Bell className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-[#e4e4e7]">{schedule.name}</h4>
                  <p className="text-xs text-zinc-500 dark:text-[#71717a] capitalize">{schedule.frequency} at {schedule.time}</p>
                </div>
              </div>
              <button onClick={() => removeSchedule(schedule.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-[#27272a]">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
