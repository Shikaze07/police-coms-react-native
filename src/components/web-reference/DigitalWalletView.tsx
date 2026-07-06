
import React, { useState } from 'react';
import { Wallet, CreditCard, Send, QrCode, FileText, Receipt, History, ArrowUpRight, ArrowDownLeft, ShieldCheck, Landmark, Printer, Plus, Camera, CheckCircle2, ChevronRight, DollarSign, Briefcase, User as UserIcon, Building2, PieChart, X, FileInput, BarChart3, TrendingUp, Download } from 'lucide-react';
import { User } from './types';

// --- MOCK DATA ---
const PAY_MATRIX = [
    { rank: 'Patrolman', base: 29668, hazard: 500, laundry: 150, subsistence: 1500 },
    { rank: 'Police Corporal', base: 30867, hazard: 500, laundry: 150, subsistence: 1500 },
    { rank: 'Police Staff Sergeant', base: 32114, hazard: 500, laundry: 150, subsistence: 1500 },
    { rank: 'Police Master Sergeant', base: 33411, hazard: 500, laundry: 150, subsistence: 1500 },
    { rank: 'Police Lieutenant', base: 49528, hazard: 500, laundry: 150, subsistence: 1500 },
    { rank: 'Police Captain', base: 56582, hazard: 500, laundry: 150, subsistence: 1500 },
];

const TRANSACTIONS = [
    { id: 'TX-9921', type: 'IN', amount: 35000.00, label: 'Monthly Salary Credit', date: 'Oct 15, 2023', category: 'SALARY' },
    { id: 'TX-9922', type: 'OUT', amount: 1500.00, label: 'Cop Shop Purchase', date: 'Oct 16, 2023', category: 'PURCHASE' },
    { id: 'TX-9923', type: 'OUT', amount: 5000.00, label: 'Transfer to Unit Alpha', date: 'Oct 18, 2023', category: 'TRANSFER' },
    { id: 'TX-9924', type: 'OUT', amount: 340.00, label: '7-Eleven', date: 'Oct 19, 2023', category: 'FOOD' },
    { id: 'TX-9925', type: 'OUT', amount: 1200.00, label: 'Shell Station', date: 'Oct 20, 2023', category: 'FUEL' },
    { id: 'TX-9926', type: 'IN', amount: 2500.00, label: 'Allowance Refund', date: 'Oct 21, 2023', category: 'ALLOWANCE' },
    { id: 'TX-9927', type: 'OUT', amount: 450.00, label: 'Mercury Drug', date: 'Oct 22, 2023', category: 'MEDICAL' },
];

const OPS_EXPENSES = [
    { id: 'OP-101', item: 'Gasoline - Mobile 14', amount: 2500, status: 'APPROVED', date: 'Oct 21', category: 'FUEL' },
    { id: 'OP-102', item: 'Meals - Stakeout Ops', amount: 850, status: 'PENDING', date: 'Oct 22', category: 'MEALS' },
    { id: 'OP-103', item: 'Office Supplies', amount: 320, status: 'LIQUIDATED', date: 'Oct 10', category: 'SUPPLIES' },
    { id: 'OP-104', item: 'Intel Fund Release', amount: 5000, status: 'APPROVED', date: 'Oct 23', category: 'INTEL' },
    { id: 'OP-105', item: 'Vehicle Repair (Tires)', amount: 4200, status: 'APPROVED', date: 'Oct 24', category: 'REPAIR' },
    { id: 'OP-106', item: 'Printer Ink', amount: 1200, status: 'PENDING', date: 'Oct 25', category: 'SUPPLIES' },
];

const EXPENSE_ANALYSIS = [
    { label: 'FOOD', amount: 4500, color: 'bg-orange-500', hex: '#f97316', width: 30 },
    { label: 'TRANS', amount: 2100, color: 'bg-blue-500', hex: '#3b82f6', width: 15 },
    { label: 'FUEL', amount: 3200, color: 'bg-red-500', hex: '#ef4444', width: 25 },
    { label: 'SUPP', amount: 1500, color: 'bg-purple-500', hex: '#a855f7', width: 10 },
    { label: 'MISC', amount: 800, color: 'bg-gray-500', hex: '#6b7280', width: 5 },
    // Remaining 15% is unspent
];

interface DigitalWalletViewProps {
    currentUser?: User | null;
}

