import React, { useState } from 'react';
import { Shield, CreditCard, HeartPulse, Network, User as UserIcon, FileText, Info } from 'lucide-react';
import { ViewState, User } from './types';

export const DigitalIDView = ({ onViewChange, currentUser }: { onViewChange: (view: ViewState) => void, currentUser?: User | null }) => {
    const [showSummary, setShowSummary] = useState(false);

    // Render registered verified account info or fallback to standard structure safely
    const officer = {
        name: currentUser?.name || "Officer J. Doe",
        rank: currentUser?.rank || "Detective Sergeant",
        badge: currentUser?.username?.toUpperCase() || currentUser?.id?.slice(0, 8).toUpperCase() || "PCT-8842",
        assignment: currentUser?.unit ? `Tactical Response - Unit ${currentUser.unit}` : "Tactical Response Unit - Zone 01",
        dob: "1988-05-12",
        address: "123 Sovereign Way, Sector 7",
        unit: currentUser?.unit || "TRU-01",
        bloodType: "O+",
        allergies: "None",
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 font-sans">
            <header className="border-b border-slate-700 pb-4 mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Shield className="w-8 h-8 text-blue-500" />
                    DIGITAL ID
                </h1>
                <button onClick={() => onViewChange(ViewState.HOME)} className="text-sm text-slate-400 hover:text-white">CLOSE</button>
            </header>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Card Display */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-blue-900/20 text-blue-400 text-xs font-mono">SECURE</div>
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-700">
                             <UserIcon className="w-16 h-16 text-slate-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{officer.name}</h2>
                            <p className="text-blue-400 font-medium">{officer.rank}</p>
                            <p className="text-slate-400 text-sm mt-1">Badge: {officer.badge}</p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-2 border-t border-slate-800 pt-4">
                        <p><span className="text-slate-500 text-xs">ASSIGNMENT:</span> {officer.assignment}</p>
                        <p><span className="text-slate-500 text-xs">UNIT:</span> {officer.unit}</p>
                        <p><span className="text-slate-500 text-xs">DOB:</span> {officer.dob}</p>
                        <p><span className="text-slate-500 text-xs">ADDRESS:</span> {officer.address}</p>
                    </div>
                </div>

                {/* Quick Access Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onViewChange(ViewState.WALLET)} className="bg-slate-900 hover:bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col items-center gap-2">
                        <CreditCard className="w-8 h-8 text-emerald-500" />
                        <span>DIGITAL WALLET</span>
                    </button>
                    <button onClick={() => onViewChange(ViewState.FIRST_AID)} className="bg-slate-900 hover:bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col items-center gap-2">
                        <HeartPulse className="w-8 h-8 text-rose-500" />
                        <span>HEALTH</span>
                    </button>
                    <button onClick={() => onViewChange(ViewState.COPNET)} className="bg-slate-900 hover:bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col items-center gap-2">
                        <Network className="w-8 h-8 text-blue-500" />
                        <span>COPNET</span>
                    </button>
                    <button onClick={() => setShowSummary(!showSummary)} className="bg-slate-800 hover:bg-slate-700 p-6 rounded-lg border border-slate-700 flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-amber-500" />
                        <span>SUMMARY</span>
                    </button>
                </div>
            </div>

            {/* Summary Overlay */}
            {showSummary && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm p-20 flex items-center justify-center">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">SUMMARY OF INFORMATION</h3>
                            <button onClick={() => setShowSummary(false)} className="text-slate-400">CLOSE</button>
                        </div>
                        <div className="space-y-4 text-slate-300">
                             <p><strong>Schooling:</strong> Police Academy (Tactical Ops Master), University of Law (Forensics)</p>
                             <p><strong>Awards:</strong> Medal of Valor, Outstanding Tactical Response (2024)</p>
                             <p><strong>Past Assignments:</strong> Zone 04 (Counter-Terror), Zone 02 (Patrol)</p>
                             <p><strong>Certifications:</strong> Advanced Forensic Analysis, First Aid Level 3</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
