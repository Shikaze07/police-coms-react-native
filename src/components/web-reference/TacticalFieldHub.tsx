import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ShieldAlert, 
    Crosshair, 
    Car, 
    Map as MapIcon, 
    Camera, 
    Smartphone, 
    Radio, 
    MessageSquare, 
    Mic, 
    FileText, 
    FilePenLine,
    Fingerprint, 
    Book, 
    HeartPulse, 
    Languages, 
    Bot, 
    Wifi, 
    ShieldCheck, 
    Siren, 
    Activity, 
    CheckCircle, 
    AlertTriangle, 
    ClipboardList,
    Clock,
    TrendingUp,
    Hourglass,
    ChevronDown,
    ChevronUp,
    Check,
    Lock,
    Zap,
    Signal
} from 'lucide-react';
import { ViewState } from './types';

interface TacticalFieldHubProps {
    currentView: ViewState;
    setView: (view: ViewState, recipient?: string | null) => void;
    isSOSActive: boolean;
    onTriggerSOS: () => void;
    onSimulateSOS?: () => void;
    activeAlert: any;
    isExpanded?: boolean;
}

interface JTBDPlaybook {
    id: string;
    title: string;
    icon: any;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    steps: {
        label: string;
        targetView: ViewState;
        actionText: string;
        completed: boolean;
    }[];
}

