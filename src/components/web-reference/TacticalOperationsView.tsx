
import React, { useState } from 'react';
import { Target, Shield, Users, Map, Crosshair, FileText, CheckSquare, Settings, ChevronRight, AlertTriangle, Zap, Radio, Briefcase, Activity, Hexagon, Cross, Sword, Eye, Truck, Database, Save, Printer, Share2, Lock, Cpu, Menu, X, Battery, ChevronLeft, Paperclip, ExternalLink, Globe, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- TYPES ---
type DocType = 'OPLAN' | 'OPORD' | 'COMMO' | 'INTEL' | 'PERSONNEL';

interface Operative {
    id: string;
    callsign: string;
    role: 'ASSAULT' | 'BREACHER' | 'SNIPER' | 'MEDIC' | 'TEAM_LEADER';
    status: 'READY' | 'DEPLOYED' | 'ENGAGED' | 'WOUNDED';
    loadout: Loadout;
    vitals: { hr: number, spo2: number };
}

interface Loadout {
    primary: string;
    secondary: string;
    armor: 'Lvl IIIA' | 'Lvl IV' | 'Plate Carrier';
    tactical: string[];
}

// --- MOCK DATA ---
const TEAM_ROSTER: Operative[] = [
    { 
        id: 'op1', callsign: 'ALPHA 1 (TL)', role: 'TEAM_LEADER', status: 'READY', 
        vitals: { hr: 65, spo2: 99 },
        loadout: { primary: 'HK416', secondary: 'Glock 19', armor: 'Lvl IV', tactical: ['Radio', 'Flashbang'] } 
    },
    { 
        id: 'op2', callsign: 'BRAVO 2 (BREACH)', role: 'BREACHER', status: 'READY', 
        vitals: { hr: 68, spo2: 98 },
        loadout: { primary: 'Mossberg 590', secondary: 'Glock 19', armor: 'Lvl IV', tactical: ['Battering Ram', 'Halligan'] } 
    },
    { 
        id: 'op3', callsign: 'CHARLIE 3 (DMR)', role: 'SNIPER', status: 'READY', 
        vitals: { hr: 55, spo2: 99 },
        loadout: { primary: 'SR-25', secondary: 'Sig P320', armor: 'Lvl IIIA', tactical: ['Rangefinder', 'Spotting Scope'] } 
    },
    { 
        id: 'op4', callsign: 'DELTA 4 (MED)', role: 'MEDIC', status: 'READY', 
        vitals: { hr: 62, spo2: 98 },
        loadout: { primary: 'MP5', secondary: 'Glock 19', armor: 'Lvl IV', tactical: ['Trauma Kit', 'Defib'] } 
    },
];

const GEAR_OPTIONS = {
    PRIMARY: ['HK416', 'M4A1 SOPMOD', 'MP5SD', 'Mossberg 590', 'SR-25', 'Tavor X95'],
    SECONDARY: ['Glock 17', 'Glock 19', 'Sig P320', '1911 Tac'],
    TACTICAL: ['Flashbang', 'Smoke Grenade', 'Breaching Charge', 'Taser', 'Flex Cuffs', 'NVG-31', 'Gas Mask', 'Ballistic Shield'],
    ARMOR: ['Lvl IIIA (Soft)', 'Lvl III (Plates)', 'Lvl IV (Ceramic)', 'Heavy Shield']
};

const DOC_TEMPLATES: Record<DocType, string> = {
    OPLAN: `OPLAN: "IRON CLAD"
--------------------------------------------------
1. SITUATION:
   a. Enemy Forces: 4-6 Armed Hostiles confirmed inside Target Building A. 
      Suspected high-powered firearms and IEDs at entry points.
   b. Friendly Forces: SAF Assault Team Alpha, LGU Medical, SWAT Perimeter.

2. MISSION:
   Conduct high-risk warrant service and neutralize threat at [GRID 14R]. 
   Secure High Value Target (HVT) "Alias Cobra".

3. EXECUTION:
   a. Concept of Ops: Stealth approach via rear alley. Explosive breach on Door 2.
   b. Phase 1: Isolation of objective.
   c. Phase 2: Breach and Clear.
   d. Phase 3: Secure HVT and Evidence.
   e. Phase 4: Withdrawal.

4. ADMIN & LOGISTICS:
   a. CASEVAC: Designated at Point X-Ray.
   b. UPSS: Full tactical loadout, Level IV armor required.

5. COMMAND & SIGNAL:
   a. Signal: Secure Channel 1 (Encrypted).
   b. Password: "THUNDER" / "FLASH".`,
   
    OPORD: `OPERATION ORDER 24-001
--------------------------------------------------
TASK ORGANIZATION:
1. Assault Element (Alpha 1, Bravo 2)
2. Support/Sniper (Charlie 3)
3. Medical/Reserve (Delta 4)

TIMELINE:
0400H - Assembly
0430H - Departure
0500H - On Scene
0515H - Initiate`,

    COMMO: `COMMUNICATIONS PLAN (PACE)
--------------------------------------------------
PRIMARY:   Radio Freq 462.5625 (Encrypted)
ALTERNATE: Signal App Group "Alpha Ops"
CONTINGENCY: Satellite Phone (Sat-1)
EMERGENCY: Flare / Whistle (3 Blasts)

CALLSIGNS:
Command: "OVERLORD"
Assault Lead: "ALPHA 1"
Sniper: "EYE 1"`,

    INTEL: `INTELLIGENCE SUMMARY
--------------------------------------------------
Target building floor plan acquired.
- Entry: Reinforced steel door.
- Windows: Barred on ground floor.
- Hostages: None confirmed.
- Threat: HIGH. History of violence against LE.`,

    PERSONNEL: `PERSONNEL ACCOUNTING
--------------------------------------------------
Total Strength: 4
Present: 4
Weapons Status: Green
Vitals: Normal`
};

const TriangleAlert = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
);

