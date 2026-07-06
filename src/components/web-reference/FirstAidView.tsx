
import React, { useState, useEffect, useRef } from 'react';
import { HeartPulse, Activity, Flame, Droplets, Bone, AlertTriangle, Zap, ChevronLeft, Phone, Search, Info, Shield, Wind, Waves, Mountain, ListChecks, Calculator, Timer, Syringe, Skull, Siren, CheckSquare } from 'lucide-react';

// --- TYPES ---
type Tab = 'MEDICAL' | 'SURVIVAL' | 'TRIAGE' | 'TOOLKIT' | 'REPORT';

interface GuideStep {
  text: string;
  subtext?: string;
  warning?: boolean;
}

interface AidGuide {
  id: string;
  title: string;
  icon: any;
  color: string;
  summary: string;
  category: 'TRAUMA' | 'MEDICAL' | 'ENVIRONMENTAL';
  steps: GuideStep[];
}

// --- DATA: MEDICAL (Updated with Tactical Trauma) ---
const MEDICAL_DATA: AidGuide[] = [
  {
    id: 'GSW',
    title: 'Gunshot Wound',
    icon: TargetIcon,
    color: 'text-red-500',
    summary: 'Penetrating trauma management.',
    category: 'TRAUMA',
    steps: [
      { text: 'Ensure Scene Safety', subtext: 'Do not approach if shooter is active.', warning: true },
      { text: 'Locate Entry/Exit', subtext: 'Check both sides of the body.' },
      { text: 'Apply Direct Pressure', subtext: 'Use gloved hands or clean cloth.' },
      { text: 'Pack the Wound', subtext: 'If on limbs/junctions, stuff gauze deep into wound cavity.', warning: true },
      { text: 'Tourniquet (Limbs)', subtext: 'Apply high and tight if bleeding is uncontrolled.' },
      { text: 'Chest Seal (Torso)', subtext: 'Cover chest holes with plastic/seal on exhale.' }
    ]
  },
  {
    id: 'CPR',
    title: 'CPR / Cardiac Arrest',
    icon: HeartPulse,
    color: 'text-red-500',
    summary: 'Resuscitation for unresponsive victims.',
    category: 'MEDICAL',
    steps: [
      { text: 'Check Responsiveness', subtext: 'Shout and tap shoulder.' },
      { text: 'Call for Backup/EMS', subtext: 'Request AED immediately.', warning: true },
      { text: 'Check Pulse/Breathing', subtext: 'No more than 10 seconds.' },
      { text: 'Start Compressions', subtext: 'Center of chest, hard and fast (100-120 bpm).' },
      { text: '30:2 Ratio', subtext: '30 compressions to 2 breaths (if trained).' },
      { text: 'Use AED', subtext: 'Follow voice prompts as soon as available.' }
    ]
  },
  {
    id: 'BLEEDING',
    title: 'Major Hemorrhage',
    icon: Droplets,
    color: 'text-red-600',
    summary: 'Control heavy arterial bleeding.',
    category: 'TRAUMA',
    steps: [
      { text: 'Direct Pressure', subtext: 'Press hard on the wound.' },
      { text: 'Tourniquet', subtext: 'For arms/legs: Place 2-3 inches above wound. Twist until bleeding stops.', warning: true },
      { text: 'Wound Packing', subtext: 'For groin/shoulder: Pack gauze tight and hold pressure 3 mins.' },
      { text: 'Keep Warm', subtext: 'Prevent hypothermia (Shock).' }
    ]
  },
  {
    id: 'BLAST',
    title: 'Blast Injury',
    icon: BombIcon,
    color: 'text-orange-600',
    summary: 'Explosion related trauma.',
    category: 'TRAUMA',
    steps: [
      { text: 'Security Sweep', subtext: 'Watch for secondary devices.', warning: true },
      { text: 'Stop Massive Bleeding', subtext: 'Prioritize tourniquets for amputations.' },
      { text: 'Airway Management', subtext: 'Check for burns/debris in mouth.' },
      { text: 'Check Torso', subtext: 'Look for lung collapse symptoms.' }
    ]
  },
  {
    id: 'FRACTURE',
    title: 'Fractures',
    icon: Bone,
    color: 'text-slate-200',
    summary: 'Stabilizing broken bones.',
    category: 'TRAUMA',
    steps: [
      { text: 'Stop Bleeding', subtext: 'Address open wounds first.' },
      { text: 'Immobilize', subtext: 'Splint in position found. Do not realign.', warning: true },
      { text: 'Check Pulse', subtext: 'Ensure blood flow distal to injury.' }
    ]
  },
  {
    id: 'BURNS',
    title: 'Burns',
    icon: Flame,
    color: 'text-orange-500',
    summary: 'Thermal or chemical burns.',
    category: 'ENVIRONMENTAL',
    steps: [
      { text: 'Extinguish Source', subtext: 'Stop, Drop, and Roll or remove chemical.' },
      { text: 'Cool the Burn', subtext: 'Running water for 10-20 mins. No ice.' },
      { text: 'Remove Constrictions', subtext: 'Rings/watches before swelling.' },
      { text: 'Cover Loosely', subtext: 'Use sterile dressing or cling wrap.' }
    ]
  }
];