export const TacticalFieldHub: React.FC<TacticalFieldHubProps> = ({
    currentView,
    setView,
    isSOSActive,
    onTriggerSOS,
    onSimulateSOS,
    activeAlert,
    isExpanded = false
}) => {
    const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
    const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

    const PLAYBOOKS: JTBDPlaybook[] = [
        {
            id: 'id_check',
            title: 'Suspect ID Clearance',
            icon: Fingerprint,
            severity: 'MEDIUM',
            description: 'Field protocol for stop & frisk, person of interest database query, and statement capture.',
            steps: [
                { label: 'Verify biometric identity & scan database', targetView: ViewState.BIOMETRIC, actionText: 'BIOMETRIC CHECK', completed: false },
                { label: 'Query AI Dispatch Partner on criminal affiliation', targetView: ViewState.BUDDY_CHAT, actionText: 'DISPATCH AI QUERY', completed: false },
                { label: 'Audio record verbal statement / field interview', targetView: ViewState.ERECORDER, actionText: 'AUDIO RECORDER', completed: false }
            ]
        },
        {
            id: 'armed_response',
            title: 'Critical Hazard Response',
            icon: ShieldAlert,
            severity: 'CRITICAL',
            description: 'Emergency armed response procedure, perimeter logs, and air response coordination.',
            steps: [
                { label: 'Dispatch tactical radio distress frequency', targetView: ViewState.ERADIO, actionText: 'PTT RADIO NETWORK', completed: false },
                { label: 'Initialize live Body Cam scene analysis', targetView: ViewState.BWC, actionText: 'START SCENE RECORD', completed: false },
                { label: 'Log incident coordinates on tactical map', targetView: ViewState.MAP, actionText: 'MARK EVENT COORDINATES', completed: false }
            ]
        },
        {
            id: 'traffic_stop',
            title: 'Vehicle Traffic Inspection',
            icon: Car,
            severity: 'MEDIUM',
            description: 'Standard traffic stop procedure to scan license plate, record citation, and capture telemetry.',
            steps: [
                { label: 'Scan license plate & check registration', targetView: ViewState.TRAFFIC, actionText: 'TRAFFIC PORTAL', completed: false },
                { label: 'Record high fidelity context photos', targetView: ViewState.CAMERA_SMARTPHONE, actionText: 'CAPTURE CONTEXT', completed: false },
                { label: 'Draft online infraction / warning report', targetView: ViewState.REPORTS, actionText: 'E-CITATION REPORT', completed: false }
            ]
        },
        {
            id: 'medical_care',
            title: 'Patient Care & De-escalation',
            icon: HeartPulse,
            severity: 'HIGH',
            description: 'Protocols for administering battlefield first aid and translating community statements.',
            steps: [
                { label: 'Administer trauma first aid / guide CPR details', targetView: ViewState.FIRST_AID, actionText: 'FIRST AID DIRECTIVES', completed: false },
                { label: 'Activate voice translator for cross-lingual statements', targetView: ViewState.TRANSLATOR, actionText: 'TRANSLATOR ENGINE', completed: false },
                { label: 'Log instant observations check with partner dispatch', targetView: ViewState.EMESSENGER, actionText: 'E-MESSENGER REPORT', completed: false }
            ]
        }
    ];

    const toggleStep = (playbookId: string, idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const key = `${playbookId}-${idx}`;
        setCheckedSteps(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleActionClick = (targetView: ViewState, playbookId: string, idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        // Mark step as checked when starting
        const key = `${playbookId}-${idx}`;
        setCheckedSteps(prev => ({
            ...prev,
            [key]: true
        }));
        setView(targetView);
    };

    return (
        <div className="flex flex-col gap-4">

            {/* High-Tempo Frequency-of-Use Quick Launch Buttons (Minimum size 48px + padded glove-friendly target) */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3">
                <div className={`grid gap-2 ${isExpanded ? 'grid-cols-2 md:grid-cols-6' : 'grid-cols-2'}`}>
                    {/* Field Interviewer */}
                    <button 
                        onClick={() => setView(ViewState.POCKET_INTERROGATOR)}
                        className="group bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-slate-200 hover:scale-[1.02] active:scale-95 h-[54px] relative overflow-hidden"
                    >
                        <div className="flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-75 group-hover:-translate-y-1.5 group-focus-within:scale-75 group-focus-within:-translate-y-1.5">
                            <MessageSquare className="w-6.5 h-6.5 text-cyan-400" />
                        </div>
                        <span className="absolute bottom-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 text-[9px] font-black font-tech uppercase tracking-wider text-cyan-400 pointer-events-none">
                            FIELD INTERVIEWER
                        </span>
                    </button>

                    {/* Body recording camera */}
                    <button 
                        onClick={() => setView(ViewState.BWC)}
                        className="group bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-slate-200 hover:scale-[1.02] active:scale-95 h-[54px] relative overflow-hidden"
                    >
                        <div className="flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-75 group-hover:-translate-y-1.5 group-focus-within:scale-75 group-focus-within:-translate-y-1.5">
                            <Camera className="w-6.5 h-6.5 text-cyan-400 animate-pulse" />
                        </div>
                        <span className="absolute bottom-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 text-[9px] font-black font-tech uppercase tracking-wider text-cyan-400 pointer-events-none">
                            BODY CAM
                        </span>
                    </button>

                    {/* Push to talk radio */}
                    <button 
                        onClick={() => setView(ViewState.ERADIO)}
                        className="group bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-slate-200 hover:scale-[1.02] active:scale-95 h-[54px] relative overflow-hidden"
                    >
                        <div className="flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-75 group-hover:-translate-y-1.5 group-focus-within:scale-75 group-focus-within:-translate-y-1.5">
                            <Radio className="w-6.5 h-6.5 text-amber-500" />
                        </div>
                        <span className="absolute bottom-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 text-[9px] font-black font-tech uppercase tracking-wider text-amber-400 pointer-events-none">
                            E-RADIO
                        </span>
                    </button>

                    {/* Interactive Report */}
                    <button 
                        onClick={() => setView(ViewState.REPORTS)}
                        className="group bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-slate-200 hover:scale-[1.02] active:scale-95 h-[54px] relative overflow-hidden"
                    >
                        <div className="flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-75 group-hover:-translate-y-1.5 group-focus-within:scale-75 group-focus-within:-translate-y-1.5">
                            <FilePenLine className="w-6.5 h-6.5 text-emerald-400" />
                        </div>
                        <span className="absolute bottom-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 text-[9px] font-black font-tech uppercase tracking-wider text-emerald-400 pointer-events-none">
                            E-REPORT
                        </span>
                    </button>

                    {/* Digital ID / Biometric ID Check */}
                    <button 
                        onClick={() => setView(ViewState.BIOMETRIC)}
                        className="group bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-slate-200 hover:scale-[1.02] active:scale-95 h-[54px] relative overflow-hidden"
                    >
                        <div className="flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-75 group-hover:-translate-y-1.5 group-focus-within:scale-75 group-focus-within:-translate-y-1.5">
                            <Fingerprint className="w-6.5 h-6.5 text-emerald-400" />
                        </div>
                        <span className="absolute bottom-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 text-[9px] font-black font-tech uppercase tracking-wider text-emerald-400 pointer-events-none font-sans font-sans">
                            ID CHECK
                        </span>
                    </button>

                    {/* Tactical Ops Taskings */}
                    <button 
                        onClick={() => setView(ViewState.TACTICAL_OPS)}
                        className="group bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-slate-200 hover:scale-[1.02] active:scale-95 h-[54px] relative overflow-hidden"
                    >
                        <div className="flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-75 group-hover:-translate-y-1.5 group-focus-within:scale-75 group-focus-within:-translate-y-1.5">
                            <ClipboardList className="w-6.5 h-6.5 text-cyan-400" />
                        </div>
                        <span className="absolute bottom-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 text-[9px] font-black font-tech uppercase tracking-wider text-cyan-400 pointer-events-none font-sans font-sans">
                            TASKINGS
                        </span>
                    </button>
                </div>
            </div>

            {/* Jobs to be Done (JTBD) Playbook Guides */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl pt-1 pb-3 px-3">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest font-tech flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-yellow-500" /> Active Task Procedure
                </span>
                
                <div className={`space-y-1.5 ${isExpanded ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 space-y-0' : 'flex flex-col'}`}>
                    {PLAYBOOKS.map((pb) => {
                        const isExpanded = selectedPlaybook === pb.id;
                        const severityColors = {
                            LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                            MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                            HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                            CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20'
                        };

                        return (
                            <div 
                                key={pb.id}
                                className={`border rounded-xl transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-slate-950 border-white/15 shadow-xl' : 'bg-slate-900/50 border-white/5 hover:border-white/10'}`}
                            >
                                <div 
                                    className="p-3 flex items-center justify-between cursor-pointer select-none gap-2"
                                    onClick={() => setSelectedPlaybook(isExpanded ? null : pb.id)}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center flex-shrink-0">
                                            <pb.icon className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-black font-tech text-slate-200 uppercase truncate tracking-wider">{pb.title}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase border flex items-center gap-1 font-bold ${severityColors[pb.severity]}`}>
                                                    {pb.severity === 'CRITICAL' && <span className="w-1 h-1 bg-red-400 rounded-full animate-ping"></span>}
                                                    {pb.severity}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-mono">
                                                    {pb.steps.length} workflows
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-slate-400 flex-shrink-0">
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-white/5 bg-slate-950 p-3 flex flex-col gap-2.5"
                                        >
                                            <p className="text-[11px] text-slate-400 leading-normal mb-1">{pb.description}</p>
                                            
                                            <div className="space-y-2">
                                                {pb.steps.map((step, idx) => {
                                                    const stepKey = `${pb.id}-${idx}`;
                                                    const isCompleted = checkedSteps[stepKey] || false;
                                                    return (
                                                        <div 
                                                            key={idx} 
                                                            className="flex items-center justify-between gap-3 bg-slate-900/60 hover:bg-slate-900 p-2.5 rounded-xl border border-white/5 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <button 
                                                                    onClick={(e) => toggleStep(pb.id, idx, e)}
                                                                    className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isCompleted ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 hover:border-slate-500 bg-slate-950'}`}
                                                                >
                                                                    {isCompleted && <Check className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <span className={`text-[11px] font-medium leading-tight truncate ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                                                    {step.label}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => handleActionClick(step.targetView, pb.id, idx, e)}
                                                                className="flex-shrink-0 font-bold font-tech text-[9px] px-2.5 py-1.5 rounded-lg bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-500/30 hover:border-cyan-400 transition-all uppercase tracking-wider"
                                                            >
                                                                {step.actionText}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Field Rugged System Vitals Banner - System Design Guidelines (Telemetry / Officers Safety) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
                    <span className="text-slate-500 text-[9px] flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> KNOX SECURITY</span>
                    <span className="text-emerald-400 font-tech mt-1 text-xs">AES-256 ENCRYPTED</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
                    <span className="text-slate-500 text-[9px] flex items-center gap-1"><MapIcon className="w-3.5 h-3.5 text-cyan-500" /> GPS TRIANGULATION</span>
                    <span className="text-emerald-400 font-tech mt-1 text-xs">0.8m ACC (LOCK)</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
                    <span className="text-slate-500 text-[9px] flex items-center gap-1"><Signal className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> NETWORK LATENCY</span>
                    <span className="text-amber-400 font-tech mt-1 text-xs">5G LTE (29ms)</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
                    <span className="text-slate-500 text-[9px] flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-pink-500" /> LOCAL STORAGE</span>
                    <span className="text-slate-200 mt-1 text-xs">CACHE_SYNCED</span>
                </div>
            </div>

            {/* SIM-SOS simulation quick banner */}
            {onSimulateSOS && (
                <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-3 flex flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2.5">
                        <Siren className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
                        <div>
                            <div className="text-[10px] font-black uppercase text-red-400 tracking-wider">Emergency Sandbox-SIM</div>
                            <div className="text-[8.5px] text-slate-400 leading-tight">Trigger distress SOS dispatch target (separate police officer) located at least 4 kms from your current position.</div>
                        </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSimulateSOS(); }} 
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-wider transition-all active:scale-95 flex items-center gap-1 shrink-0 ${isSOSActive ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-red-950 text-red-400 border-red-900/40 hover:border-red-500/50'}`}
                    >
                        {isSOSActive ? 'RESET' : 'SIM'}
                    </button>
                </div>
            )}
        </div>
    );
};
