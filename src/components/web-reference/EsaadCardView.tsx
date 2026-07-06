import React, { useState } from 'react';
import { CreditCard, User, Calendar, QrCode, LogIn, Search, Home, Tag, ChevronRight, Settings, Info, Phone, MessageSquare } from 'lucide-react';

type EsaadView = 'LOGIN' | 'HOME' | 'PROFILE';

const OFFERS = [
  { id: 1, name: "Ammos Restaurant", discount: "25% OFF", color: "from-blue-700 to-blue-900" },
  { id: 2, name: "Dubai Mall Cafe", discount: "15% OFF", color: "from-emerald-700 to-emerald-900" },
  { id: 3, name: "Desert Safari", discount: "30% OFF", color: "from-amber-700 to-amber-900" }
];

const EsaadCardView: React.FC = () => {
    const [view, setView] = useState<EsaadView>('LOGIN');

    const renderLogin = () => (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <h2 className="text-3xl font-black text-white mb-2">Activate membership</h2>
            <p className="text-slate-400 mb-8">Limited to esaad members only</p>
            <input type="text" placeholder="NNN-NNNN-NNNNNNN-N" className="w-full bg-black/40 text-slate-200 p-4 rounded-xl border border-white/10 mb-4 font-mono" />
            <button onClick={() => setView('HOME')} className="w-full bg-emerald-700 text-white p-4 rounded-xl font-bold">VERIFY</button>
            <div className="my-6 text-slate-500">OR</div>
            <button className="w-full bg-white text-emerald-900 p-4 rounded-xl font-bold flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5"/> Sign Up with UAE PASS
            </button>
            <button onClick={() => setView('HOME')} className="mt-8 text-emerald-400 font-bold">Have an account? Sign in</button>
        </div>
    );

    const renderHome = () => (
        <div className="flex flex-col h-full">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
                <span>Hi, SARA</span>
                <div className="flex gap-4">
                    <CreditCard className="w-6 h-6" onClick={() => setView('PROFILE')} />
                </div>
            </div>
            {/* Mock Featured Offer */}
            <div className="p-4 overflow-y-auto">
                <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-2xl h-40 flex flex-col justify-end p-4 text-white mb-4">
                    <h3 className="text-xl font-bold">Save 25% on your bill!</h3>
                    <p className="text-sm">Explore Featured Offers</p>
                </div>
                
                <h4 className="font-bold text-white mb-3">Nearby Offers</h4>
                <div className="grid grid-cols-1 gap-4">
                    {OFFERS.map(offer => (
                        <div key={offer.id} className={`bg-gradient-to-r ${offer.color} p-4 rounded-xl flex justify-between items-center text-white shadow-lg`}>
                            <div>
                                <div className="font-bold">{offer.name}</div>
                                <div className="text-xs opacity-80 mt-1">{offer.discount}</div>
                            </div>
                            <button className="p-2 bg-white/20 rounded-lg"><ChevronRight /></button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-auto p-4 border-t border-white/10 flex justify-around text-slate-400 bg-emerald-950">
                <Home className="w-6 h-6 text-emerald-500" />
                <Tag className="w-6 h-6" />
                <User className="w-6 h-6" onClick={() => setView('PROFILE')} />
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="flex flex-col h-full p-4">
            <div className="flex flex-col items-center py-8">
                <User className="w-20 h-20 bg-emerald-800 text-emerald-100 rounded-full p-4 mb-4"/>
                <h3 className="text-xl font-bold text-white">JOHN PRATT</h3>
                <p className="text-slate-400">john@live.com</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-xl text-center"><div className="text-lg font-bold">1</div><div>Redemptions</div></div>
                <div className="bg-white/5 p-4 rounded-xl text-center"><div className="text-lg font-bold">0</div><div>Saved</div></div>
            </div>
            
            <div className="flex flex-col gap-4 text-slate-300">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg"><div className="flex items-center gap-3"><User className="w-5 h-5"/> My Profile</div><ChevronRight /></div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg"><div className="flex items-center gap-3"><Info className="w-5 h-5"/> About Esaad</div><ChevronRight /></div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" onClick={() => setView('HOME')}><div className="flex items-center gap-3"><Home className="w-5 h-5"/> Back to Home</div><ChevronRight /></div>
            </div>
        </div>
    );

  return (
    <div className="h-full w-full bg-emerald-950 text-slate-200 overflow-hidden relative">
        {view === 'LOGIN' && renderLogin()}
        {view === 'HOME' && renderHome()}
        {view === 'PROFILE' && renderProfile()}
    </div>
  );
};

export default EsaadCardView;