// --- DATA: SURVIVAL ---
const SURVIVAL_DATA: AidGuide[] = [
  {
    id: 'MISSILE',
    title: 'Missile Attack',
    icon: AlertTriangle,
    color: 'text-red-500',
    summary: 'Seek cover and shelter.',
    category: 'ENVIRONMENTAL',
    steps: [
      { text: 'Identify Shelter', subtext: 'Find nearest hardened shelter immediately.' },
      { text: 'Seek Cover', subtext: 'Stay away from windows and glass.' },
      { text: 'Lie Flat', subtext: 'Protect head and neck if caught outside.' },
      { text: 'Wait for All Clear', subtext: 'Check for fires and structural damage.' }
    ]
  },
  {
    id: 'DRONE',
    title: 'Drone Attack',
    icon: Shield,
    color: 'text-amber-500',
    summary: 'Stay hidden and quiet.',
    category: 'ENVIRONMENTAL',
    steps: [
      { text: 'Seek Cover', subtext: 'Move indoors or to dense cover promptly.' },
      { text: 'Stay Low', subtext: 'Do not run to avoid attracting attention.' },
      { text: 'Report', subtext: 'Report sightings, do not approach downed drones.' }
    ]
  },
  {
    id: 'EARTHQUAKE',
    title: 'Earthquake',
    icon: Activity,
    color: 'text-amber-500',
    summary: 'Drop, cover, and hold on.',
    category: 'ENVIRONMENTAL',
    steps: [
      { text: 'Drop, Cover, Hold On', subtext: 'Seek cover under sturdy furniture.' },
      { text: 'Stay Safe', subtext: 'Avoid windows and heavy objects.' },
      { text: 'Post-Quake', subtext: 'Inspect utilities and expect aftershocks.' }
    ]
  },
  {
    id: 'TYPHOON',
    title: 'Typhoon / Flood',
    icon: Wind,
    color: 'text-blue-400',
    summary: 'High ground and avoidance.',
    category: 'ENVIRONMENTAL',
    steps: [
      { text: 'Stay Indoors', subtext: 'Monitor reliable weather updates.' },
      { text: 'Utilities', subtext: 'Switch off main power if water rises.' },
      { text: 'Avoid Floodwater', subtext: 'Avoid wading to prevent contamination.' }
    ]
  },
  {
    id: 'VOLCANO',
    title: 'Volcanic Eruption',
    icon: Mountain,
    color: 'text-red-400',
    summary: 'Protect lungs and seal home.',
    category: 'ENVIRONMENTAL',
    steps: [
      { text: 'Seal Home', subtext: 'Seal windows and doors, use N95 if needed.' },
      { text: 'Evacuate', subtext: 'Follow alerts and watch for mudflows.' },
      { text: 'Aftermath', subtext: 'Clear ash from roof, wash food well.' }
    ]
  }
];

// --- ICONS HELPERS ---
function TargetIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
function BombIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="13" r="9"/><path d="m19.5 9.5 1.8-1.8a2.4 2.4 0 0 0 0-3.4l-1.6-1.6a2.41 2.41 0 0 0-3.4 0l-1.8 1.8"/><path d="m22 2-1.5 1.5"/></svg>;
}

