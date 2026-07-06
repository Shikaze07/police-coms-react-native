
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Eye, Users, FileText, Database, Search, Target, FolderOpen, Globe, Brain, ChevronRight, Lock, Printer, AlertTriangle, Download, Scan, Fingerprint, RefreshCcw, Network, Share2, Plus, Zap, Calendar, MapPin, Phone, User, GitBranch, X, ZoomIn, ZoomOut, Move, Menu, Siren, Bot, Clock, Filter, Activity, Box, Accessibility, Play, Camera, Sparkles, Skull } from 'lucide-react';
import { generateTextResponse } from './services/geminiService';
import { MOCK_ROGUE_GALLERY } from './constants';
import { INTEL_REPORT_TEMPLATES, PNP_KNOWLEDGE_BASE } from './knowledgeBase';
import RogueGalleryView from './RogueGalleryView';

const MOCK_GROUPS = [
    { id: 'G1', name: 'Dragon Syndicate', type: 'Organized Crime', area: 'Metro Manila', threat: 'HIGH', members: 45 },
    { id: 'G2', name: 'Batang City Jail', type: 'Street Gang', area: 'District 1', threat: 'MEDIUM', members: 20 },
    { id: 'G3', name: 'Red Triad Group', type: 'Insurgency', area: 'Rural Sector 4', threat: 'CRITICAL', members: 150 },
];

interface GraphNode {
    id: string;
    type: 'PERSON' | 'ORG' | 'LOCATION' | 'EVENT' | 'DEVICE' | 'VEHICLE';
    label: string;
    x: number;
    y: number;
    risk: 'HIGH' | 'MEDIUM' | 'LOW';
    details?: string;
    timestamp?: number;
}

interface GraphLink {
    id: string;
    source: string;
    target: string;
    label: string;
    type: 'STRONG' | 'WEAK' | 'FINANCIAL' | 'COMM';
}

const INITIAL_NODES: GraphNode[] = [
    { id: 'n1', type: 'PERSON', label: 'Marco V.', x: 400, y: 300, risk: 'HIGH', details: 'Syndicate Leader', timestamp: Date.now() - 86400000 * 2 },
    { id: 'n2', type: 'ORG', label: 'Dragon Syn.', x: 400, y: 150, risk: 'HIGH', details: 'Main Organization', timestamp: Date.now() - 86400000 * 30 },
    { id: 'n3', type: 'LOCATION', label: 'Warehouse 4', x: 600, y: 300, risk: 'MEDIUM', details: 'Storage Facility', timestamp: Date.now() - 86400000 * 5 },
    { id: 'n4', type: 'PERSON', label: 'Elena R.', x: 200, y: 300, risk: 'MEDIUM', details: 'Financial Officer', timestamp: Date.now() - 86400000 * 10 },
    { id: 'n5', type: 'EVENT', label: 'Drug Bust 01', x: 600, y: 450, risk: 'LOW', details: 'Failed Operation', timestamp: Date.now() - 86400000 * 1 },
];

const INITIAL_LINKS: GraphLink[] = [
    { id: 'l1', source: 'n1', target: 'n2', label: 'LEADER', type: 'STRONG' },
    { id: 'l2', source: 'n4', target: 'n2', label: 'FINANCE', type: 'FINANCIAL' },
    { id: 'l3', source: 'n1', target: 'n3', label: 'FREQUENTS', type: 'WEAK' },
    { id: 'l4', source: 'n3', target: 'n5', label: 'SITE OF', type: 'STRONG' },
    { id: 'l5', source: 'n1', target: 'n4', label: 'COMMUNICATES', type: 'COMM' },
];

