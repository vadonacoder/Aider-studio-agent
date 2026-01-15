
import React, { useState, useEffect } from 'react';
import { Project, DeviceMode, ProjectFile } from '../types';
import { gemini } from '../services/geminiService';

interface StudioProps {
  project: Project;
  onUpdateProject: (p: Project) => void;
}

const Studio: React.FC<StudioProps> = ({ project, onUpdateProject }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [device, setDevice] = useState<DeviceMode>(DeviceMode.PC);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>(["Agent initialized.", "Waiting for architect instructions..."]);

  useEffect(() => {
    if (project.files.length > 0 && !activeFile) {
      setActiveFile(project.files[0].path);
    }
  }, [project.files]);

  const addLog = (msg: string) => {
    setAgentLogs(prev => [...prev.slice(-10), `> ${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const parseAIResponse = (text: string): ProjectFile[] => {
    const files: ProjectFile[] = [];
    const parts = text.split(/\[FILE: (.*?)\]/);
    
    if (parts[0].trim()) {
      files.push({ path: 'README.md', content: parts[0].trim(), language: 'markdown' });
    }

    for (let i = 1; i < parts.length; i += 2) {
      const path = parts[i].trim();
      const content = parts[i + 1]?.trim() || '';
      const ext = path.split('.').pop() || 'typescript';
      files.push({ path, content, language: ext === 'tsx' || ext === 'ts' ? 'typescript' : ext });
    }

    return files.length > 0 ? files : [{ path: 'App.tsx', content: text, language: 'typescript' }];
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    addLog(`Analyzing intent: "${prompt.substring(0, 30)}..."`);
    addLog("Consulting Gemini 3 Pro knowledge base...");
    
    try {
      const result = await gemini.generateAppBlueprint(prompt);
      const generatedFiles = parseAIResponse(result);
      
      addLog(`Generated ${generatedFiles.length} modules.`);
      addLog("Validating syntax and dependencies...");

      onUpdateProject({
        ...project,
        files: generatedFiles,
        lastEdited: new Date().toISOString()
      });
      
      setPrompt('');
      setActiveTab('code');
      if (generatedFiles.length > 0) setActiveFile(generatedFiles[0].path);
      addLog("Autonomous build successful.");
    } catch (error) {
      addLog("ERROR: Generation interrupted.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAction = async (action: 'explain' | 'refactor') => {
    if (!activeFile) return;
    const file = project.files.find(f => f.path === activeFile);
    if (!file) return;

    setIsGenerating(true);
    addLog(`AI Action: ${action.toUpperCase()} requested for ${activeFile}...`);
    
    try {
      // Simulate specialized AI action
      const result = await gemini.debugCode(file.content, `Action: ${action}`);
      addLog(`${action.toUpperCase()} complete.`);
      if (action === 'refactor') {
         onUpdateProject({
           ...project,
           files: project.files.map(f => f.path === activeFile ? { ...f, content: result } : f)
         });
      } else {
        alert("AI Explanation:\n\n" + result);
      }
    } catch (e) {
      addLog("Action failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentFileContent = project.files.find(f => f.path === activeFile)?.content || '';

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* File Explorer (Left) */}
      <aside className="w-64 border-r border-slate-800 bg-[#0b1219] flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Project Files</span>
          <span className="material-symbols-outlined text-sm text-slate-600">create_new_folder</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {project.files.map((file) => (
            <button
              key={file.path}
              onClick={() => setActiveFile(file.path)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-3 transition-all ${
                activeFile === file.path ? 'bg-primary/20 text-primary font-bold border border-primary/20' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {file.path.endsWith('.md') ? 'description' : 'code'}
              </span>
              <span className="truncate">{file.path}</span>
            </button>
          ))}
          {project.files.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-[10px] text-slate-600 italic">No files generated yet.</p>
            </div>
          )}
        </div>
        
        <div className="h-48 border-t border-slate-800 bg-black/40 p-3 font-mono text-[10px] overflow-hidden flex flex-col">
           <p className="text-primary mb-2 border-b border-slate-800 pb-1 flex items-center justify-between">
             <span>AGENT_LOGS</span>
             {isGenerating && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>}
           </p>
           <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
              {agentLogs.map((log, i) => (
                <p key={i} className="text-slate-500 leading-tight">{log}</p>
              ))}
           </div>
        </div>
      </aside>

      {/* Center: Main Canvas */}
      <section className="flex-1 flex flex-col bg-[#0f172a] relative">
        <div className="h-14 border-b border-slate-800 bg-[#111a22] flex items-center justify-between px-6 shrink-0">
           <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'preview' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-sm">devices</span> PREVIEW
              </button>
              <button 
                onClick={() => setActiveTab('code')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'code' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-sm">code</span> SOURCE
              </button>
           </div>

           <div className="flex items-center gap-4">
              {activeTab === 'code' && (
                <div className="flex gap-2">
                   <button onClick={() => handleAiAction('explain')} className="text-[10px] font-black text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                     <span className="material-symbols-outlined text-xs">live_help</span> EXPLAIN
                   </button>
                   <button onClick={() => handleAiAction('refactor')} className="text-[10px] font-black text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                     <span className="material-symbols-outlined text-xs">auto_fix</span> REFACTOR
                   </button>
                </div>
              )}
              {activeTab === 'preview' && (
                <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                  <button onClick={() => setDevice(DeviceMode.PC)} className={`p-1.5 rounded ${device === DeviceMode.PC ? 'bg-slate-700 text-primary' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined text-sm">desktop_windows</span>
                  </button>
                  <button onClick={() => setDevice(DeviceMode.MOBILE)} className={`p-1.5 rounded ${device === DeviceMode.MOBILE ? 'bg-slate-700 text-primary' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined text-sm">smartphone</span>
                  </button>
                </div>
              )}
              <div className="h-6 w-[1px] bg-slate-800"></div>
              <button className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg text-[10px] font-black border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                <span className="material-symbols-outlined text-sm">play_arrow</span> RUN APP
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-hidden p-6 flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
           {activeTab === 'preview' ? (
              <div className={`bg-[#f8fafc] rounded-[2.5rem] border-[12px] border-slate-900 overflow-hidden shadow-2xl transition-all duration-700 relative ${
                device === DeviceMode.MOBILE ? 'w-[360px] h-[640px]' : 'w-full h-full max-w-[1200px] max-h-[800px]'
              }`}>
                 <div className="bg-slate-800 p-2 border-b border-slate-700 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="size-1.5 rounded-full bg-slate-600"></div>
                      <div className="size-1.5 rounded-full bg-slate-600"></div>
                    </div>
                    <div className="flex-1 text-center"><span className="text-[8px] font-mono text-slate-500">HTTPS://SIMULATOR.LOCAL</span></div>
                 </div>
                 <div className="w-full h-full bg-white flex flex-col items-center justify-center p-12 text-center space-y-6">
                    {project.files.length > 0 ? (
                      <>
                        <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary animate-pulse">
                          <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{project.name} Loaded</h3>
                          <p className="text-sm text-slate-500 mt-2">Preview is currently simulating the generated components.</p>
                        </div>
                        <button className="bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold">RELOAD FRAME</button>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-6xl text-slate-200 animate-pulse">rocket</span>
                        <p className="text-slate-400 font-medium">Ready to build your masterpiece.</p>
                      </>
                    )}
                 </div>
              </div>
           ) : (
             <div className="w-full h-full bg-[#0b1219] rounded-2xl overflow-hidden border border-slate-800 flex flex-col font-mono shadow-2xl">
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar text-sm leading-relaxed text-slate-300">
                   {project.files.length > 0 ? (
                     <pre className="whitespace-pre-wrap"><code className="language-typescript">{currentFileContent}</code></pre>
                   ) : (
                     <p className="text-slate-700 italic">// Waiting for autonomous agent input...</p>
                   )}
                </div>
             </div>
           )}
        </div>

        {/* Input area fixed at bottom of Center Canvas */}
        <div className="p-6 bg-[#111a22]/80 backdrop-blur-md border-t border-slate-800">
           <div className="max-w-4xl mx-auto flex gap-4 items-end bg-slate-900 border border-slate-700 p-2 rounded-2xl focus-within:border-primary/50 transition-all shadow-xl">
              <textarea 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-4 resize-none text-slate-200 h-14"
                placeholder="What should I build or change next? (e.g., 'Add a dark mode toggle and a login modal')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="bg-primary text-white size-14 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
              >
                {isGenerating ? (
                  <span className="animate-spin material-symbols-outlined">sync</span>
                ) : (
                  <span className="material-symbols-outlined">auto_awesome</span>
                )}
              </button>
           </div>
        </div>
      </section>

      {/* Stats & Tools Panel (Right) */}
      <aside className="w-[300px] border-l border-slate-800 bg-[#111a22] flex flex-col shrink-0">
         <div className="p-4 border-b border-slate-800">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Architect Controls</h3>
         </div>
         
         <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Token Usage</span>
                  <span className="text-[10px] font-bold text-primary">2.4k / 32k</span>
               </div>
               <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[15%]"></div>
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-bold text-slate-600 uppercase">Generation Quality</label>
               <div className="grid grid-cols-2 gap-2">
                  <button className="px-3 py-2 bg-primary/10 border border-primary text-primary rounded-lg text-[10px] font-black uppercase">Creative</button>
                  <button className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-500 rounded-lg text-[10px] font-black uppercase">Precise</button>
               </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
               <p className="text-[10px] font-bold text-primary uppercase flex items-center gap-2">
                 <span className="material-symbols-outlined text-sm">lightbulb</span> Architect Tip
               </p>
               <p className="text-[11px] text-slate-400 leading-relaxed">
                 Use the **Build Center** to export your app as a native Android or Windows package.
               </p>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Active Models</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="size-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-bold text-slate-300">Gemini 3 Pro</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800 opacity-50">
                  <span className="size-2 rounded-full bg-slate-600"></span>
                  <span className="text-[10px] font-bold text-slate-300">Gemini 3 Flash</span>
                </div>
              </div>
            </div>
         </div>
         
         <div className="p-4 border-t border-slate-800">
            <button className="w-full bg-slate-800 text-white py-3 rounded-xl text-xs font-black uppercase hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
               <span className="material-symbols-outlined text-sm">save</span> PERSIST PROJECT
            </button>
         </div>
      </aside>
    </div>
  );
};

export default Studio;