const TacticalOperationsView: React.FC = () => {
    const [view, setView] = useState<'DOCS' | 'UPSS' | 'EXECUTION' | 'ATAK'>('DOCS');
    const [activeDoc, setActiveDoc] = useState<DocType>('OPLAN');
    const [docContent, setDocContent] = useState(DOC_TEMPLATES);
    const [roster, setRoster] = useState(TEAM_ROSTER);
    const [selectedOperative, setSelectedOperative] = useState<string>(TEAM_ROSTER[0].id);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const activeOp = roster.find(o => o.id === selectedOperative) || roster[0];

    // Initial mobile state
    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, []);

    const handleDocChange = (text: string) => {
        setDocContent(prev => ({ ...prev, [activeDoc]: text }));
    };

    const updateLoadout = (category: keyof Loadout, value: string) => {
        setRoster(prev => prev.map(op => {
            if (op.id === selectedOperative) {
                if (category === 'tactical') {
                    const current = op.loadout.tactical;
                    const newTactical = current.includes(value) 
                        ? current.filter(t => t !== value)
                        : [...current, value].slice(0, 3);
                    return { ...op, loadout: { ...op.loadout, tactical: newTactical } };
                }
                return { ...op, loadout: { ...op.loadout, [category]: value } };
            }
            return op;
        }));
    };

    // --- SUB-COMPONENTS ---

    const AtakSituationalAwareness = () => {
        const [isAtakPanelOpen, setIsAtakPanelOpen] = useState(true);
        const [mapSource, setMapSource] = useState<'SATELLITE' | 'DARK' | 'GOOGLE'>('SATELLITE');
        const [showMapMenu, setShowMapMenu] = useState(false);

        const launchNativeAtak = () => {
            // Intent for Civilian ATAK
            const intentUrl = 'intent://#Intent;scheme=atak;package=com.atakmap.app.civ;S.browser_fallback_url=https%3A%2F%2Ftak.gov;end';
            window.location.href = intentUrl;
        };

        const mapUrls = {
            SATELLITE: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/121.0493,14.6515,16,0/1200x800?access_token=Pk.eyJ1IjoidGVtcCIsImEiOiJjbHhxIn0",
            DARK: "https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/121.0493,14.6515,16,0/1200x800?access_token=Pk.eyJ1IjoidGVtcCIsImEiOiJjbHhxIn0",
            GOOGLE: "https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/121.0493,14.6515,16,0/1200x800?access_token=Pk.eyJ1IjoidGVtcCIsImEiOiJjbHhxIn0" // Street view as surrogate for Google
        };

        return (
            <div className="flex h-full w-full bg-slate-950 overflow-hidden relative">
                {/* Tactical Map Interface */}
                <div className="flex-1 relative bg-black group" onClick={() => setIsAtakPanelOpen(!isAtakPanelOpen)}>
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-all duration-500 opacity-60"
                        style={{ backgroundImage: `url('${mapUrls[mapSource]}')` }}
                    ></div>
                    
                    {/* Compass Rose Overlay */}
                    <div className="absolute top-4 right-4 w-12 h-12 border border-emerald-500/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="text-[8px] font-black text-emerald-400">N</div>
                        <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full"></div>
                    </div>

                    {/* MGRS Grid Labels */}
                    <div className="absolute bottom-4 left-4 font-mono text-[9px] text-emerald-500/70 space-y-1 bg-black/40 p-2 rounded">
                        <div>MGRS: 51P TU 548 194</div>
                        <div>LAT/LON: 14.6515° N, 121.0493° E</div>
                    </div>

                    {/* COT (Cursor On Target) Markers */}
                    <div className="absolute top-[40%] left-[45%]">
                        <div className="relative group cursor-pointer">
                            <Hexagon className="w-6 h-6 text-emerald-400 fill-emerald-400/20 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-emerald-500 rounded text-[8px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                TEAM ALPHA | COT-ID: 104
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-[55%] left-[60%]">
                        <div className="relative group cursor-pointer">
                            <TriangleAlert className="w-5 h-5 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-amber-500 rounded text-[8px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                SUSPECT VEHICLE | BP: ABC-1234
                            </div>
                        </div>
                    </div>

                    {/* Map Controls */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                        <div className="relative">
                            <AnimatePresence>
                                {showMapMenu && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute bottom-full right-0 mb-2 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden p-1 z-50"
                                    >
                                        <button 
                                            onClick={() => { setMapSource('SATELLITE'); setShowMapMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase rounded ${mapSource === 'SATELLITE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                        >
                                            Satellite
                                        </button>
                                        <button 
                                            onClick={() => { setMapSource('DARK'); setShowMapMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase rounded ${mapSource === 'DARK' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                        >
                                            Tactical Dark
                                        </button>
                                        <button 
                                            onClick={() => { setMapSource('GOOGLE'); setShowMapMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase rounded ${mapSource === 'GOOGLE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                        >
                                            Google Maps
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button 
                                onClick={() => setShowMapMenu(!showMapMenu)}
                                className={`p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-emerald-500 rounded-md backdrop-blur shadow-xl transition-all ${showMapMenu ? 'bg-slate-800 ring-2 ring-emerald-500/50' : ''}`}
                            >
                                <Layers className="w-4 h-4" />
                            </button>
                        </div>
                        <button className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-emerald-500 rounded-md backdrop-blur shadow-xl">
                            <Globe className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ATAK Integration Panel */}
                <motion.div 
                    animate={{ x: isAtakPanelOpen ? 0 : '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-10 shadow-2xl relative"
                >
                    <div className="p-4 border-b border-slate-800 bg-slate-850">
                        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-4 h-4" /> ATAK LINK
                        </h3>
                        <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Android Team Awareness Kit</p>
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                        <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
                            <div className="text-[10px] font-bold text-emerald-400 mb-2 uppercase tracking-tighter">Situational Awareness</div>
                            <div className="space-y-2 text-[9px] text-slate-400">
                                <div className="flex justify-between">
                                    <span>NETWORK:</span>
                                    <span className="text-emerald-500">CONNECTED</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>DATA SYNC:</span>
                                    <span className="text-emerald-500">ACTIVE</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ENCRYPTION:</span>
                                    <span className="text-emerald-500">AES-256</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[9px] font-black text-slate-500 uppercase">TAK Data Feed</h4>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[8px] text-emerald-400/80 max-h-32 overflow-hidden">
                                <div>[09:38:12] REC COT-PACKET: ALPHA_1</div>
                                <div>[09:38:15] POS UPD: 14.6515, 121.0493</div>
                                <div>[09:38:19] ALERT: SUSPECTED_POINTER</div>
                                <div className="animate-pulse">_</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-800 space-y-3">
                        <button 
                            onClick={launchNativeAtak}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-lg border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            OPEN NATIVE ATAK
                        </button>
                        <p className="text-[8px] text-center text-slate-500 font-bold uppercase"> requires ATAK app on device </p>
                    </div>
                </motion.div>
            </div>
        );
    };

    const DocumentationView = () => (
        <div className="flex h-full w-full overflow-hidden bg-slate-950 relative">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[25] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Doc Selector Sidebar */}
            <motion.div 
                initial={false}
                animate={{ 
                    x: isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 0 : '-100%',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`w-56 bg-slate-900 border-r border-slate-700 flex flex-col shrink-0 z-30 absolute inset-y-0 left-0 md:relative md:translate-x-0 h-full`}
            >
                {/* Floating Mobile Toggle Button (Attached to Panel) */}
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden absolute right-[-25px] top-1/2 -translate-y-1/2 w-[25px] h-[50px] bg-blue-600 hover:bg-blue-500 text-white rounded-r-xl flex items-center justify-center z-[40] shadow-[4px_0_15px_rgba(37,99,235,0.4)] border border-l-0 border-blue-400/30 transition-all active:scale-95"
                    title={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                    {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>

                <div className="p-3 border-b border-slate-800 bg-slate-950/50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Op-Documents</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto py-2">
                    {(Object.keys(DOC_TEMPLATES) as DocType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                setActiveDoc(type);
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={`w-full text-left px-4 py-4 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-3 relative
                                ${activeDoc === type ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}
                            `}
                        >
                            {activeDoc === type && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                            <FileText className="w-4 h-4 shrink-0" />
                            {type}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-10 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{activeDoc} EDITOR</span>
                    <div className="flex gap-1.5">
                        <button className="group relative flex items-center gap-0 hover:gap-2 px-2 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded border border-slate-700 hover:border-blue-500 transition-all active:scale-95 duration-300 overflow-hidden" title="Attach media/docs">
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="w-0 group-hover:w-16 overflow-hidden text-[10px] font-bold uppercase whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100">Attach</span>
                        </button>
                        <button className="group relative flex items-center gap-0 hover:gap-2 px-2 py-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded border border-slate-700 hover:border-cyan-500 transition-all active:scale-95 duration-300 overflow-hidden" title="Share report">
                            <Share2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="w-0 group-hover:w-14 overflow-hidden text-[10px] font-bold uppercase whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100">Share</span>
                        </button>
                        <button className="group relative flex items-center gap-0 hover:gap-2 px-2 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded border border-slate-700 hover:border-emerald-500 transition-all active:scale-95 duration-300 overflow-hidden" title="Save changes">
                            <Save className="w-3.5 h-3.5 shrink-0" />
                            <span className="w-0 group-hover:w-12 overflow-hidden text-[10px] font-bold uppercase whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100">Save</span>
                        </button>
                        <button className="group relative flex items-center gap-0 hover:gap-2 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 hover:border-slate-600 transition-all active:scale-95 duration-300 overflow-hidden" title="Print document">
                            <Printer className="w-3.5 h-3.5 shrink-0" />
                            <span className="w-0 group-hover:w-14 overflow-hidden text-[10px] font-bold uppercase whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100">Print</span>
                        </button>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <textarea 
                        value={docContent[activeDoc]} 
                        onChange={(e) => handleDocChange(e.target.value)}
                        className="w-full h-full bg-white p-4 md:p-6 text-xs md:text-sm font-mono text-black leading-relaxed outline-none resize-none"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );

    const UPSSManager = () => (
        <div className="flex flex-col md:flex-row h-full w-full bg-slate-950 overflow-hidden relative">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[25] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* 1. Roster (Left) */}
            <motion.div 
                initial={false}
                animate={{ 
                    x: isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 0 : '-100%',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`w-64 bg-slate-900 border-r border-slate-700 flex flex-col shrink-0 z-30 absolute inset-y-0 left-0 md:relative md:translate-x-0 h-full`}
            >
                {/* Floating Mobile Toggle Button */}
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden absolute right-[-25px] top-1/2 -translate-y-1/2 w-[25px] h-[50px] bg-blue-600 hover:bg-blue-500 text-white rounded-r-xl flex items-center justify-center z-[40] shadow-[4px_0_15px_rgba(37,99,235,0.4)] border border-l-0 border-blue-400/30 transition-all active:scale-95"
                    title={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                    {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>

                <div className="p-3 border-b border-slate-700 bg-slate-850">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Alpha Roster</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {roster.map(op => (
                        <button
                            key={op.id}
                            onClick={() => {
                                setSelectedOperative(op.id);
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={`w-full p-2 rounded-lg border text-left transition-all relative overflow-hidden group ${
                                selectedOperative === op.id 
                                ? 'bg-amber-900/20 border-amber-500' 
                                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-[10px] font-black font-mono ${selectedOperative === op.id ? 'text-amber-400' : 'text-slate-200'}`}>
                                    {op.callsign}
                                </span>
                                <span className="text-[8px] bg-black/50 px-1 rounded text-slate-400">{op.role}</span>
                            </div>
                            <div className="text-[8px] text-slate-500 flex flex-col gap-0.5">
                                <span>PRIM: {op.loadout.primary}</span>
                                <span>ARMOR: {op.loadout.armor}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* 2. Visual Loadout (Center) */}
            <div className="flex-1 flex flex-col border-r border-slate-700 relative overflow-hidden bg-grid-pattern h-full">
                <div className="absolute top-2 left-2 text-[10px] text-amber-500 font-bold border border-amber-500/50 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm">
                    {activeOp.callsign} // CONFIGURATION
                </div>
                
                <div className="flex-1 flex items-center justify-center relative">
                    {/* Operative Silhouette */}
                    <div className="relative w-48 h-64 md:w-64 md:h-80">
                        <Users className="w-full h-full text-slate-800 drop-shadow-2xl" strokeWidth={0.5} />
                        
                        {/* Interactive Hotspots */}
                        <div className="absolute top-[20%] right-[-10%] md:right-[-20%]">
                            <div className="bg-slate-900/90 border border-blue-500 px-3 py-1.5 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-md">
                                <Shield className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] font-bold text-white whitespace-nowrap">{activeOp.loadout.armor}</span>
                            </div>
                            <div className="w-8 h-px bg-blue-500 absolute top-1/2 right-full"></div>
                        </div>

                        <div className="absolute top-[45%] left-[-10%] md:left-[-30%]">
                            <div className="bg-slate-900/90 border border-red-500 px-3 py-1.5 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] backdrop-blur-md">
                                <Crosshair className="w-3 h-3 text-red-400" />
                                <span className="text-[10px] font-bold text-white whitespace-nowrap">{activeOp.loadout.primary}</span>
                            </div>
                            <div className="w-12 h-px bg-red-500 absolute top-1/2 left-full"></div>
                        </div>

                        <div className="absolute bottom-[20%] right-[-5%] md:right-[-15%]">
                            <div className="bg-slate-900/90 border border-amber-500 px-3 py-1.5 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] backdrop-blur-md">
                                <Briefcase className="w-3 h-3 text-amber-400" />
                                <span className="text-[10px] font-bold text-white whitespace-nowrap">{activeOp.loadout.tactical.length} ITEMS</span>
                            </div>
                            <div className="w-6 h-px bg-amber-500 absolute top-1/2 right-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Gear Locker (Right) */}
            <div className="w-full md:w-64 bg-slate-900 flex flex-col shrink-0 h-1/3 md:h-full border-t md:border-t-0 md:border-l border-slate-700">
                <div className="p-3 border-b border-slate-700 bg-slate-850">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Supply (UPSS)</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <label className="text-[9px] text-amber-500 uppercase font-bold mb-2 flex items-center gap-1">
                            <Sword className="w-3 h-3" /> Weaponry
                        </label>
                        <div className="grid grid-cols-1 gap-1">
                            {GEAR_OPTIONS.PRIMARY.map(w => (
                                <button 
                                    key={w} 
                                    onClick={() => updateLoadout('primary', w)}
                                    className={`px-3 py-2 text-[9px] rounded border transition-all text-left truncate ${activeOp.loadout.primary === w ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[9px] text-emerald-500 uppercase font-bold mb-2 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Kit (Max 3)
                        </label>
                        <div className="flex flex-wrap gap-1">
                            {GEAR_OPTIONS.TACTICAL.map(t => (
                                <button 
                                    key={t} 
                                    onClick={() => updateLoadout('tactical', t)}
                                    className={`px-2 py-1 text-[9px] rounded border transition-all ${activeOp.loadout.tactical.includes(t) ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const ExecutionView = () => (
        <div className="flex h-full w-full bg-slate-950 overflow-hidden relative">
            {/* Map Area */}
            <div className="flex-1 relative bg-slate-950 group">
                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/121.0493,14.6515,17,0/1000x800?access_token=Pk.eyJ1IjoidGVtcCIsImEiOiJjbHhxIn0')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                
                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 p-3 bg-black/80 backdrop-blur rounded border-l-4 border-red-500 text-white font-mono shadow-2xl">
                    <div className="text-xs text-slate-400 font-bold mb-1">MISSION CLOCK</div>
                    <div className="text-2xl font-black text-white">00:14:22</div>
                    <div className="text-[10px] text-red-400 mt-1 font-bold animate-pulse">PHASE 2: BREACH</div>
                </div>

                {/* Tactical Markers */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_20px_blue] animate-pulse"></div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-white bg-blue-600 px-1.5 py-0.5 rounded whitespace-nowrap">ALPHA TEAM</span>
                    </div>
                </div>
            </div>

            {/* Status Sidebar (Right - Collapsible on small screens but persistent in landscape) */}
            <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-10 shadow-2xl">
                <div className="p-3 border-b border-slate-800 bg-slate-850 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">UNIT STATUS</h3>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[9px] text-green-400 font-bold">LIVE</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {roster.map(op => (
                        <div key={op.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] font-black text-white">{op.callsign}</div>
                                <div className="text-[9px] text-slate-500">{op.role}</div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-400">
                                    <Activity className="w-3 h-3" /> {op.vitals.hr}
                                </div>
                                <div className="text-[9px] text-slate-400">SP02: {op.vitals.spo2}%</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t border-slate-800">
                    <button className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold uppercase text-[10px] rounded border border-red-900/50 transition-colors tracking-widest">
                        EMERGENCY ABORT
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
            {/* Top Navigation Bar - Single row layout */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 shrink-0 z-20 shadow-lg flex items-center gap-6">
                {/* View Navigation Tabs - Now along side SAF/SWAT */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full shrink-0 shadow-inner">
                    {[
                        { id: 'DOCS', icon: FileText, label: 'Briefing' },
                        { id: 'UPSS', icon: Shield, label: 'Logistics' },
                        { id: 'EXECUTION', icon: Target, label: 'Mission' },
                        { id: 'ATAK', icon: Zap, label: 'ATAK' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setView(tab.id as any);
                                setIsSidebarOpen(true); 
                            }}
                            className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center justify-center md:justify-start gap-2 transition-all whitespace-nowrap ${
                                view === tab.id 
                                ? 'bg-slate-800 text-white border border-slate-600 shadow-md' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <tab.icon className={`w-3 h-3 ${view === tab.id ? 'text-red-400' : ''} shrink-0`} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 overflow-hidden relative">
                {view === 'DOCS' && <DocumentationView />}
                {view === 'UPSS' && <UPSSManager />}
                {view === 'EXECUTION' && <ExecutionView />}
                {view === 'ATAK' && <AtakSituationalAwareness />}
            </div>
        </div>
    );
};

export default TacticalOperationsView;
