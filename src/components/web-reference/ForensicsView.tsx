
import React, { useState, useRef, useEffect } from 'react';
import WitnessInterviewView from './WitnessInterviewView';
import TacticalScannerView from './TacticalScannerView';
import { 
  Camera, Microscope, Box, Map as MapIcon, Shield, Search, Plus, 
  Trash2, Save, RefreshCw, X, Download, Fingerprint, FileText, 
  AlertTriangle, ScanLine, Eye, Share2, ClipboardList, Zap, 
  Database, CheckCircle2, ChevronRight, Activity, Bot, HardDrive, 
  Smartphone, FileDigit, Link as LinkIcon, Cpu, Globe, Key, 
  UploadCloud, Layers, Move3D, Maximize, Rotate3d, Hash, 
  ShieldCheck, Ruler, Scale, Play, BoxSelect, Brain, ZoomIn, ZoomOut,
  Info, Star, Gavel, Radio, Laptop, ShieldAlert, BookOpen
} from 'lucide-react';
import { analyzeImage, generateTextResponse } from './services/geminiService';
import { EvidenceItem } from './types';

interface ForensicsViewProps {
  onAddEvidence?: (item: EvidenceItem) => void;
  evidenceList?: EvidenceItem[];
  theme?: 'light' | 'dark';
}

interface SceneMarker {
  id: string;
  x: number;
  y: number;
  z: number;
  label: string;
  type: 'BLOOD' | 'CASING' | 'WEAPON' | 'BODY' | 'FINGERPRINT' | 'GENERIC';
  description?: string;
}

