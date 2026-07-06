import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { Shield, Fingerprint, Mail, Lock, User as UserIcon, Loader2, AlertCircle, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from './types';

interface AuthFormProps {
  onSuccess: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'RESET';

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'OFFICER' | 'ADMIN'>('OFFICER');
  const [unit, setUnit] = useState('01-KNOX');
  const [rank, setRank] = useState('OFFICER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  // Tactical Scroll Mechanism for Small/Iframe Viewports
  const formScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const checkScroll = () => {
    if (formScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = formScrollRef.current;
      setShowScrollUp(scrollTop > 2);
      setShowScrollDown(scrollTop + clientHeight < scrollHeight - 2);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(checkScroll, 100);
    return () => clearTimeout(timeout);
  }, [mode, password, confirmPassword, error, message]);

  useEffect(() => {
    const el = formScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      const observer = new ResizeObserver(checkScroll);
      observer.observe(el);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        observer.disconnect();
      };
    }
  }, [mode]);

  const handleScroll = (direction: 'up' | 'down') => {
    if (formScrollRef.current) {
      const scrollAmount = direction === 'up' ? -120 : 120;
      formScrollRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setMessage("Verification email dispatched successfully. Check your secure inbox.");
      setShowResend(false);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setShowResend(false);

    try {
      if (mode === 'LOGIN') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          setError("TACTICAL LOCK: Your email has not been verified. Check your inbox or click 'Resend Verification' below.");
          setShowResend(true);
          await signOut(auth);
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          onSuccess(userDoc.data() as User);
        } else {
          // Dynamic profile provisioning to resolve Firestore-Auth deadlock
          const emailPrefix = userCredential.user.email ? userCredential.user.email.split('@')[0] : 'agent';
          const defaultUserData: User & { email: string; createdAt: any; updatedAt: any } = {
            id: userCredential.user.uid,
            name: userCredential.user.displayName || emailPrefix.toUpperCase(),
            username: emailPrefix.toLowerCase(),
            role: 'OFFICER',
            unit: '01-KNOX',
            rank: 'OFFICER',
            email: userCredential.user.email || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          try {
            await setDoc(doc(db, 'users', userCredential.user.uid), defaultUserData);
            onSuccess(defaultUserData as User);
          } catch (createErr) {
            console.error("Failed to auto-provision user profile during login deadlock:", createErr);
            await signOut(auth);
            setError("UNREGISTERED AGENT: No profile found in the tactical registry and auto-provisioning failed due to database permission restrictions.");
            setLoading(false);
            return;
          }
        }
      } else if (mode === 'SIGNUP') {
        // Alphanumeric tactical registration ID check
        if (!username || username.trim() === '') {
          setError("TACTICAL REGISTRY VIOLATION: Registration ID / Badge is required to enroll a new agent.");
          setLoading(false);
          return;
        }
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
          setError("TACTICAL REGISTRY VIOLATION: Registration ID must be 3-20 characters and contain only alphanumeric characters, underscores, or hyphens.");
          setLoading(false);
          return;
        }

        // Password strength and secure cryptographic requirements check
        if (password.length < 8) {
          setError("SECURE PIN VIOLATION: Password is too short. Operational standards require at least 8 characters.");
          setLoading(false);
          return;
        }
        if (!/[0-9]/.test(password)) {
          setError("SECURE PIN VIOLATION: Password must contain at least one numeric digit (0-9).");
          setLoading(false);
          return;
        }
        if (!/[A-Z]/.test(password) && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          setError("SECURE PIN VIOLATION: Password must contain at least one uppercase letter or special character.");
          setLoading(false);
          return;
        }

        // Password matching validation
        if (password !== confirmPassword) {
          setError("PASSCODE CONFLICT: Secure passcode confirmation does not match the entered passcode. Re-enter credentials.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        const userData: User & { email: string; createdAt: any; updatedAt: any } = {
          id: userCredential.user.uid,
          name,
          username: username.toLowerCase().trim(),
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
        
        // Dispatch email verification upon registration
        await sendEmailVerification(userCredential.user);
        
        // Unauthenticate user immediately so they must verify
        await signOut(auth);

        setMessage("REGISTRATION OUTCOME: A priority verification link has been dispatched to your email. Check your inbox and click the link to authorize your agent account.");
        setMode('LOGIN');
      } else if (mode === 'RESET') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Reset link priority-dispatched to comms channel (email).');
        setMode('LOGIN');
      }
    } catch (err: any) {
      console.error("Auth process caught error:", err);
      let errMsg = 'Authentication override failed.';
      
      // Parse JSON stringified firestore error if applicable
      if (err instanceof Error && err.message.startsWith('{')) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error && (parsed.error.includes("permission") || parsed.error.includes("Permission") || parsed.error.includes("insufficient"))) {
            errMsg = "DATABASE AUTHORIZATION DENIED: Insufficient cryptographic or database clearance to register agent profile.";
          } else {
            errMsg = `DATABASE ERROR: ${parsed.error || 'Operation failed.'}`;
          }
        } catch (e) {
          errMsg = err.message;
        }
      } else if (err.code) {
        // Handle standard Firebase Auth and Firestore error codes
        switch (err.code) {
          case 'auth/weak-password':
            errMsg = "SECURE PASSCODE ERROR: The password is too weak. Operational security requires a stronger key.";
            break;
          case 'auth/email-already-in-use':
            errMsg = "COMMUNICATIONS ERROR: Email is already registered to an active tactical officer account.";
            break;
          case 'auth/invalid-email':
            errMsg = "COMMUNICATIONS ERROR: Invalid tactical email format.";
            break;
          case 'auth/operation-not-allowed':
            errMsg = "SYSTEM CONFIG ERROR: Email/password authentication is not enabled in this sector.";
            break;
          case 'auth/user-disabled':
            errMsg = "TACTICAL LOCK: This agent profile has been suspended or disabled by central administration.";
            break;
          case 'auth/user-not-found':
            errMsg = "AUTHENTICATION ERROR: Officer profile not found in active duty directory.";
            break;
          case 'auth/wrong-password':
            errMsg = "AUTHENTICATION ERROR: Invalid PIN/Password credentials. Access denied.";
            break;
          case 'auth/invalid-credential':
            errMsg = "AUTHENTICATION ERROR: Invalid credentials. Verify agent email and security passcode.";
            break;
          case 'auth/network-request-failed':
            errMsg = "SIGNAL TIMEOUT: Secure connection to sovereign server timed out. Check carrier network state.";
            break;
          case 'permission-denied':
            errMsg = "DATABASE PERMISSION DENIED: Your account does not have sufficient cryptographic clearance to access agent profiles. Please ensure your firestore.rules are deployed and you are registering with correct credentials.";
            break;
          case 'unavailable':
            errMsg = "DATABASE OFFLINE: The sovereign tactical database is currently unreachable. Check your network uplink or retry in a few moments.";
            break;
          case 'resource-exhausted':
            errMsg = "DATABASE LIMIT EXCEEDED: Datalink API quota or resource limits exceeded. Contact system administration.";
            break;
          default:
            errMsg = `SECURE GATEWAY ERROR [${err.code}]: ${err.message}`;
        }
      } else {
        errMsg = err.message || String(err);
      }
      
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm glass rounded-2xl p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden">
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

      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Scrollable Container for Input Fields */}
        <div 
          ref={formScrollRef}
          className="overflow-y-auto pr-1.5 space-y-4 max-h-[250px] sm:max-h-[300px] scroll-smooth pb-2 relative mb-3 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
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
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="REGISTRATION ID / BADGE NUMBER"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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

          {mode === 'SIGNUP' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="CONFIRM SECURE PASSCODE"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-colors text-white placeholder:text-slate-600 font-tech"
                required
              />
            </div>
          )}

          {mode === 'SIGNUP' && password && (
            <div className="p-3 bg-slate-950/80 border border-slate-800/60 rounded-lg space-y-2 text-[10px] font-mono animate-in fade-in slide-in-from-top-1">
              <div className="text-slate-400 uppercase tracking-widest text-[8px] border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center">
                <span>PASSCODE SECURITY METRICS</span>
                <span className={
                  (password.length >= 8 && /[0-9]/.test(password) && (/[A-Z]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)) && password === confirmPassword)
                    ? "text-emerald-400 font-bold"
                    : "text-amber-400 font-bold"
                }>
                  {(password.length >= 8 && /[0-9]/.test(password) && (/[A-Z]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)) && password === confirmPassword) ? "SECURE" : "PENDING"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                <span className={password.length >= 8 ? 'text-emerald-300' : 'text-slate-500'}>At least 8 characters ({password.length}/8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                <span className={/[0-9]/.test(password) ? 'text-emerald-300' : 'text-slate-500'}>Contains numeric digit (0-9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${(/[A-Z]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                <span className={(/[A-Z]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)) ? 'text-emerald-300' : 'text-slate-500'}>Contains uppercase or special char</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${(confirmPassword && password === confirmPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                <span className={(confirmPassword && password === confirmPassword) ? 'text-emerald-300' : 'text-slate-500'}>Passcodes match verification</span>
              </div>
            </div>
          )}
        </div>

        {/* Scroll Navigation Overlay - Prompts and provides tactile scrolling buttons */}
        {(showScrollUp || showScrollDown) && (
          <div className="flex justify-between items-center bg-blue-950/20 border border-blue-500/20 rounded-lg p-1.5 px-3 mb-3 text-[10px] font-mono tracking-wider text-slate-400 animate-in fade-in duration-200">
            <span className="animate-pulse flex items-center gap-1.5 text-blue-400 uppercase text-[9px] font-tech">
              <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping"></span> More Fields Below
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll('up')}
                disabled={!showScrollUp}
                className={`p-1 rounded border transition-all ${
                  showScrollUp 
                    ? 'bg-blue-950/60 hover:bg-blue-900/50 border-blue-500/40 text-blue-400 cursor-pointer active:scale-95' 
                    : 'bg-slate-950/20 border-slate-800/40 text-slate-600 cursor-not-allowed'
                }`}
                title="Scroll Up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('down')}
                disabled={!showScrollDown}
                className={`p-1 rounded border transition-all ${
                  showScrollDown 
                    ? 'bg-blue-950/60 hover:bg-blue-900/50 border-blue-500/40 text-blue-400 cursor-pointer active:scale-95' 
                    : 'bg-slate-950/20 border-slate-800/40 text-slate-600 cursor-not-allowed'
                }`}
                title="Scroll Down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 py-3 rounded-lg font-bold text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-4 group disabled:opacity-50"
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

        {showResend && mode === 'LOGIN' && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={loading}
            className="w-full bg-cyan-600/10 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-400 py-2 rounded-lg font-bold text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>RESEND VERIFICATION EMAIL</span>
          </button>
        )}


      </form>

      <div className="mt-6 flex flex-row items-center justify-between gap-4 border-t border-slate-800/60 pt-4">
        {mode === 'LOGIN' ? (
          <>
            <button 
              onClick={() => {
                setMode('SIGNUP');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setUsername('');
                setUnit('');
                setRank('');
                setError(null);
                setMessage(null);
              }}
              className="text-[9px] text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-1.5 whitespace-nowrap font-tech border border-transparent hover:border-blue-500/20 px-2 py-1 rounded"
            >
              <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" /> Register
            </button>
            <button 
              onClick={() => {
                setMode('RESET');
                setEmail('');
                setPassword('');
                setError(null);
                setMessage(null);
              }}
              className="text-[9px] text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-[0.2em] whitespace-nowrap font-tech border border-transparent hover:border-slate-500/20 px-2 py-1 rounded"
            >
              Reset Comms
            </button>
          </>
        ) : (
          <button 
            onClick={() => {
              setMode('LOGIN');
              setEmail('');
              setPassword('');
              setError(null);
              setMessage(null);
            }}
            className="text-[9px] text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 font-tech px-2 py-1 border border-transparent hover:border-blue-500/20 rounded"
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
  );
};

export default AuthForm;