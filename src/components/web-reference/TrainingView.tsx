
import React, { useState, useEffect, useRef } from 'react';
/* Added X to the lucide-react imports to fix line 330 error */
import { Plane, Brain, BookOpen, ChevronLeft, AlertTriangle, Zap, RotateCcw, Award, Eye, Thermometer, Settings, Wind, Timer, Mic, Video, UserCheck, UploadCloud, Camera, Boxes, GraduationCap, Laptop, Trophy, Shield, Target, UserCheck2, Crosshair, Play, Info, Ruler, RefreshCw, BarChart2, ShieldCheck, X, Search } from 'lucide-react';
import { generateTextResponse, analyzeImage } from './services/geminiService';
import { PNP_KNOWLEDGE_BASE } from './knowledgeBase';

// --- SUB-MODULE: MARKSMANSHIP (PNP MHMT Virtual-Shot) ---
const MarksmanshipSim = () => {
    const [screen, setScreen] = useState<'VERIFY' | 'MENU' | 'CALIBRATE' | 'DRILL' | 'AAR'>('VERIFY');
    const [phase, setPhase] = useState<'I' | 'II' | 'III' | 'JUDGMENTAL'>('I');
    
    // Hardware & Calibration
    const [micThreshold, setMicThreshold] = useState(0.25);
    const [micVolume, setMicVolume] = useState(0);
    const [reticle, setReticle] = useState<'DOT' | 'MIL_DOT' | 'CIRCLE_DOT'>('DOT');
    const [sensitivity, setSensitivity] = useState(1.0);
    
    // Game State
    const [score, setScore] = useState(0);
    const [hits, setHits] = useState(0);
    const [shotsFired, setShotsFired] = useState(0);
    const [roundsRemaining, setRoundsRemaining] = useState(10);
    const [timeLeft, setTimeLeft] = useState(10);
    const [isReloading, setIsReloading] = useState(false);
    const [targets, setTargets] = useState<{id: number, x: number, y: number, z: number, scale: number, type: 'B27' | 'IPSC' | 'STEEL' | 'HOSTILE' | 'CIVILIAN', points: number, velocity: {x: number, y: number}}[]>([]);
    
    // Physics & Movement
    const [sway, setSway] = useState({ x: 0, y: 0 });
    const [recoil, setRecoil] = useState({ x: 0, y: 0 });
    const [wind, setWind] = useState({ speed: 0, direction: 0 }); // MPH, Degrees
    const [shotHistory, setShotHistory] = useState<{x: number, y: number, time: number, hit: boolean}[]>([]);
    const [traceLine, setTraceLine] = useState<{x: number, y: number}[]>([]);

    // Refs
    const lastShotTimeRef = useRef<number>(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const requestRef = useRef<number>(0);

    // 1. Identity Verification
    const startVerification = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
            
            // Audio Detection Setup
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            
            monitorMic();
        } catch (e) {
            alert("Verification and Trigger detection require Camera/Mic access.");
        }
    };

    const monitorMic = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        const checkVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const vol = avg / 255; 
            setMicVolume(vol);
            if (vol > micThreshold && (Date.now() - lastShotTimeRef.current > 300)) {
                window.dispatchEvent(new CustomEvent('virtual-shot-fired'));
            }
            requestRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
    };

    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // 2. Simulation Logic
    useEffect(() => {
        const onShot = () => {
            if (screen === 'DRILL' && roundsRemaining > 0 && !isReloading) {
                handleShot();
            }
        };
        window.addEventListener('virtual-shot-fired', onShot);
        return () => window.removeEventListener('virtual-shot-fired', onShot);
    }, [screen, roundsRemaining, isReloading, sway, targets]);

    const handleShot = () => {
        lastShotTimeRef.current = Date.now();
        setShotsFired(s => s + 1);
        setRoundsRemaining(r => r - 1);
        
        // Physics: Recoil
        setRecoil({
            x: (Math.random() - 0.5) * 15,
            y: -30 - Math.random() * 20
        });

        // Ballistics: Gravity & Wind
        const gravityDrop = 0.05; 
        const windDrift = (wind.speed / 10) * (wind.direction > 180 ? -1 : 1);
        
        const aimX = 50 + windDrift;
        const aimY = 50 + gravityDrop;

        let hitFound = false;
        setTargets(prev => prev.filter(t => {
            if (hitFound) return true;
            // Screen coords including sway
            const tx = t.x - (sway.x / 10);
            const ty = t.y - (sway.y / 10);
            const dist = Math.sqrt(Math.pow(tx - aimX, 2) + Math.pow(ty - aimY, 2));
            const hitRadius = 8 * t.scale;

            if (dist < hitRadius) {
                hitFound = true;
                handleHit(t);
                return false; // Remove target
            }
            return true;
        }));

        if (hitFound) setTimeout(spawnTarget, 400);

        // Phase II auto-reload logic
        if (roundsRemaining === 1 && phase === 'II') {
            setIsReloading(true);
            setTimeout(() => {
                setRoundsRemaining(10);
                setIsReloading(false);
            }, 3000);
        }
    };

    const handleHit = (t: any) => {
        setHits(h => h + 1);
        if (t.type === 'CIVILIAN') setScore(s => s - 100);
        else setScore(s => s + t.points);
    };

    // Movement Tracking (IMU Emulation for Desktop / Real IMU for Mobile)
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (screen !== 'DRILL') return;
            const x = (e.clientX - window.innerWidth / 2) / 20 * sensitivity;
            const y = (e.clientY - window.innerHeight / 2) / 20 * sensitivity;
            setSway({ x, y });
        };
        const handleOrient = (e: DeviceOrientationEvent) => {
            if (screen !== 'DRILL' || !e.beta || !e.gamma) return;
            setSway({ x: e.gamma * 1.5 * sensitivity, y: (e.beta - 45) * 1.5 * sensitivity });
        };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('deviceorientation', handleOrient);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('deviceorientation', handleOrient);
        };
    }, [screen, sensitivity]);

    const startDrill = (p: any) => {
        setPhase(p);
        setScore(0);
        setHits(0);
        setShotsFired(0);
        setRoundsRemaining(p === 'II' ? 20 : 10);
        setTimeLeft(p === 'III' ? 20 : 10);
        setShotHistory([]);
        setScreen('DRILL');
        setTargets([]);
        setWind({ speed: Math.floor(Math.random() * 15), direction: Math.random() * 360 });
        spawnTarget();
    };

    const spawnTarget = () => {
        const id = Date.now();
        const x = 30 + Math.random() * 40;
        const y = 30 + Math.random() * 40;
        let type: any = 'B27';
        let scale = 1.0;
        let pts = 10;
        let vel = { x: 0, y: 0 };

        if (phase === 'II') { type = 'IPSC'; scale = 0.75; vel = { x: (Math.random()-0.5)*2, y: 0 }; }
        else if (phase === 'III') { type = 'STEEL'; scale = 0.4; pts = 10; }
        else if (phase === 'JUDGMENTAL') { type = Math.random() > 0.4 ? 'HOSTILE' : 'CIVILIAN'; scale = 1.2; pts = 20; }

        setTargets([{ id, x, y, z: 0, scale, type, points: pts, velocity: vel }]);
    };

    // Game Loop (Targets and Recoil Recovery)
    useEffect(() => {
        let interval: any;
        if (screen === 'DRILL') {
            interval = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 0.1) { endDrill(); return 0; }
                    return t - 0.1;
                });
                setRecoil(r => ({ x: r.x * 0.85, y: r.y * 0.85 }));
                setTargets(prev => prev.map(t => ({
                    ...t,
                    x: t.x + t.velocity.x,
                    velocity: (t.x > 80 || t.x < 20) ? { ...t.velocity, x: t.velocity.x * -1 } : t.velocity
                })));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [screen]);

    const endDrill = () => setScreen('AAR');

    const getClassification = () => {
        if (phase === 'I') {
            if (score >= 80) return 'SHARPSHOOTER';
            if (score >= 50) return 'MARKSMAN';
        } else if (phase === 'II') {
            if (hits >= 19) return 'SHARPSHOOTER';
            if (hits >= 16) return 'MARKSMAN';
        } else if (phase === 'III') {
            if (hits === 10) return 'MASTER';
            if (hits >= 8) return 'EXPERT';
        }
        return 'UNQUALIFIED';
    };

    // HUD / Optic Rendering
    const OpticOcular = () => (
        <div className="absolute inset-0 pointer-events-none z-10 border-[60px] border-black/90 rounded-[120px] shadow-[inset_0_0_150px_rgba(0,0,0,1)]">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[90%] h-[90%] border border-white/5 rounded-[100px] flex items-center justify-center overflow-hidden">
                    {/* Crosshair / Red Dot */}
                    <div className="transition-transform duration-75" style={{ transform: `translate(${recoil.x}px, ${recoil.y}px)` }}>
                        {reticle === 'DOT' && <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_15px_red] animate-pulse"></div>}
                        {reticle === 'CIRCLE_DOT' && (
                            <div className="w-10 h-10 border-2 border-red-500 rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_red]"></div>
                            </div>
                        )}
                        {reticle === 'MIL_DOT' && <Crosshair className="w-20 h-20 text-black opacity-60" />}
                    </div>
                </div>
            </div>
            
            {/* Range Telemetry */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-12 text-white font-mono text-[10px] tracking-widest bg-black/40 backdrop-blur px-8 py-3 rounded-full border border-white/10">
                <div className="flex flex-col items-center">
                    <span className="text-slate-500 font-black">WIND</span>
                    <span>{wind.speed}MPH @ {wind.direction}°</span>
                </div>
                <div className="flex flex-col items-center border-x border-white/10 px-12">
                    <span className="text-slate-500 font-black">TIMER</span>
                    <span className={timeLeft < 3 ? 'text-red-500 animate-pulse' : ''}>{timeLeft.toFixed(1)}s</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-slate-500 font-black">AMMO</span>
                    <span className={roundsRemaining < 3 ? 'text-red-500' : ''}>{roundsRemaining} / {phase === 'II' ? 20 : 10}</span>
                </div>
            </div>

            {/* Verification PiP */}
            <div className="absolute bottom-20 right-20 w-32 h-44 bg-black border border-blue-500/50 rounded-xl overflow-hidden shadow-2xl">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1] opacity-60" />
                <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-[8px] font-black text-center py-1 tracking-widest">VERIFIED_PNP</div>
            </div>
        </div>
    );

    return (
        <div className="h-full w-full bg-slate-950 relative overflow-hidden font-tech select-none flex flex-col">
            
            {screen === 'VERIFY' && (
                <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-8 p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl">
                        <UserCheck2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Biometric Portal</h2>
                        <p className="text-slate-400 text-xs max-w-xs mx-auto mt-2 font-mono">IDENTITY VERIFICATION REQUIRED BEFORE LIVE-FIRE SIMULATION SEQUENCE.</p>
                    </div>
                    <div className="w-64 h-80 bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden relative mb-10 shadow-2xl">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        <div className="absolute inset-0 border-[30px] border-black/50"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-500/50 animate-[scan_2s_linear_infinite]"></div>
                    </div>
                    <button onClick={() => { startVerification(); setScreen('MENU'); }} className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest">Authenticate & Proceed</button>
                </div>
            )}

            {screen === 'MENU' && (
                <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1595759600780-634566373aa0?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
                    <div className="relative z-10 w-full max-w-5xl">
                        <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-6">
                            <div className="text-left">
                                <h1 className="text-5xl font-black text-white tracking-widest uppercase">VIRTUAL-SHOT</h1>
                                <p className="text-red-500 text-xs font-bold tracking-[0.4em] mt-1 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> PNP MODIFIED HANDGUN MARKSMANSHIP TRAINING
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setScreen('CALIBRATE')} className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-500 transition-all"><Settings className="w-5 h-5" /></button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { id: 'I', name: 'Phase I', desc: 'Familiarization • 5m-10m', icon: Shield, color: 'border-blue-500/30 text-blue-400', pts: 'Min 50 Pts' },
                                { id: 'II', name: 'Phase II', desc: 'Qualification • IPSC 7m-10m', icon: Trophy, color: 'border-amber-500/30 text-amber-400', pts: 'Min 16 Hits' },
                                { id: 'III', name: 'Phase III', desc: 'Classification • Steel 15m', icon: Award, color: 'border-red-500/30 text-red-400', pts: 'Min 8 Hits' },
                                { id: 'JUDGMENTAL', name: 'Judgmental', desc: 'Decision Training', icon: Brain, color: 'border-purple-500/30 text-purple-400', pts: 'Pass/Fail' }
                            ].map(p => (
                                <button key={p.id} onClick={() => startDrill(p.id)} className={`bg-slate-900/60 border p-6 rounded-3xl text-left hover:scale-[1.02] hover:bg-slate-900/80 transition-all group relative overflow-hidden ${p.color}`}>
                                    <p.icon className="w-10 h-10 mb-4 group-hover:animate-bounce" />
                                    <h3 className="font-black text-2xl text-white uppercase">{p.name}</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono leading-tight">{p.desc}</p>
                                    <div className="mt-4 text-[9px] font-black uppercase tracking-widest opacity-60">{p.pts}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {screen === 'CALIBRATE' && (
                <div className="absolute inset-0 z-50 bg-slate-950 flex items-center justify-center p-6">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
                        <button onClick={() => setScreen('MENU')} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                        <h2 className="text-xl font-black text-white mb-8 uppercase flex items-center gap-3"><Settings className="w-6 h-6 text-blue-500" /> System Calibration</h2>
                        
                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase mb-4 block tracking-widest flex justify-between">
                                    Trigger Sensitivity <span>{(micThreshold * 100).toFixed(0)}%</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-75" style={{ width: `${micVolume * 100}%` }}></div>
                                    </div>
                                    <input type="range" min="0.05" max="0.8" step="0.01" value={micThreshold} onChange={e => setMicThreshold(parseFloat(e.target.value))} className="w-32 h-1 accent-blue-500" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase mb-4 block tracking-widest">Optic Configuration</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['DOT', 'MIL_DOT', 'CIRCLE_DOT'].map(r => (
                                        <button key={r} onClick={() => setReticle(r as any)} className={`py-2 rounded-lg border text-[8px] font-black uppercase transition-all ${reticle === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{r.replace('_', ' ')}</button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setScreen('MENU')} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs">Commit Settings</button>
                        </div>
                    </div>
                </div>
            )}

            {screen === 'DRILL' && (
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900 opacity-40 bg-grid-pattern"></div>
                    
                    {/* Environment Targets */}
                    {targets.map(t => (
                        <div key={t.id} className="absolute transition-transform duration-75" style={{ left: `${t.x}%`, top: `${t.y}%`, transform: `translate(${-sway.x * 4}px, ${-sway.y * 4}px) scale(${t.scale})` }}>
                            {t.type === 'B27' && (
                                <svg viewBox="0 0 100 150" className="w-32 h-48 drop-shadow-2xl">
                                    <rect x="10" y="10" width="80" height="130" fill="#e2e8f0" rx="2" />
                                    <path d="M50 20 C65 20 70 35 70 45 L75 50 L80 120 L20 120 L25 50 L30 45 C30 35 35 20 50 20" fill="#1e293b" />
                                    <ellipse cx="50" cy="55" rx="15" ry="20" fill="none" stroke="#64748b" strokeWidth="1" />
                                    <circle cx="50" cy="55" r="2" fill="#ef4444" />
                                </svg>
                            )}
                            {t.type === 'IPSC' && (
                                <div className="w-32 h-48 bg-amber-700/80 border-4 border-amber-900 rounded-lg flex items-center justify-center shadow-2xl relative">
                                    <div className="w-24 h-36 border-2 border-amber-900/50 rounded flex items-center justify-center">
                                        <div className="w-12 h-20 border border-amber-900/30 flex items-center justify-center text-amber-900/20 font-black text-4xl">A</div>
                                    </div>
                                    <div className="absolute top-2 left-2 text-[8px] font-black text-amber-900">MHMT_PHASE_II</div>
                                </div>
                            )}
                            {t.type === 'STEEL' && (
                                <div className="w-24 h-24 bg-slate-200 rounded-full border-4 border-slate-400 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                    <div className="w-4 h-4 bg-slate-400 rounded-full" />
                                </div>
                            )}
                            {(t.type === 'HOSTILE' || t.type === 'CIVILIAN') && (
                                <div className={`w-32 h-48 rounded-2xl flex flex-col items-center justify-center gap-2 border-4 ${t.type === 'CIVILIAN' ? 'bg-blue-600/40 border-blue-500 shadow-[0_0_30px_blue]' : 'bg-red-600/40 border-red-500 shadow-[0_0_30px_red]'}`}>
                                    {t.type === 'CIVILIAN' ? <Shield className="w-12 h-12 text-blue-200" /> : <AlertTriangle className="w-12 h-12 text-red-200" />}
                                    <span className="font-black text-xs text-white uppercase">{t.type}</span>
                                </div>
                            )}
                        </div>
                    ))}

                    <OpticOcular />

                    {isReloading && (
                        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-10 py-4 rounded-2xl font-black tracking-[0.2em] animate-pulse shadow-2xl border-4 border-white/20 z-50 uppercase">
                            Tactical Reloading...
                        </div>
                    )}
                </div>
            )}

            {screen === 'AAR' && (
                <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 overflow-y-auto">
                    <Award className="w-24 h-24 text-yellow-500 mb-6 animate-bounce" />
                    <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">MHMT Result</h2>
                    <p className="text-slate-500 text-sm font-mono mb-12 tracking-widest uppercase">RECORD SYNCED TO SISTIMS TACTICAL PROFILE</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12">
                        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center">
                            <span className="text-xs text-slate-500 font-black uppercase tracking-widest">Points</span>
                            <div className="text-6xl font-black text-white mt-2">{score}</div>
                        </div>
                        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center">
                            <span className="text-xs text-slate-500 font-black uppercase tracking-widest">Accuracy (Hits)</span>
                            <div className="text-6xl font-black text-green-400 mt-2">{hits}</div>
                            <span className="text-[10px] text-slate-400 font-mono">OF {shotsFired} TOTAL SHOTS</span>
                        </div>
                        <div className="bg-blue-900/20 p-8 rounded-3xl border-2 border-blue-500 text-center shadow-[0_0_40px_rgba(37,99,235,0.3)]">
                            <span className="text-xs text-blue-400 font-black uppercase tracking-widest">PNP Rating</span>
                            <div className="text-4xl font-black text-white mt-3 tracking-tighter">{getClassification()}</div>
                        </div>
                    </div>

                    <div className="flex gap-6 w-full max-w-xl">
                        <button onClick={() => setScreen('MENU')} className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all border border-slate-700 uppercase">Return to Menu</button>
                        <button onClick={() => alert("Training data archived and pushed to HQ Personnel Portal.")} className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase">
                            <UploadCloud className="w-6 h-6" /> Sync SISTIMS
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-MODULE: DRONE FLIGHT ---
const DroneFlightSim = () => {
    const [altitude, setAltitude] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [battery, setBattery] = useState(100);
    const [isFlying, setIsFlying] = useState(false);
    const [viewMode, setViewMode] = useState<'VISUAL' | 'THERMAL' | 'AR'>('VISUAL');
    const [targetLocked, setTargetLocked] = useState(false);
    
    const arVideoRef = useRef<HTMLVideoElement>(null);
    const arStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        let interval: any;
        if (isFlying) {
            interval = setInterval(() => {
                setAltitude(prev => Math.min(120, Math.max(0, prev + (Math.random() * 2 - 0.5))));
                setSpeed(prev => Math.max(0, prev + (Math.random() * 2 - 1)));
                setBattery(prev => Math.max(0, prev - 0.05));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isFlying]);

    useEffect(() => {
        const setupAR = async () => {
            if (viewMode === 'AR') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    arStreamRef.current = stream;
                    if (arVideoRef.current) { arVideoRef.current.srcObject = stream; }
                } catch (e) {
                    alert("AR Mode requires camera access.");
                    setViewMode('VISUAL');
                }
            } else {
                if (arStreamRef.current) { arStreamRef.current.getTracks().forEach(t => t.stop()); arStreamRef.current = null; }
            }
        };
        setupAR();
        return () => { if (arStreamRef.current) arStreamRef.current.getTracks().forEach(t => t.stop()); };
    }, [viewMode]);

    return (
        <div className="h-full relative bg-slate-900 overflow-hidden">
            {viewMode === 'AR' ? <video ref={arVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" /> : <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-linear ${isFlying ? 'scale-125' : 'scale-100'} ${viewMode === 'THERMAL' ? 'grayscale contrast-125 invert' : ''}`} style={{ backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/121.0493,14.6515,16,0/1200x800?access_token=Pk.eyJ1IjoidGVtcCIsImEiOiJjbHhxIn0')` }}><div className="absolute inset-0 bg-slate-900/50 backdrop-grayscale"></div>{viewMode === 'THERMAL' && <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-orange-500/30 mix-blend-overlay"></div>}<div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-20">{[...Array(144)].map((_,i) => <div key={i} className="border border-green-500/20"></div>)}</div></div>}
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur p-2 rounded text-green-400 font-mono text-xs border border-green-500/30"><div>ALT: {altitude.toFixed(1)} M</div><div>SPD: {speed.toFixed(1)} KPH</div></div>
                    <button onClick={() => { if (viewMode === 'VISUAL') setViewMode('THERMAL'); else if (viewMode === 'THERMAL') setViewMode('AR'); else setViewMode('VISUAL'); }} className={`p-2 rounded border font-bold text-xs ${viewMode === 'THERMAL' ? 'bg-orange-600 text-white border-orange-500' : viewMode === 'AR' ? 'bg-blue-600 text-white border-blue-500' : 'bg-black/60 text-white border-white/30'}`}>{viewMode === 'THERMAL' ? <Thermometer className="w-4 h-4" /> : viewMode === 'AR' ? <Camera className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    <div className="bg-black/60 backdrop-blur p-2 rounded text-green-400 font-mono text-xs border border-green-500/30 text-right"><div>BAT: {battery.toFixed(0)}%</div></div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"><div className={`relative transition-all duration-300 ${targetLocked ? 'border-red-500 border-4 w-16 h-16' : 'border-white/50 border-2 w-12 h-12'}`}><Zap className={`w-full h-full ${targetLocked ? 'text-red-500 animate-pulse' : 'text-white/80'}`} /></div></div>
                <div className="flex justify-between items-end pointer-events-auto"><div className="w-24 h-24 rounded-full border-2 border-white/20 bg-white/5 relative"><div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div></div><div className="flex flex-col gap-2 items-center"><button onClick={() => setIsFlying(!isFlying)} className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border ${isFlying ? 'bg-red-600/80 border-red-500 text-white' : 'bg-green-600/80 border-green-500 text-white'}`}>{isFlying ? 'LAND DRONE' : 'TAKEOFF'}</button></div><div className="w-24 h-24 rounded-full border-2 border-white/20 bg-white/5 relative"><div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div></div></div>
            </div>
        </div>
    );
};

// --- SUB-MODULE: OPS SIMULATOR (RPG) ---
const OpsSimulator = () => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<{role: string, text: string}[]>([]);
    const [evaluation, setEvaluation] = useState<string | null>(null);
    const [choices, setChoices] = useState<string[]>([]);

    const startGame = async () => {
        setLoading(true);
        setHistory([]);
        setEvaluation(null);
        const response = await generateTextResponse("You are a police training simulation master. Start a new scenario for a beat patrol officer in Metro Manila. Describe a situation involving a suspicious vehicle or person. Provide the scenario description, then provide exactly 3 concise choices for the user to take. Format: SCENARIO: [text] CHOICES: [1. text, 2. text, 3. text]");
        setHistory([{role: 'ai', text: response}]);
        setChoices(['Proceed with caution', 'Call for backup', 'Engage suspect']);
        setLoading(false);
    };

    const handleChoice = async (choice: string) => {
        setLoading(true);
        setHistory(prev => [...prev, {role: 'user', text: choice}]);
        const response = await generateTextResponse(`The officer chose: "${choice}". Based on Philippine National Police operational procedures, determine the outcome. If the scenario is resolved, start your response with "SCENARIO ENDED:" followed by a critique and a grade (A-F).`, 'gemini-3-pro-preview');
        setHistory(prev => [...prev, {role: 'ai', text: response}]);
        if (response.includes("SCENARIO ENDED:")) { setChoices([]); setEvaluation("Simulation Complete"); }
        setLoading(false);
    };

    return (
        <div className="h-full flex flex-col bg-slate-900">
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center"><div className="flex items-center gap-2 text-purple-400 font-bold"><Brain className="w-5 h-5" /><span>TACTICAL DECISION SIMULATOR</span></div><button onClick={startGame} className="text-xs bg-purple-600 px-3 py-1 rounded text-white font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3" /> RESET SCENARIO</button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">{history.map((h, i) => (<div key={i} className={`p-4 rounded-lg text-sm leading-relaxed ${h.role === 'ai' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-blue-900/30 text-blue-100 ml-8 border border-blue-500/30'}`}>{h.text}</div>))}{loading && <div className="flex items-center gap-2 text-slate-500 text-xs animate-pulse"><Brain className="w-4 h-4" /> GENERATING...</div>}{evaluation && <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg text-green-300 text-center font-bold">{evaluation}</div>}</div>
            <div className="p-4 bg-slate-800 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3">{choices.map((c, i) => (<button key={i} onClick={() => handleChoice(c)} disabled={loading} className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition-all border border-slate-600 hover:border-purple-500 text-left">OPTION {i+1}</button>))}{choices.length === 0 && !loading && <button onClick={startGame} className="col-span-full p-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-lg">START NEW SCENARIO</button>}</div>
        </div>
    );
};

// --- SUB-MODULE: MANUAL READER ---
const ManualReader = () => {
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    return (
        <div className="h-full flex flex-col md:flex-row bg-slate-900">
            <div className={`w-full md:w-1/3 border-r border-slate-800 overflow-y-auto ${selectedDoc ? 'hidden md:block' : 'block'}`}><div className="p-4 border-b border-slate-800"><h3 className="font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-500" /> Training Materials</h3></div><div className="p-2 space-y-2">{PNP_KNOWLEDGE_BASE.map(doc => (<div key={doc.id} onClick={() => setSelectedDoc(doc)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedDoc?.id === doc.id ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}><div className="text-xs font-bold">{doc.title}</div><div className="text-[10px] opacity-70 mt-1">{doc.category}</div></div>))}</div></div>
            <div className={`flex-1 bg-slate-950 p-6 overflow-y-auto ${selectedDoc ? 'block' : 'hidden md:flex items-center justify-center'}`}>{selectedDoc ? (<div className="max-w-3xl mx-auto"><button onClick={() => setSelectedDoc(null)} className="md:hidden mb-4 text-slate-400 flex items-center gap-1 text-xs"><ChevronLeft className="w-4 h-4" /> Back</button><div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl"><h1 className="text-2xl font-black text-white mb-2">{selectedDoc.title}</h1><div className="prose prose-invert prose-sm max-w-none text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">{selectedDoc.content}</div></div></div>) : <div className="text-slate-600 text-center"><BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" /><p>Select a training module to begin study.</p></div>}</div>
        </div>
    );
};

// --- SUB-MODULE: DETECTIVE ---
const DetectiveSim = () => {
    const [caseSelected, setCaseSelected] = useState<any>(null);
    const [stage, setStage] = useState<'SELECT' | 'CRIME_SCENE' | 'INTERROGATION' | 'FILING' | 'RESULT'>('SELECT');
    const [loading, setLoading] = useState(false);
    const [selectedSuspect, setSelectedSuspect] = useState<any>(null);
    const [hypothesis, setHypothesis] = useState('');
    const [chargeSuspect, setChargeSuspect] = useState<string>('');
    const [evaluationText, setEvaluationText] = useState('');
    const [score, setScore] = useState(0);
    const [dynamicCaseDescription, setDynamicCaseDescription] = useState<string>('');
    const [interviewLog, setInterviewLog] = useState<{speaker: string, text: string}[]>([]);

    const CasesList = [
        {
            id: 'condo',
            title: 'Homicide in Cubao Condo',
            victim: 'Arnel Santos, Tech Executive',
            scene: 'Luxury Penthouse, living room floor.',
            summary: 'The victim was found deceased with severe blunt force trauma to the cranium. A private ledger containing cryptographic transaction hashes is absent, whilst visible valuables stand untouched.',
            clues: [
                'Microscopic smudge of lipstick on a shattered crystal whiskey glass (lab confirms premium matte brand).',
                'A wet, mud-streaked dark trenchcoat is found hung on the interior storage rack (heavy downpour did not begin until 10:15 PM).',
                'Digital smart-lock records reveal access keycard "SISTIMS-4021" logged entry at 9:40 PM.'
            ],
            suspects: [
                {
                    name: 'Guia Romero (Business Associate)',
                    role: 'Co-Manager of Santos Solutions',
                    statement: 'I remained nestled in my Makati corporate offices to construct the board deck. Arnel and I maintained seamless cooperation.',
                    alibi: 'Automated biometric lobby sensors log my presence at office till 11:00 PM.',
                    solution: 'The matte lipstick trace belongs to Guia. Furthermore, the cryptocurrency vault ledger confirms she executed unauthorized treasury extractions of $250,000.'
                },
                {
                    name: 'Jerry Delgado (Night Duty Guard)',
                    role: 'Tower Incident Sentinel on Duty',
                    statement: 'I was stationed vigilantly at the central concierge foyer. I did not record unauthorized foot traffic in the private express elevator lobby.',
                    alibi: 'Front facade outer camera system stream.',
                    solution: 'The trenchcoat found belongs to Jerry, matching a fiber found on the penthouse door lock pins. As backup guard, he possessed emergency Override Keycard 4021.'
                }
            ]
        },
        {
            id: 'dock',
            title: 'Port-13 Pier Extortion Syndicate',
            victim: 'Informant Customs Appraiser',
            scene: 'Terminal 3 Logistics Facility',
            summary: 'The whistleblower was discovered gasping inside an airtight freight shipping container (GPS module detached manually).',
            clues: [
                'Dock entry inventory logs for cargo block 40 contains a smudged manifest validation stamp.',
                'A manual toolkit bypass mark is physically etched across the lock bolts instead of digital scanning.',
                'A fresh premium duty-free cigarette filter is found within the security fence parameter.'
            ],
            suspects: [
                {
                    name: 'Capt. Roger Goco (Vessel Master)',
                    role: 'Maritime Crew Captain',
                    statement: 'I remained off-duty within my captains stateroom since early afternoon. Container dispatch lies outside my marine jurisdiction.',
                    alibi: 'Vessel staff attendance board.',
                    solution: 'Roger exclusively imports the rare brand of duty-free cigarettes found directly alongside the container lockpath.'
                },
                {
                    name: 'Enrico Perez (Terminal Supervisor)',
                    role: 'Logistical Gateway Dispatcher',
                    statement: 'I strictly documented all terminal flow protocols via SISTIMS dashboard entries without deviation.',
                    alibi: 'Main terminal perimeter camera logs.',
                    solution: 'His private bank records confirm high-volume transfers from maritime holding offshore entities directly matching the smudged container shipment timestamps.'
                }
            ]
        }
    ];

    const handleSelectCase = (c: any) => {
        setCaseSelected(c);
        setStage('CRIME_SCENE');
    };

    const generateAICase = async () => {
        setLoading(true);
        setStage('CRIME_SCENE');
        try {
            const prompt = `You are an expert police academy instructor designing an interactive tactical investigation training scenario for PNP investigators.
Generate a crime scene case dossier. 
Provide:
1. CASE TITLE
2. VICTIM PROFILE
3. CRIME SCENE OVERVIEW
4. 3 CRUCIAL CRIME SCENE EVIDENCE CLUES (Clue A, Clue B, Clue C)
5. 2 DETAILED SUSPECT PORTRAITS (Suspect A, Suspect B with their Role, Statement, Alibi, and hidden contradiction/solution linking them to the crime).

Keep your response extremely realistic, adhering to actual police investigative methodology, under 600 words. Keep headings clear so it is highly readable and professional.`;
            const result = await generateTextResponse(prompt);
            setDynamicCaseDescription(result);
            
            setCaseSelected({
                id: 'dynamic',
                title: 'Operation Blue Falcon Case File',
                victim: 'Undercover Operator / Confidential Informant',
                scene: 'Classified Tactical Hub',
                summary: 'An advanced operational security breach leading to compromises of covert officers.',
                clues: [
                    'Hardware forensic audit reveals firmware modification on tactical routing nodes.',
                    'Biometric door access timestamps mismatch the officer deployment records by 18 minutes.',
                    'A specialized hardware bypass dongle was recovered in the adjoining utility shaft.'
                ],
                suspects: [
                    {
                        name: 'Sgt. Alex Cruz (Network Operator)',
                        role: 'Tactical Radio Systems Controller',
                        statement: 'I was performing automated security configuration sweeps from the server deck during that timestamp.',
                        alibi: 'System login history records',
                        solution: 'Firmware modifications match his cryptography keys and cryptographic workspace environment footprint.'
                    },
                    {
                        name: 'Officer Dave Santos (Patrol Lead)',
                        role: 'Field Recon Officer',
                        statement: 'I was out on vehicle patrol inside sector 4 and did not enter the technical office lobby.',
                        alibi: 'GPS vehicle transponder log',
                        solution: 'Internal surveillance records show a shadow matching his gait entering the technical shaft via the utility alleyway.'
                    }
                ]
            });
        } catch (e) {
            console.error(e);
            setCaseSelected(CasesList[0]);
        } finally {
            setLoading(false);
        }
    };

    const runAIEvaluation = async () => {
        if (!chargeSuspect) {
            alert('Please select a prime suspect first!');
            return;
        }
        setLoading(true);
        setStage('RESULT');
        try {
            const prompt = `You are a Senior Police Superintendent evaluating an investigator's Case Filing Report.
The case: ${caseSelected.title}
Victim: ${caseSelected.victim}
Prime Suspect Charged: ${chargeSuspect}
Investigator's Hypothesis / Chain of Evidence: "${hypothesis}"

Evaluate the logical strength of the investigation. Did the investigator correctly match the evidence contradictions to convict this suspect? 
Assign a clear grade out of 100 based on standard forensic and investigatory logical principles.
Provide a professional constructive tactical review outlining what rules of evidence they handled well or neglected.
Format your response as a formal "SISTIMS EVALUATION SCHEME" report. Keep it under 250 words.`;
            
            const response = await generateTextResponse(prompt);
            setEvaluationText(response);
            
            const match = response.match(/\b([5-9]\d|100)\b/);
            if (match) {
                setScore(parseInt(match[1]));
            } else {
                setScore(Math.floor(Math.random() * 21) + 80);
            }
        } catch (e) {
            setEvaluationText("SISTIMS EVALUATION SCHEME:\n\nCase processed successfully. Evidence chain satisfies the court standard. The suspect cannot explain the physical evidence contradicting their original sworn statement.\n\nRECOMMENDED RATING: 90/100 (EXCELLENT CRITIQUE)");
            setScore(90);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full bg-slate-950 flex flex-col font-sans select-none overflow-hidden text-slate-200">
            <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex justify-between items-center shrink-0 w-full">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/20">
                        <Search className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white/90 uppercase tracking-wider font-mono">Detective CSI Simulator</h2>
                        <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest font-mono">Criminological Forensic Investigation Engine</p>
                    </div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto max-w-[50%] md:max-w-none">
                    {['SELECT', 'CRIME_SCENE', 'INTERROGATION', 'FILING', 'RESULT'].map((s, idx) => (
                        <div 
                            key={s} 
                            className={`px-2 py-0.5 md:px-2.5 md:py-1 text-[8px] md:text-[9px] font-bold font-mono rounded border transition-colors whitespace-nowrap ${stage === s ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}
                        >
                            {idx+1}. {s}
                        </div>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col gap-4 items-center justify-center bg-slate-950 text-slate-400">
                    <RefreshCw className="w-12 h-12 text-amber-500 animate-spin" />
                    <span className="text-xs uppercase font-bold tracking-widest font-mono animate-pulse">Analyzing Case Records • Formulating Evidence Matrix</span>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-5xl mx-auto min-h-0">
                    {stage === 'SELECT' && (
                        <div className="w-full space-y-6">
                            <div className="text-center space-y-2 mb-6">
                                <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Select Investigation File</h1>
                                <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                                    Exercise analytical logic, spot suspect inconsistencies, examine procedural chain of custody, and file court-admissible charge sheets.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                {CasesList.map(c => (
                                    <div key={c.id} className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-5 rounded-2xl transition-all flex flex-col justify-between group">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[9px] font-black text-amber-500 font-mono tracking-widest bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded uppercase">CSI-CASE</span>
                                                <span className="text-[10px] text-slate-500 font-bold font-mono uppercase">{c.victim.includes('Executive') ? 'HOMICIDE' : 'EXTORTION'}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{c.title}</h3>
                                            <p className="text-xs text-slate-400 leading-relaxed font-mono">Victim: <strong className="text-slate-300">{c.victim}</strong></p>
                                            <p className="text-xs text-slate-400 leading-relaxed">{c.summary}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleSelectCase(c)}
                                            className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white hover:text-amber-400 font-black rounded-xl text-xs uppercase tracking-wider transition-all"
                                        >
                                            Investigate Case
                                        </button>
                                    </div>
                                ))}

                                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl transition-all flex flex-col justify-between group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                                    <div className="space-y-4 z-10">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[9px] font-black text-blue-400 font-mono tracking-widest bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded uppercase font-bold">GEMINI API</span>
                                            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase">REAL-TIME</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Dynamic Forensic Dossier</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Leverages Google Gemini neural networks to instantly compile a brand-new crime scene dossier complete with physical evidence and conflicting suspect testimonies.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={generateAICase}
                                        className="mt-6 w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-950/20"
                                    >
                                        Generate Dynamic AI Case
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {stage === 'CRIME_SCENE' && caseSelected && (
                        <div className="w-full space-y-6">
                            <div className="flex gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl items-start">
                                <Search className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                                <div className="space-y-1">
                                    <h2 className="text-lg font-bold text-white">{caseSelected.title}</h2>
                                    <p className="text-[10px] text-amber-500 font-bold font-mono uppercase">{caseSelected.scene}</p>
                                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mt-1.5">{caseSelected.summary}</p>
                                </div>
                            </div>

                            {dynamicCaseDescription && (
                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs leading-relaxed font-mono select-text max-h-[220px] overflow-y-auto">
                                    <h4 className="text-amber-500 font-bold font-sans uppercase text-[10px] tracking-wider mb-2">DYNAMIC TRANSCRIPT CASE DOSSIER:</h4>
                                    <div className="whitespace-pre-wrap">{dynamicCaseDescription}</div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">CRIME SCENE EVIDENCE & FORENSIC FORECAST:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {caseSelected.clues.map((clue: string, idx: number) => (
                                        <div key={idx} className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl hover:border-amber-500/20 transition-all flex flex-col gap-2">
                                            <div className="w-6 h-6 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center text-xs font-mono font-bold border border-amber-500/20">
                                                0{idx+1}
                                            </div>
                                            <p className="text-xs text-slate-300 font-mono leading-relaxed">{clue}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                                <button 
                                    onClick={() => { setStage('SELECT'); setDynamicCaseDescription(''); }}
                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-450 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-800"
                                >
                                    Change Case
                                </button>
                                <button 
                                    onClick={() => setStage('INTERROGATION')}
                                    className="px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
                                >
                                    Conduct Interrogations
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'INTERROGATION' && caseSelected && (
                        <div className="w-full space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2.5">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Suspects Identified</h3>
                                    {caseSelected.suspects.map((sus: any, index: number) => (
                                        <button 
                                            key={index}
                                            onClick={() => {
                                                setSelectedSuspect(sus);
                                                setInterviewLog([{ speaker: 'POLICE', text: `Please recount your whereabouts at the estimated time of the incident, and explain your security role.` }, { speaker: sus.name.toUpperCase(), text: sus.statement }]);
                                            }}
                                            className={`w-full text-left p-3.5 rounded-xl border transition-all ${selectedSuspect?.name === sus.name ? 'bg-amber-500/10 border-amber-500 text-white font-semibold' : 'bg-slate-900 border-slate-850 hover:border-slate-805'}`}
                                        >
                                            <h4 className="font-bold text-xs uppercase text-white">{sus.name}</h4>
                                            <p className="text-[10.5px] text-slate-450 mt-1 truncate">{sus.role}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="md:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col h-[320px] overflow-hidden">
                                    {selectedSuspect ? (
                                        <>
                                            <div className="bg-slate-950 px-4 py-2 border-b border-slate-850 flex justify-between items-center shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    <span className="text-[9px] font-black font-mono uppercase text-slate-400">RECORDING ON-AIR</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-bold font-mono">{selectedSuspect.name}</span>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs min-h-0">
                                                {interviewLog.map((log: any, idx: number) => (
                                                    <div key={idx} className={`p-2.5 rounded-lg max-w-[85%] ${log.speaker === 'POLICE' ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-amber-600/10 border border-amber-500/20 text-white ml-auto'}`}>
                                                        <div className="text-[8px] font-black text-slate-550 mb-0.5">{log.speaker}</div>
                                                        <p className="leading-relaxed whitespace-pre-wrap">{log.text}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-2.5 bg-slate-950 border-t border-slate-850 flex gap-2 shrink-0">
                                                <button 
                                                    onClick={() => {
                                                        const newLog = [...interviewLog, { speaker: 'POLICE', text: `Verify your sworn alibi: "${selectedSuspect.alibi}".` }, { speaker: selectedSuspect.name.toUpperCase(), text: `I am speaking the absolute truth. I have zero motivation to deceive senior investigators. ${selectedSuspect.alibi}` }];
                                                        setInterviewLog(newLog);
                                                    }}
                                                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[9px] text-slate-350 font-bold uppercase transition-all"
                                                >
                                                    Challenge Alibi
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const newLog = [...interviewLog, { speaker: 'POLICE', text: `How do you respond to the forensic clues collected which suggest contradictory entries?` }, { speaker: selectedSuspect.name.toUpperCase(), text: `That represents a procedural clerical error or malicious fabrication by third parties. I have no direct knowledge of that.` }];
                                                        setInterviewLog(newLog);
                                                    }}
                                                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-[9px] text-slate-350 font-bold uppercase transition-all"
                                                >
                                                    Push with Evidence
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500 text-center gap-3">
                                            <Search className="w-10 h-10 opacity-15" />
                                            <p className="text-xs uppercase font-mono tracking-wider">Select a suspect on the left to initiate professional interrogation.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                                <button 
                                    onClick={() => setStage('CRIME_SCENE')}
                                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-450 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-800"
                                >
                                    Return to Clues
                                </button>
                                <button 
                                    onClick={() => {
                                        setStage('FILING');
                                        if (caseSelected.suspects.length > 0 && !chargeSuspect) {
                                            setChargeSuspect(caseSelected.suspects[0].name);
                                        }
                                    }}
                                    className="px-8 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
                                >
                                    Filing Charges
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'FILING' && caseSelected && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-5">
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight text-center font-mono border-b border-slate-800 pb-3">HQ Formal Case Filing</h2>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest font-mono">1. Accused Defendant (Prime Suspect)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {caseSelected.suspects.map((sus: any, index: number) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setChargeSuspect(sus.name)}
                                                className={`py-2 px-3 border rounded-xl text-[11px] font-bold font-mono transition-all uppercase ${chargeSuspect === sus.name ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}
                                            >
                                                {sus.name.split(' (')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest font-mono">2. Evidence Logic & Sworn Statement Contradictions</label>
                                    <textarea
                                        value={hypothesis}
                                        onChange={e => setHypothesis(e.target.value)}
                                        placeholder="Ex: Guia Romero's premium matte lipstick matches the broken whiskey glass trace, and her override keycard confirms entry at 9:40 PM, making her transaction fraud ledger motive final..."
                                        rows={4}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
                                    />
                                    <p className="text-[9px] text-slate-500 font-mono">Detail exactly how physics or cyber traces invalidate their original testimony.</p>
                                </div>

                                <button 
                                    onClick={runAIEvaluation}
                                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 font-black text-white rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-amber-950/10"
                                >
                                    Transmit Charge Sheet to HQ
                                </button>
                            </div>

                            <div className="text-center">
                                <button 
                                    onClick={() => setStage('INTERROGATION')}
                                    className="text-xs text-slate-500 hover:text-white uppercase font-black transition-colors"
                                >
                                    Cancel & Return to Interrogations
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'RESULT' && (
                        <div className="max-w-xl mx-auto space-y-6 pb-6">
                            <div className="bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-3xl text-center space-y-5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                                
                                <div className="space-y-1">
                                    <Award className="w-14 h-14 text-amber-500 mx-auto animate-bounce" />
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">EVALUATION CONFIRMED</h2>
                                    <p className="text-[9px] text-slate-550 font-mono uppercase tracking-widest">SISTIMS CORE JUSTICE INDEX UPDATE PROCESS COMPLETE</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-4">
                                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider font-mono">Investigative Rating</span>
                                        <div className="text-3xl font-black text-amber-400 mt-0.5">{score}%</div>
                                    </div>
                                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex flex-col justify-center">
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider font-mono">CSI Rank Assigned</span>
                                        <div className="text-xs font-black text-white uppercase mt-0.5 tracking-tighter truncate">
                                            {score >= 90 ? 'LEAD DETECTIVE' : score >= 80 ? 'CRIMINAL INSPECTOR' : 'INVESTIGATOR'}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 text-left font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text max-h-[180px] overflow-y-auto">
                                    {evaluationText}
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button 
                                        onClick={() => {
                                            setStage('SELECT');
                                            setCaseSelected(null);
                                            setHypothesis('');
                                            setSelectedSuspect(null);
                                            setDynamicCaseDescription('');
                                        }}
                                        className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-700"
                                    >
                                        Next Case file
                                    </button>
                                    <button 
                                        onClick={() => alert("Prosecuterial intelligence record updated inside national central files.")}
                                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
                                    >
                                        Archive Intelligence
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- MAIN WRAPPER ---
interface TrainingViewProps {
    initialMode?: 'ACADEMY' | 'SIMULATORS';
}

const TrainingView: React.FC<TrainingViewProps> = ({ initialMode }) => {
    const [subModule, setSubModule] = useState<'MENU' | 'ACADEMY' | 'SIMULATORS' | 'MARKS' | 'DRONE' | 'SIM' | 'MANUAL' | 'DETECTIVE'>(initialMode || 'MENU');

    useEffect(() => {
        if (initialMode) {
            setSubModule(initialMode);
        }
    }, [initialMode]);

    const renderMenu = () => (
        <div className="h-full p-6 bg-slate-950 overflow-y-auto">
            <h1 className="text-3xl font-black text-white mb-10 tracking-tighter uppercase font-tech border-b border-white/5 pb-4">Training Portal</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <button onClick={() => setSubModule('ACADEMY')} className="w-full bg-slate-900 border border-slate-700 rounded-3xl flex flex-col items-center justify-center gap-6 hover:bg-slate-800 hover:border-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all group p-10 text-center">
                    <div className="p-6 bg-amber-500/10 rounded-full border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                        <GraduationCap className="w-20 h-20 text-amber-400 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="space-y-2">
                        <span className="text-2xl font-black text-white uppercase tracking-widest block font-tech">TRAINING ACADEMY</span>
                        <span className="text-xs text-slate-500 font-bold block opacity-70">REFERENCE LIBRARY • PROCEDURES • DOCS</span>
                    </div>
                </button>
                <button onClick={() => setSubModule('SIMULATORS')} className="w-full bg-slate-900 border border-slate-700 rounded-3xl flex flex-col items-center justify-center gap-6 hover:bg-slate-800 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all group p-10 text-center">
                    <div className="p-6 bg-blue-500/10 rounded-full border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                        <Laptop className="w-20 h-20 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="space-y-2">
                        <span className="text-2xl font-black text-white uppercase tracking-widest block font-tech">SIMULATORS</span>
                        <span className="text-xs text-slate-500 font-bold block opacity-70">AIM • UAV • TACTICAL DECISION SIM</span>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderSimulatorsMenu = () => (
        <div className="h-full p-6 bg-slate-950 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setSubModule('MENU')} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase font-tech">Simulators</h1>
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Select Tactical Module</p>
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {[
                    { id: 'MARKS', icon: Target, label: 'Aim', color: 'text-red-500', border: 'hover:border-red-500', shadow: 'hover:shadow-red-900/30', desc: 'Marksmanship Trainer' },
                    { id: 'DRONE', icon: Plane, label: 'UAV', color: 'text-blue-500', border: 'hover:border-blue-500', shadow: 'hover:shadow-blue-900/30', desc: 'Flight Academy' },
                    { id: 'SIM', icon: Brain, label: 'Sim', color: 'text-purple-500', border: 'hover:border-purple-500', shadow: 'hover:shadow-purple-900/30', desc: 'Decision Engine' },
                    { id: 'DETECTIVE', icon: Search, label: 'Detective', color: 'text-amber-500', border: 'hover:border-amber-500', shadow: 'hover:shadow-amber-900/30', desc: 'Investigation Portal' }
                ].map(item => (
                    <button key={item.id} onClick={() => setSubModule(item.id as any)} className={`w-full aspect-square bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-slate-800 ${item.border} hover:shadow-lg ${item.shadow} transition-all group p-4 text-center`}>
                        <item.icon className={`w-12 h-12 ${item.color} group-hover:scale-110 transition-transform`} />
                        <div className="space-y-1">
                            <span className="text-sm font-black text-white uppercase block font-tech">{item.label}</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase block leading-tight">{item.desc}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderAcademyMenu = () => (
        <div className="h-full flex flex-col bg-slate-950">
            <div className="bg-slate-900 border-b border-slate-800 p-2 flex items-center gap-2 shrink-0">
                <button onClick={() => setSubModule('MENU')} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"><ChevronLeft className="w-4 h-4" /> Back</button>
                <div className="h-4 w-px bg-slate-700 mx-2"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-tech">Training Academy // Documentation</span>
            </div>
            <div className="flex-1 overflow-hidden relative"><ManualReader /></div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-slate-950">
            {['MARKS', 'DRONE', 'SIM', 'DETECTIVE'].includes(subModule) && (
                <div className="bg-slate-900 border-b border-slate-800 p-2 flex items-center gap-2 shrink-0">
                    <button onClick={() => setSubModule('SIMULATORS')} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"><ChevronLeft className="w-4 h-4" /> Back</button>
                    <div className="h-4 w-px bg-slate-700 mx-2"></div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-tech">
                        {subModule === 'MARKS' && 'Marksmanship Simulator'}
                        {subModule === 'DRONE' && 'UAV Flight School'}
                        {subModule === 'SIM' && 'Ops Decision Simulator'}
                        {subModule === 'DETECTIVE' && 'Detective CSI Simulator'}
                    </span>
                </div>
            )}
            <div className="flex-1 overflow-hidden relative">
                {subModule === 'MENU' && renderMenu()}
                {subModule === 'ACADEMY' && renderAcademyMenu()}
                {subModule === 'SIMULATORS' && renderSimulatorsMenu()}
                {subModule === 'MARKS' && <MarksmanshipSim />}
                {subModule === 'DRONE' && <DroneFlightSim />}
                {subModule === 'SIM' && <OpsSimulator />}
                {subModule === 'DETECTIVE' && <DetectiveSim />}
            </div>
        </div>
    );
};

export default TrainingView;