const ForensicsView: React.FC<ForensicsViewProps> = ({ onAddEvidence, evidenceList = [], theme = 'dark' }) => {
  const [activeTab, setActiveTab] = useState<'HUD' | 'DIGITAL' | 'MAPPING' | 'ASSISTANT' | 'INTERVIEW' | 'SCANNER'>('HUD');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  
  const [sceneMarkers, setSceneMarkers] = useState<SceneMarker[]>([]);
  const [is3DMode, setIs3DMode] = useState(true);
  const [rotation, setRotation] = useState(45);
  const [tilt, setTilt] = useState(65);
  const [zoom, setZoom] = useState(0.85);
  
  const [digitalDump, setDigitalDump] = useState<string>('');
  const [isAnalyzingDump, setIsAnalyzingDump] = useState(false);
  const [dumpAnalysis, setDumpAnalysis] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (activeTab === 'HUD' && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
          });
          videoRef.current.srcObject = stream;
        } catch (e) {
          console.error("Forensic camera failed", e);
        }
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [activeTab]);

  const performAnalysis = async () => {
    console.log("Analyzing image button clicked.");
    if (!videoRef.current || !canvasRef.current) {
        console.error("Video or canvas ref missing:", { v: !!videoRef.current, c: !!canvasRef.current });
        return;
    }
    
    setIsScanning(true);
    console.log("Scanning started, isScanning set to true");
    setScanResult(null);

    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    if (ctx) ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

    const prompt = `ACT AS A SENIOR FORENSIC CSI EXPERT. Analyze this image for physical evidence markers.
    IDENTIFY:
    1. Ballistics: Shell casings, projectile impacts.
    2. Biological: Blood spatter patterns, hair/fiber.
    3. Prints: Latent fingerprint traces on flat surfaces.
    4. Points of Entry: Tool marks on doors/windows.
    
    Return valid JSON ONLY: { "evidenceFound": boolean, "items": [{ "label": string, "type": "BLOOD"|"CASING"|"WEAPON"|"BODY"|"FINGERPRINT", "description": string, "conf": number, "action": "Recommendation for collection" }] }`;

    try {
      console.log("Calling analyzeImage...");
      const response = await analyzeImage(base64, prompt);
      console.log("analyzeImage response received.");
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setScanResult(parsed);
      
      if (parsed.evidenceFound && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.error("Forensic analysis error details:", e);
    } finally {
      console.log("Scanning finished, isScanning set to false");
      setIsScanning(false);
    }
  };

  const handleBagAndTag = (item: any) => {
    if (!canvasRef.current || !onAddEvidence) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    const simulatedHash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newItem: EvidenceItem = {
      id: `FOR-${Date.now()}`,
      type: 'FORENSIC',
      timestamp: new Date().toLocaleString(),
      location: 'SCENE_ALPHA_COORD_40.7128N',
      officer: 'SGT. J. DOE',
      tags: ['FORENSIC', item.type, item.label, `SHA256:${simulatedHash.substring(0,8)}...`],
      chainOfCustody: [
        { action: 'Collected & Sealed at Scene', user: 'SGT. J. DOE', time: new Date().toLocaleTimeString() },
        { action: 'Digitally Authenticated (KNOX)', user: 'SYSTEM', time: new Date().toLocaleTimeString() }
      ],
      content: dataUrl,
      description: `[AI_FORENSIC_CERT]: ${item.description}\n[COLLECTION_PROC]: ${item.action}\n[CRYPTO_LOG]: ${simulatedHash}`,
      forensicType: item.type
    };

    onAddEvidence(newItem);
    setScanResult(null);
    alert(`Evidence Bagged: ${item.label}\nID: ${newItem.id}\nHash Secured.`);
  };

  const analyzeDigitalDump = async () => {
    if (!digitalDump) return;
    setIsAnalyzingDump(true);
    const prompt = `Perform tactical digital forensic analysis on this data dump. 
    Look for: Encrypted containers, criminal communications, metadata anomalies, and location traces.
    Data: "${digitalDump}"
    Return a professional intelligence summary.`;
    
    try {
      const response = await generateTextResponse(prompt, 'gemini-3-pro-preview');
      setDumpAnalysis(response);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingDump(false);
    }
  };

  const addMarker = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newMarker: SceneMarker = {
      id: Date.now().toString(),
      x, y, z: 0,
      label: `#${sceneMarkers.length + 1}`,
      type: 'GENERIC'
    };
    setSceneMarkers([...sceneMarkers, newMarker]);
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden font-tech select-none ${theme === 'light' ? 'bg-white text-slate-950' : 'bg-slate-950 text-slate-200'}`}>
      <div className="bg-slate-900 border-b border-white/5 p-3 flex justify-between items-center shrink-0 z-50 shadow-2xl">
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'HUD', label: 'Tactical', icon: ScanLine },
            { id: 'SCANNER', label: '3D Scanner', icon: Camera },
            { id: 'MAPPING', label: '3D Scene', icon: Rotate3d },
            { id: 'DIGITAL', label: 'Digital', icon: HardDrive },
            { id: 'INTERVIEW', label: 'Interview', icon: Brain },
            { id: 'ASSISTANT', label: 'User Manual', icon: BookOpen }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 relative overflow-hidden flex flex-col ${theme === 'light' ? 'bg-slate-50' : 'bg-black'}`}>
        {activeTab === 'SCANNER' && <TacticalScannerView onAddEvidence={onAddEvidence} />}

        {activeTab === 'HUD' && (
          <div className="flex-1 relative flex flex-col">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="bg-black/60 backdrop-blur px-4 py-2 rounded border border-cyan-500/30">
                            <div className="text-[9px] text-cyan-400 font-bold mb-1">OPTICAL SENSORS</div>
                            <div className="text-xs text-white font-mono flex items-center gap-2">
                                <Zap className="w-3 h-3 text-yellow-400 animate-pulse" /> AI_ENHANCED_SPECTRA
                            </div>
                        </div>
                        <button onClick={performAnalysis} disabled={isScanning} className="w-16 h-16 bg-black/60 backdrop-blur-xl rounded-full border-2 border-cyan-500 flex flex-col items-center justify-center shadow-lg active:scale-90 transition-all group">
                            {isScanning ? <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" /> : <><ScanLine className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" /><span className="text-[8px] font-black text-cyan-400 mt-1 uppercase">Process</span></>}
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center opacity-40">
                    <div className="w-64 h-64 border border-cyan-500/30 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
                    </div>
                </div>
                {scanResult && (
                  <div className="bg-slate-900/90 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-4 mb-32 max-w-md mx-auto pointer-events-auto animate-in slide-in-from-bottom-10">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <Fingerprint className="w-4 h-4" /> Identification Result
                      </span>
                      <button onClick={() => setScanResult(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="space-y-4">
                      {scanResult.items.map((item: any, i: number) => (
                        <div key={i} className="bg-black/40 border border-white/5 rounded-lg p-3 group">
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">{item.type}</span>
                              <span className="text-[10px] font-mono text-slate-500">{Math.round(item.conf * 100)}% CONFIDENCE</span>
                           </div>
                           <h4 className="text-white font-bold text-sm mb-1">{item.label}</h4>
                           <p className="text-[10px] text-slate-400 mb-3">{item.description}</p>
                           <button onClick={() => handleBagAndTag(item)} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black rounded uppercase shadow-lg transition-all flex items-center justify-center gap-2"><BoxSelect className="w-3.5 h-3.5" /> BAG & TAG EVIDENCE</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {activeTab === 'MAPPING' && (
          <div className={`flex-1 flex flex-col p-6 overflow-hidden relative ${theme === 'light' ? 'bg-white text-slate-950' : 'bg-slate-950 text-slate-200'}`}>
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
            <div className="flex justify-between items-center mb-6 z-10">
               <div>
                  <h2 className={`text-xl font-black uppercase flex items-center gap-3 ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}><Rotate3d className="w-6 h-6 text-cyan-500" /> Spatial Reconstruction</h2>
                  <p className="text-[10px] text-slate-500 font-mono">DIGITAL TWIN ENGINE V2.0</p>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setSceneMarkers([])} className="p-2 bg-slate-900 border border-slate-800 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
                  <button className="bg-cyan-600 text-white px-4 py-2 rounded text-[10px] font-black flex items-center gap-2"><Plus className="w-4 h-4" /> NEW GRID</button>
               </div>
            </div>
            <div className="flex-1 flex gap-6 overflow-hidden">
               <div className="w-16 flex flex-col gap-4 z-10">
                  <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className={`w-12 h-12 rounded-lg flex items-center justify-center border ${theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}><ZoomIn className="w-6 h-6" /></button>
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className={`w-12 h-12 rounded-lg flex items-center justify-center border ${theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}><ZoomOut className="w-6 h-6" /></button>
                  <button onClick={() => setIs3DMode(!is3DMode)} className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all ${is3DMode ? 'bg-cyan-600 border-cyan-500 text-white' : theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-500 hover:bg-slate-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}><Rotate3d className="w-6 h-6" /></button>
               </div>
               <div className={`flex-1 rounded-2xl border relative overflow-hidden flex items-center justify-center ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/50 border-white/5'}`} style={{ perspective: '1200px' }}>
                  <div className="absolute w-[200%] h-[200%] transition-all duration-700 ease-out" style={{ transform: is3DMode ? `rotateX(${tilt}deg) rotateZ(${rotation}deg) scale(${zoom}) translate(-25%, -25%)` : `scale(${zoom}) translate(-25%, -25%)`, transformStyle: 'preserve-3d' }} onClick={addMarker}>
                    <div className="absolute inset-0 bg-slate-950 border border-cyan-500/30 shadow-[0_0_100px_rgba(6,182,212,0.1)]" style={{ backgroundImage: 'linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
                    {sceneMarkers.map(m => (
                      <div key={m.id} className="absolute w-8 h-8 -ml-4 -mt-4 transition-transform hover:scale-125 z-50 group" style={{ left: `${m.x}%`, top: `${m.y}%`, transform: is3DMode ? `rotateZ(${-rotation}deg) rotateX(${-tilt}deg)` : 'none' }}>
                         <div className="w-full h-full bg-cyan-600 rounded-full border-4 border-white shadow-[0_0_20px_cyan] flex items-center justify-center text-[10px] font-black text-white">{m.label}</div>
                      </div>
                    ))}
                  </div>
               </div>
               <div className={`w-72 rounded-2xl border flex flex-col overflow-hidden ${theme === 'light' ? 'bg-slate-50 border-slate-200 shadow-sm text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                  <div className={`p-4 flex justify-between items-center border-b ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-705'}`}><h3 className={`text-xs font-bold flex items-center gap-2 uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><Ruler className="w-4 h-4 text-cyan-400" /> Evidence Map</h3></div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sceneMarkers.length === 0 ? <div className={`text-center py-20 ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}><Plus className="w-12 h-12 mx-auto mb-4 opacity-20" /><p className="text-xs">Tap grid to plot markers</p></div> : sceneMarkers.map(m => (
                        <div key={m.id} className={`p-3 rounded-lg border hover:border-cyan-500/50 transition-colors ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                           <div className="flex justify-between items-center mb-1"><span className="text-xs font-black text-cyan-400">{m.label}</span><button onClick={() => setSceneMarkers(sceneMarkers.filter(sm => sm.id !== m.id))} className="text-slate-600 hover:text-red-400"><X className="w-3 h-3" /></button></div>
                           <div className="text-[9px] text-slate-500 font-mono">X: {m.x.toFixed(1)} Y: {m.y.toFixed(1)}</div>
                        </div>
                    ))}
                  </div>
                  <div className={`p-4 border-t ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'}`}><button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2"><Save className="w-4 h-4" /> EXPORT TWIN</button></div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'DIGITAL' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center mb-2"><div><h2 className={`text-xl font-black uppercase flex items-center gap-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><HardDrive className="w-6 h-6 text-blue-500" /> Device Evidence Ingest</h2><p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Advanced Logical Acquisition Engine</p></div><div className="bg-blue-900/30 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"><Key className="w-4 h-4" /> KNOX SECURED LINE</div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-200'}`}><h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><Smartphone className="w-4 h-4 text-cyan-500" /> PHYSICAL SOURCE</h3><div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group ${theme === 'light' ? 'border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400' : 'border-slate-700 hover:bg-blue-900/5 hover:border-blue-500/50'}`}><UploadCloud className="w-12 h-12 text-slate-500 group-hover:text-blue-500 mb-4 transition-colors" /><span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500">Upload Device Dump (.E01 / .DD)</span><input type="file" ref={fileInputRef} className="hidden" multiple onChange={() => setDigitalDump("Logical acquisition complete. Target: Android 13. Partitions: [userdata, system, vendor]. Analyzing partition metadata...")} /></div></div>
                  <div className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-200'}`}><h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><Hash className="w-4 h-4 text-blue-500" /> METADATA RAW VIEW</h3><textarea value={digitalDump} onChange={e => setDigitalDump(e.target.value)} className={`w-full h-40 rounded p-4 text-xs font-mono outline-none border focus:border-blue-500/50 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-blue-400'}`} placeholder="Input raw hex or metadata dump for AI processing..." /><button onClick={analyzeDigitalDump} disabled={isAnalyzingDump || !digitalDump} className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2">{isAnalyzingDump ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />} PERFORM DEEP AI ANALYSIS</button></div>
               </div>
               <div className="flex flex-col gap-4"><div className={`flex-1 rounded-2xl p-6 flex flex-col shadow-2xl relative overflow-hidden border ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-200'}`}><div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><FileDigit className="w-32 h-32" /></div><h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><Brain className="w-4 h-4 text-purple-405" /> FORENSIC INTELLIGENCE SUMMARY</h3><div className={`flex-1 rounded-xl p-6 overflow-y-auto border ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-950' : 'bg-slate-950/50 border-white/5 text-slate-300'}`}>{dumpAnalysis ? <p className={`text-xs md:text-sm font-mono leading-relaxed whitespace-pre-wrap animate-in fade-in duration-1000 ${theme === 'light' ? 'text-slate-950' : 'text-slate-300'}`}>{dumpAnalysis}</p> : <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center"><Search className="w-12 h-12 mb-4 opacity-10" /><p className="text-xs uppercase font-black tracking-widest opacity-35">Awaiting acquisition data...</p></div>}</div>{dumpAnalysis && <div className="mt-4 flex gap-3"><button className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 border ${theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-705'}`}><Download className="w-4 h-4" /> Export Report</button><button className="flex-1 py-3 bg-purple-600 hover:bg-purple-505 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg"><Share2 className="w-4 h-4" /> Push to Intel</button></div>}</div></div>
            </div>
          </div>
        )}

        {/* {activeTab === 'INTERVIEW' && <WitnessInterviewView />} */ }

        {/* --- TAB 4: USER MANUAL & TACTICAL VALUE GUIDE --- */}
        {activeTab === 'ASSISTANT' && (
          <div className={`flex-1 flex flex-col p-6 overflow-y-auto ${theme === 'light' ? 'bg-white text-slate-950' : 'bg-slate-950 text-slate-200'}`}>
            <div className="max-w-4xl mx-auto w-full space-y-10 pb-20">
              
              {/* Manual Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/30 text-xs font-black tracking-[0.2em] uppercase">
                  <BookOpen className="w-4 h-4" /> Official System Manual
                </div>
                <h1 className={`text-4xl font-black uppercase tracking-tighter ${theme === 'light' ? 'text-slate-900 font-sans' : 'text-white'}`}>POLICECOMS AI SUPERAPP</h1>
                <p className={`font-mono text-sm max-w-2xl mx-auto uppercase ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>The next-generation tactical ecosystem for law enforcement. Secured by Samsung Knox. Powered by Gemini Pro AI.</p>
              </div>

              {/* Tools Guide Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* HUD Tool */}
                <div className={`rounded-2xl p-6 transition-all group border ${theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-cyan-500/30' : 'bg-slate-900 border-slate-800 hover:border-cyan-500/30'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-cyan-600/20 rounded-xl text-cyan-400"><ScanLine className="w-8 h-8" /></div>
                    <div>
                      <h3 className={`text-lg font-black uppercase tracking-wider ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>CSI AI-Scanner</h3>
                      <p className="text-[10px] text-cyan-500 font-bold uppercase">HUD Module</p>
                    </div>
                  </div>
                  <div className={`space-y-3 text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                    <p><span className="text-cyan-600 font-black">HOW TO USE:</span> Point device at potential evidence. Click 'PROCESS'. AI identifies ballistics, biologicals, or fingerprints instantly.</p>
                    <p><span className="text-cyan-600 font-black">TACTICAL VALUE:</span> Prevents evidence contamination by identifying traces invisible to the naked eye. Automated digital chain of custody via cryptographic hashing ensures court admissibility.</p>
                  </div>
                </div>

                {/* Mapping Tool */}
                <div className={`rounded-2xl p-6 transition-all group border ${theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-purple-500/30' : 'bg-slate-900 border-slate-800 hover:border-purple-500/30'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-600/20 rounded-xl text-purple-400"><Rotate3d className="w-8 h-8" /></div>
                    <div>
                      <h3 className={`text-lg font-black uppercase tracking-wider ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>3D Digital Twin</h3>
                      <p className="text-[10px] text-purple-500 font-bold uppercase">Spatial Module</p>
                    </div>
                  </div>
                  <div className={`space-y-3 text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                    <p><span className="text-purple-600 font-black">HOW TO USE:</span> Activate 3D Scene. Tap the spatial grid to plot markers for physical evidence. Use sliders to orient the perspective.</p>
                    <p><span className="text-purple-600 font-black">TACTICAL VALUE:</span> Creates an immutable digital reconstruction of a scene before it is disturbed. Essential for courtroom visualizations and trajectory analysis.</p>
                  </div>
                </div>

                {/* Digital Tool */}
                <div className={`rounded-2xl p-6 transition-all group border ${theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-blue-500/30' : 'bg-slate-900 border-slate-800 hover:border-blue-500/30'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400"><HardDrive className="w-8 h-8" /></div>
                    <div>
                      <h3 className={`text-lg font-black uppercase tracking-wider ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Device Forensics</h3>
                      <p className="text-[10px] text-blue-500 font-bold uppercase">Logical Ingest</p>
                    </div>
                  </div>
                  <div className={`space-y-3 text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                    <p><span className="text-blue-600 font-black">HOW TO USE:</span> Upload device images or paste raw metadata. Trigger 'DEEP AI ANALYSIS' for automated pattern recognition.</p>
                    <p><span className="text-blue-600 font-black">TACTICAL VALUE:</span> Bypasses manual hex-dump reading. AI identifies hidden communications, geofence violations, and encrypted containers in seconds instead of hours.</p>
                  </div>
                </div>

                {/* Comms Tool */}
                <div className={`rounded-2xl p-6 transition-all group border ${theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-emerald-500/30' : 'bg-slate-900 border-slate-800 hover:border-emerald-500/30'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-600/20 rounded-xl text-emerald-400"><Radio className="w-8 h-8" /></div>
                    <div>
                      <h3 className={`text-lg font-black uppercase tracking-wider ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Secure Comms</h3>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase">AES-256 PTT</p>
                    </div>
                  </div>
                  <div className={`space-y-3 text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                    <p><span className="text-emerald-600 font-black">HOW TO USE:</span> Long-press PTT to talk. AI auto-transcribes audio messages. Use 'HQ BROADCAST' for unit-wide urgent alerts.</p>
                    <p><span className="text-emerald-600 font-black">TACTICAL VALUE:</span> Eliminates signal noise and misinterpretation. Transcribed radio logs allow for instant searchability of verbal orders and field observations.</p>
                  </div>
                </div>

              </div>

              {/* Advantage List */}
              <div className={`border rounded-3xl p-10 space-y-8 ${theme === 'light' ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-250 shadow-sm text-slate-900' : 'bg-gradient-to-br from-slate-900 to-black border-white/5 text-slate-200'}`}>
                 <h2 className={`text-2xl font-black uppercase tracking-tight flex items-center gap-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    <ShieldCheck className="w-8 h-8 text-blue-500" /> Key Operational Advantages
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <div className="text-blue-600 font-black text-sm uppercase">Immutable Chain of Custody</div>
                        <p className={`text-xs font-mono ${theme === 'light' ? 'text-slate-600' : 'text-slate-500'}`}>Every scan and capture is hashed and signed. Attempted edits are flagged immediately. Courtroom ready.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-cyan-600 font-black text-sm uppercase">Knox-Grade Protection</div>
                        <p className={`text-xs font-mono ${theme === 'light' ? 'text-slate-600' : 'text-slate-500'}`}>Military-grade hardware isolation prevents intelligence leakage if the physical device is compromised.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-purple-600 font-black text-sm uppercase">AI Intelligence Fusion</div>
                        <p className={`text-xs font-mono ${theme === 'light' ? 'text-slate-600' : 'text-slate-500'}`}>The app cross-references scene data with the Intelligence Database to provide real-time risk assessments.</p>
                    </div>
                 </div>
              </div>

              {/* Call to Action */}
              <div className="flex flex-col items-center gap-4 text-slate-600">
                  <Star className="w-10 h-10 opacity-20" />
                  <p className="text-xs uppercase font-bold tracking-[0.4em]">Integrated • Secure • Analytical</p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForensicsView;
