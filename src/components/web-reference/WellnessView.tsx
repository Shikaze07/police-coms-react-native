
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Activity, Wind, Brain, Smile, AlertCircle, Footprints, Moon, Flame, Timer, ChevronRight, TrendingUp, Calendar, BarChart2, CheckCircle2, X, Zap, Scale, Dumbbell, Play, Pause, RotateCcw, Utensils, ClipboardList, Plus, Clock, Hash, History } from 'lucide-react';

// --- MOCK DATA HELPERS ---
const generateHrData = (prev: number) => {
    const change = Math.floor(Math.random() * 5) - 2;
    let newRate = prev + change;
    if (newRate > 110) newRate = 110;
    if (newRate < 55) newRate = 55;
    return newRate;
};

// PNP EXERCISES (Appendix A/B)
const PNP_EXERCISES = [
    { id: '1', name: 'Jumping Jacks', duration: 60, rest: 10, instructions: 'Feet together, arms at side. Jump and spread feet apart while raising arms overhead.' },
    { id: '2', name: 'Wall Sit', duration: 60, rest: 10, instructions: 'Back against wall, slide down until knees are at 90 degrees. Hold.' },
    { id: '3', name: 'Push-Up', duration: 45, rest: 15, instructions: 'Prone position, hands shoulder width. Lower body until chest nears floor.' },
    { id: '4', name: 'Abdominal Crunches', duration: 45, rest: 15, instructions: 'Lie supine, knees bent. Lift upper body off floor towards knees.' },
    { id: '5', name: 'Step-Up onto Chair', duration: 60, rest: 10, instructions: 'Step up on stable chair/bench, then step back down. Alternate legs.' },
    { id: '6', name: 'Squats', duration: 60, rest: 10, instructions: 'Feet shoulder width. Lower hips back and down. Keep chest up.' },
    { id: '7', name: 'Triceps Dip', duration: 45, rest: 15, instructions: 'Hands on chair edge behind you. Lower hips by bending elbows.' },
    { id: '8', name: 'Plank', duration: 60, rest: 10, instructions: 'Forearms on ground, legs straight. Hold body in straight line.' },
    { id: '9', name: 'High Stepping', duration: 30, rest: 10, instructions: 'Run in place bringing knees as high as possible.' },
    { id: '10', name: 'Lunges', duration: 45, rest: 15, instructions: 'Step forward with one leg, lower hips until both knees are 90 degrees.' },
    { id: '11', name: 'Push-Up Rotation', duration: 45, rest: 15, instructions: 'Push up, then rotate body to side raising one arm to sky.' },
    { id: '12', name: 'Side Plank', duration: 30, rest: 10, instructions: 'Lie on side, lift hips. Hold straight line. Switch sides halfway.' },
];

interface WorkoutLog {
    id: string;
    date: string;
    exercise: string;
    duration: string;
    details: string; // Sets/Reps
}

