
import React, { useState } from 'react';
import { Project, BuildLog } from '../types';

interface BuildCenterProps {
  project: Project | null;
}

const BuildCenter: React.FC<BuildCenterProps> = ({ project }) => {
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activePipeline, setActivePipeline] = useState<string | null>(null);

  const startBuild = (target: string) => {
    setIsBuilding(true);
    setActivePipeline(target);
    setProgress(0);
    setLogs([]);
    addLog('info', `SW_FACTORY: Starting build process for [${target.toUpperCase()}]...`);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 8;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setIsBuilding(false);
        addLog('success', `SW_FACTORY: Artifact compilation complete. Project binary signed.`);
      }
      setProgress(currentProgress);
      
      const factoryStep = [
        'Initializing Docker build environment...',
        'Checking hardware acceleration (WASM)...',
        'Bundling source modules...',
        'Generating native bridge layers...',
        'Optimizing assets for target OS...',
        'Creating application bundle manifest...',
        'Running final security audit...'
      ];
      if (Math.random() > 0.65) {
        addLog('info', factoryStep[Math.floor(Math.random() * factoryStep.length)]);
      }
    }, 600);
  };

  const addLog = (type: BuildLog['type'], message: string) => {
    setLogs(prev => [
      { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type, message },
      ...prev
    ]);
  };

  if (!project) return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
      <span className="material-symbols-outlined text-6xl opacity-20">inventory_2</span>
      <p className="font-bold text-sm">SELECT A PROJECT TO ACTIVATE BUILD PIPELINES</p>
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start">
           <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tighter">SOFTWARE FACTORY</h2>
            <p className="text-slate-400 text-lg">Generate native binaries for Windows, Android, and Web.</p>
          </div>
          <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
             <span className="text-[10px] font-black text-primary tracking-widest">PIPELINE_READY</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-[#111a22] border border-slate-800 rounded-[2rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center gap-3">
               <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">package_2</span></div>
               <h3 className="text-xl font-bold text-white uppercase tracking-wider">Source Distribution</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-primary/50 transition-all group">
                <div className="flex items-center gap-4">
                   <div className="size-12 bg-white/5 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-slate-400">zip_box</span></div>
                   <div className="text-left"><p className="text-sm font-bold text-white">Full Project Repository</p><p className="text-[10px] text-slate-500 uppercase font-mono">source_v1.0.zip • 12.4 MB</p></div>
                </div>
                <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">download</span>
              </button>
            </div>
          </div>

          <div className="bg-[#111a22] border border-slate-800 rounded-[2rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center gap-3">
               <div className="size-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">deployed_code</span></div>
               <h3 className="text-xl font-bold text-white uppercase tracking-wider">Binary compilation</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                disabled={isBuilding}
                onClick={() => startBuild('Android APK')}
                className="group p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/50 transition-all flex flex-col items-center gap-4"
              >
                <span className="material-symbols-outlined text-3xl text-emerald-500 group-hover:scale-110 transition-transform">android</span>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Android APK</span>
              </button>
              <button 
                disabled={isBuilding}
                onClick={() => startBuild('Windows EXE')}
                className="group p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all flex flex-col items-center gap-4"
              >
                <span className="material-symbols-outlined text-3xl text-blue-500 group-hover:scale-110 transition-transform">window</span>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Windows EXE</span>
              </button>
            </div>
          </div>
        </div>

        {isBuilding && (
          <div className="bg-[#111a22] border border-slate-800 rounded-[2rem] p-10 space-y-6 shadow-[0_20px_50px_rgba(19,127,236,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-primary animate-[shimmer_2s_infinite]" style={{width: '100%'}}></div>
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">Building: {activePipeline}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">PIPELINE_ID: B-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
               </div>
               <span className="text-3xl font-black text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-900 h-6 rounded-full overflow-hidden p-1">
               <div className="h-full bg-primary rounded-full transition-all duration-300 relative overflow-hidden" style={{ width: `${progress}%` }}>
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Industrial-style Terminal Panel */}
      <aside className="w-[450px] bg-black border-l border-slate-800 flex flex-col shrink-0 font-mono overflow-hidden">
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STDOUT_STREAM</span>
           </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-3 bg-[#050505]">
          {logs.map(log => (
            <div key={log.id} className="flex gap-4 text-[10px] leading-relaxed">
              <span className="text-slate-700 shrink-0">[{log.timestamp}]</span>
              <span className={`font-black shrink-0 ${
                log.type === 'info' ? 'text-blue-500' :
                log.type === 'success' ? 'text-emerald-500' :
                log.type === 'warning' ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {log.type.toUpperCase()}
              </span>
              <span className="text-slate-400">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
               <span className="material-symbols-outlined text-4xl mb-4">terminal</span>
               <p className="text-[10px] font-black">WAITING_FOR_BUILD_HOOK</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default BuildCenter;
