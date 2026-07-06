
import React, { useState, useRef, useEffect } from 'react';
import { Skull, FlaskConical, Eye, FileWarning, Camera, Scale, Gavel, CheckSquare, Search, ChevronRight, AlertTriangle, ScanLine, Printer, Save, RefreshCw, AlertOctagon, FileText, Tag, MapPin, Hash, Trash2, X, Image as ImageIcon, BookOpen } from 'lucide-react';
import { analyzeImage, generateTextResponse } from './services/geminiService';

// --- DATA: DRUG DATABASE ---
const DRUG_DB = [
    {
        id: 'd1',
        name: 'Methamphetamine HCl',
        alias: ['Shabu', 'Bato', 'Item', 'S'],
        appearance: 'White crystalline solid, odorless, bitter taste.',
        effects: 'Euphoria, wakefulness, dilated pupils, paranoia, grinding teeth.',
        packaging: 'Heat-sealed transparent plastic sachets.',
        law: 'RA 9165 Art II Sec 5 (Sale), Sec 11 (Possession)',
        image: 'https://images.unsplash.com/photo-1616409743779-138355606f52?auto=format&fit=crop&q=80&w=400&h=300'
    },
    {
        id: 'd2',
        name: 'Cannabis Sativa',
        alias: ['Marijuana', 'Weed', 'Mary Jane', 'Ganja', 'Damu'],
        appearance: 'Dried leaves, flowering tops, fruity/skunky smell.',
        effects: 'Red eyes, dry mouth, increased appetite, impaired coordination.',
        packaging: 'Bricks (compressed), foil wraps, rolls.',
        law: 'RA 9165 Art II Sec 11',
        image: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&q=80&w=400&h=300'
    },
    {
        id: 'd3',
        name: 'MDMA / Ecstasy',
        alias: ['E', 'X', 'Party Pill', 'Love Drug'],
        appearance: 'Colorful tablets/pills often with logos (Tesla, Superman).',
        effects: 'Enhanced empathy, energy, teeth clenching, blurred vision.',
        packaging: 'Ziplock bags, loose pills.',
        law: 'RA 9165 Art II Sec 11',
        image: 'https://images.unsplash.com/photo-1620052349195-23ba09647209?auto=format&fit=crop&q=80&w=400&h=300'
    },
    {
        id: 'd4',
        name: 'Cocaine',
        alias: ['Coke', 'Snow', 'Blow'],
        appearance: 'Fine white powder.',
        effects: 'Short intense euphoria, confidence, fast heart rate.',
        packaging: 'Paper bindles, small bags.',
        law: 'RA 9165 Art II Sec 11',
        image: 'https://images.unsplash.com/photo-1599409636242-7580bbf1314b?auto=format&fit=crop&q=80&w=400&h=300'
    }
];

const DrugOpsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'SCAN' | 'SUBSTANCES' | 'ASSESSMENT' | 'PROTOCOLS' | 'EVIDENCE'>('SCAN');
    
    // SCANNER STATE
    const [scanMode, setScanMode] = useState<'AI_ANALYSIS' | 'VIRTUAL_TAGGING'>('AI_ANALYSIS');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{detected: boolean, item: string, confidence: string} | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [showReference, setShowReference] = useState(false);
    
    // SUBSTANCE SEARCH STATE
    const [drugSearchQuery, setDrugSearchQuery] = useState('');

    // VIRTUAL TAGGING STATE
    const [taggedEvidenceImage, setTaggedEvidenceImage] = useState<string | null>(null);
    const [evidenceTags, setEvidenceTags] = useState<{id: number, x: number, y: number, label: string, timestamp: string}[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ASSESSMENT STATE
    const [assessmentScores, setAssessmentScores] = useState<Record<string, boolean>>({});
    const [assessmentResult, setAssessmentResult] = useState<string>('');

    // EVIDENCE STATE
    const [evidenceNotes, setEvidenceNotes] = useState('');
    const [generatedInventory, setGeneratedInventory] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // --- CAMERA LOGIC ---
    useEffect(() => {
        let stream: MediaStream | null = null;
        
        const startCamera = async () => {
            if (activeTab === 'SCAN' && cameraActive && !taggedEvidenceImage) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'environment' } 
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (e) {
                    console.error("Camera access denied", e);
                }
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [activeTab, cameraActive, taggedEvidenceImage]);

    // AI Analysis
    const handleScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setScanning(true);
        setScanResult(null);

        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        if (ctx) ctx.drawImage(videoRef.current, 0, 0);
        
        const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        
        const prompt = `Analyze this image for illegal substances (Shabu/Meth, Marijuana/Cannabis, Ecstasy/MDMA, Cocaine) or drug paraphernalia (tooters, aluminum foil strips, lighters, improvised burners). 
        Return the result strictly as: 'POSITIVE: [Item Name]' or 'NEGATIVE'. 
        Be extremely cautious and label as 'SUSPECTED'. 
        Context: Law Enforcement Drug Operation.`;

        const result = await analyzeImage(base64, prompt);
        
        if (result.includes("POSITIVE")) {
            setScanResult({
                detected: true,
                item: result.replace('POSITIVE:', '').trim(),
                confidence: 'High'
            });
        } else {
            setScanResult({
                detected: false,
                item: 'No visible contraband',
                confidence: 'N/A'
            });
        }
        setScanning(false);
    };

    // Virtual Tagging Logic
    const captureForTagging = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        if (ctx) ctx.drawImage(videoRef.current, 0, 0);
        setTaggedEvidenceImage(canvasRef.current.toDataURL('image/jpeg'));
        setEvidenceTags([]);
    };

    const addEvidenceTag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!taggedEvidenceImage) return;
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Calculate relative position %
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const label = String.fromCharCode(65 + evidenceTags.length); // A, B, C...
        const newTag = {
            id: Date.now(),
            x, y,
            label,
            timestamp: new Date().toLocaleTimeString()
        };
        setEvidenceTags([...evidenceTags, newTag]);
    };

    const removeTag = (id: number) => {
        setEvidenceTags(prev => prev.filter(t => t.id !== id));
    };

    const saveTaggedEvidence = () => {
        if (!taggedEvidenceImage) return;
        
        // Simulate saving
        const link = document.createElement('a');
        link.href = taggedEvidenceImage;
        link.download = `EVIDENCE_TAGGED_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("EVIDENCE SECURED. DIGITAL HASH GENERATED: " + Math.random().toString(36).substring(2, 15).toUpperCase());
        setTaggedEvidenceImage(null);
        setEvidenceTags([]);
    };

    // --- ASSESSMENT LOGIC ---
    const handleCheck = (key: string) => {
        setAssessmentScores(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const calculateAssessment = () => {
        const checks = Object.keys(assessmentScores).filter(k => assessmentScores[k]);
        let result = "Inconclusive";
        
        const stimulants = checks.filter(c => ['dilated', 'grinding', 'sweating', 'jittery', 'euphoric'].includes(c)).length;
        const depressants = checks.filter(c => ['constricted', 'drowsy', 'slurred', 'disoriented'].includes(c)).length;
        const cannabis = checks.filter(c => ['red_eyes', 'hungry', 'dry_mouth'].includes(c)).length;

        if (stimulants >= 3) result = "Possible Stimulant Influence (Shabu/Ecstasy)";
        else if (depressants >= 3) result = "Possible Depressant Influence (Opiates/Benzos)";
        else if (cannabis >= 2) result = "Possible Cannabis Influence";
        else if (checks.length > 0) result = "Signs of Impairment Present";
        
        setAssessmentResult(result);
    };

    // --- EVIDENCE LOGIC ---
    const generateInventoryDescription = async () => {
        if (!evidenceNotes) return;
        setIsGenerating(true);
        const prompt = `Convert these rough notes into a formal police inventory description for a Chain of Custody Form (Republic Act 9165 compliant).
        Notes: "${evidenceNotes}"
        Format Example: "One (1) heat-sealed transparent plastic sachet containing white crystalline substance suspected to be Methamphetamine Hydrochloride, marked as '[initials]'."
        Do not add conversational text.`;
        
        const text = await generateTextResponse(prompt);
        setGeneratedInventory(text);
        setIsGenerating(false);
    };

    // Filter Drugs
    const filteredDrugs = DRUG_DB.filter(drug => 
        drug.name.toLowerCase().includes(drugSearchQuery.toLowerCase()) ||
        drug.alias.some(a => a.toLowerCase().includes(drugSearchQuery.toLowerCase())) ||
        drug.appearance.toLowerCase().includes(drugSearchQuery.toLowerCase())
    );

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
            {/* Header - Consolidated Header with Integrated Tabs */}
            <div className="bg-violet-950/30 border-b border-violet-900/50 p-3 flex items-center min-h-16 h-auto py-2 gap-4 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-violet-600/20 text-violet-400 rounded-lg flex items-center justify-center border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)] shrink-0">
                        <Skull className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="font-black text-white text-lg tracking-tighter flex items-center gap-2 font-tech truncate">
                                NARCOTICS
                            </h1>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider truncate">Anti-Illegal Drugs Operations</p>
                        </div>

                        {/* Navigation Tabs - Integrated alongside labels */}
                        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800 overflow-x-auto no-scrollbar shadow-inner">
                            {[
                                { id: 'SCAN', label: 'Scanner', icon: ScanLine },
                                { id: 'SUBSTANCES', label: 'Database', icon: FlaskConical },
                                { id: 'ASSESSMENT', label: 'Assessment', icon: Eye },
                                { id: 'PROTOCOLS', label: 'Protocols', icon: Scale },
                                { id: 'EVIDENCE', label: 'Evidence', icon: FileWarning },
                            ].map((tab: any) => (
                                <button
                                    key={tab.id}
                                    id={`drug-ops-tab-${tab.id.toLowerCase()}`}
                                    onClick={() => { setActiveTab(tab.id); if(tab.id === 'SCAN') setCameraActive(true); else setCameraActive(false); }}
                                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase flex items-center gap-1.5 transition-all shrink-0 ${
                                        activeTab === tab.id 
                                        ? 'bg-violet-600 text-white shadow-lg' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                                >
                                    <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-950">
                
                {/* --- SCANNER TAB --- */}
                {activeTab === 'SCAN' && (
                    <div className="h-full flex flex-col relative">
                        {/* Scan Mode Toggle & Reference Button */}
                        <div className="absolute top-4 left-0 right-0 flex justify-center z-30 gap-2 px-4 pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 flex pointer-events-auto shadow-xl">
                                <button
                                    onClick={() => setScanMode('AI_ANALYSIS')}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${scanMode === 'AI_ANALYSIS' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    AI ANALYSIS
                                </button>
                                <button
                                    onClick={() => setScanMode('VIRTUAL_TAGGING')}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${scanMode === 'VIRTUAL_TAGGING' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    EVIDENCE TAGGING
                                </button>
                            </div>
                            
                            {/* Visual Reference Toggle */}
                            <button 
                                onClick={() => setShowReference(!showReference)}
                                className={`pointer-events-auto p-2 rounded-full border shadow-lg transition-all ${showReference ? 'bg-white text-black border-white' : 'bg-black/60 text-white border-white/20 backdrop-blur-md'}`}
                                title="Visual ID Guide"
                            >
                                <BookOpen className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                            {!cameraActive && !taggedEvidenceImage ? (
                                <div className="flex flex-col items-center gap-4">
                                    <button 
                                        onClick={() => setCameraActive(true)}
                                        className="w-20 h-20 rounded-full bg-violet-900/20 border border-violet-500 text-violet-400 flex items-center justify-center animate-pulse"
                                    >
                                        <Camera className="w-8 h-8" />
                                    </button>
                                    <span className="text-xs text-violet-400 font-mono">ACTIVATE CAMERA</span>
                                </div>
                            ) : (
                                <>
                                    {!taggedEvidenceImage ? (
                                        // LIVE CAMERA FEED
                                        <>
                                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
                                            {/* Reticle / Overlays */}
                                            {scanMode === 'AI_ANALYSIS' ? (
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-violet-500/50 rounded-lg flex items-center justify-center">
                                                        <div className="w-full h-0.5 bg-red-500/50 absolute top-1/2 left-0 animate-pulse"></div>
                                                        <div className="h-full w-0.5 bg-red-500/50 absolute left-1/2 top-0 animate-pulse"></div>
                                                        <span className="absolute top-2 left-2 text-[10px] text-violet-300 font-mono bg-black/50 px-1">AI_SEARCHING...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 pointer-events-none border-[10px] border-yellow-500/20 flex flex-col justify-between p-4">
                                                    <div className="text-center bg-yellow-500 text-black font-bold text-xs px-3 py-1 rounded mx-auto inline-block">EVIDENCE DOCUMENTATION MODE</div>
                                                    <div className="text-center text-yellow-500/50 font-mono text-[10px]">ALIGN EVIDENCE IN FRAME</div>
                                                </div>
                                            )}

                                            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-auto">
                                                {scanMode === 'AI_ANALYSIS' ? (
                                                    <button 
                                                        onClick={handleScan}
                                                        disabled={scanning}
                                                        className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all active:scale-95 ${
                                                            scanning ? 'border-amber-500 bg-amber-900/20 animate-spin' : 'border-violet-500 bg-violet-600 hover:bg-violet-500'
                                                        }`}
                                                    >
                                                        <ScanLine className="w-8 h-8 text-white" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={captureForTagging}
                                                        className="w-20 h-20 rounded-full border-4 border-yellow-500 bg-yellow-600 hover:bg-yellow-500 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)] active:scale-95"
                                                    >
                                                        <Camera className="w-8 h-8 text-black" />
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        // CAPTURED IMAGE FOR TAGGING
                                        <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                                            <div className="relative max-h-full max-w-full overflow-hidden" onClick={addEvidenceTag}>
                                                <img src={taggedEvidenceImage} className="max-h-[80vh] w-auto border-2 border-yellow-500/50 rounded shadow-2xl" alt="Evidence" />
                                                
                                                {/* Render Tags */}
                                                {evidenceTags.map(tag => (
                                                    <div 
                                                        key={tag.id}
                                                        className="absolute w-8 h-8 -ml-4 -mt-8 cursor-pointer group"
                                                        style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                                                        onClick={(e) => { e.stopPropagation(); removeTag(tag.id); }}
                                                    >
                                                        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-400 absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1"></div>
                                                        <div className="w-full h-full bg-yellow-400 rounded text-black font-black flex items-center justify-center border border-white shadow-lg text-sm relative z-10">
                                                            {tag.label}
                                                        </div>
                                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-black/80 text-white text-[9px] p-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                            Tap to Remove
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Image Controls */}
                                            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                                                <button onClick={() => { setTaggedEvidenceImage(null); setEvidenceTags([]); }} className="p-3 rounded-full bg-slate-800 text-white hover:bg-slate-700 shadow-lg">
                                                    <RefreshCw className="w-5 h-5" />
                                                </button>
                                                <div className="flex-1 bg-black/60 backdrop-blur rounded-lg px-4 py-2 flex items-center justify-between border border-white/10 text-white">
                                                    <span className="text-xs font-mono text-yellow-400">TAP IMAGE TO TAG</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">TAGS: {evidenceTags.length}</span>
                                                </div>
                                                <button onClick={saveTaggedEvidence} className="px-6 py-2 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm shadow-lg flex items-center gap-2">
                                                    <Save className="w-4 h-4" /> SECURE
                                                </button>
                                            </div>

                                            {/* Digital Watermark Overlay */}
                                            <div className="absolute top-20 left-4 bg-black/50 p-2 rounded border-l-2 border-yellow-500 pointer-events-none">
                                                <div className="text-[8px] text-yellow-500 font-bold uppercase tracking-widest mb-1">Chain of Custody</div>
                                                <div className="text-[9px] text-white font-mono flex flex-col gap-0.5">
                                                    <span className="flex items-center gap-1"><MapPin className="w-2 h-2" /> GPS: 14.5995, 120.9842</span>
                                                    <span className="flex items-center gap-1"><Hash className="w-2 h-2" /> ID: {Date.now().toString(36).toUpperCase()}</span>
                                                    <span className="flex items-center gap-1"><FileText className="w-2 h-2" /> CASE: 24-PNP-001</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {/* AI Result Overlay */}
                            {scanResult && scanMode === 'AI_ANALYSIS' && (
                                <div className={`absolute top-24 left-4 right-4 p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-top-4 ${
                                    scanResult.detected 
                                    ? 'bg-red-900/80 border-red-500 text-white' 
                                    : 'bg-emerald-900/80 border-emerald-500 text-white'
                                }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${scanResult.detected ? 'bg-red-600' : 'bg-emerald-600'}`}>
                                            {scanResult.detected ? <AlertTriangle className="w-6 h-6" /> : <CheckSquare className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg uppercase font-tech tracking-wider">
                                                {scanResult.detected ? 'POSITIVE DETECTION' : 'NEGATIVE'}
                                            </h3>
                                            <p className="font-mono text-sm opacity-90 mt-1 uppercase">
                                                {scanResult.item}
                                            </p>
                                            {scanResult.detected && (
                                                <div className="mt-2 text-[10px] bg-black/30 p-2 rounded border border-white/10">
                                                    CAUTION: TREAT AS HAZARDOUS MATERIAL. FOLLOW CHAIN OF CUSTODY.
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => setScanResult(null)} className="ml-auto text-white/50 hover:text-white">
                                            <AlertOctagon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* REFERENCE OVERLAY (New Feature) */}
                            {showReference && (
                                <div className="absolute inset-0 bg-black/90 z-40 p-4 flex flex-col animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5 text-violet-400" /> Visual ID Guide
                                        </h3>
                                        <button onClick={() => setShowReference(false)} className="text-slate-400 hover:text-white">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-4">
                                        {DRUG_DB.map(drug => (
                                            <div key={drug.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex gap-3">
                                                <img src={drug.image} className="w-24 h-24 object-cover rounded border border-slate-600" alt={drug.name} />
                                                <div className="flex-1">
                                                    <div className="font-bold text-white text-sm">{drug.name}</div>
                                                    <div className="text-[10px] text-violet-400 font-mono mb-1">{drug.alias.join(', ')}</div>
                                                    <div className="text-[10px] text-slate-300 leading-tight">{drug.appearance}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 text-center text-[10px] text-slate-500 uppercase">
                                        Reference Purposes Only • Confirmatory Lab Test Required
                                    </div>
                                </div>
                            )}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                {/* --- SUBSTANCES TAB --- */}
                {activeTab === 'SUBSTANCES' && (
                    <div className="h-full overflow-y-auto p-4 bg-grid-pattern">
                        <div className="mb-4 relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Search substances by name, alias, appearance..." 
                                value={drugSearchQuery}
                                onChange={(e) => setDrugSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDrugs.length === 0 ? (
                                <div className="col-span-full text-center py-10 text-slate-500">
                                    <FlaskConical className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No matching substances found.</p>
                                </div>
                            ) : (
                                filteredDrugs.map(drug => (
                                    <div key={drug.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-violet-500/50 transition-all">
                                        <div className="h-32 overflow-hidden relative">
                                            <img src={drug.image} alt={drug.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                            <div className="absolute bottom-2 left-3">
                                                <h3 className="font-black text-white text-lg">{drug.name}</h3>
                                                <div className="text-violet-400 text-[10px] font-mono uppercase tracking-wide">
                                                    {drug.alias.join(' • ')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-2 text-xs text-slate-300">
                                            <div className="flex gap-2">
                                                <span className="font-bold text-slate-500 uppercase w-16 shrink-0">Look:</span>
                                                <span>{drug.appearance}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-bold text-slate-500 uppercase w-16 shrink-0">Effects:</span>
                                                <span>{drug.effects}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-bold text-slate-500 uppercase w-16 shrink-0">Pack:</span>
                                                <span>{drug.packaging}</span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2 text-amber-500 font-bold">
                                                <Gavel className="w-3 h-3" /> {drug.law}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- ASSESSMENT TAB --- */}
                {activeTab === 'ASSESSMENT' && (
                    <div className="h-full overflow-y-auto p-4 md:p-6 bg-slate-950">
                        <div className="max-w-xl mx-auto bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                                <Eye className="w-5 h-5 text-violet-500" />
                                Influence Assessment Checklist
                            </h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Eyes & Face</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'dilated', label: 'Dilated Pupils' },
                                            { id: 'constricted', label: 'Constricted Pupils' },
                                            { id: 'red_eyes', label: 'Red/Bloodshot Eyes' },
                                            { id: 'grinding', label: 'Jaw Grinding' },
                                        ].map(opt => (
                                            <button 
                                                key={opt.id}
                                                onClick={() => handleCheck(opt.id)}
                                                className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${assessmentScores[opt.id] ? 'bg-violet-900/30 border-violet-500 text-violet-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Behavior & Physical</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'sweating', label: 'Profuse Sweating' },
                                            { id: 'dry_mouth', label: 'Dry Mouth / Lips' },
                                            { id: 'jittery', label: 'Jittery / Restless' },
                                            { id: 'drowsy', label: 'Drowsy / Nodding' },
                                            { id: 'slurred', label: 'Slurred Speech' },
                                            { id: 'euphoric', label: 'Euphoric / Hyper' },
                                        ].map(opt => (
                                            <button 
                                                key={opt.id}
                                                onClick={() => handleCheck(opt.id)}
                                                className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${assessmentScores[opt.id] ? 'bg-violet-900/30 border-violet-500 text-violet-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={calculateAssessment}
                                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                                >
                                    ANALYZE INDICATORS
                                </button>

                                {assessmentResult && (
                                    <div className="bg-slate-800 border-l-4 border-amber-500 p-4 rounded-r-lg animate-in fade-in slide-in-from-bottom-2">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">Result</div>
                                        <div className="text-white font-bold text-lg leading-tight">{assessmentResult}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PROTOCOLS TAB --- */}
                {activeTab === 'PROTOCOLS' && (
                    <div className="h-full overflow-y-auto p-4 space-y-4 bg-slate-950">
                        {/* RA 9165 Sec 21 */}
                        <div className="bg-slate-900 border border-red-500/30 rounded-xl overflow-hidden shadow-lg">
                            <div className="bg-red-900/20 p-4 border-b border-red-500/20 flex items-center gap-3">
                                <Scale className="w-6 h-6 text-red-400" />
                                <div>
                                    <h2 className="text-white font-black text-sm uppercase">RA 9165 Section 21</h2>
                                    <p className="text-red-300 text-[10px] font-mono">CRITICAL: Chain of Custody Requirements</p>
                                </div>
                            </div>
                            <div className="p-4 text-xs text-slate-300 space-y-3 leading-relaxed font-mono">
                                <p className="font-bold text-white">The apprehending team having initial custody and control of the drugs shall:</p>
                                <ul className="list-disc pl-4 space-y-2">
                                    <li>Immediately after seizure and confiscation, physically inventory and photograph the same in the presence of the accused.</li>
                                    <li>Require the presence of:
                                        <ul className="list-decimal pl-4 mt-1 text-red-200">
                                            <li>The accused or his/her representative.</li>
                                            <li>A representative from the Media.</li>
                                            <li>A representative from the Department of Justice (DOJ).</li>
                                            <li>Any elected public official.</li>
                                        </ul>
                                    </li>
                                    <li>All witnesses must sign the copies of the inventory and be given a copy thereof.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Buy Bust Checklist */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="bg-slate-800 p-3 border-b border-slate-700 font-bold text-slate-200 text-sm flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-blue-400" /> Buy-Bust Protocol Checklist
                            </div>
                            <div className="p-4 space-y-2">
                                {[
                                    'Coordinate with PDEA (Pre-Ops)',
                                    'Preparation of Buy-Bust Money (Dusting/Marking)',
                                    'Surveillance / Confirm Target',
                                    'Briefing / Designation of Poseur Buyer',
                                    'Execution / Signal',
                                    'Arrest & Seizure',
                                    'Marking of Evidence (On Site)',
                                    'Inventory with Witnesses (Sec 21)',
                                    'Booking & Medical Exam'
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 text-xs text-slate-300 p-2 hover:bg-slate-800 rounded">
                                        <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            {i + 1}
                                        </div>
                                        {step}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- EVIDENCE TAB --- */}
                {activeTab === 'EVIDENCE' && (
                    <div className="h-full flex flex-col p-4 bg-slate-950">
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col shadow-xl">
                            <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-500" /> Chain of Custody Helper
                            </h2>
                            
                            <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block">Rough Notes (Item, Markings, Weight)</label>
                            <textarea 
                                value={evidenceNotes}
                                onChange={(e) => setEvidenceNotes(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-violet-500 outline-none h-32 resize-none mb-4"
                                placeholder="e.g. 1 sachet shabu marked JD-1 found in right pocket..."
                            />
                            
                            <button 
                                onClick={generateInventoryDescription}
                                disabled={isGenerating || !evidenceNotes}
                                className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 mb-6"
                            >
                                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                                GENERATE OFFICIAL DESCRIPTION
                            </button>

                            <div className="flex-1 relative">
                                <label className="text-[10px] text-slate-400 font-bold uppercase mb-2 block">Generated Output (Copy to Form)</label>
                                <div className="absolute inset-0 top-6 bg-slate-950 border border-slate-700 rounded-lg p-3 overflow-y-auto">
                                    <p className="text-sm text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed">
                                        {generatedInventory || <span className="text-slate-600 italic">Output will appear here...</span>}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex justify-end gap-3">
                                <button className="p-2 rounded bg-slate-800 text-slate-400 hover:text-white">
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button className="px-4 py-2 rounded bg-emerald-600 text-white text-xs font-bold flex items-center gap-2">
                                    <Save className="w-4 h-4" /> SAVE TO LOG
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DrugOpsView;
