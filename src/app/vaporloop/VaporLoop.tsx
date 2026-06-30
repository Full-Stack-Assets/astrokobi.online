'use client';

import React, { useState, useEffect, useRef } from 'react';

const Icons = {
  Cpu: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  DollarSign: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  History: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Terminal: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Desktop: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Mobile: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

const SAMPLE_DRAFT_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Enterprise Analytics Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-50 p-8 min-h-screen">
    <main class="max-w-4xl mx-auto space-y-6">
        <header class="border-b border-zinc-900 pb-4">
            <h1 class="text-xl font-bold tracking-tight">VaporMetrics Console</h1>
            <p class="text-xs text-zinc-400">Monitoring real-time database loads and MRR rates.</p>
        </header>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-5 bg-zinc-900 rounded-xl border border-zinc-800">
                <span class="text-xs text-zinc-500 uppercase">Monthly Recurring Revenue</span>
                <h2 class="text-2xl font-bold mt-1 text-indigo-400">$142,390</h2>
            </div>
            <div class="p-5 bg-zinc-900 rounded-xl border border-zinc-800">
                <span class="text-xs text-zinc-500 uppercase">Interactive Log Row</span>
                <input id="logVal" type="text" placeholder="Write custom payload tag..." class="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 mt-2 w-full focus:outline-none focus:border-indigo-500" />
            </div>
        </div>
    </main>
</body>
</html>`;

const HEALED_ACCESSIBLE_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Enterprise Analytics Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :focus-visible { outline: 3px solid #6366f1 !important; outline-offset: 3px !important; }
        :focus:not(:focus-visible) { outline: none !important; }
    </style>
</head>
<body class="bg-zinc-950 text-zinc-50 p-8 min-h-screen">
    <main id="main-content" class="max-w-4xl mx-auto space-y-6" aria-label="System Dashboard View">
        <header class="border-b border-zinc-900 pb-4">
            <h1 class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">VaporMetrics Console</h1>
            <p class="text-xs text-zinc-400">Monitoring real-time database loads and MRR rates.</p>
        </header>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-6 bg-zinc-900 rounded-2xl border border-zinc-850">
                <span class="text-xs text-zinc-500 uppercase font-mono">Monthly Recurring Revenue</span>
                <h2 class="text-3xl font-extrabold mt-2 text-indigo-400">$142,390</h2>
            </div>
            <div class="p-6 bg-zinc-900 rounded-2xl border border-zinc-850 space-y-3">
                <span class="text-xs text-zinc-500 uppercase font-mono">Interactive Log Row</span>
                <input id="logVal" type="text" placeholder="Write custom payload tag..." aria-label="Interactive log record entry" class="bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 w-full focus:outline-none focus:border-indigo-500 transition" />
            </div>
        </div>
    </main>
</body>
</html>`;

type LogType = 'system' | 'security' | 'success' | 'error';

interface LogEntry {
  time: string;
  type: LogType;
  msg: string;
}

interface Checkpoint {
  attempt: number;
  timestamp: string;
  code: string;
  status: string;
  errors: string | null;
  cost: number;
}

interface DbRow {
  id: number;
  created_at: string;
  project_id: string;
  payload: Record<string, string>;
}

export default function VaporLoop() {
  const [activeTab, setActiveTab] = useState('workspace');
  const [prompt, setPrompt] = useState('');
  const [maxBudget, setMaxBudget] = useState(1.5);
  const [viewMode, setViewMode] = useState('desktop');

  const [enableEnhancer, setEnableEnhancer] = useState(true);
  const [enableRls, setEnableRls] = useState(true);
  const [enableA11y, setEnableA11y] = useState(true);

  // Compile & Pipeline Steps
  const [isGenerating, setIsGenerating] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [currentAppCode, setCurrentAppCode] = useState(HEALED_ACCESSIBLE_CODE);
  const [, setCurrentAppName] = useState('Enterprise Analytics Console');
  const [projectId, setProjectId] = useState('vpr-e3a8');
  const [actualCost, setActualCost] = useState(0.015);

  // SSE References
  const sseRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: '10:02:00', type: 'system', msg: 'VaporLoop Engine V3.3 running diagnostics...' },
    { time: '10:02:01', type: 'security', msg: 'Multi-tenant RLS guards active on Supabase cluster.' },
    { time: '10:02:02', type: 'success', msg: 'Gateway connection validated on *.vaporloop.com.' },
  ]);

  // Version Control Checkpoints
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([
    {
      attempt: 1,
      timestamp: '10:02:01',
      code: SAMPLE_DRAFT_CODE,
      status: 'Errors Detected',
      errors: 'WCAG 2.2 Warning: Input tags missing aria-label attributes. Missing viewport metadata.',
      cost: 0.007,
    },
    {
      attempt: 2,
      timestamp: '10:02:05',
      code: HEALED_ACCESSIBLE_CODE,
      status: 'Valid & Compliant',
      errors: null,
      cost: 0.015,
    },
  ]);
  const [, setSelectedCheckpoint] = useState(1);

  // Database Row Simulator Playground
  const [dbRows, setDbRows] = useState<DbRow[]>([
    { id: 1, created_at: '2026-05-27 10:01:00', project_id: 'vpr-e3a8', payload: { metrics: 'Uptime 99.9%', load: '0.02%' } },
    { id: 2, created_at: '2026-05-27 10:01:45', project_id: 'vpr-e3a8', payload: { metrics: 'LCP 1.1s', size: '142KB' } },
    { id: 3, created_at: '2026-05-27 10:02:10', project_id: 'vpr-7b4a', payload: { metrics: 'Blocked Tenant Attempt', auth: 'Guest' } },
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Cleanup SSE on projectId change
  useEffect(() => {
    return () => {
      stopSse();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [projectId]);

  const stopSse = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  };

  const addLog = (msg: string, type: LogType = 'system') => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [...prev, { time: timeStr, type, msg }]);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const executePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setBuildStep(1);
    const newProjId = 'vpr-' + Math.random().toString(36).substring(2, 6);
    setProjectId(newProjId);

    addLog(`Pipeline triggered: "${prompt.slice(0, 35)}..."`, 'system');
    addLog(`Setting execution budget ceiling: $${maxBudget.toFixed(2)} USD`, 'security');

    // Phase 1: Enhancement
    await delay(1000);
    setBuildStep(2);
    addLog('Specification enhancer running requirements analysis...', 'system');

    // Phase 2: Synthesis
    await delay(1200);
    setBuildStep(3);
    addLog('Evaluating generated code parameters...', 'system');

    // Phase 3: Healing
    await delay(1000);
    setBuildStep(4);
    addLog('Structural warnings caught on Pass 1. Applying healing patches...', 'error');

    // Phase 4: Done
    await delay(1200);
    setBuildStep(5);
    setIsGenerating(false);

    const generatedCode = HEALED_ACCESSIBLE_CODE.replace('vpr-e3a8', newProjId);
    setCurrentAppCode(generatedCode);
    setCurrentAppName(prompt.slice(0, 24) + '...');
    setActualCost(0.0132);

    const updatedCheckpoints: Checkpoint[] = [
      {
        attempt: 1,
        timestamp: 'Phase 1 Draft',
        code: SAMPLE_DRAFT_CODE,
        status: 'Errors Detected',
        errors: 'Accessibility Warnings found: input is missing clear description.',
        cost: 0.006,
      },
      {
        attempt: 2,
        timestamp: 'Phase 2 Healed',
        code: generatedCode,
        status: 'Valid & Compliant',
        errors: null,
        cost: 0.0132,
      },
    ];
    setCheckpoints(updatedCheckpoints);
    setSelectedCheckpoint(1);

    setDbRows((prev) => [
      { id: Date.now(), created_at: '2026-05-27 10:02:40', project_id: newProjId, payload: { metrics: 'VaporLoop Instance Created', log: 'Active Node' } },
      ...prev,
    ]);

    addLog('Self-healing successful. Script dependencies resolved.', 'success');
    addLog(`App deployed. Domain online at: https://${newProjId}.vaporloop.com`, 'success');
  };

  const renderDiffLine = (line: string, isLeft: boolean) => {
    const isDocType = line.startsWith('<!DOCTYPE') || line.startsWith('<html') || line.startsWith('<head>');
    if (isDocType) return <span className="text-zinc-500">{line}</span>;
    if (line.includes('aria-label') || line.includes('viewport') || line.includes('focus-visible')) {
      return isLeft ? (
        <span className="bg-rose-950/40 text-rose-300 block w-full truncate">- {line.trim()}</span>
      ) : (
        <span className="bg-emerald-950/40 text-emerald-300 block w-full truncate">+ {line.trim()}</span>
      );
    }
    return <span className="text-zinc-400">{line}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-zinc-950 text-zinc-100 font-sans overflow-hidden">

      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-6 shrink-0 select-none">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              V
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-sm block leading-none bg-gradient-to-r from-zinc-50 to-zinc-300 bg-clip-text text-transparent">VaporLoop V3.3</span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5 block">App Engine Factory</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'workspace' ? 'bg-zinc-900 text-zinc-100 border border-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <Icons.Sparkles />
              Autonomous Workspace
            </button>
            <button
              onClick={() => setActiveTab('checkpoints')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'checkpoints' ? 'bg-zinc-900 text-zinc-100 border border-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <Icons.History />
              S3 Diff Inspect
              <span className="ml-auto bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-[9px] px-1.5 py-0.5 rounded-full">
                2 CP
              </span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'security' ? 'bg-zinc-900 text-zinc-100 border border-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <Icons.ShieldCheck />
              Supabase RLS & DB
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'telemetry' ? 'bg-zinc-900 text-zinc-100 border border-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <Icons.Terminal />
              System Telemetry
            </button>
          </nav>
        </div>

        <div className="border-t border-zinc-900 pt-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-[11px] text-zinc-400 font-medium">BaaS API Sync Active</span>
          </div>
        </div>
      </aside>

      {/* Workspace Display */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">

        {activeTab === 'workspace' && (
          <div className="flex h-full w-full overflow-hidden">

            {/* Split Parameters Panel */}
            <div className="w-[420px] border-r border-zinc-900 p-6 flex flex-col justify-between h-full overflow-y-auto shrink-0 bg-zinc-950/60">
              <div className="space-y-6">
                <div>
                  <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
                    Interactive Ingress
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1">
                    Configure the options panel below and describe the desired dynamic application logic.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Pipeline Middleware</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-zinc-300 block">Prompt Spec Enhancer</span>
                        <span className="text-[10px] text-zinc-500">Auto-detail incomplete specs</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableEnhancer}
                        onChange={(e) => setEnableEnhancer(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0 h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-zinc-300 block">Row-Level Security Integration</span>
                        <span className="text-[10px] text-zinc-500">Inject database tenant keys</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableRls}
                        onChange={(e) => setEnableRls(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0 h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-zinc-300 block">WCAG 2.2 Optimizer</span>
                        <span className="text-[10px] text-zinc-500">Accessibility structural auditing</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableA11y}
                        onChange={(e) => setEnableA11y(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0 h-4 w-4"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-zinc-900/10 border border-zinc-900 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Budget Limit Target</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">${maxBudget.toFixed(2)} USD</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="5.00"
                    step="0.25"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <form onSubmit={executePipeline} className="space-y-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    placeholder="e.g. Build an enterprise client roster log CRM that saves client contact names and phone numbers..."
                    className="w-full h-28 rounded-2xl bg-zinc-900 border border-zinc-850 p-4 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none transition"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-600 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {isGenerating ? 'Forging Codebase...' : 'Build Autonomous App'}
                  </button>
                </form>
              </div>

              {/* Progress Telemetry Sequencer Visualizer */}
              {isGenerating && (
                <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Build Sequence Telemetry</span>
                  <div className="space-y-2 text-[10px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">1. Prompt Enhancement</span>
                      <span className={buildStep >= 1 ? 'text-emerald-400' : 'text-zinc-600'}>● {buildStep >= 1 ? 'Done' : 'Pending'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">2. Layout Synthesis</span>
                      <span className={buildStep >= 2 ? 'text-emerald-400' : 'text-zinc-600'}>● {buildStep >= 2 ? 'Done' : 'Pending'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">3. Structural Tag Verification</span>
                      <span className={buildStep >= 3 ? 'text-emerald-400' : 'text-zinc-600'}>● {buildStep >= 3 ? 'Done' : 'Pending'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">4. Dynamic Healing Loop</span>
                      <span className={buildStep >= 4 ? 'text-amber-400' : 'text-zinc-600'}>● {buildStep >= 4 ? 'Active' : 'Pending'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Display Iframe Column */}
            <div className="flex-1 bg-zinc-950 flex flex-col h-full overflow-hidden">
              <div className="h-14 border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-950 shrink-0 select-none">
                <div className="h-8 bg-zinc-900/80 border border-zinc-850/80 rounded-xl px-4 flex items-center text-[11px] text-zinc-400 max-w-xl w-full truncate font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2.5"></span>
                  https://{projectId}.vaporloop.com
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-850">
                    Cost Metrics: <span className="text-zinc-200">${actualCost.toFixed(4)} USD</span>
                  </div>
                  <div className="bg-zinc-900 p-0.5 rounded-xl flex items-center border border-zinc-800">
                    <button onClick={() => setViewMode('desktop')} className={`p-1 rounded-md ${viewMode === 'desktop' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-50'}`}><Icons.Desktop /></button>
                    <button onClick={() => setViewMode('mobile')} className={`p-1 rounded-md ${viewMode === 'mobile' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-50'}`}><Icons.Mobile /></button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 bg-zinc-900/10 flex items-center justify-center overflow-hidden">
                <div className={`h-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-zinc-850 transition-all duration-300 ${
                  viewMode === 'mobile' ? 'w-[375px] max-h-[760px]' : 'w-full'
                }`}>
                  <iframe srcDoc={currentAppCode} className="w-full h-full bg-white" title="VaporLoop Viewport" sandbox="allow-scripts" />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Checkpoint S3 Visual Split Diff Tab */}
        {activeTab === 'checkpoints' && (
          <div className="p-8 space-y-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <div>
              <h1 className="text-xl font-bold tracking-tight">S3 Version Inspector</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Visually examine the code differences changed during the self-healing passes before edge publication.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Draft Left Column */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-zinc-400">Step 1: Original Unstructured Code</span>
                <div className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-5 overflow-hidden font-mono text-[11px] h-[480px] overflow-y-auto leading-relaxed">
                  {checkpoints[0].code.split('\n').map((line, idx) => (
                    <div key={idx}>{renderDiffLine(line, true)}</div>
                  ))}
                </div>
              </div>

              {/* Healed Right Column */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-zinc-400">Step 2: Corrected, WCAG 2.2 Compliant Build</span>
                <div className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-5 overflow-hidden font-mono text-[11px] h-[480px] overflow-y-auto leading-relaxed">
                  {checkpoints[1].code.split('\n').map((line, idx) => (
                    <div key={idx}>{renderDiffLine(line, false)}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database RLS Multi-Tenant Playground */}
        {activeTab === 'security' && (
          <div className="p-8 space-y-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Supabase RLS & Database Playground</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Simulate how Row-Level Security policies filter database values to guarantee multi-tenant tenant isolation.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Database Visual Inspector */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-300">Global Database Table: apps_data</h3>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase">Live View</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500">
                        <th className="py-2">ID</th>
                        <th>Project Scope ID</th>
                        <th>Record Data Payload</th>
                        <th>RLS Filter Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {dbRows.map((row) => (
                        <tr key={row.id}>
                          <td className="py-3">{row.id.toString().slice(-4)}</td>
                          <td className="text-indigo-400 font-bold">{row.project_id}</td>
                          <td>{JSON.stringify(row.payload)}</td>
                          <td>
                            {row.project_id === projectId ? (
                              <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px]">Visible to App</span>
                            ) : (
                              <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded text-[9px]">Blocked (Isolated)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Isolated Policy Info Panel */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl col-span-1 space-y-4">
                <h3 className="font-bold text-sm text-zinc-300">Tenant Access Isolation</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Only rows matching your active workspace ID (<span className="text-indigo-400 font-mono font-bold">{projectId}</span>) are accessible to the app.
                  Any request attempting to pull rows belonging to other project tokens is blocked.
                </p>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                  <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed select-all">
{`CREATE POLICY "Access Isolation"
ON apps_data FOR ALL
USING (project_id = '${projectId}');`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry diagnostics */}
        {activeTab === 'telemetry' && (
          <div className="p-8 space-y-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Active Process Telemetry</h1>
                <p className="text-xs text-zinc-400 mt-1">Real-time compiler loops, validation tracking, and edge CDN invalidations.</p>
              </div>
              <button onClick={() => setLogs([])} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-xl">Clear Console</button>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 font-mono text-xs overflow-y-auto h-[480px] flex flex-col justify-between">
              <div className="space-y-3">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                    {log.type === 'success' && <span className="text-emerald-400 font-bold shrink-0">OK:</span>}
                    {log.type === 'error' && <span className="text-rose-400 font-bold shrink-0">ERR:</span>}
                    {log.type === 'security' && <span className="text-indigo-400 font-bold shrink-0">SEC:</span>}
                    {log.type === 'system' && <span className="text-zinc-500 shrink-0">SYS:</span>}
                    <span className="text-zinc-300 leading-relaxed">{log.msg}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