// --- SUB-COMPONENTS ---

const ReportView = () => {
    const fields = [
        { id: 1, title: "1. Location", type: "text" },
        { id: 2, title: "2. Radio Frequency", type: "text" },
        { id: 3, title: "3. Patients", type: "number" },
        { id: 4, title: "4. Special Equipment", options: ["None", "Hoist", "Extraction"] },
        { id: 5, title: "5. Patient Types", type: "text" },
        { id: 6, title: "6. Security", options: ["No Enemy", "Enemy Presence"] },
        { id: 7, title: "7. Marking Method", options: ["Smoke", "Panels", "Visual"] },
        { id: 8, title: "8. Patient Nationality", type: "text" },
        { id: 9, title: "9. NBC Threat", options: ["None", "Nuclear", "Biological", "Chemical"] },
    ];
    return (
        <div className="p-4 space-y-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-3">
                <div className="w-full aspect-video bg-black flex items-center justify-center border border-slate-700">
                    <Siren className="w-12 h-12 text-red-500 animate-pulse" />
                    <span className="text-white ml-3 font-bold">TRANSMITTING LIVE VIDEO...</span>
                </div>
                <button className="w-full py-3 bg-red-600 font-black rounded text-white hover:bg-red-500">STOP TRANSMISSION</button>
            </div>
            
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <h3 className="font-black text-white text-lg mb-4">9-LINE CASEVAC</h3>
                <div className="space-y-3">
                    {fields.map(field => (
                        <div key={field.id} className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400">{field.title}</label>
                            {field.options ? (
                                <select className="bg-slate-950 border border-slate-700 w-full p-2 text-xs text-white">
                                    {field.options.map(opt => <option key={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <input type={field.type} className="bg-slate-950 border border-slate-700 w-full p-2 text-xs text-white" />
                            )}
                        </div>
                    ))}
                    <button className="w-full mt-4 py-3 bg-blue-600 font-black rounded text-white hover:bg-blue-500">TRANSMIT REPORT</button>
                </div>
            </div>
        </div>
    );
};

const TriageCalculator = () => {
    const [gcs, setGcs] = useState({ eye: 4, verbal: 5, motor: 6 });
    
    const totalGCS = gcs.eye + gcs.verbal + gcs.motor;
    const severity = totalGCS >= 13 ? 'MILD' : totalGCS >= 9 ? 'MODERATE' : 'SEVERE';
    const severityColor = totalGCS >= 13 ? 'text-green-400' : totalGCS >= 9 ? 'text-yellow-400' : 'text-red-500';

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Glasgow Coma Scale (GCS)</h3>
                    <div className={`text-2xl font-black ${severityColor}`}>{totalGCS} <span className="text-xs font-mono text-slate-400">/ 15</span></div>
                </div>
                <div className="space-y-3">
                    {/* Eye Response */}
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Eye Response (E)</label>
                        <input type="range" min="1" max="4" step="1" value={gcs.eye} onChange={e => setGcs({...gcs, eye: parseInt(e.target.value)})} className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                            <span>None (1)</span>
                            <span className="text-white font-bold">{
                                gcs.eye === 1 ? 'None' : gcs.eye === 2 ? 'To Pain' : gcs.eye === 3 ? 'To Voice' : 'Spontaneous'
                            }</span>
                            <span>Spontaneous (4)</span>
                        </div>
                    </div>
                    {/* Verbal */}
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Verbal Response (V)</label>
                        <input type="range" min="1" max="5" step="1" value={gcs.verbal} onChange={e => setGcs({...gcs, verbal: parseInt(e.target.value)})} className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                            <span>None (1)</span>
                            <span className="text-white font-bold">{
                                gcs.verbal === 1 ? 'None' : gcs.verbal === 2 ? 'Sounds' : gcs.verbal === 3 ? 'Words' : gcs.verbal === 4 ? 'Confused' : 'Oriented'
                            }</span>
                            <span>Oriented (5)</span>
                        </div>
                    </div>
                    {/* Motor */}
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Motor Response (M)</label>
                        <input type="range" min="1" max="6" step="1" value={gcs.motor} onChange={e => setGcs({...gcs, motor: parseInt(e.target.value)})} className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                            <span>None (1)</span>
                            <span className="text-white font-bold">{
                                gcs.motor === 1 ? 'None' : gcs.motor === 2 ? 'Extension' : gcs.motor === 3 ? 'Flexion' : gcs.motor === 4 ? 'Withdraws' : gcs.motor === 5 ? 'Localizes' : 'Obeys'
                            }</span>
                            <span>Obeys (6)</span>
                        </div>
                    </div>
                </div>
                <div className={`mt-4 text-center text-xs font-bold px-2 py-1 rounded bg-slate-900 ${severityColor} border border-slate-700`}>
                    INJURY SEVERITY: {severity}
                </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="font-bold text-white mb-2">START Triage (Adult)</h3>
                <div className="text-xs space-y-2 font-mono text-slate-300">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span>WALKING WOUNDED {"->"} MINOR</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-black rounded-full border border-slate-500"></span>
                        <span>NO RESP / NO PULSE {"->"} DECEASED</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <span>RESP {">"} 30 OR NO RADIAL PULSE {"->"} IMMEDIATE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        <span>OTHERWISE {"->"} DELAYED</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Toolkit = () => {
    const [metronomeOn, setMetronomeOn] = useState(false);
    const [bpm] = useState(110);
    const [tick, setTick] = useState(false);

    useEffect(() => {
        let interval: any;
        if (metronomeOn) {
            const ms = 60000 / bpm;
            interval = setInterval(() => {
                setTick(prev => !prev);
                if (navigator.vibrate) navigator.vibrate(50);
            }, ms);
        }
        return () => clearInterval(interval);
    }, [metronomeOn, bpm]);

    const GO_BAG_ITEMS = [
        "Water (1L/person)", "Non-perishable Food", "Flashlight + Batteries", 
        "First Aid Kit", "Whistle", "Dust Mask (N95)", "Power Bank", 
        "Important Docs (Sealed)", "Cash (Small Bills)", "Rain Coat/Poncho"
    ];

    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    const toggleItem = (item: string) => {
        if (checkedItems.includes(item)) {
            setCheckedItems(checkedItems.filter(i => i !== item));
        } else {
            setCheckedItems([...checkedItems, item]);
        }
    };

    return (
        <div className="space-y-4">
            {/* CPR Metronome */}
            <div className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${metronomeOn ? 'bg-slate-800 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-slate-900 border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <HeartPulse className={`w-6 h-6 ${metronomeOn ? 'text-green-500 animate-pulse' : 'text-slate-500'}`} />
                    <h3 className="font-bold text-white text-lg">CPR Pacer</h3>
                </div>
                
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    <div className={`absolute inset-0 rounded-full border-4 border-slate-700 transition-all duration-100 ${tick ? 'scale-110 border-green-500' : 'scale-100'}`}></div>
                    <div className={`text-4xl font-black transition-colors ${tick ? 'text-green-400' : 'text-slate-500'}`}>
                        {bpm}
                    </div>
                    <div className="absolute bottom-6 text-[10px] text-slate-500 font-bold">BPM</div>
                </div>

                <button 
                    onClick={() => setMetronomeOn(!metronomeOn)}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${metronomeOn ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                    {metronomeOn ? 'STOP PACER' : 'START CPR PACER'}
                </button>
            </div>

            {/* Go Bag Checklist */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 bg-slate-850 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-amber-500" /> Go-Bag Checklist
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">{checkedItems.length}/{GO_BAG_ITEMS.length}</span>
                </div>
                <div className="p-2">
                    {GO_BAG_ITEMS.map(item => (
                        <div key={item} onClick={() => toggleItem(item)} className="flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checkedItems.includes(item) ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600 text-transparent'}`}>
                                <CheckSquare className="w-3 h-3" />
                            </div>
                            <span className={`text-sm ${checkedItems.includes(item) ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FirstAidView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('MEDICAL');
  const [selectedGuide, setSelectedGuide] = useState<AidGuide | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle navigation requests from other modules
  useEffect(() => {
    // Check for pending navigation (set in CameraView)
    if ((window as any).PENDING_FIRST_AID_SECTION) {
        const section = (window as any).PENDING_FIRST_AID_SECTION;
        (window as any).PENDING_FIRST_AID_SECTION = null; // consume it
        if (section === 'gunshot_wound') {
            setActiveTab('MEDICAL');
            const guide = MEDICAL_DATA.find(g => g.id === 'GSW');
            if (guide) {
                setSelectedGuide(guide);
            }
        }
    }

    const handleNavigate = (e: any) => {
        const { section } = e.detail;
        if (section === 'gunshot_wound') {
            setActiveTab('MEDICAL');
            const guide = MEDICAL_DATA.find(g => g.id === 'GSW');
            if (guide) {
                setSelectedGuide(guide);
            }
        }
    };
    window.addEventListener('NAVIGATE_TO_FIRST_AID', handleNavigate);
    return () => window.removeEventListener('NAVIGATE_TO_FIRST_AID', handleNavigate);
  }, []);

  // --- FILTER LOGIC ---
  const filteredMedical = MEDICAL_DATA.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSurvival = SURVIVAL_DATA.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
      
      {/* HEADER */}
      
        {/* TABS */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 m-3">
            {[
                { id: 'MEDICAL', label: 'Medical', icon: HeartPulse },
                { id: 'SURVIVAL', label: 'Survival', icon: AlertTriangle },
                { id: 'TRIAGE', label: 'Triage', icon: Calculator },
                { id: 'TOOLKIT', label: 'Toolkit', icon: Timer },
                { id: 'REPORT', label: 'Report', icon: Siren }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as Tab); setSelectedGuide(null); }}
                    className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-[10px] font-bold uppercase transition-all ${
                        activeTab === tab.id 
                        ? 'bg-slate-800 text-white shadow-md border border-slate-700' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? 'text-red-400' : ''}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                </button>
            ))}
            {/* 911 Button placed here */}
            <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-md text-[10px] font-black flex items-center gap-2 animate-pulse shadow-lg ml-1">
                <Phone className="w-3 h-3" /> 911
            </button>
        </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-grid-pattern relative">
        
        {/* --- MEDICAL TAB --- */}
        {activeTab === 'MEDICAL' && (
            <div className="p-4 h-full flex flex-col">
                {!selectedGuide ? (
                    <>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Search protocols..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredMedical.map(guide => (
                                <div 
                                    key={guide.id} 
                                    onClick={() => setSelectedGuide(guide)}
                                    className="bg-slate-900/80 border border-slate-800 hover:border-red-500/50 p-4 rounded-xl cursor-pointer transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`p-3 rounded-lg bg-slate-950 ${guide.color} border border-slate-800`}>
                                            {React.createElement(guide.icon, { className: "w-6 h-6" })}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">{guide.title}</h3>
                                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                                                    {guide.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">{guide.summary}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    // MEDICAL DETAIL VIEW
                    <div className="h-full flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="flex items-center mb-2 pl-3 mt-[-15px]">
                            <button onClick={() => setSelectedGuide(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider">
                                <ChevronLeft className="w-4 h-4" /> Back to List
                            </button>
                            <h2 className="flex-1 text-center text-xl font-black text-white uppercase tracking-widest ml-[28px] mr-[17px]">{selectedGuide.title}</h2>
                            <div className="w-20" /> {/* Spacer to balance the button width */}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                            {/* Left Column: Video Viewport Placeholder */}
                            <div className="overflow-y-auto pr-2">
                                <div className="bg-black w-full h-[181px] rounded-xl border border-slate-800 flex items-center justify-center mt-[5px]">
                                    <span className="text-slate-500 font-bold text-sm">VIDEO VIEWPORT</span>
                                </div>
                            </div>

                            {/* Right Column: Steps/Instructions */}
                            <div className="overflow-y-auto space-y-3">
                                {selectedGuide.steps.map((step, idx) => (
                                    <div key={idx} className={`flex gap-4 p-4 rounded-xl border ${step.warning ? 'bg-red-900/10 border-red-500/30' : 'bg-slate-900 border-slate-800'}`}>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                                                {idx + 1}
                                            </div>
                                            {idx !== selectedGuide.steps.length - 1 && <div className="w-0.5 h-full bg-slate-800"></div>}
                                        </div>
                                        <div>
                                            {step.warning && (
                                                <div className="flex items-center gap-1 text-red-400 text-[10px] font-black uppercase mb-1 tracking-wider">
                                                    <AlertTriangle className="w-3 h-3" /> Critical
                                                </div>
                                            )}
                                            <h4 className="font-bold text-slate-100 text-sm mb-1">{step.text}</h4>
                                            {step.subtext && <p className="text-xs text-slate-400 leading-relaxed">{step.subtext}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- SURVIVAL TAB --- */}
        {activeTab === 'SURVIVAL' && (
            <div className="p-4 h-full flex flex-col">
                {!selectedGuide ? (
                     <div className="p-4 h-full flex flex-col">
                        <div className="relative mb-4">
                             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                             <input 
                                 type="text" 
                                 placeholder="Search survival protocols..." 
                                 value={searchTerm}
                                 onChange={(e) => setSearchTerm(e.target.value)}
                                 className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500"
                             />
                         </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredSurvival.map(guide => (
                                <div 
                                    key={guide.id} 
                                    onClick={() => setSelectedGuide(guide)}
                                    className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`p-3 rounded-lg bg-slate-950 ${guide.color} border border-slate-800`}>
                                            {React.createElement(guide.icon, { className: "w-6 h-6" })}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">{guide.title}</h3>
                                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                                                    {guide.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">{guide.summary}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                     // SURVIVAL DETAIL VIEW
                    <div className="h-full flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="flex items-center mb-2 pl-3 mt-[-15px]">
                            <button onClick={() => setSelectedGuide(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider">
                                <ChevronLeft className="w-4 h-4" /> Back to List
                            </button>
                            <h2 className="flex-1 text-center text-xl font-black text-white uppercase tracking-widest ml-[28px] mr-[17px]">{selectedGuide.title}</h2>
                            <div className="w-20" /> {/* Spacer to balance the button width */}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                            {/* Left Column: Video Viewport Placeholder */}
                            <div className="overflow-y-auto pr-2">
                                <div className="bg-black w-full h-[181px] rounded-xl border border-slate-800 flex items-center justify-center mt-[5px]">
                                    <span className="text-slate-500 font-bold text-sm">VIDEO VIEWPORT</span>
                                </div>
                            </div>

                            {/* Right Column: Steps/Instructions */}
                            <div className="overflow-y-auto space-y-3">
                                {selectedGuide.steps.map((step, idx) => (
                                    <div key={idx} className={`flex gap-4 p-4 rounded-xl border ${step.warning ? 'bg-red-900/10 border-red-500/30' : 'bg-slate-900 border-slate-800'}`}>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                                                {idx + 1}
                                            </div>
                                            {idx !== selectedGuide.steps.length - 1 && <div className="w-0.5 h-full bg-slate-800"></div>}
                                        </div>
                                        <div>
                                             {step.warning && (
                                                <div className="flex items-center gap-1 text-red-400 text-[10px] font-black uppercase mb-1 tracking-wider">
                                                    <AlertTriangle className="w-3 h-3" /> Critical
                                                </div>
                                            )}
                                            <h4 className="font-bold text-slate-100 text-sm mb-1">{step.text}</h4>
                                            {step.subtext && <p className="text-xs text-slate-400 leading-relaxed">{step.subtext}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- TRIAGE & TOOLKIT TABS --- */}
        {activeTab === 'TRIAGE' && (
            <div className="p-4 h-full overflow-y-auto">
                <TriageCalculator />
            </div>
        )}

        {activeTab === 'TOOLKIT' && (
            <div className="p-4 h-full overflow-y-auto">
                <Toolkit />
            </div>
        )}

        {activeTab === 'REPORT' && (
            <div className="p-4 h-full overflow-y-auto">
                <ReportView />
            </div>
        )}

      </div>
    </div>
  );
};

export default FirstAidView;