const SecureVaultOverlay: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
    const [status, setStatus] = useState('LOCKED');
    const [progress, setProgress] = useState(0);

    const handleUnlock = () => {
        setStatus('VERIFYING');
        let p = 0;
        const interval = setInterval(() => {
            p += 5;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setStatus('UNLOCKED');
                setTimeout(onUnlock, 500);
            }
        }, 20);
    };

    return (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col font-sans">
            <div className="flex-1 flex flex-col items-center justify-center relative p-6">
                <div className="border-2 border-blue-500 rounded-lg p-8 md:p-10 flex flex-col items-center gap-4 mb-10 w-full max-w-sm bg-slate-900/50 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden">
                    {status === 'VERIFYING' && <div className="absolute inset-0 bg-blue-500/10 z-0"><div className="w-full h-1 bg-blue-400/50 shadow-[0_0_10px_rgba(96,165,250,0.8)] absolute top-0 animate-[scan_1.5s_linear_infinite]" /></div>}
                    <Shield className="w-20 h-20 text-blue-500 z-10" strokeWidth={1.5} />
                    <div className="text-center z-10"><h2 className="text-3xl font-black text-white tracking-wider font-tech mb-1">KNOX VAULT</h2><p className="text-[10px] text-blue-400 font-mono tracking-[0.2em] font-bold">SECURE ENCLAVE ACTIVE</p></div>
                </div>
                <div className="mb-12 relative">
                    <button onClick={handleUnlock} disabled={status !== 'LOCKED'} className={`group relative w-24 h-24 rounded-full border-2 ${status === 'LOCKED' ? 'border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10' : 'border-blue-500 bg-blue-500/20'} flex items-center justify-center transition-all outline-none focus:ring-4 focus:ring-blue-500/30`}>
                        <Fingerprint className={`w-12 h-12 ${status === 'LOCKED' ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-300 animate-pulse'} transition-colors`} strokeWidth={1.5} />
                        {status === 'LOCKED' && <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin-slow opacity-0 group-hover:opacity-100"></div>}
                        {status === 'VERIFYING' && <svg className="absolute inset-0 w-full h-full -rotate-90"><circle cx="48" cy="48" r="46" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-blue-500/30" /><circle cx="48" cy="48" r="46" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray="289" strokeDashoffset={289 - (289 * progress) / 100} className="text-blue-400" /></svg>}
                    </button>
                </div>
                <div className="mt-auto md:mt-0 text-center"><p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">Hardware-Backed Security</p><p className="text-[9px] text-blue-900/50 font-mono uppercase tracking-widest mt-1">Samsung Galaxy XCover 6</p></div>
            </div>
        </div>
    );
};

const IntelTargetCard: React.FC<{ target: any, onClick: (t: any) => void }> = ({ target, onClick }) => (
    <div onClick={() => onClick(target)} className="bg-slate-900 border border-slate-700 p-3 rounded-lg hover:border-cyan-500/50 cursor-pointer group transition-all relative overflow-hidden active:scale-95">
        <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center border border-slate-600 group-hover:border-cyan-500/30 overflow-hidden">{target.imageUrl ? <img src={target.imageUrl} className="w-full h-full object-cover" alt="" /> : <Users className="w-6 h-6 text-slate-500 group-hover:text-cyan-500" />}</div>
            <div className="flex-1">
                <div className="flex justify-between items-start"><h4 className="text-slate-200 font-bold text-sm group-hover:text-cyan-400">{target.name}</h4><span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${target.threat === 'CRITICAL' || target.riskLevel === 'HIGH' ? 'bg-red-900/20 text-red-400 border-red-500/30' : target.threat === 'HIGH' ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700'}`}>{target.threat || target.riskLevel}</span></div>
                <p className="text-[10px] text-slate-400 font-mono mt-1">{target.type || target.crime || target.alias}</p>
                <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-500"><Globe className="w-3 h-3" /> {target.area || target.lastSeen}</div>
            </div>
        </div>
    </div>
);

const LinkAnalysisBoard: React.FC = () => {
    const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
    const [links, setLinks] = useState<GraphLink[]>(INITIAL_LINKS);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'GRAPH' | 'TIMELINE'>('GRAPH');
    const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'CRITICAL' | 'RECENT'>('ALL');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const handleWheel = (e: React.WheelEvent) => setScale(Math.min(Math.max(0.5, scale + (e.deltaY * -0.001)), 3));
    const handleMouseDown = (e: React.MouseEvent) => { if (!draggingNodeId) { setIsDraggingCanvas(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); } };
    const handleMouseMove = (e: React.MouseEvent) => { if (draggingNodeId && svgRef.current) { const pt = svgRef.current.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse()); setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: svgP.x, y: svgP.y } : n)); } else if (isDraggingCanvas) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
    const handleMouseUp = () => { setIsDraggingCanvas(false); setDraggingNodeId(null); };
    const handleTouchStart = (e: React.TouchEvent, nodeId?: string) => { if (nodeId) setDraggingNodeId(nodeId); else { setIsDraggingCanvas(true); setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y }); } };
    const handleTouchMove = (e: React.TouchEvent) => { if (draggingNodeId && svgRef.current) { const pt = svgRef.current.createSVGPoint(); pt.x = e.touches[0].clientX; pt.y = e.touches[0].clientY; const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse()); setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: svgP.x, y: svgP.y } : n)); } else if (isDraggingCanvas) setOffset({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y }); };

    const handleAddNode = (type: GraphNode['type']) => { const newNode: GraphNode = { id: `n${Date.now()}`, type, label: 'New Entity', x: 400 + (Math.random() * 50 - 25), y: 300 + (Math.random() * 50 - 25), risk: 'LOW', details: 'No details.', timestamp: Date.now() }; setNodes(prev => [...prev, newNode]); setSelectedNodeId(newNode.id); };
    const analyzeNetwork = async () => { setIsAnalyzing(true); const networkData = { nodes: nodes.map(n => ({ id: n.id, label: n.label, type: n.type })), links: links.map(l => ({ source: l.source, target: l.target, type: l.type })) }; const prompt = `Analyze this intelligence network graph (Link Analysis). Data: ${JSON.stringify(networkData)}. Tasks: 1. Identify Central Node. 2. Detect Hidden Connections. 3. Recommendation. Output strictly as: "KEY NODE: [Name]. INSIGHT: [Brief Analysis]. REC: [Action]."`; const result = await generateTextResponse(prompt, 'gemini-3-pro-preview'); setAiInsight(result); setIsAnalyzing(false); };

    const getNodeIcon = (type: string) => { switch (type) { case 'PERSON': return <User className="w-4 h-4" />; case 'ORG': return <Users className="w-4 h-4" />; case 'LOCATION': return <MapPin className="w-4 h-4" />; case 'EVENT': return <Calendar className="w-4 h-4" />; case 'DEVICE': return <Phone className="w-4 h-4" />; case 'VEHICLE': return <Scan className="w-4 h-4" />; default: return <Target className="w-4 h-4" />; } };
    const getNodeColor = (type: string) => { switch (type) { case 'PERSON': return 'fill-blue-600 stroke-blue-400'; case 'ORG': return 'fill-purple-600 stroke-purple-400'; case 'LOCATION': return 'fill-emerald-600 stroke-emerald-400'; case 'EVENT': return 'fill-cyan-600 stroke-cyan-400'; default: return 'fill-slate-600 stroke-slate-400'; } };
    const getFilteredTimelineNodes = () => { let filtered = nodes; const now = Date.now(); const sevenDays = 7 * 24 * 60 * 60 * 1000; if (timelineFilter === 'CRITICAL') filtered = filtered.filter(n => n.risk === 'HIGH'); else if (timelineFilter === 'RECENT') filtered = filtered.filter(n => (n.timestamp || 0) > now - sevenDays); return filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); };

    return (
        <div className="flex h-full bg-slate-950 relative overflow-hidden">
            <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-20 shadow-xl">
                <button onClick={() => handleAddNode('PERSON')} className="p-2 rounded-lg bg-blue-900/30 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all"><User className="w-5 h-5"/></button>
                <button onClick={() => handleAddNode('ORG')} className="p-2 rounded-lg bg-purple-900/30 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all"><Users className="w-5 h-5"/></button>
                <button onClick={() => handleAddNode('LOCATION')} className="p-2 rounded-lg bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all"><MapPin className="w-5 h-5"/></button>
                <button onClick={() => handleAddNode('EVENT')} className="p-2 rounded-lg bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all"><Calendar className="w-5 h-5"/></button>
                <div className="h-px w-8 bg-slate-700 my-2"></div>
                <button onClick={() => setViewMode(viewMode === 'GRAPH' ? 'TIMELINE' : 'GRAPH')} className={`p-2 rounded-lg hover:text-white hover:bg-slate-800 transition-all ${viewMode === 'TIMELINE' ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-400'}`}>{viewMode === 'GRAPH' ? <GitBranch className="w-5 h-5" /> : <Network className="w-5 h-5" />}</button>
                <button onClick={() => { setScale(1); setOffset({x:0, y:0}); }} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"><RefreshCcw className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 relative bg-slate-950 overflow-hidden cursor-move touch-none" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} onTouchStart={(e) => handleTouchStart(e)} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}>
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px', transform: viewMode === 'GRAPH' ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})` : 'none', transformOrigin: '0 0' }}></div>
                {viewMode === 'GRAPH' ? (
                    <svg ref={svgRef} className="w-full h-full" viewBox={`0 0 1000 800`}><g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>{links.map(link => { const source = nodes.find(n => n.id === link.source); const target = nodes.find(n => n.id === link.target); if (!source || !target) return null; return <g key={link.id}><line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={link.type === 'FINANCIAL' ? '#34d399' : link.type === 'COMM' ? '#60a5fa' : '#94a3b8'} strokeWidth={link.type === 'STRONG' ? 3 : 1} opacity={0.6} /><text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2} fill="#94a3b8" fontSize="8" textAnchor="middle" alignmentBaseline="middle" className="font-mono bg-slate-900">{link.label}</text></g>; })}{nodes.map(node => <g key={node.id} transform={`translate(${node.x}, ${node.y})`} onMouseDown={(e) => { e.stopPropagation(); setDraggingNodeId(node.id); setSelectedNodeId(node.id); }} onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, node.id); setSelectedNodeId(node.id); }} className="cursor-pointer transition-all duration-75"><circle r={selectedNodeId === node.id ? 25 : 20} className={`${getNodeColor(node.type)} transition-all duration-200`} strokeWidth={selectedNodeId === node.id ? 4 : 2} /><foreignObject x="-10" y="-10" width="20" height="20" className="pointer-events-none"><div className="flex items-center justify-center w-full h-full text-white">{getNodeIcon(node.type)}</div></foreignObject><text y="35" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className="pointer-events-none uppercase tracking-wide drop-shadow-md">{node.label}</text></g>)}</g></svg>
                ) : (
                    <div className="absolute inset-0 bg-slate-950/90 overflow-y-auto pointer-events-auto"><div className="max-w-2xl mx-auto p-8 relative min-h-full"><div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-800" /><div className="fixed top-20 right-6 flex flex-col gap-2 z-30"><div className="bg-slate-900/90 backdrop-blur p-2 rounded-lg border border-slate-700 shadow-xl"><div className="text-[10px] font-bold text-slate-500 uppercase mb-2 px-1 flex items-center gap-1"><Filter className="w-3 h-3" /> Filters</div><div className="flex flex-col gap-1"><button onClick={() => setTimelineFilter('ALL')} className={`px-3 py-1.5 rounded text-[10px] font-bold text-left ${timelineFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>ALL EVENTS</button><button onClick={() => setTimelineFilter('CRITICAL')} className={`px-3 py-1.5 rounded text-[10px] font-bold text-left ${timelineFilter === 'CRITICAL' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>CRITICAL</button><button onClick={() => setTimelineFilter('RECENT')} className={`px-3 py-1.5 rounded text-[10px] font-bold text-left ${timelineFilter === 'RECENT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>RECENT</button></div></div></div>{getFilteredTimelineNodes().map((node, i) => <div key={node.id} className="relative pl-12 py-4 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 50}ms` }}><div className={`absolute left-[29px] top-6 w-3 h-3 rounded-full border-2 border-slate-950 z-10 ${node.risk === 'HIGH' ? 'bg-red-500 shadow-[0_0_10px_red]' : node.risk === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-500'}`} /><div onClick={() => setSelectedNodeId(node.id)} className={`bg-slate-900 border p-4 rounded-lg cursor-pointer hover:bg-slate-800 transition-all ${selectedNodeId === node.id ? 'border-cyan-500 ring-1 ring-cyan-500/50' : 'border-slate-800 hover:border-slate-600'}`}><div className="flex justify-between items-start mb-1"><span className="text-[10px] font-mono text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {node.timestamp ? new Date(node.timestamp).toLocaleDateString() : 'UNKNOWN'}</span>{node.risk === 'HIGH' && <span className="text-[9px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-bold">CRITICAL</span>}</div><div className="flex items-center gap-3 mb-2"><div className={`p-1.5 rounded-md ${node.type === 'EVENT' ? 'bg-cyan-900/20 text-cyan-400' : node.type === 'PERSON' ? 'bg-blue-900/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>{getNodeIcon(node.type)}</div><h3 className="text-sm font-bold text-white">{node.label}</h3></div><p className="text-xs text-slate-400 leading-relaxed pl-1 border-l-2 border-slate-700">{node.details}</p></div></div>)}</div></div>
                )}
                <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2"><button onClick={analyzeNetwork} disabled={isAnalyzing} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 text-sm active:scale-95 transition-all">{isAnalyzing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} ANALYZE</button>{aiInsight && <div className="w-80 bg-slate-900/95 backdrop-blur border border-cyan-500/50 p-4 rounded-xl shadow-2xl animate-in slide-in-from-right"><div className="flex justify-between items-start mb-2"><h4 className="text-cyan-400 font-black text-xs uppercase tracking-wider flex items-center gap-2"><Zap className="w-3 h-3" /> AI Insight</h4><button onClick={() => setAiInsight(null)} className="text-slate-500 hover:text-white"><X className="w-3 h-3"/></button></div><p className="text-xs text-slate-300 leading-relaxed font-mono">{aiInsight}</p></div>}</div>
            </div>
            {selectedNodeId && (
                <div className="w-72 bg-slate-900 border-l border-slate-800 p-4 flex flex-col z-20 shadow-xl animate-in slide-in-from-right"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-sm uppercase">Entity Details</h3><button onClick={() => setSelectedNodeId(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button></div>{nodes.filter(n => n.id === selectedNodeId).map(node => <div key={node.id} className="space-y-4"><div className="text-center py-4 bg-slate-950 rounded-lg border border-slate-800"><div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${node.type === 'PERSON' ? 'bg-blue-900/30 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>{getNodeIcon(node.type)}</div><input type="text" value={node.label} onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? {...n, label: e.target.value} : n))} className="bg-transparent text-center font-bold text-white w-full outline-none" /><div className="text-[10px] text-slate-500 font-mono mt-1">{node.id}</div></div><div><label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Type</label><select value={node.type} onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? {...n, type: e.target.value as any} : n))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"><option value="PERSON">Person</option><option value="ORG">Organization</option><option value="LOCATION">Location</option><option value="EVENT">Event</option></select></div><div><label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Notes</label><textarea value={node.details} onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? {...n, details: e.target.value} : n))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white h-24 resize-none" /></div><div className="bg-slate-800 p-2 rounded border border-slate-700 flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400">RISK</span><select value={node.risk} onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? {...n, risk: e.target.value as any} : n))} className={`text-[10px] font-bold bg-transparent text-right ${node.risk === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`}><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option></select></div><button onClick={() => { setNodes(prev => prev.filter(n => n.id !== node.id)); setLinks(prev => prev.filter(l => l.source !== node.id && l.target !== node.id)); setSelectedNodeId(null); }} className="w-full py-2 bg-red-900/20 text-red-400 border border-red-500/30 rounded text-xs font-bold">DELETE</button></div>)}</div>
            )}
        </div>
    );
};