const WellnessView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VITALS' | 'MENTAL' | 'FITNESS'>('OVERVIEW');
    
    // Vitals State
    const [heartRate, setHeartRate] = useState(72);
    const [hrHistory, setHrHistory] = useState<number[]>(new Array(30).fill(70));
    const [stressScore, setStressScore] = useState(32); // 0-100
    const [spo2, setSpo2] = useState(98);
    
    // Activity State
    const [steps, setSteps] = useState(8432);
    const [calories, setCalories] = useState(2105);
    const [standHours, setStandHours] = useState(9);
    
    // Breathing Tool State
    const [breathingActive, setBreathingActive] = useState(false);
    const [breathPhase, setBreathPhase] = useState('Ready'); 
    const [breathCount, setBreathCount] = useState(4);

    // PNP Fitness Profile State
    const [weight, setWeight] = useState<string>('75');
    const [height, setHeight] = useState<string>('1.75');
    const [age, setAge] = useState<string>('30');
    const [bmiData, setBmiData] = useState<{bmi: number, class: string, package: string, color: string, diet: string} | null>(null);
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [exerciseTimer, setExerciseTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Fitness Log State
    const [fitnessViewMode, setFitnessViewMode] = useState<'PROGRAM' | 'LOGBOOK'>('PROGRAM');
    const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([
        { id: 'l1', date: new Date(Date.now() - 86400000).toLocaleString(), exercise: 'Morning Run', duration: '30m', details: '5km Distance' },
        { id: 'l2', date: new Date(Date.now() - 172800000).toLocaleString(), exercise: 'Bench Press', duration: '15m', details: '3 Sets x 12 Reps' },
    ]);
    const [manualLog, setManualLog] = useState({ exercise: '', duration: '', sets: '', reps: '' });
    
    // Simulation Effects
    useEffect(() => {
        const interval = setInterval(() => {
            setHeartRate(prev => {
                const newRate = generateHrData(prev);
                setHrHistory(h => [...h.slice(1), newRate]);
                
                // Dynamic Stress based on HR
                if (newRate > 90) setStressScore(prevS => Math.min(100, prevS + 2));
                else if (newRate < 70) setStressScore(prevS => Math.max(5, prevS - 1));
                
                return newRate;
            });
            
            // Increment steps occasionally
            if (Math.random() > 0.7) {
                setSteps(s => s + Math.floor(Math.random() * 5));
                setCalories(c => c + 1);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Box Breathing Logic
    useEffect(() => {
        if (!breathingActive) {
            setBreathPhase('Ready');
            setBreathCount(4);
            return;
        }
        
        const phases = [
            { name: 'INHALE', duration: 4, color: 'text-blue-400' },
            { name: 'HOLD', duration: 4, color: 'text-purple-400' },
            { name: 'EXHALE', duration: 4, color: 'text-green-400' },
            { name: 'HOLD', duration: 4, color: 'text-slate-400' }
        ];
        
        let phaseIndex = 0;
        let timeLeft = 4;
        
        setBreathPhase(phases[0].name);

        const timer = setInterval(() => {
            timeLeft--;
            setBreathCount(timeLeft);
            
            if (timeLeft === 0) {
                phaseIndex = (phaseIndex + 1) % 4;
                timeLeft = phases[phaseIndex].duration;
                setBreathPhase(phases[phaseIndex].name);
                
                // Haptic
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [breathingActive]);

    // Workout Timer Logic
    useEffect(() => {
        let interval: any;
        if (isWorkoutActive && !isPaused) {
            interval = setInterval(() => {
                setExerciseTimer((prev) => {
                    if (prev > 0) return prev - 1;
                    
                    // Timer finished
                    if (isResting) {
                        // End of Rest -> Next Exercise
                        setIsResting(false);
                        const nextIndex = currentExerciseIndex + 1;
                        if (nextIndex < PNP_EXERCISES.length) {
                            setCurrentExerciseIndex(nextIndex);
                            return PNP_EXERCISES[nextIndex].duration;
                        } else {
                            // Workout Complete
                            setIsWorkoutActive(false);
                            
                            // Auto-Log Workout
                            const newLog: WorkoutLog = {
                                id: Date.now().toString(),
                                date: new Date().toLocaleString(),
                                exercise: 'PNP Pulisteniks',
                                duration: '45m',
                                details: 'Full Body Circuit Complete'
                            };
                            setWorkoutLogs(prev => [newLog, ...prev]);
                            
                            alert("Workout Complete! Activity logged.");
                            return 0;
                        }
                    } else {
                        // End of Exercise -> Rest
                        setIsResting(true);
                        return PNP_EXERCISES[currentExerciseIndex].rest;
                    }
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isWorkoutActive, isPaused, isResting, currentExerciseIndex]);

    const calculatePNPProfile = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        if (!w || !h) return;

        const bmi = w / (h * h);
        let classification = '';
        let pkg = '';
        let color = '';
        let diet = '';

        // Classification based on PNP Table (Approx from Page 28/41)
        if (bmi < 18.5) {
            classification = 'UNDERWEIGHT';
            pkg = 'Package A';
            color = 'text-yellow-400';
            diet = '2500+ kcal (High Protein)';
        } else if (bmi >= 18.5 && bmi <= 24.9) {
            classification = 'NORMAL';
            pkg = 'Package B';
            color = 'text-green-400';
            diet = '2000 kcal (Maintenance)';
        } else if (bmi >= 25.0 && bmi <= 29.9) {
            classification = 'OVERWEIGHT';
            pkg = 'Package C';
            color = 'text-orange-400';
            diet = '1800 kcal (Low Carb)';
        } else if (bmi >= 30.0 && bmi <= 34.9) {
            classification = 'OBESE I';
            pkg = 'Package D';
            color = 'text-red-400';
            diet = '1600 kcal (Strict)';
        } else if (bmi >= 35.0 && bmi <= 39.9) {
            classification = 'OBESE II';
            pkg = 'Package E';
            color = 'text-red-500';
            diet = '1500 kcal (Very Strict)';
        } else {
            classification = 'OBESE III';
            pkg = 'Package F';
            color = 'text-red-600';
            diet = '1400 kcal (Medical Supv)';
        }

        setBmiData({ bmi, class: classification, package: pkg, color, diet });
    };

    const startWorkout = () => {
        setCurrentExerciseIndex(0);
        setIsResting(false);
        setExerciseTimer(PNP_EXERCISES[0].duration);
        setIsWorkoutActive(true);
        setIsPaused(false);
    };

    const handleLogManual = () => {
        if (!manualLog.exercise || !manualLog.duration) return;
        const newLog: WorkoutLog = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            exercise: manualLog.exercise,
            duration: manualLog.duration + 'm',
            details: manualLog.sets && manualLog.reps ? `${manualLog.sets} Sets x ${manualLog.reps} Reps` : 'Timed Session'
        };
        setWorkoutLogs(prev => [newLog, ...prev]);
        setManualLog({ exercise: '', duration: '', sets: '', reps: '' });
    };

    // --- COMPONENTS ---
    
    const MetricCard = ({ title, value, unit, icon: Icon, color, trend, graphData }: any) => (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg relative overflow-hidden group flex flex-col justify-between min-h-[120px]">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-16 h-16" />
            </div>
            
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                    <Icon className={`w-4 h-4 ${color}`} /> {title}
                </div>
                {trend && (
                    <div className="flex items-center text-[10px] font-bold text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded">
                        <TrendingUp className="w-3 h-3 mr-1" /> {trend}
                    </div>
                )}
            </div>
            
            <div className="relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white tracking-tight">{value}</span>
                    <span className="text-xs font-bold text-slate-500">{unit}</span>
                </div>
            </div>

            {/* Micro Chart */}
            {graphData && (
                <div className="h-8 mt-2 flex items-end gap-0.5 opacity-50">
                   {graphData.map((val: number, i: number) => (
                       <div key={i} style={{ height: `${(val / 120) * 100}%` }} className={`flex-1 rounded-t-sm ${color.replace('text-', 'bg-')}`} />
                   ))}
                </div>
            )}
        </div>
    );

    const OverviewTab = () => (
        <div className="flex flex-col landscape:flex-row md:flex-row gap-4 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
            {/* LEFT COLUMN: Readiness & Alerts */}
            <div className="flex-1 flex flex-col gap-4">
                {/* AI Readiness Score */}
                <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-6 border border-blue-800/50 shadow-2xl relative overflow-hidden flex-1 min-h-[200px] flex flex-col justify-between">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-blue-300 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Daily Readiness
                            </h2>
                            <div className="text-5xl font-black text-white mb-2">85<span className="text-2xl text-blue-400">%</span></div>
                        </div>
                        
                        {/* Circular Indicator */}
                        <div className="relative w-20 h-20 flex items-center justify-center">
                             <svg className="w-full h-full -rotate-90">
                                 <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                                 <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="226" strokeDashoffset="34" className="text-blue-500" strokeLinecap="round" />
                             </svg>
                             <Zap className="absolute w-6 h-6 text-white fill-white" />
                        </div>
                    </div>
                    <p className="text-sm text-slate-300 max-w-xs leading-relaxed relative z-10">
                        Your recovery is excellent. You are primed for high-stress tactical operations today.
                    </p>
                </div>

                {/* Recent Alerts (Visible here in landscape to maximize space) */}
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex-1 min-h-[140px] flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-400" /> Recent Trends
                        </h3>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                        <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg border border-slate-700">
                            <div className="bg-green-500/20 p-1.5 rounded-full text-green-400">
                                <TrendingUp className="w-3 h-3" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-white">VO2 Max Improved</div>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg border border-slate-700">
                            <div className="bg-orange-500/20 p-1.5 rounded-full text-orange-400">
                                <AlertCircle className="w-3 h-3" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-white">High Stress (14:00)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Metric Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4 h-full content-start">
                <MetricCard 
                    title="Heart Rate" 
                    value={heartRate} 
                    unit="BPM" 
                    icon={Heart} 
                    color="text-red-500" 
                    graphData={hrHistory}
                />
                <MetricCard 
                    title="Steps" 
                    value={steps.toLocaleString()} 
                    unit="steps" 
                    icon={Footprints} 
                    color="text-green-500" 
                    trend="+12%"
                />
                <MetricCard 
                    title="Sleep" 
                    value="7h 12m" 
                    unit="Qual: 88" 
                    icon={Moon} 
                    color="text-purple-500" 
                />
                 <MetricCard 
                    title="Calories" 
                    value={calories} 
                    unit="KCAL" 
                    icon={Flame} 
                    color="text-orange-500" 
                />
            </div>
        </div>
    );

    const FitnessTab = () => (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right duration-300">
            {/* View Toggle */}
            <div className="flex justify-center mb-4">
                <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 inline-flex">
                    <button 
                        onClick={() => setFitnessViewMode('PROGRAM')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${fitnessViewMode === 'PROGRAM' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Dumbbell className="w-3 h-3" /> Program
                    </button>
                    <button 
                        onClick={() => setFitnessViewMode('LOGBOOK')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${fitnessViewMode === 'LOGBOOK' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ClipboardList className="w-3 h-3" /> Logbook
                    </button>
                </div>
            </div>

            {fitnessViewMode === 'PROGRAM' ? (
                <div className="flex-1 flex flex-col landscape:flex-row gap-4 overflow-hidden">
                    {/* LEFT: CALCULATOR & PROFILE */}
                    <div className="flex-1 bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 text-blue-400 font-bold uppercase tracking-wider text-xs">
                            <Scale className="w-4 h-4" /> PNP Standard Profile
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold">Weight (kg)</label>
                                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold">Height (m)</label>
                                <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono" />
                            </div>
                        </div>
                        
                        <button onClick={calculatePNPProfile} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs w-full mb-4">
                            CALCULATE BMI & PACKAGE
                        </button>

                        {bmiData && (
                            <div className="mt-auto border-t border-slate-700 pt-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400">BMI SCORE</span>
                                    <span className={`text-2xl font-black ${bmiData.color}`}>{bmiData.bmi.toFixed(1)}</span>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">CLASSIFICATION</span>
                                        <span className={`font-bold ${bmiData.color}`}>{bmiData.class}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">PROGRAM</span>
                                        <span className="font-bold text-white">{bmiData.package}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">DIET RX</span>
                                        <span className="font-bold text-blue-400">{bmiData.diet}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 p-2 bg-blue-900/20 rounded border border-blue-500/30">
                                    <Utensils className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-blue-200 leading-tight">
                                        Recommended: "Pinggang Pinoy" meal plan. 50% Veg/Fruits, 25% Carbs, 25% Protein.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: WORKOUT PLAN */}
                    <div className="flex-1 bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col relative overflow-hidden">
                        {!bmiData ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                                <Dumbbell className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-sm font-bold">Calculate BMI to View Program</p>
                                <p className="text-xs mt-2">Required for PNP Physical Fitness Test compliance.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <Dumbbell className="w-4 h-4 text-green-400" />
                                        {bmiData.package} Routine
                                    </h3>
                                    <div className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-500/30">
                                        45 MINS • COMPOUND
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                                    {PNP_EXERCISES.map((ex, i) => (
                                        <div key={ex.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-slate-200">{ex.name}</div>
                                                <div className="text-[10px] text-slate-500">{ex.duration}s work • {ex.rest}s rest</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={startWorkout}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                                >
                                    <Play className="w-5 h-5 fill-current" /> START PULISTENIKS
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                // LOGBOOK VIEW
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Log Form */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shrink-0">
                        <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                            <Plus className="w-4 h-4" /> New Log Entry
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Exercise Name</label>
                                <input 
                                    type="text" 
                                    value={manualLog.exercise}
                                    onChange={e => setManualLog({...manualLog, exercise: e.target.value})}
                                    placeholder="e.g. Running, Push-ups" 
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Duration (Mins)</label>
                                <input 
                                    type="number" 
                                    value={manualLog.duration}
                                    onChange={e => setManualLog({...manualLog, duration: e.target.value})}
                                    placeholder="0" 
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Sets</label>
                                    <input 
                                        type="number" 
                                        value={manualLog.sets}
                                        onChange={e => setManualLog({...manualLog, sets: e.target.value})}
                                        placeholder="-" 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Reps</label>
                                    <input 
                                        type="number" 
                                        value={manualLog.reps}
                                        onChange={e => setManualLog({...manualLog, reps: e.target.value})}
                                        placeholder="-" 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button 
                                    onClick={handleLogManual}
                                    disabled={!manualLog.exercise || !manualLog.duration}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2"
                                >
                                    LOG ENTRY
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-400" /> Workout History
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {workoutLogs.length === 0 ? (
                                <div className="text-center text-slate-500 py-10">
                                    <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">No workout logs yet.</p>
                                </div>
                            ) : (
                                workoutLogs.map(log => (
                                    <div key={log.id} className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 rounded-xl hover:border-slate-500 transition-colors">
                                        <div className="bg-slate-800 p-2 rounded-lg text-emerald-500">
                                            <Dumbbell className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-white text-sm">{log.exercise}</h4>
                                                <span className="text-[10px] text-slate-500 font-mono">{log.date}</span>
                                            </div>
                                            <div className="flex gap-4 mt-1 text-xs text-slate-400">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log.duration}</span>
                                                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {log.details}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* WORKOUT OVERLAY */}
            {isWorkoutActive && (
                <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-full max-w-md flex flex-col items-center">
                        <div className={`text-xl font-bold tracking-widest uppercase mb-8 ${isResting ? 'text-blue-400' : 'text-green-400'} animate-pulse`}>
                            {isResting ? 'REST / PREPARE' : 'WORKOUT IN PROGRESS'}
                        </div>

                        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                                <circle 
                                    cx="128" cy="128" r="120" 
                                    stroke="currentColor" strokeWidth="12" 
                                    fill="transparent" 
                                    className={isResting ? 'text-blue-500' : 'text-green-500'}
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={2 * Math.PI * 120 * (1 - exerciseTimer / (isResting ? PNP_EXERCISES[currentExerciseIndex].rest : PNP_EXERCISES[currentExerciseIndex].duration))}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                />
                            </svg>
                            <div className="absolute text-6xl font-black text-white tabular-nums">
                                {exerciseTimer}
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-white text-center mb-2">
                            {isResting 
                                ? (PNP_EXERCISES[currentExerciseIndex + 1] ? `NEXT: ${PNP_EXERCISES[currentExerciseIndex + 1].name}` : 'FINISH LINE') 
                                : PNP_EXERCISES[currentExerciseIndex].name}
                        </h2>
                        
                        <p className="text-sm text-slate-400 text-center mb-8 max-w-xs">
                            {isResting 
                                ? 'Breathe deeply. Get ready for the next set.' 
                                : PNP_EXERCISES[currentExerciseIndex].instructions}
                        </p>

                        <div className="flex gap-4 w-full">
                            <button onClick={() => setIsPaused(!isPaused)} className="flex-1 bg-slate-800 py-4 rounded-xl text-white font-bold flex justify-center gap-2 hover:bg-slate-700">
                                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                {isPaused ? 'RESUME' : 'PAUSE'}
                            </button>
                            <button onClick={() => setIsWorkoutActive(false)} className="flex-1 bg-red-900/30 text-red-400 border border-red-900 py-4 rounded-xl font-bold flex justify-center gap-2 hover:bg-red-900/50">
                                <X className="w-5 h-5" /> QUIT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const MentalTab = () => (
         <div className="flex flex-col landscape:flex-row md:flex-row gap-4 h-full animate-in fade-in slide-in-from-right duration-300 pb-2">
             {/* LEFT COLUMN: Monitor & Resources */}
             <div className="flex-1 flex flex-col gap-4">
                 {/* Stress Monitor */}
                 <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex-1 flex flex-col justify-center">
                     <div className="flex justify-between items-center mb-6">
                         <div>
                            <h2 className="text-lg font-bold text-white">Stress Monitor</h2>
                            <p className="text-xs text-slate-400">Real-time HRV Analysis</p>
                         </div>
                         <div className={`text-2xl font-black ${stressScore > 70 ? 'text-red-500' : stressScore > 40 ? 'text-orange-400' : 'text-green-400'}`}>
                             {stressScore}<span className="text-sm font-bold text-slate-500 ml-1">/ 100</span>
                         </div>
                     </div>
                     
                     {/* Bar Visualization */}
                     <div className="h-4 bg-slate-700 rounded-full overflow-hidden flex mb-2">
                         <div style={{ width: `${stressScore}%` }} className={`transition-all duration-1000 ${stressScore > 70 ? 'bg-red-500' : stressScore > 40 ? 'bg-orange-500' : 'bg-green-500'}`} />
                     </div>
                     <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                         <span>Relaxed</span>
                         <span>Moderate</span>
                         <span>High</span>
                     </div>
                 </div>

                 {/* Resources */}
                 <div className="bg-gradient-to-r from-purple-900/50 to-slate-800 rounded-xl p-4 border border-purple-500/20 flex items-center gap-4">
                    <div className="bg-purple-600/20 p-3 rounded-full text-purple-400">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-sm">Mental Support</h3>
                        <p className="text-xs text-slate-400">Confidential counseling 24/7.</p>
                    </div>
                    <button className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold">
                        CONNECT
                    </button>
                 </div>
             </div>

             {/* RIGHT COLUMN: Breathing Tool */}
             <div className={`flex-1 bg-slate-800 rounded-2xl p-6 border-2 transition-all shadow-xl flex flex-col ${breathingActive ? 'border-blue-500 shadow-blue-900/20' : 'border-slate-700'}`}>
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5 text-blue-400" />
                        <h3 className="font-bold text-white">Tactical Breathing</h3>
                    </div>
                    <button 
                        onClick={() => setBreathingActive(!breathingActive)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg ${breathingActive ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}
                    >
                        {breathingActive ? 'STOP' : 'START'}
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center flex-1 min-h-[200px]">
                    {breathingActive ? (
                        <>
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                {/* Animated Rings */}
                                <div className={`absolute inset-0 border-4 border-blue-500/30 rounded-full transition-all duration-[4000ms] ${breathPhase === 'INHALE' ? 'scale-125 opacity-0' : 'scale-100 opacity-0'}`}></div>
                                <div className={`absolute inset-0 border-4 border-blue-500 rounded-full transition-all duration-[4000ms] ease-in-out ${
                                    breathPhase === 'INHALE' ? 'scale-110 opacity-100' : 
                                    breathPhase === 'EXHALE' ? 'scale-75 opacity-80' : 
                                    'scale-95 opacity-90'
                                }`}></div>
                                
                                <div className="text-center z-10 relative">
                                    <div className="text-3xl font-black text-white mb-1 transition-all">{breathCount}</div>
                                    <div className="text-sm font-bold text-blue-300 tracking-widest uppercase">{breathPhase}</div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-6 text-center animate-pulse">
                                Focus on your breath. Inhale through nose, exhale through mouth.
                            </p>
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto text-slate-500">
                                <Wind className="w-10 h-10" />
                            </div>
                            <div>
                                <h4 className="text-slate-200 font-bold mb-1">Box Breathing Technique</h4>
                                <p className="text-xs text-slate-400 max-w-[250px] mx-auto">
                                    A simple 4-step rhythm to regain control, lower cortisol, and improve focus during high-stress situations.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
             </div>
         </div>
    );

    const Sparkles = ({className}: {className?: string}) => (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
    );

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/50 overflow-x-auto no-scrollbar shrink-0">
                {[
                    { id: 'OVERVIEW', label: 'Summary', icon: TrendingUp },
                    { id: 'FITNESS', label: 'PNP Program', icon: Dumbbell },
                    { id: 'MENTAL', label: 'Mind', icon: Brain },
                    { id: 'VITALS', label: 'Vitals', icon: Heart }
                ].map((tab: any) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[100px] py-4 flex flex-col items-center gap-1.5 text-[10px] font-bold uppercase transition-all relative ${
                            activeTab === tab.id 
                            ? 'text-green-400' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
                <div className="max-w-xl md:max-w-6xl landscape:max-w-6xl mx-auto h-full">
                    {activeTab === 'OVERVIEW' && <OverviewTab />}
                    {activeTab === 'MENTAL' && <MentalTab />}
                    {activeTab === 'FITNESS' && <FitnessTab />}
                    
                    {activeTab === 'VITALS' && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4 animate-in fade-in">
                            <BarChart2 className="w-16 h-16 opacity-20" />
                            <p className="text-sm font-bold">Detailed Analytics Module</p>
                            <p className="text-xs text-center max-w-xs">
                                Advanced historical data visualization and export features are available in the desktop dashboard.
                            </p>
                            <button className="text-xs text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1">
                                VIEW REPORT <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WellnessView;