const DigitalWalletView: React.FC<DigitalWalletViewProps> = ({ currentUser }) => {
    const [activePocket, setActivePocket] = useState<'PERSONAL' | 'UNIT'>('PERSONAL');
    const [subView, setSubView] = useState<'MAIN' | 'PAYSLIP'>('MAIN');
    const [showMatrix, setShowMatrix] = useState(false);
    
    // Modals
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);

    // Funds
    const [personalBalance, setPersonalBalance] = useState(45250.00);
    const [opsBalance, setOpsBalance] = useState(15000.00);

    // Unit Request Form
    const [requestAmount, setRequestAmount] = useState('');
    const [requestPurpose, setRequestPurpose] = useState('');

    const themeColor = activePocket === 'PERSONAL' ? 'emerald' : 'cyan';
    const ThemeIcon = activePocket === 'PERSONAL' ? UserIcon : Building2;

    const handleTransfer = () => {
        const amount = prompt("Enter Amount to Transfer:");
        if (amount) {
            alert(`Successfully transferred ₱${amount} securely.`);
        }
    };

    const handleGenerateReceipt = () => {
        alert("Digital Official Receipt (OR) Captured. Uploading to COA Database...");
    };

    const submitFundRequest = () => {
        alert(`Request for ₱${requestAmount} submitted to Finance Service for approval.`);
        setShowRequestModal(false);
        setRequestAmount('');
        setRequestPurpose('');
    };

    // Construct Conic Gradient for Pie Chart
    const getConicGradient = () => {
        let gradientStr = '';
        let currentPos = 0;
        
        EXPENSE_ANALYSIS.forEach(item => {
            const endPos = currentPos + item.width;
            gradientStr += `${item.hex} ${currentPos}% ${endPos}%, `;
            currentPos = endPos;
        });
        
        // Fill remainder with dark slate
        gradientStr += `#1e293b ${currentPos}% 100%`;
        
        return `conic-gradient(${gradientStr})`;
    };

    // Inline Dashboard Component
    const FinancialDashboard = () => (
        <div className={`bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full shadow-inner relative overflow-hidden`}>
            {/* Background Decor */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${activePocket === 'PERSONAL' ? 'bg-emerald-500/5' : 'bg-cyan-500/5'} rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`}></div>
            
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <PieChart className={`w-3 h-3 ${activePocket === 'PERSONAL' ? 'text-emerald-500' : 'text-cyan-500'}`} /> 
                        {activePocket === 'PERSONAL' ? 'SPENDING' : 'UTILIZATION'}
                    </h3>
                    <div className="text-xs text-white font-mono mt-0.5">Oct 2023 • 85%</div>
                </div>
                <button onClick={() => setShowAnalyzeModal(true)} className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors">
                    DETAILS
                </button>
            </div>

            {/* Pie Chart Visualization */}
            <div className="flex items-center gap-4 relative z-10 flex-1">
                {/* Pie Chart */}
                <div className="w-20 h-20 rounded-full shrink-0 relative flex items-center justify-center shadow-lg"
                     style={{ background: getConicGradient() }}>
                     {/* Inner Circle for Donut Effect */}
                     <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center">
                         <span className="text-[8px] font-bold text-slate-500">EXP</span>
                     </div>
                </div>
                
                {/* Legend / Stats */}
                <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1">
                    {EXPENSE_ANALYSIS.slice(0, 4).map(item => (
                        <div key={item.label} className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div>
                                <span className="text-[8px] font-bold text-slate-400">{item.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-200 ml-3">₱{item.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden relative">
            
            {/* --- COMPACT HEADER --- */}
            <div className="bg-slate-900 border-b border-slate-800 p-2 md:p-3 flex flex-row items-center gap-3 shrink-0 justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-lg transition-colors ${activePocket === 'PERSONAL' ? 'bg-emerald-600/20 text-emerald-500 border-emerald-500/30' : 'bg-cyan-600/20 text-cyan-500 border-cyan-500/30'}`}>
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-black text-white text-base tracking-tighter flex items-center gap-2 font-tech">
                            DIGITAL WALLET <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono tracking-widest ${activePocket === 'PERSONAL' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-800' : 'bg-cyan-900/50 text-cyan-300 border-cyan-800'}`}>SECURE</span>
                        </h1>
                    </div>
                </div>

                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button onClick={() => { setActivePocket('PERSONAL'); setSubView('MAIN'); }} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${activePocket === 'PERSONAL' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <UserIcon className="w-3 h-3" /> Personal
                    </button>
                    <button onClick={() => { setActivePocket('UNIT'); setSubView('MAIN'); }} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${activePocket === 'UNIT' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Building2 className="w-3 h-3" /> Unit Fund
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            {subView === 'MAIN' ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* TOP SECTION: CARD + ACTIONS + DASHBOARD (Landscape Optimized 3-Column) */}
                    <div className="p-4 bg-slate-950 shrink-0 flex flex-col md:flex-row landscape:flex-row gap-4 border-b border-slate-800 shadow-xl z-10">
                        
                        {/* 1. CREDIT CARD VISUAL */}
                        <div className="flex justify-center items-center md:w-auto landscape:w-auto shrink-0">
                            <div className={`relative w-full md:w-[320px] lg:w-[340px] h-[190px] rounded-2xl p-5 flex flex-col justify-between shadow-2xl border-t border-white/20 transform transition-transform hover:scale-[1.02] ${activePocket === 'PERSONAL' ? 'bg-gradient-to-br from-emerald-900 to-slate-900 border-emerald-500/30' : 'bg-gradient-to-br from-cyan-900 to-slate-900 border-cyan-500/30'}`}>
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
                                <div className="flex justify-between items-start z-10">
                                    <div className="flex items-center gap-2">
                                        <Landmark className="w-5 h-5 text-white/80" />
                                        <span className="font-bold text-white/80 tracking-widest text-[10px]">{activePocket === 'PERSONAL' ? 'LANDBANK' : 'OFFICIAL'}</span>
                                    </div>
                                    <ShieldCheck className={`w-6 h-6 ${activePocket === 'PERSONAL' ? 'text-emerald-400' : 'text-cyan-400'}`} />
                                </div>
                                <div className="z-10 text-center">
                                    <div className="text-[10px] text-white/60 font-mono mb-1 tracking-wider uppercase">{activePocket === 'PERSONAL' ? 'Personal Savings' : 'Operational Fund (WOCA)'}</div>
                                    <div className="text-3xl font-black text-white tracking-tight flex justify-center items-start gap-1">
                                        <span className="text-sm mt-1">₱</span>
                                        {(activePocket === 'PERSONAL' ? personalBalance : opsBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </div>
                                </div>
                                <div className="z-10 flex justify-between items-end">
                                    <div>
                                        <div className="text-[9px] text-white/50 uppercase font-bold">Account Name</div>
                                        <div className="text-xs font-mono text-white tracking-widest uppercase">
                                            {activePocket === 'PERSONAL' 
                                                ? (currentUser ? `${currentUser.rank ? currentUser.rank + '. ' : ''}${currentUser.name}`.toUpperCase() : 'SGT. J. DOE')
                                                : (currentUser ? `UNIT ${currentUser.unit || '01-KNOX'}`.toUpperCase() : 'TPMO SECTOR 1')}
                                        </div>
                                    </div>
                                    <div className="text-sm text-white/80 font-mono">
                                        •••• {currentUser?.username ? currentUser.username.slice(-4).toUpperCase() : (currentUser?.id ? currentUser.id.slice(0, 4).toUpperCase() : '9921')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. ACTION BUTTONS (2x2 Grid on Landscape/MD) */}
                        <div className="grid grid-cols-4 md:grid-cols-2 landscape:grid-cols-2 gap-3 shrink-0 md:w-48 lg:w-56 landscape:w-48 h-auto content-center">
                            {activePocket === 'PERSONAL' ? (
                                <>
                                    <button onClick={handleTransfer} className="flex flex-col items-center justify-center gap-2 group p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500 transition-all hover:bg-slate-800/50 aspect-square">
                                        <Send className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Transfer</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center gap-2 group p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500 transition-all hover:bg-slate-800/50 aspect-square">
                                        <QrCode className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Scan QR</span>
                                    </button>
                                    <button onClick={() => setSubView('PAYSLIP')} className="flex flex-col items-center justify-center gap-2 group p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-amber-500 transition-all hover:bg-slate-800/50 aspect-square">
                                        <FileText className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Payslip</span>
                                    </button>
                                    <button onClick={() => setShowAnalyzeModal(true)} className="flex flex-col items-center justify-center gap-2 group p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500 transition-all hover:bg-slate-800/50 aspect-square">
                                        <BarChart3 className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Analysis</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setShowRequestModal(true)} className="flex flex-col items-center justify-center gap-2 group p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500 transition-all hover:bg-slate-800/50 aspect-square">
                                        <Plus className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Request</span>
                                    </button>
                                    <button onClick={() => alert("Scan Merchant QR")} className="flex flex-col items-center justify-center gap-2 group p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500 transition-all hover:bg-slate-800/50 aspect-square">
                                        <QrCode className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Scan QR</span>
                                    </button>
                                    <button onClick={handleGenerateReceipt} className="flex flex-col items-center justify-center gap-2 group p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500 transition-all hover:bg-slate-800/50 aspect-square">
                                        <Camera className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Photo OR</span>
                                    </button>
                                    <button onClick={() => setShowAnalyzeModal(true)} className="flex flex-col items-center justify-center gap-2 group p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500 transition-all hover:bg-slate-800/50 aspect-square">
                                        <BarChart3 className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Analyze</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* 3. INLINE DASHBOARD (Pie Chart) */}
                        <div className="flex-1 min-h-[120px]">
                            <FinancialDashboard />
                        </div>
                    </div>

                    {/* BOTTOM SECTION: TRANSACTION LIST (Scrollable) */}
                    <div className="flex-1 bg-slate-950 overflow-y-auto relative">
                        <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-20 px-4 py-2 border-b border-slate-800 flex justify-between items-center shadow-md">
                            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                                <History className="w-3 h-3 text-slate-400" /> 
                                {activePocket === 'PERSONAL' ? 'Transaction History' : 'Expense Log & Liquidation'}
                            </h3>
                            <button className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1">
                                <Download className="w-3 h-3" /> EXPORT
                            </button>
                        </div>
                        
                        <div className="divide-y divide-slate-800">
                            {activePocket === 'PERSONAL' ? (
                                TRANSACTIONS.map((tx) => (
                                    <div key={tx.id} className="p-3 px-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/5 ${tx.type === 'IN' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                                {tx.type === 'IN' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-200">{tx.label}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">{tx.date} • {tx.category}</div>
                                            </div>
                                        </div>
                                        <div className={`font-mono text-sm font-bold ${tx.type === 'IN' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                            {tx.type === 'IN' ? '+' : '-'}₱{tx.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                OPS_EXPENSES.map((ex) => (
                                    <div key={ex.id} className="p-3 px-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-900/20 text-cyan-400 border border-cyan-500/20">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-200">{ex.item}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">{ex.date} • {ex.status}</div>
                                            </div>
                                        </div>
                                        <div className="font-mono text-sm font-bold text-white">
                                            ₱{ex.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* PAYSLIP VIEW (Unchanged) */
                <div className="flex-1 overflow-y-auto bg-slate-950 p-4">
                    <div className="max-w-3xl mx-auto h-full flex flex-col animate-in slide-in-from-right">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <button onClick={() => setSubView('MAIN')} className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
                                <ChevronRight className="w-4 h-4 rotate-180" /> BACK TO WALLET
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => setShowMatrix(!showMatrix)} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700 hover:text-white">
                                    {showMatrix ? 'HIDE MATRIX' : 'VIEW PAY MATRIX'}
                                </button>
                                <button className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 shadow-lg">
                                    <Printer className="w-3 h-3" /> PRINT
                                </button>
                            </div>
                        </div>

                        {showMatrix ? (
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-6 animate-in slide-in-from-top-4">
                                <div className="p-3 bg-slate-800 border-b border-slate-700 font-bold text-slate-300 text-xs">OFFICIAL PAY & ALLOWANCES MATRIX (2024)</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left text-slate-300">
                                        <thead className="text-slate-500 font-bold uppercase bg-slate-900">
                                            <tr>
                                                <th className="px-4 py-3">Rank</th>
                                                <th className="px-4 py-3">Base Pay</th>
                                                <th className="px-4 py-3">Hazard</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {PAY_MATRIX.map((row) => (
                                                <tr key={row.rank} className="hover:bg-slate-800/50">
                                                    <td className="px-4 py-2 font-bold text-white">{row.rank}</td>
                                                    <td className="px-4 py-2 font-mono">₱{row.base.toLocaleString()}</td>
                                                    <td className="px-4 py-2 font-mono">₱{row.hazard.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white text-slate-900 rounded-sm shadow-xl p-8 font-mono text-xs flex-1">
                                <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
                                    <div className="font-black text-lg">PHILIPPINE NATIONAL POLICE</div>
                                    <div className="font-bold">FINANCE SERVICE</div>
                                    <div className="mt-2">PAYSLIP FOR PERIOD: OCTOBER 1-31, 2023</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <div className="font-bold text-slate-500">NAME</div>
                                        <div className="font-bold text-sm">
                                            {currentUser 
                                                ? (() => {
                                                    const parts = currentUser.name.trim().split(' ');
                                                    if (parts.length > 1) {
                                                        const lastName = parts[parts.length - 1];
                                                        const firstNames = parts.slice(0, parts.length - 1).join(' ');
                                                        return `${lastName}, ${firstNames}`.toUpperCase();
                                                    }
                                                    return currentUser.name.toUpperCase();
                                                })()
                                                : 'DOE, JOHN'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-500">RANK / UNIT</div>
                                        <div className="font-bold text-sm">
                                            {currentUser 
                                                ? `${currentUser.rank || 'SGT'} / ${currentUser.unit || 'TPMO'}`.toUpperCase()
                                                : 'PMSg / TPMO'}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <div className="font-black border-b border-slate-300 mb-2 pb-1">EARNINGS</div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between"><span>BASE PAY</span><span>33,411.00</span></div>
                                            <div className="flex justify-between"><span>HAZARD PAY</span><span>540.00</span></div>
                                            <div className="flex justify-between font-bold border-t border-dashed border-slate-300 pt-1 mt-1"><span>GROSS</span><span>37,801.00</span></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-black border-b border-slate-300 mb-2 pb-1">DEDUCTIONS</div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between"><span>GSIS</span><span>3,006.99</span></div>
                                            <div className="flex justify-between font-bold border-t border-dashed border-slate-300 pt-1 mt-1"><span>TOTAL</span><span>3,556.99</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 border-t-2 border-slate-900 pt-4 flex justify-between items-center">
                                    <div className="text-slate-500 italic">Generated Systematically.</div>
                                    <div className="text-right"><div className="font-bold text-slate-500 text-[10px]">NET PAY</div><div className="font-black text-2xl">₱34,244.01</div></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}

            {/* REQUEST FUNDS MODAL */}
            {showRequestModal && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-cyan-500" /> Request Funds
                            </h3>
                            <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Amount (PHP)</label>
                                <input 
                                    type="number" 
                                    value={requestAmount}
                                    onChange={(e) => setRequestAmount(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white font-mono text-lg focus:border-cyan-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Purpose / MOOE Category</label>
                                <select 
                                    value={requestPurpose}
                                    onChange={(e) => setRequestPurpose(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-cyan-500 outline-none"
                                >
                                    <option value="">Select Category</option>
                                    <option value="FUEL">Fuel & Oil</option>
                                    <option value="REPAIR">Repairs & Maintenance</option>
                                    <option value="SUPPLIES">Office Supplies</option>
                                    <option value="MEALS">Food & Subsistence (Ops)</option>
                                    <option value="INTEL">Intelligence Expenses</option>
                                </select>
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-400 text-xs cursor-pointer hover:bg-slate-800 hover:text-white transition-colors gap-2">
                                <FileText className="w-4 h-4" /> Attach Supporting Docs (Optional)
                            </div>
                            <button 
                                onClick={submitFundRequest}
                                disabled={!requestAmount || !requestPurpose}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg mt-2"
                            >
                                SUBMIT REQUEST
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL ANALYSIS MODAL (Detailed View) */}
            {showAnalyzeModal && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <PieChart className={`w-5 h-5 text-${themeColor}-500`} /> Expense Analysis
                            </h3>
                            <button onClick={() => setShowAnalyzeModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex justify-center mb-6">
                            <div className="w-40 h-40 rounded-full border-8 border-slate-800 relative flex items-center justify-center"
                                 style={{ background: getConicGradient(), padding: '10px' }}>
                                <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-xs text-slate-400">TOTAL</div>
                                        <div className="text-lg font-bold text-white">₱12.1K</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-600 rounded-full"></div> FUEL & OIL</div>
                                <span className="text-white font-mono">₱3,200 (26%)</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> INTEL</div>
                                <span className="text-white font-mono">₱5,000 (41%)</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> FOOD</div>
                                <span className="text-white font-mono">₱4,500 (37%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DigitalWalletView;