const IntelligenceView: React.FC = () => {
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
    const [activeTab, setActiveTab] = useState<'TARGETS' | 'ANALYSIS' | 'NETWORK' | 'LIBRARY' | 'GALLERY'>('TARGETS');
    const [selectedTarget, setSelectedTarget] = useState<any>(null);
    const [selectedManual, setSelectedManual] = useState<any>(null);
    const [assetView, setAssetView] = useState<'HEAD' | 'BODY' | '3D'>('HEAD');
    const [reportType, setReportType] = useState('DOSSIER');
    const [intelSubject, setIntelSubject] = useState('');
    const [intelArea, setIntelArea] = useState('');
    const [intelNotes, setIntelNotes] = useState('');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isVaultUnlocked) return <SecureVaultOverlay onUnlock={() => setIsVaultUnlocked(true)} />;

    const handleGenerateReport = async () => { setIsGenerating(true); const prompt = `GENERATE CLASSIFIED REPORT: ${reportType}. TARGET: ${intelSubject}. AREA: ${intelArea}. NOTES: ${intelNotes}. FORMAT: ${INTEL_REPORT_TEMPLATES[reportType as keyof typeof INTEL_REPORT_TEMPLATES] || ''}`; const result = await generateTextResponse(prompt, 'gemini-3-pro-preview'); const cleanedResult = result ? result.replace(/\*/g, '') : ''; setGeneratedReport(cleanedResult); setIsGenerating(false); };
    const handleDownloadTxt = () => { if (!generatedReport) return; const element = document.createElement("a"); const file = new Blob([generatedReport], {type: 'text/plain'}); element.href = URL.createObjectURL(file); element.download = `INTEL_${reportType}.txt`; document.body.appendChild(element); element.click(); document.body.removeChild(element); };
    const handlePrint = () => { if (!generatedReport) return; const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.write(`<html><body style="font-family:serif;padding:40px;white-space:pre-wrap;">${generatedReport}</body></html>`); printWindow.document.close(); printWindow.print(); } };

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-col md:flex-row justify-between items-center shrink-0 gap-3">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 bg-cyan-600/10 text-cyan-400 rounded-lg flex items-center justify-center border border-cyan-500/30 shrink-0">
                        <Eye className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="font-black text-white text-lg tracking-tighter truncate md:whitespace-normal w-[200px]">INTEL FUSION</h1>
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider truncate md:whitespace-normal w-[200px]">DI Directorate for Intelligence</p>
                    </div>
                </div>
                <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 w-full md:w-auto overflow-x-auto no-scrollbar">{[{ id: 'TARGETS', icon: Target, label: 'Targets' }, { id: 'NETWORK', icon: Network, label: 'Network' }, { id: 'ANALYSIS', icon: Brain, label: 'Reports' }, { id: 'LIBRARY', icon: Database, label: 'Manuals' }].map(tab => <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelectedTarget(null); }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}><tab.icon className="w-3 h-3" /> <span className="hidden md:inline">{tab.label}</span></button>)}</div>
            </div>
            <div className="flex-1 overflow-hidden relative flex">
                {activeTab === 'TARGETS' && (
                    <div className="w-full flex flex-col md:flex-row h-full">
                        <div className={`w-full md:w-1/3 bg-slate-900/50 border-r border-slate-800 flex-col ${selectedTarget ? 'hidden md:flex' : 'flex'}`}><div className="p-3 border-b border-slate-800"><div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" /><input type="text" placeholder="Search targets..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200" /></div></div><div className="flex-1 overflow-y-auto p-3 space-y-4"><div><h3 className="text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Organized Groups</h3><div className="space-y-2">{MOCK_GROUPS.map(g => <IntelTargetCard key={g.id} target={g} onClick={setSelectedTarget} />)}</div></div><div><h3 className="text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Priority Individuals</h3><div className="space-y-2">{MOCK_ROGUE_GALLERY.map(p => <IntelTargetCard key={p.id} target={p} onClick={setSelectedTarget} />)}</div></div></div></div>
                        <div className={`flex-1 bg-slate-950 items-center justify-center ${selectedTarget ? 'flex' : 'hidden md:flex'}`}>{selectedTarget ? <div className="w-full h-full flex flex-col animate-in fade-in zoom-in duration-200"><div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center shadow-lg z-10"><div><h2 className="text-xl font-black text-white uppercase flex items-center gap-2">{selectedTarget.name}<span className={`text-[10px] px-2 py-0.5 rounded border font-mono tracking-widest ${selectedTarget.threat === 'CRITICAL' || selectedTarget.riskLevel === 'HIGH' ? 'bg-red-900/50 text-red-400 border-red-500/50' : 'bg-blue-900/50 text-blue-400 border-blue-500/50'}`}>{selectedTarget.threat || selectedTarget.riskLevel}</span></h2><div className="text-cyan-500 font-mono text-xs">ID: {selectedTarget.id}</div></div><button onClick={() => setSelectedTarget(null)} className="text-slate-500 hover:text-white p-2 rounded-full hover:bg-slate-800"><X className="w-6 h-6" /></button></div><div className="flex-1 flex overflow-hidden flex-col md:flex-row"><div className="w-full md:w-1/2 h-1/2 md:h-full bg-black relative flex flex-col border-b md:border-b-0 md:border-r border-slate-800"><div className="absolute top-4 left-4 z-20 flex gap-2"><button onClick={() => setAssetView('HEAD')} className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${assetView === 'HEAD' ? 'bg-blue-600 text-white border-blue-500' : 'bg-black/60 text-slate-300'}`}><User className="w-4 h-4" /> MUGSHOT</button><button onClick={() => setAssetView('BODY')} className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${assetView === 'BODY' ? 'bg-blue-600 text-white border-blue-500' : 'bg-black/60 text-slate-300'}`}><Accessibility className="w-4 h-4" /> BODY</button></div><div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden">{assetView === '3D' && selectedTarget.threeDModelUrl ? <video src={selectedTarget.threeDModelUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" /> : assetView === 'BODY' ? (selectedTarget.fullBodyImageUrl ? <img src={selectedTarget.fullBodyImageUrl} className="w-full h-full object-contain object-top" /> : <div className="text-slate-600">No image</div>) : (selectedTarget.imageUrl ? <img src={selectedTarget.imageUrl} className="w-full h-full object-cover" /> : <div className="text-slate-600">No image</div>)}</div><div className="p-4 bg-black/80 absolute bottom-0 w-full border-t border-white/10 flex items-center gap-4 text-xs font-mono">{selectedTarget.imageSource === 'AI_GENERATED' ? <span className="text-cyan-400">AI Composite</span> : <span className="text-blue-400">Actual Photo</span>}</div></div><div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-900 p-6 flex flex-col overflow-y-auto"><h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Intel Brief</h3><div className="bg-slate-950 border border-slate-800 rounded p-4 text-sm text-slate-300 font-mono leading-relaxed mb-6">Subject under surveillance. Sector illicit activity suspected. {selectedTarget.crime && <div className="mt-2 text-red-400">CRIME: {selectedTarget.crime}</div>}</div><div className="grid grid-cols-2 gap-4 text-xs mb-6"><div className="bg-slate-950 p-3 rounded border border-slate-800"><span className="text-slate-500 block mb-1">AREA</span><span className="text-slate-200 font-bold">{selectedTarget.area || selectedTarget.lastSeen}</span></div><div className="bg-slate-950 p-3 rounded border border-slate-800"><span className="text-slate-500 block mb-1">STATUS</span><span className={`font-black ${selectedTarget.status === 'CAPTURED' ? 'text-green-500' : 'text-red-500'}`}>{selectedTarget.status || 'ACTIVE'}</span></div></div><div className="mt-auto flex gap-3"><button onClick={() => { setActiveTab('ANALYSIS'); setIntelSubject(selectedTarget.name); }} className="flex-1 bg-cyan-700 text-white py-3 rounded-lg text-xs font-bold">GENERATE DOSSIER</button><button className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-lg text-xs font-bold">UPDATE</button></div></div></div></div> : <div className="text-center text-slate-600"><Target className="w-24 h-24 mx-auto mb-4 opacity-20" /><h3 className="text-lg font-bold">Select Target</h3></div>}</div>
                    </div>
                )}
                {activeTab === 'NETWORK' && <div className="w-full h-full"><LinkAnalysisBoard /></div>}
                {activeTab === 'ANALYSIS' && <div className="w-full flex h-full p-4 md:p-6 bg-slate-950"><div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl"><div className="w-full md:w-1/3 border-r border-slate-800 p-6 flex flex-col gap-4"><h2 className="text-white font-bold text-sm uppercase mb-2 flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-500" /> AI Report</h2><div><select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"><option value="DOSSIER">Dossier</option><option value="INTSUM">INTSUM</option></select></div><div><input type="text" value={intelSubject} onChange={(e) => setIntelSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" placeholder="Subject Name" /></div><div className="flex-1"><textarea value={intelNotes} onChange={(e) => setIntelNotes(e.target.value)} className="w-full h-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-300 resize-none" placeholder="Intel notes..." /></div><button onClick={handleGenerateReport} disabled={isGenerating || !intelSubject} className="w-full bg-cyan-700 text-white font-bold py-3 rounded-lg text-xs flex items-center justify-center gap-2">{isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} GENERATE</button></div><div className="flex-1 bg-white text-black p-8 font-serif text-sm overflow-y-auto relative">{generatedReport ? <><div className="absolute top-4 right-4 flex gap-2"><button onClick={handleDownloadTxt} className="p-2 text-slate-600"><Download className="w-4 h-4" /></button><button onClick={handlePrint} className="p-2 text-slate-600"><Printer className="w-4 h-4" /></button></div><div className="whitespace-pre-wrap leading-relaxed max-w-2xl mx-auto">{generatedReport}</div></> : <div className="h-full flex flex-col items-center justify-center text-slate-400"><FileText className="w-16 h-16 mb-4 opacity-20" /><p>Ready to generate.</p></div>}</div></div></div>}
                {activeTab === 'LIBRARY' && <div className="w-full flex h-full"><div className="w-full md:w-1/3 bg-slate-900 border-r border-slate-800 p-2 overflow-y-auto"><h3 className="text-xs font-bold text-slate-500 uppercase p-2">Reference Manuals</h3><div className="space-y-1">{PNP_KNOWLEDGE_BASE.filter(k => k.category === 'Intelligence').map(doc => <div key={doc.id} onClick={() => setSelectedManual(doc)} className={`p-3 rounded border cursor-pointer transition-all ${selectedManual?.id === doc.id ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-300'}`}><div className="text-xs font-bold">{doc.title}</div></div>)}</div></div><div className="hidden md:block flex-1 bg-slate-950 p-6 overflow-y-auto">{selectedManual ? <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl"><h2 className="text-xl font-bold text-cyan-500 mb-4 flex items-center gap-2"><Lock className="w-5 h-5" /> {selectedManual.title}</h2><div className="prose prose-invert max-w-none text-sm font-mono text-slate-300 whitespace-pre-wrap">{selectedManual.content}</div></div> : <div className="flex flex-col items-center justify-center h-full text-slate-500"><Database className="w-16 h-16 mb-4 opacity-20" /><p>Select a manual.</p></div>}</div></div>}
            </div>
        </div>
    );
};

export default IntelligenceView;
