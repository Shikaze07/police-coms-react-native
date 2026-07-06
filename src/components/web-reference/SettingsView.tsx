import React, { useState, useEffect } from 'react';
import { Settings, Wifi, Radio, Satellite, ShieldCheck, Sun, Moon, Download, Smartphone, Cpu, Terminal, X, Copy, Check, AlertTriangle, FileText, ExternalLink, Key, CheckCircle2, XCircle } from 'lucide-react';
import { User } from './types';

interface SettingsViewProps {
  currentUser: User | null;
  theme: 'dark' | 'light';
  onChangeTheme: (theme: 'dark' | 'light') => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, theme, onChangeTheme }) => {
  const [paceConfig, setPaceConfig] = useState({
    primary: '5G/LTE',
    alternate: 'Starlink DTC',
    contingency: 'Beartooth Radio',
    emergency: 'Manual/Satellite'
  });
  const [downloading, setDownloading] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keysStatus, setKeysStatus] = useState({
    GEMINI_API_KEY: false,
    GOOGLE_MAPS_PLATFORM_KEY: false,
    PHOTOGRAMMETRY_API_KEY: false,
  });
  const [loadingKeys, setLoadingKeys] = useState(true);

  useEffect(() => {
    const fetchKeysStatus = async () => {
      try {
        const response = await fetch('/api/keys/status');
        if (response.ok) {
          const data = await response.json();
          setKeysStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch API keys status:", err);
      } finally {
        setLoadingKeys(false);
      }
    };
    fetchKeysStatus();
  }, []);

  const handleDownloadAPK = () => {
    setShowBuildModal(true);
  };

  const copyCommands = () => {
    const commands = `npm install
npm run build
npm run cap:sync
cd android
chmod +x gradlew
./gradlew assembleDebug`;
    navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`h-full w-full p-6 overflow-y-auto ${theme === 'light' ? 'bg-slate-50 text-slate-850' : 'bg-slate-950 text-slate-200'}`}>
        <h2 className={`text-2xl font-black font-tech tracking-widest flex items-center gap-3 mb-8 ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
            <Settings className={`w-8 h-8 ${theme === 'light' ? 'text-blue-600' : 'text-cyan-400'}`} />
            SYSTEM SETTINGS & PACE ONBOARDING
        </h2>

        {/* Visual Theme Recalibration Panel */}
        <div className={`rounded-2xl p-6 border mb-8 shadow-xl transition-all ${
          theme === 'light' 
            ? 'bg-white border-blue-200 shadow-blue-500/5' 
            : 'glass border-white/5 shadow-2xl'
        }`}>
            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 font-tech ${theme === 'light' ? 'text-blue-900 border-b border-blue-50 pb-2' : 'text-white'}`}>
                {theme === 'light' ? <Sun className="w-5 h-5 text-blue-600 font-bold" /> : <Moon className="w-5 h-5 text-cyan-400" />}
                SECURE OCULAR RECALIBRATION (APP THEME)
            </h3>
            
            <p className={`text-xs mb-6 max-w-2xl font-mono leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Adjust Knox tactical rendering. Calibrate viewport profiles to secure screen legibility across environments.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => onChangeTheme('dark')}
                className={`p-5 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-cyan-950/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white' 
                    : 'bg-slate-900/10 border-slate-800/10 text-slate-500 hover:border-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-sky-500'}`} />
                  <span className="font-bold text-sm uppercase tracking-wider font-tech">NIGHT OPERATIONS PANEL (DARK SLATE)</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-80 font-sans">
                  Optimizes ocular persistence for low-light night-patrol operations. Reduced light signature avoids revealing officer location at night.
                </p>
              </button>

              <button 
                onClick={() => onChangeTheme('light')}
                className={`p-5 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'bg-blue-50/60 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.1)] text-blue-900' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-amber-500'}`} />
                  <span className="font-bold text-sm uppercase tracking-wider font-tech">DAYLIGHT PATROL CONSOLE (BLUE & WHITE)</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-80 font-sans">
                  Daytime high-contrast display with white background and tactical blue accents. Resolves excessive glare under solar exposure.
                </p>
              </button>
            </div>
        </div>

        <div className={`rounded-2xl p-6 border shadow-xl transition-all ${
          theme === 'light' 
            ? 'bg-white border-blue-200 shadow-blue-500/5' 
            : 'glass border-white/5 shadow-2xl'
        }`}>
            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 font-tech ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                <ShieldCheck className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-emerald-400'}`} />
                COMMUNICATION PACE PROTOCOL
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { label: 'PRIMARY', key: 'primary', icon: Wifi },
                    { label: 'ALTERNATE', key: 'alternate', icon: Satellite },
                    { label: 'CONTINGENCY', key: 'contingency', icon: Radio },
                    { label: 'EMERGENCY', key: 'emergency', icon: ShieldCheck }
                ].map(item => (
                    <div key={item.key} className={`p-4 rounded-xl border ${
                      theme === 'light' 
                        ? 'bg-slate-50 border-blue-100' 
                        : 'bg-white/5 border-white/10'
                    }`}>
                        <label className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${theme === 'light' ? 'text-blue-800' : 'text-slate-400'}`}>
                             <item.icon className="w-3 h-3"/> {item.label} CHANNEL
                        </label>
                        <select 
                            value={paceConfig[item.key as keyof typeof paceConfig]}
                            onChange={(e) => setPaceConfig({...paceConfig, [item.key]: e.target.value})}
                            className={`w-full p-2 rounded border text-sm font-mono focus:outline-none ${
                              theme === 'light' 
                                ? 'bg-white text-slate-800 border-slate-200 focus:border-blue-500' 
                                : 'bg-black/40 text-white border-white/10 focus:border-cyan-500'
                            }`}
                        >
                            <option>5G/LTE</option>
                            <option>Starlink DTC</option>
                            <option>Beartooth Radio</option>
                            <option>Manual/Satellite</option>
                        </select>
                    </div>
                ))}
            </div>
            <button className={`mt-8 px-8 py-3 rounded-lg font-bold transition-all font-tech tracking-wider uppercase text-sm ${
              theme === 'light' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-200'
            }`}>SAVE PACE CONFIG</button>
        </div>

        {/* Tactical Cryptographic Keys & Integrated Platform Status */}
        <div className={`rounded-2xl p-6 border mb-8 shadow-xl transition-all ${
          theme === 'light' 
            ? 'bg-white border-blue-200 shadow-blue-500/5' 
            : 'glass border-white/5 shadow-2xl'
        }`}>
            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 font-tech ${theme === 'light' ? 'text-blue-900 border-b border-blue-50 pb-2' : 'text-white'}`}>
                <Key className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-cyan-400'}`} />
                TACTICAL SOVEREIGN INTEGRATION & CORE CRYPTO KEYS
            </h3>
            
            <p className={`text-xs mb-6 max-w-2xl font-mono leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Verify active hardware, geolocation, and photogrammetry key authorization statuses. These cryptographic credentials unlock tactical systems on Ruggedized Android and sovereign server-side loops.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Google Maps Key status card */}
              <div className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                theme === 'light' 
                  ? 'bg-slate-50 border-blue-100 shadow-sm' 
                  : 'bg-black/35 border-white/5 shadow-inner'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black tracking-widest font-mono text-slate-500">PLATFORM MAPS KEY</span>
                    {loadingKeys ? (
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
                    ) : keysStatus.GOOGLE_MAPS_PLATFORM_KEY ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> SECURE_MISSING</span>
                    )}
                  </div>
                  <h4 className="text-xs font-black tracking-wider uppercase mb-1 font-tech">GOOGLE_MAPS_PLATFORM_KEY</h4>
                  <p className="text-[10px] font-mono leading-relaxed opacity-70">
                    Powers server-side high-resolution text searches, localized bias filters, and real-time precinct boundary lookup services.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-mono opacity-50">STATUS:</span>
                  <span className={`text-[9px] font-mono font-bold ${keysStatus.GOOGLE_MAPS_PLATFORM_KEY ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {keysStatus.GOOGLE_MAPS_PLATFORM_KEY ? "DECRYPTED & INJECTED" : "RESERVED (REQUIRES ENTRY)"}
                  </span>
                </div>
              </div>

              {/* Photogrammetry Key status card */}
              <div className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                theme === 'light' 
                  ? 'bg-slate-50 border-blue-100 shadow-sm' 
                  : 'bg-black/35 border-white/5 shadow-inner'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black tracking-widest font-mono text-slate-500">3D RECON KEY</span>
                    {loadingKeys ? (
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
                    ) : keysStatus.PHOTOGRAMMETRY_API_KEY ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> SECURE_MISSING</span>
                    )}
                  </div>
                  <h4 className="text-xs font-black tracking-wider uppercase mb-1 font-tech">PHOTOGRAMMETRY_API_KEY</h4>
                  <p className="text-[10px] font-mono leading-relaxed opacity-70">
                    Powers tactical 3D forensics scene modeling and depth cloud mapping arrays across active field incident zones.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-mono opacity-50">STATUS:</span>
                  <span className={`text-[9px] font-mono font-bold ${keysStatus.PHOTOGRAMMETRY_API_KEY ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {keysStatus.PHOTOGRAMMETRY_API_KEY ? "DECRYPTED & INJECTED" : "RESERVED (REQUIRES ENTRY)"}
                  </span>
                </div>
              </div>

              {/* Gemini Key status card */}
              <div className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                theme === 'light' 
                  ? 'bg-slate-50 border-blue-100 shadow-sm' 
                  : 'bg-black/35 border-white/5 shadow-inner'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black tracking-widest font-mono text-slate-500">TACTICAL AI CORE KEY</span>
                    {loadingKeys ? (
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
                    ) : keysStatus.GEMINI_API_KEY ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> SECURE_MISSING</span>
                    )}
                  </div>
                  <h4 className="text-xs font-black tracking-wider uppercase mb-1 font-tech">GEMINI_API_KEY</h4>
                  <p className="text-[10px] font-mono leading-relaxed opacity-70">
                    Powers the core sovereign cognitive scanner, voice transcription modules, and auto-generative tactical reports.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-mono opacity-50">STATUS:</span>
                  <span className={`text-[9px] font-mono font-bold ${keysStatus.GEMINI_API_KEY ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {keysStatus.GEMINI_API_KEY ? "DECRYPTED & INJECTED" : "RESERVED (REQUIRES ENTRY)"}
                  </span>
                </div>
              </div>
            </div>
        </div>

        {/* Tactical Android Native Environment Console */}
        <div className={`mt-8 rounded-2xl p-6 border shadow-xl transition-all ${
          theme === 'light' 
            ? 'bg-white border-blue-200 shadow-blue-500/5' 
            : 'glass border-white/5 shadow-2xl'
        }`}>
            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 font-tech ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                <Smartphone className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-cyan-400'}`} />
                NATIVE ANDROID COMPILATION & APK PIPELINE
            </h3>

            <p className={`text-xs mb-6 max-w-3xl font-mono leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              The tactical super app has been packaged with a full native Capacitor wrapper configured for ruggedized Android platforms.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Package Specifications */}
                <div className={`p-5 rounded-xl border flex flex-col justify-between ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/35 border-white/5'
                }`}>
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu className="w-4 h-4 text-cyan-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wider font-tech">APK ENGINE METRIC DATA</span>
                        </div>
                        <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="opacity-60">APP NAME</span>
                                <span className="font-bold">POLICECOMS AI 3.1</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="opacity-60">PACKAGE ID</span>
                                <span className="font-bold text-cyan-400">ph.safer.policecoms</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="opacity-60">TARGET SDK</span>
                                <span>Android 14 (API 34)</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="opacity-60">NATIVE BRIDGE</span>
                                <span>Capacitor 6.x Wrapper</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="opacity-60">MANIFEST PERMS</span>
                                <span className="text-right text-[10px] text-emerald-400 font-sans font-semibold">
                                  CAMERA, RECORD_AUDIO, FINE/COARSE GPS
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <span className="text-[10px] text-slate-500 font-mono uppercase block mb-2">LOCAL WORKFLOW RECIPE:</span>
                        <div className="p-3 bg-black/80 rounded-lg text-[11px] text-cyan-300 font-mono border border-white/10 space-y-1 overflow-x-auto">
                            <p className="text-slate-500"># Compiles full native release build on native workstation</p>
                            <p><span className="text-yellow-400">npm run</span> build</p>
                            <p><span className="text-yellow-400">npx cap</span> sync</p>
                            <p><span className="text-yellow-400">cd android &&</span> ./gradlew assembleDebug</p>
                        </div>
                    </div>
                </div>

                {/* Instant Action Panel */}
                <div className={`p-5 rounded-xl border flex flex-col justify-between items-center text-center ${
                  theme === 'light' ? 'bg-blue-50/50 border-blue-100' : 'bg-cyan-950/10 border-cyan-500/10'
                }`}>
                    <div className="my-auto py-6">
                        <div className={`inline-flex p-4 rounded-full mb-4 bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 animate-pulse`}>
                            <Smartphone className="w-10 h-10" />
                        </div>
                        <h4 className="text-sm font-bold tracking-wider font-tech mb-2 uppercase">POLICECOMS-AI-3.1.APK</h4>
                        <p className={`text-xs max-w-xs mx-auto mb-6 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                            Deploy the latest runtime bundle configured for field terminals. Tap the trigger to stream local configuration immediately.
                        </p>

                        <button 
                            onClick={handleDownloadAPK}
                            disabled={downloading}
                            className={`px-8 py-3.5 rounded-xl font-bold font-tech tracking-wider uppercase text-xs flex items-center justify-center gap-2.5 mx-auto transition-all shadow-xl shadow-cyan-500/10 cursor-pointer ${
                              downloading 
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 animate-pulse'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-black font-semibold'
                            }`}
                        >
                            <Download className="w-4 h-4" />
                            {downloading ? 'FETCHING PACKAGE...' : 'DOWNLOAD ANDROID APK'}
                        </button>
                    </div>

                    <div className="w-full mt-4 text-[10px] opacity-60 font-mono border-t border-white/5 pt-3">
                        READY TO DEPLOY • SECURED WITH SAMSUNG KNOX INTEGRATION
                    </div>
                </div>
            </div>
        </div>

        {showBuildModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className={`relative w-full max-w-2xl rounded-2xl border p-6 shadow-2xl transition-all ${
              theme === 'light' 
                ? 'bg-white border-blue-200 text-slate-800 shadow-blue-500/10' 
                : 'bg-slate-900 border-white/10 text-white shadow-cyan-500/10'
            }`}>
              <button 
                onClick={() => setShowBuildModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-500 rounded-xl">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-tech tracking-wider uppercase mb-1">
                    ENVIRONMENT COMPILER RESTRICTION
                  </h3>
                  <p className={`text-[10px] font-mono font-bold ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`}>
                    SANDBOX ACCESS CONTROL SECURITY LOG
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border mb-6 text-xs leading-relaxed font-sans ${
                theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-black/30 border-white/5 text-slate-350'
              }`}>
                Please note that compiling standard Android binary packages (<span className="font-semibold text-cyan-400 font-mono">.apk</span>) requires native hardware compilers (such as <span className="font-semibold">Java 17 Development Kit</span>, <span className="font-semibold">Android SDK</span>, and the <span className="font-semibold">Gradle Building Suite</span>). 
                <br /><br />
                Because our application operates in a secured, zero-latency sovereign cloud editor sandbox, native APK compilation is prohibited on Cloud Run. To deploy this applet to physical ruggedized Android tablets/mobile devices, perform local packaging:
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold font-mono">1</span>
                    <span className="text-xs font-bold uppercase tracking-wider font-tech">Export Source Directory</span>
                  </div>
                  <p className={`text-xs ml-7 leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Use the standard export suite inside AI Studio. Click the <span className="font-bold">Settings (gear icon)</span> in the top-right toolbar of your editor and select <span className="font-bold underline text-cyan-400">Export to ZIP</span>.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold font-mono">2</span>
                    <span className="text-xs font-bold uppercase tracking-wider font-tech flex justify-between w-full">
                      Workstation Local Compile
                      <button 
                        onClick={copyCommands}
                        className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1 normal-case cursor-pointer bg-transparent border-none outline-none"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'CONSOL COPY SUCCESS' : 'COPY SHELL RECIPE'}
                      </button>
                    </span>
                  </div>
                  
                  <div className="ml-7 p-3 bg-black/90 text-cyan-400 font-mono rounded-lg border border-white/10 text-[11px] space-y-1 overflow-x-auto relative group">
                    <p className="text-slate-500"># Navigate to unzipped source and initialize compilation</p>
                    <p>npm install</p>
                    <p>npm run build</p>
                    <p>npm run cap:sync</p>
                    <p className="text-slate-500"># Compile Android APK via Gradle wrapper</p>
                    <p>cd android</p>
                    <p>chmod +x gradlew</p>
                    <p>./gradlew assembleDebug</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold font-mono">3</span>
                    <span className="text-xs font-bold uppercase tracking-wider font-tech">Deploy & Install Package</span>
                  </div>
                  <p className={`text-xs ml-7 leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Locate the newly-generated APK at <code className="font-mono bg-black/20 dark:bg-black/40 px-1 py-0.5 rounded text-cyan-400">android/app/build/outputs/apk/debug/app-debug.apk</code> and install it directly via USB (with Developer Debugging enabled) or standard on-device transfers. Refer to <code className="font-mono text-cyan-450">ANDROID_BUILD_GUIDE.md</code> for physical key registration.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap gap-3 justify-end items-center">
                <button 
                  onClick={() => {
                    const element = document.createElement('a');
                    element.href = '/api/download-apk';
                    element.setAttribute('download', 'policecoms-ai-3.1.apk');
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className={`px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    theme === 'light' 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Download Offline Manifesto
                </button>
                <button 
                  onClick={() => setShowBuildModal(false)}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold uppercase tracking-wider text-xs font-tech cursor-pointer transition-colors"
                >
                  Acknowledge & Confirm
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SettingsView;
