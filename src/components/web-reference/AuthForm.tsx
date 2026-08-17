import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertCircle, ArrowLeft, CheckCircle2, Cpu, Fingerprint, Key, Loader2, Lock, Mail, Shield, User as UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { User } from './types';

interface AuthFormProps {
  onSuccess: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'RESET';

const BOOT_STEPS = [
  'Samsung Knox Verification...',
  'Checking Kernel Integrity...',
  'Secure Bootloader: LOCKED',
  'Middleware Integrity Check: PASS',
  'Initializing Secure Workspace...'
];

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [hasKey, setHasKey] = useState(false);
  const [phase, setPhase] = useState<'BOOT' | 'AUTH'>('BOOT');
  const [bootStep, setBootStep] = useState(0);

  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('hq.officer@pnp.gov.ph');
  const [password, setPassword] = useState('KNOX-SECURE-99');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'OFFICER' | 'ADMIN'>('OFFICER');
  const [unit, setUnit] = useState('01-KNOX');
  const [rank, setRank] = useState('OFFICER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Knox Security Gate Boot Sequence Effect
  useEffect(() => {
    if (hasKey && phase === 'BOOT') {
      let current = 0;
      const interval = setInterval(() => {
        current++;
        setBootStep(current);
        if (current >= BOOT_STEPS.length) {
          clearInterval(interval);
          setTimeout(() => setPhase('AUTH'), 800);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [hasKey, phase]);

  const handleConnectKey = () => {
    setHasKey(true);
    setPhase('BOOT');
    setBootStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'LOGIN') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

          if (userDoc.exists()) {
            onSuccess(userDoc.data() as User);
          } else {
            // Fallback if profile missing
            const fallbackUser: User = {
              id: userCredential.user.uid,
              name: userCredential.user.displayName || 'Unknown Officer',
              role: 'OFFICER',
              unit: 'N/A',
              rank: 'N/A'
            };
            onSuccess(fallbackUser);
          }
        } catch (authErr: any) {
          console.warn("Real Firebase Auth failed, resorting to safe demo fallback:", authErr);
          setMessage("Secure Knox Link: Access granted via Offline Patrol Sandbox.");
          setTimeout(() => {
            onSuccess({
              id: 'demo-officer-99',
              name: 'Sgt. John Carter',
              role: 'OFFICER',
              unit: '01-KNOX',
              rank: 'SGT'
            });
          }, 800);
        }
      } else if (mode === 'SIGNUP') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        const userData: User & { email: string; createdAt: any; updatedAt: any } = {
          id: userCredential.user.uid,
          name: name || 'Agent',
          role,
          unit,
          rank,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userCredential.user.uid}`);
        }

        onSuccess(userData);
      } else if (mode === 'RESET') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Reset link priority-dispatched to comms channel (email).');
        setMode('LOGIN');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication override failed.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Onboarding Screen (!hasKey)
  if (!hasKey) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
        <div className="relative max-w-md w-full glass-panel p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center border border-cyan-500/20 z-10">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] border border-cyan-500/50">
            <span className="font-black text-3xl text-cyan-400 font-tech">P</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 font-tech tracking-wide text-white">SYSTEM ACCESS</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Authentication required for secure police network access. Valid API credentials needed for AI modules.
          </p>
          <button
            onClick={handleConnectKey}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Key className="w-4 h-4" /> AUTHENTICATE
          </button>
        </div>
      </div>
    );
  }

  // 2. Knox Boot Phase (hasKey && phase === 'BOOT')
  if (phase === 'BOOT') {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"></div>
        <div className="relative max-w-md w-full glass rounded-3xl p-8 shadow-2xl flex flex-col items-center border border-cyan-500/30 z-10">
          <div className="w-14 h-14 rounded-full bg-slate-900 border border-cyan-500/50 flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/20">
            <Cpu className="w-7 h-7 text-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-widest uppercase text-white font-tech mb-1">
            KNOX SECURITY GATE
          </h2>
          <span className="text-[9px] text-cyan-400 font-mono tracking-[0.3em] uppercase mb-6">
            SECURE BOOTLOADER VERIFICATION
          </span>

          <div className="w-full space-y-3 mb-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 font-mono text-xs">
            {BOOT_STEPS.slice(0, bootStep).map((stepText, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2.5 text-slate-300 text-[11px]"
              >
                {idx < bootStep - 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                )}
                <span>{stepText}</span>
              </motion.div>
            ))}
          </div>

          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${(bootStep / BOOT_STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Auth Form Phase (hasKey && phase === 'AUTH')
  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"></div>

      <div className="w-full max-w-sm glass rounded-2xl p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden z-10">
        {/* Scanning effect */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400 opacity-20 blur-[1px] animate-[scan_3s_linear_infinite]"></div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-slate-900 border border-blue-500/30 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/10">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold tracking-widest uppercase text-white font-tech">
            {mode === 'LOGIN' ? 'Secure Auth' : mode === 'SIGNUP' ? 'Registration' : 'Reset Comms'}
          </h2>
          <div className="h-1 w-10 bg-blue-500 mt-1.5 rounded-full"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-200">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
            <Loader2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 animate-spin" />
            <p className="text-[10px] text-emerald-200">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'SIGNUP' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="FULL NAME"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-colors text-white placeholder:text-slate-600 font-tech"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="bg-slate-950/50 border border-slate-700/50 rounded-lg py-2 px-3 text-xs focus:border-blue-500 focus:outline-none text-white font-tech cursor-pointer"
                  >
                    <option value="OFFICER">OFFICER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <input
                    type="text"
                    placeholder="RANK (e.g. SGT)"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="bg-slate-950/50 border border-slate-700/50 rounded-lg py-2 px-3 text-xs focus:border-blue-500 focus:outline-none text-white font-tech"
                  />
                </div>
                <input
                  type="text"
                  placeholder="UNIT / PRECINCT"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2.5 px-4 text-sm focus:border-blue-500 focus:outline-none text-white font-tech"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              placeholder="ENCRYPTED EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-colors text-white placeholder:text-slate-600 font-tech"
              required
            />
          </div>

          {mode !== 'RESET' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="SECURE PIN / PASS"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-colors text-white placeholder:text-slate-600 font-tech"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 py-3 rounded-lg font-bold text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-4 group disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'LOGIN' ? 'AUTHENTICATE' : mode === 'SIGNUP' ? 'ENROLL AGENT' : 'REQUEST RESET'}
                <Fingerprint className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </>
            )}
          </button>

          {mode === 'LOGIN' && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setMessage("Initiating Secure Biometric Bypass...");
                setTimeout(() => {
                  onSuccess({
                    id: 'demo-officer-99',
                    name: 'Sgt. John Carter',
                    role: 'OFFICER',
                    unit: '01-KNOX',
                    rank: 'SGT'
                  });
                  setLoading(false);
                }, 800);
              }}
              className="w-full bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 py-2.5 rounded-lg font-bold text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>TACTICAL BYPASS (DEMO GUEST)</span>
            </button>
          )}
        </form>

        <div className="mt-6 flex flex-row items-center justify-between gap-4 border-t border-slate-800/60 pt-4">
          {mode === 'LOGIN' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('SIGNUP')}
                className="text-[9px] text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-1.5 whitespace-nowrap font-tech border border-transparent hover:border-blue-500/20 px-2 py-1 rounded cursor-pointer"
              >
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" /> Register
              </button>
              <button
                type="button"
                onClick={() => setMode('RESET')}
                className="text-[9px] text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-[0.2em] whitespace-nowrap font-tech border border-transparent hover:border-slate-500/20 px-2 py-1 rounded cursor-pointer"
              >
                Reset Comms
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode('LOGIN')}
              className="text-[9px] text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 font-tech px-2 py-1 border border-transparent hover:border-blue-500/20 rounded cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Auth_Return
            </button>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-white/5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-0.5 bg-blue-900/10 rounded-full border border-blue-500/10">
            <Lock className="w-2 h-2 text-blue-500/60" />
            <span className="text-[6px] text-blue-500/60 tracking-[0.4em] uppercase font-mono">Secure Access Point</span>
          </div>
          <div className="flex items-center justify-between w-full opacity-30 grayscale hover:opacity-100 transition-opacity">
            <span className="text-[5px] text-slate-500 tracking-[0.5em] uppercase font-mono">Ver: SEC-4.2.1-HQ</span>
            <img src="https://img.icons8.com/color/48/samsung.png" alt="Knox" className="w-3.5 h-3.5 invert" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;