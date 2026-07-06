
import React, { useState, useRef, useEffect } from 'react';
import { Car, Camera, ScanLine, AlertTriangle, CheckCircle, FileText, Search, Printer, X, Plus, Trash2, Clock, Calendar, MapPin, User, ChevronDown, CarFront, CloudRain, ShieldAlert, Upload, Mic, Loader2, CreditCard, Sparkles, RefreshCw } from 'lucide-react';
import { analyzeImage, transcribeUserAudio, generateTextResponse } from './services/geminiService';

const MOCK_HOTLIST = ['ABC-1234', 'XYZ-9988', 'NTA-1029'];

const VIOLATION_CODES = [
    { code: '001', type: 'Disregarding Traffic Sign', amount: 1500 },
    { code: '002', type: 'Obstruction', amount: 200 },
    { code: '003', type: 'No Helmet', amount: 1500 },
    { code: '004', type: 'Illegal Parking', amount: 1000 },
    { code: '005', type: 'Number Coding', amount: 500 },
    { code: '006', type: 'Reckless Driving', amount: 2000 },
    { code: '007', type: 'Driving w/o License', amount: 3000 },
    { code: '008', type: 'Unregistered Vehicle', amount: 10000 },
];

interface ViolationItem {
    id: string;
    code: string;
    type: string;
    amount: number;
}

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]); 
        } else {
            reject(new Error("Failed to convert blob"));
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const TrafficEnforcementView: React.FC = () => {
    const [mode, setMode] = useState<'SCAN' | 'TICKET' | 'ACCIDENT'>('SCAN');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{plate: string, status: string, make?: string} | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Voice Input State
    const [activeField, setActiveField] = useState<string | null>(null);
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [isSmartFilling, setIsSmartFilling] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // License Scan State
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [licenseSide, setLicenseSide] = useState<'FRONT' | 'BACK'>('FRONT');
    const [licenseImages, setLicenseImages] = useState<{front: string | null, back: string | null}>({ front: null, back: null });
    const [processingLicense, setProcessingLicense] = useState(false);

    // UOVR Form State
    const [uovrData, setUovrData] = useState({
        city: 'QUEZON CITY',
        uovrNo: `QCT-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
        driverLastName: '',
        driverFirstName: '',
        driverMiddleName: '',
        driverDob: '',
        driverAddress: '',
        licenseNo: '',
        plateNo: '',
        mvFileNo: '',
        vehicleOwner: '',
        ownerAddress: '',
        ownership: 'PRIVATE',
        vehicleType: '03-CAR',
        date: new Date().toISOString().split('T')[0],
        timeStarted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        timeFinished: '',
        dlConfiscated: false,
        plateConfiscated: false,
        towed: false,
        impounded: false,
        street: '',
        municipality: 'QUEZON CITY',
        officerName: 'SGT. J. DOE',
        officerUnit: 'TPMO SECTOR 1',
        deputationNr: 'D-9921'
    });

    // Accident Report State
    const [tairData, setTairData] = useState({
        id: `TAIR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        dtpo: new Date().toLocaleString(),
        location: '',
        weather: 'Clear',
        roadCondition: 'Dry / Paved',
        partyA: { name: '', license: '', plate: '', insurance: '', insurancePolicy: '', damage: '' },
        partyB: { name: '', license: '', plate: '', insurance: '', insurancePolicy: '', damage: '' },
        sketch: null as string | null,
        narrative: '',
        aiAnalysis: ''
    });
    const [analyzingAccident, setAnalyzingAccident] = useState(false);

    const [violations, setViolations] = useState<ViolationItem[]>([]);
    const [selectedViolationCode, setSelectedViolationCode] = useState('');

    const startCamera = async (force: boolean = false) => {
        if (!force && mode === 'TICKET' && !showLicenseModal) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.error("Camera error", e);
        }
    };

    useEffect(() => {
        if (mode === 'SCAN' || showLicenseModal) {
            startCamera(true);
        } else {
            // Stop camera when not needed
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        }
    }, [mode, showLicenseModal]);

    const handleVoiceInput = async (field: string) => {
        if (activeField === field && isRecordingVoice) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            return;
        }

        if (activeField !== null) return; // Busy

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                setIsRecordingVoice(false);
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                
                try {
                    const base64 = await blobToBase64(blob);
                    const text = await transcribeUserAudio(base64);
                    if (text) {
                        setUovrData(prev => ({
                            ...prev,
                            [field]: text.replace(/[.]/g, '').toUpperCase().trim()
                        }));
                    }
                } catch (e) {
                    console.error("Transcription failed", e);
                } finally {
                    setActiveField(null);
                    stream.getTracks().forEach(t => t.stop());
                }
            };

            recorder.start();
            setIsRecordingVoice(true);
            setActiveField(field);
        } catch (e) {
            console.error("Mic error", e);
            alert("Microphone access denied.");
        }
    };

    const handleSmartVoiceFill = async () => {
        if (isSmartFilling) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                setIsSmartFilling(false);
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                
                try {
                    const base64 = await blobToBase64(blob);
                    const text = await transcribeUserAudio(base64);
                    
                    if (text) {
                        // AI Parsing Logic
                        const prompt = `
                            Parse the following traffic police dictation into a JSON object to populate a ticket/report.
                            Dictation: "${text}"
                            
                            Target JSON Format (UOVR):
                            {
                                "driverFirstName": string,
                                "driverLastName": string,
                                "driverMiddleName": string,
                                "driverAddress": string,
                                "licenseNo": string,
                                "plateNo": string,
                                "vehicleOwner": string,
                                "vehicleType": string
                            }
                            
                            If a field is not mentioned, exclude it or set to empty string. Return ONLY valid JSON.
                        `;
                        
                        const jsonStr = await generateTextResponse(prompt, 'gemini-2.5-flash', true);
                        const parsed = JSON.parse(jsonStr);
                        
                        setUovrData(prev => ({
                            ...prev,
                            ...parsed,
                            // Ensure uppercase for standard form
                            driverFirstName: (parsed.driverFirstName || prev.driverFirstName).toUpperCase(),
                            driverLastName: (parsed.driverLastName || prev.driverLastName).toUpperCase(),
                            plateNo: (parsed.plateNo || prev.plateNo).toUpperCase(),
                            licenseNo: (parsed.licenseNo || prev.licenseNo).toUpperCase()
                        }));
                    }
                } catch (e) {
                    console.error("Smart fill failed", e);
                    alert("Could not process audio. Try again.");
                } finally {
                    stream.getTracks().forEach(t => t.stop());
                }
            };

            recorder.start();
            setIsSmartFilling(true);
        } catch (e) {
            console.error("Mic error", e);
        }
    };

    const handleLicenseScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        // Capture logic
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        if (ctx) ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        
        if (licenseSide === 'FRONT') {
            setLicenseImages(prev => ({ ...prev, front: dataUrl }));
            setLicenseSide('BACK'); // Auto switch to back
        } else {
            setLicenseImages(prev => ({ ...prev, back: dataUrl }));
            // Process immediately after back capture
            await processLicenseData(licenseImages.front, dataUrl);
            setShowLicenseModal(false);
            setLicenseSide('FRONT');
        }
    };

    const processLicenseData = async (frontImg: string | null, backImg: string) => {
        if (!frontImg) return; // Need front at minimum
        setProcessingLicense(true);
        
        try {
            const base64Front = frontImg.split(',')[1];
            
            const prompt = `
                Analyze this Driver's License image (Front). Extract the following details into a JSON object:
                - driverFirstName
                - driverLastName
                - driverMiddleName
                - driverAddress
                - driverDob (YYYY-MM-DD format)
                - licenseNo
                
                Ensure all text is UPPERCASE. If a field is not visible, return empty string.
            `;
            
            const jsonStr = await generateTextResponse(prompt, 'gemini-2.5-flash', true); // Assuming modify service to accept this or use analyzeImage logic
            // Note: generateTextResponse strictly handles text-to-text. We need analyzeImage equivalent that returns JSON. 
            // Reuse analyzeImage but parse result since analyzeImage returns string.
            const resultText = await analyzeImage(base64Front, prompt);
            
            // Clean markdown json if present
            const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            setUovrData(prev => ({
                ...prev,
                ...parsed
            }));

        } catch (e) {
            console.error("License scan error", e);
            alert("OCR Failed. Please retake or enter manually.");
        } finally {
            setProcessingLicense(false);
        }
    };

    const handleScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setScanning(true);

        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        if (ctx) ctx.drawImage(videoRef.current, 0, 0);
        
        const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        setCapturedImage(canvasRef.current.toDataURL('image/jpeg'));

        const prompt = `Look for a vehicle license plate in this image. 
        Return ONLY the license plate characters in uppercase text. 
        If no plate is found, return "NO_PLATE". 
        Do not add any other text.`;

        const result = await analyzeImage(base64, prompt);
        const cleanPlate = result.replace(/[^A-Z0-9-]/g, '').trim();

        if (cleanPlate && cleanPlate !== 'NO_PLATE') {
            const isHot = MOCK_HOTLIST.includes(cleanPlate);
            setScanResult({
                plate: cleanPlate,
                status: isHot ? 'STOLEN / WANTED' : 'CLEAR',
                make: 'Vehicle' 
            });
            
            // Auto-fill ticket
            setUovrData(prev => ({ ...prev, plateNo: cleanPlate }));
        } else {
            setScanResult({ plate: 'NO READ', status: 'UNKNOWN' });
        }

        setScanning(false);
    };

    const resetScan = () => {
        setScanResult(null);
        setCapturedImage(null);
        startCamera(true);
    };

    const handleAddViolation = () => {
        const v = VIOLATION_CODES.find(v => v.code === selectedViolationCode);
        if (v) {
            setViolations(prev => [...prev, { ...v, id: Date.now().toString() }]);
            setSelectedViolationCode('');
        }
    };

    const removeViolation = (id: string) => {
        setViolations(prev => prev.filter(v => v.id !== id));
    };

    const totalAmount = violations.reduce((sum, v) => sum + v.amount, 0);

    const issueTicket = () => {
        // Set Time Finished automatically on issue
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        setUovrData(prev => ({ ...prev, timeFinished: now }));
        
        setTimeout(() => {
            alert(`UOVR #${uovrData.uovrNo} ISSUED. Total Fine: PHP ${totalAmount}`);
            setMode('SCAN');
            resetScan();
            setViolations([]);
        }, 500);
    };

    // --- ACCIDENT LOGIC ---
    const handleAccidentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Str = reader.result as string;
                setTairData(prev => ({ ...prev, sketch: base64Str }));
                await analyzeAccidentImage(base64Str.split(',')[1]);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeAccidentImage = async (base64: string) => {
        setAnalyzingAccident(true);
        const prompt = `Analyze this traffic accident image for an insurance report.
        1. Describe visible damage to vehicles (Part A/Part B).
        2. Identify point of impact.
        3. Estimate severity (Minor/Moderate/Total).
        4. Note any visible road conditions or weather.
        
        Format as a professional police narrative.`;

        const result = await analyzeImage(base64, prompt);
        setTairData(prev => ({ 
            ...prev, 
            aiAnalysis: result,
            narrative: result // Auto-fill narrative
        }));
        setAnalyzingAccident(false);
    };

    const submitAccidentReport = () => {
        alert(`Traffic Accident Investigation Report #${tairData.id} Submitted to Insurance & Legal.`);
        setMode('SCAN');
    };

    // Helper Component for Voice Inputs
    const VoiceInput = ({ 
        value, 
        onChange, 
        placeholder, 
        fieldId, 
        className 
    }: { value: string, onChange: (val: string) => void, placeholder: string, fieldId: string, className?: string }) => (
        <div className={`relative ${className || ''}`}>
            <input 
                type="text" 
                placeholder={placeholder} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full uppercase text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none pr-7" 
            />
            <button 
                onClick={() => handleVoiceInput(fieldId)} 
                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 p-1"
                title="Voice Input"
            >
                {activeField === fieldId ? (
                    isRecordingVoice ? (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    ) : (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    )
                ) : (
                    <Mic className="w-3 h-3" />
                )}
            </button>
        </div>
    );

    return (
        <div className="h-full bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-2 md:p-3 flex flex-col md:flex-row justify-between items-center sm:items-start md:items-center min-h-16 h-auto py-2 gap-3 shrink-0 z-20">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="w-8 h-8 bg-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center border border-blue-500/30 shrink-0">
                        <Car className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-black text-white text-base tracking-tight truncate uppercase">Traffic Management</h1>
                        <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider truncate">Uniform Ordinance Violation</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setMode('SCAN')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${mode === 'SCAN' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
                    >
                        ALPR SCAN
                    </button>
                    <button 
                        onClick={() => setMode('TICKET')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${mode === 'TICKET' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
                    >
                        UOVR FORM
                    </button>
                    <button 
                        onClick={() => setMode('ACCIDENT')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${mode === 'ACCIDENT' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
                    >
                        ACCIDENT
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {mode === 'SCAN' && (
                    <div className="h-full relative flex flex-col">
                        <div className="flex-1 relative bg-black">
                            {!capturedImage ? (
                                <>
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                    {/* Scanning Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-64 h-32 border-2 border-blue-400/50 rounded-lg relative">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500"></div>
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500"></div>
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500"></div>
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500"></div>
                                            {scanning && <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-pulse"></div>}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                                        <button 
                                            onClick={handleScan}
                                            disabled={scanning}
                                            className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center active:scale-95 transition-all shadow-lg"
                                        >
                                            <ScanLine className="w-8 h-8 text-slate-900" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center p-6 relative">
                                    <img src={capturedImage} alt="Capture" className="max-w-full max-h-[50vh] rounded-lg border border-slate-600 mb-6" />
                                    
                                    {scanResult && (
                                        <div className={`w-full max-w-md p-6 rounded-xl border-2 ${scanResult.status === 'CLEAR' ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'} backdrop-blur-md`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-xs text-slate-400 font-bold uppercase">License Plate</div>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${scanResult.status === 'CLEAR' ? 'bg-green-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
                                                    {scanResult.status}
                                                </div>
                                            </div>
                                            <div className="text-4xl font-mono font-black text-white tracking-widest mb-4">
                                                {scanResult.plate}
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={resetScan} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm">
                                                    SCAN AGAIN
                                                </button>
                                                <button onClick={() => setMode('TICKET')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                                                    <FileText className="w-4 h-4" /> CREATE UOVR
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                {mode === 'TICKET' && (
                    // --- UOVR FORM ---
                    <div className="h-full overflow-y-auto p-4 bg-slate-950">
                        {/* Dark Tactical Theme */}
                        <div className="max-w-3xl mx-auto bg-slate-900 text-slate-200 border border-slate-800 rounded-sm shadow-2xl overflow-hidden font-sans text-xs">
                            
                            {/* HEADER */}
                            <div className="bg-slate-950 text-white p-4 flex justify-between items-start border-b border-slate-700">
                                <div>
                                    <div className="font-black text-lg tracking-widest">UNIFORM ORDINANCE VIOLATION RECEIPT</div>
                                    <div className="font-bold opacity-80 text-slate-400">{uovrData.city}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold opacity-70 text-slate-500">UOVR NO.</div>
                                    <div className="text-xl font-mono font-black text-red-500">{uovrData.uovrNo}</div>
                                </div>
                            </div>

                            {/* SMART ACTIONS */}
                            <div className="p-3 bg-slate-800/50 border-b border-slate-700 flex gap-2 overflow-x-auto">
                                <button 
                                    onClick={handleSmartVoiceFill}
                                    className={`px-3 py-2 rounded flex items-center gap-2 text-xs font-bold transition-all ${
                                        isSmartFilling 
                                        ? 'bg-red-600 text-white animate-pulse' 
                                        : 'bg-blue-600 text-white hover:bg-blue-500'
                                    }`}
                                >
                                    {isSmartFilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
                                    {isSmartFilling ? 'LISTENING...' : 'SMART VOICE FILL'}
                                </button>
                                <button 
                                    onClick={() => { setShowLicenseModal(true); setLicenseSide('FRONT'); }}
                                    className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 flex items-center gap-2 text-xs font-bold"
                                >
                                    <CreditCard className="w-3 h-3" /> SCAN LICENSE
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                
                                {/* DRIVER INFO */}
                                <div className="border border-slate-700 rounded p-3 bg-slate-800/50 relative">
                                    {processingLicense && (
                                        <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center rounded">
                                            <Sparkles className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                                            <span className="text-xs font-bold text-blue-300">EXTRACTING LICENSE DATA...</span>
                                        </div>
                                    )}
                                    <div className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1 flex items-center gap-2">
                                        <User className="w-3 h-3" /> NAME OF DRIVER
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        <VoiceInput 
                                            placeholder="LAST NAME" 
                                            value={uovrData.driverLastName} 
                                            onChange={val => setUovrData({...uovrData, driverLastName: val})} 
                                            fieldId="driverLastName"
                                        />
                                        <VoiceInput 
                                            placeholder="FIRST NAME" 
                                            value={uovrData.driverFirstName} 
                                            onChange={val => setUovrData({...uovrData, driverFirstName: val})} 
                                            fieldId="driverFirstName"
                                        />
                                        <VoiceInput 
                                            placeholder="MIDDLE NAME" 
                                            value={uovrData.driverMiddleName} 
                                            onChange={val => setUovrData({...uovrData, driverMiddleName: val})} 
                                            fieldId="driverMiddleName"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                        <div className="col-span-2">
                                            <div className="text-[10px] text-slate-500 font-bold">ADDRESS</div>
                                            <VoiceInput 
                                                placeholder=""
                                                value={uovrData.driverAddress} 
                                                onChange={val => setUovrData({...uovrData, driverAddress: val})} 
                                                fieldId="driverAddress"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold">DATE OF BIRTH</div>
                                            <input type="date" value={uovrData.driverDob} onChange={e => setUovrData({...uovrData, driverDob: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full uppercase text-xs text-white focus:border-blue-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold">LICENSE NO.</div>
                                            <VoiceInput 
                                                placeholder=""
                                                value={uovrData.licenseNo} 
                                                onChange={val => setUovrData({...uovrData, licenseNo: val})} 
                                                fieldId="licenseNo"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* VEHICLE INFO */}
                                <div className="border border-slate-700 rounded p-3 bg-slate-800/50">
                                    <div className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1 flex items-center gap-2">
                                        <Car className="w-3 h-3" /> VEHICLE & OWNERSHIP
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold">PLATE NO.</div>
                                            <VoiceInput 
                                                placeholder=""
                                                value={uovrData.plateNo} 
                                                onChange={val => setUovrData({...uovrData, plateNo: val})} 
                                                fieldId="plateNo"
                                                className="bg-yellow-900/20 text-yellow-400 border border-yellow-700"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold">MV FILE NO.</div>
                                            <input type="text" value={uovrData.mvFileNo} onChange={e => setUovrData({...uovrData, mvFileNo: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full uppercase text-xs text-white focus:border-blue-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold">VEHICLE OWNER</div>
                                            <VoiceInput 
                                                placeholder=""
                                                value={uovrData.vehicleOwner} 
                                                onChange={val => setUovrData({...uovrData, vehicleOwner: val})} 
                                                fieldId="vehicleOwner"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold">OWNER ADDRESS</div>
                                            <VoiceInput 
                                                placeholder=""
                                                value={uovrData.ownerAddress} 
                                                onChange={val => setUovrData({...uovrData, ownerAddress: val})} 
                                                fieldId="ownerAddress"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* APPREHENSION DETAILS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-slate-700 rounded p-3 bg-slate-800/50">
                                        <div className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1">DETAILS OF APPREHENSION</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold">OWNERSHIP</div>
                                                <select value={uovrData.ownership} onChange={e => setUovrData({...uovrData, ownership: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full text-xs text-white focus:border-blue-500 focus:outline-none">
                                                    <option>PUBLIC</option>
                                                    <option>PRIVATE</option>
                                                    <option>GOVT</option>
                                                </select>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold">VEHICLE TYPE</div>
                                                <select value={uovrData.vehicleType} onChange={e => setUovrData({...uovrData, vehicleType: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full text-xs text-white focus:border-blue-500 focus:outline-none">
                                                    <option>01-PUB</option>
                                                    <option>02-PUJ</option>
                                                    <option>03-CAR</option>
                                                    <option>04-MOTORCYCLE</option>
                                                    <option>05-TAXI</option>
                                                    <option>06-TRAILER</option>
                                                    <option>07-TRICYCLE</option>
                                                    <option>08-VAN</option>
                                                    <option>09-TRUCK</option>
                                                    <option>10-OTHERS</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                                            <label className="flex items-center gap-2 cursor-pointer border border-slate-700 p-1.5 rounded hover:bg-slate-700/80">
                                                <input type="checkbox" checked={uovrData.dlConfiscated} onChange={e => setUovrData({...uovrData, dlConfiscated: e.target.checked})} className="accent-blue-500" />
                                                DL CONFISCATED
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer border border-slate-700 p-1.5 rounded hover:bg-slate-700/80">
                                                <input type="checkbox" checked={uovrData.plateConfiscated} onChange={e => setUovrData({...uovrData, plateConfiscated: e.target.checked})} className="accent-blue-500" />
                                                PLATE CONFISCATED
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer border border-slate-700 p-1.5 rounded hover:bg-slate-700/80">
                                                <input type="checkbox" checked={uovrData.towed} onChange={e => setUovrData({...uovrData, towed: e.target.checked})} className="accent-blue-500" />
                                                TOWED
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer border border-slate-700 p-1.5 rounded hover:bg-slate-700/80">
                                                <input type="checkbox" checked={uovrData.impounded} onChange={e => setUovrData({...uovrData, impounded: e.target.checked})} className="accent-blue-500" />
                                                IMPOUNDED
                                            </label>
                                        </div>
                                    </div>

                                    <div className="border border-slate-700 rounded p-3 bg-slate-800/50 flex flex-col">
                                        <div className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1">AOR / TIME & PLACE</div>
                                        <div className="space-y-2 flex-1">
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <div className="text-[10px] text-slate-500 font-bold">DATE</div>
                                                    <input type="date" value={uovrData.date} disabled className="bg-slate-900 border border-slate-700 p-1.5 rounded w-full text-xs text-slate-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[10px] text-slate-500 font-bold">TIME STARTED</div>
                                                    <input type="text" value={uovrData.timeStarted} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full text-xs text-white focus:border-blue-500 focus:outline-none" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[10px] text-slate-500 font-bold">TIME FINISHED</div>
                                                    <input type="text" placeholder="AUTO" value={uovrData.timeFinished} disabled className="bg-slate-900 border border-slate-700 p-1.5 rounded w-full text-xs text-slate-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold">LOCATION (STREET / CITY)</div>
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="STREET" value={uovrData.street} onChange={e => setUovrData({...uovrData, street: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full uppercase text-xs text-white focus:border-blue-500 focus:outline-none" />
                                                    <input type="text" placeholder="CITY" value={uovrData.municipality} onChange={e => setUovrData({...uovrData, municipality: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-1/2 uppercase text-xs text-white focus:border-blue-500 focus:outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* VIOLATIONS */}
                                <div className="border border-slate-700 rounded p-3 bg-slate-800/50">
                                    <div className="font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1 flex justify-between items-center">
                                        <span>VIOLATIONS</span>
                                        <div className="flex gap-2">
                                            <select 
                                                value={selectedViolationCode}
                                                onChange={e => setSelectedViolationCode(e.target.value)}
                                                className="bg-slate-950 border border-slate-700 rounded text-xs p-1 w-48 text-white focus:border-blue-500 focus:outline-none"
                                            >
                                                <option value="">-- Select Violation --</option>
                                                {VIOLATION_CODES.map(v => (
                                                    <option key={v.code} value={v.code}>{v.code} - {v.type}</option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={handleAddViolation}
                                                disabled={!selectedViolationCode}
                                                className="bg-blue-600 text-white px-2 rounded hover:bg-blue-500 disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <table className="w-full text-left text-xs mb-2">
                                        <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-700">
                                            <tr>
                                                <th className="p-2">CODE</th>
                                                <th className="p-2">TYPE</th>
                                                <th className="p-2 text-right">AMOUNT</th>
                                                <th className="p-2 w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800 text-slate-300">
                                            {violations.map(v => (
                                                <tr key={v.id}>
                                                    <td className="p-2 font-mono text-slate-400">{v.code}</td>
                                                    <td className="p-2">{v.type}</td>
                                                    <td className="p-2 text-right font-mono">{v.amount.toLocaleString()}</td>
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => removeViolation(v.id)} className="text-red-500 hover:text-red-400">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {violations.length === 0 && (
                                                <tr><td colSpan={4} className="p-4 text-center text-slate-500 italic">No violations added</td></tr>
                                            )}
                                        </tbody>
                                        <tfoot className="border-t border-slate-700 bg-slate-900">
                                            <tr>
                                                <td colSpan={2} className="p-2 font-bold text-right text-slate-500">TOTAL AMOUNT:</td>
                                                <td className="p-2 font-black text-right text-lg text-white font-mono">PHP {totalAmount.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* FOOTER / OFFICER INFO */}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-bold">NAME AND UNIT OF APPREHENDING OFFICER</div>
                                        <input type="text" value={uovrData.officerName} onChange={e => setUovrData({...uovrData, officerName: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full uppercase font-bold text-sm text-white focus:border-blue-500 focus:outline-none" />
                                        <input type="text" value={uovrData.officerUnit} onChange={e => setUovrData({...uovrData, officerUnit: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full uppercase mt-1 text-xs text-white focus:border-blue-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-bold">DEPUTATION NR.</div>
                                        <input type="text" value={uovrData.deputationNr} onChange={e => setUovrData({...uovrData, deputationNr: e.target.value})} className="bg-slate-950 border border-slate-700 p-1.5 rounded w-full uppercase font-mono font-bold text-white focus:border-blue-500 focus:outline-none" />
                                        <div className="mt-4 border-t border-slate-600 text-center text-[10px] pt-1 text-slate-500">
                                            SIGNATURE
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="bg-slate-900 p-4 border-t border-slate-800 flex gap-3">
                                <button onClick={() => setMode('SCAN')} className="flex-1 py-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded font-bold">CANCEL</button>
                                <button onClick={issueTicket} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center justify-center gap-2 shadow-lg">
                                    <Printer className="w-4 h-4" /> ISSUE & PRINT
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'ACCIDENT' && (
                    // --- ACCIDENT REPORT FORM (INSURANCE COMPLIANT) ---
                    <div className="h-full overflow-y-auto p-4 bg-slate-950">
                        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                            
                            {/* FORM AREA */}
                            <div className="flex-1 p-6 space-y-6">
                                <div className="border-b border-slate-700 pb-4">
                                    <h2 className="text-white font-black text-xl flex items-center gap-2">
                                        <CarFront className="w-6 h-6 text-red-500" />
                                        TRAFFIC ACCIDENT INVESTIGATION REPORT
                                    </h2>
                                    <p className="text-slate-400 text-xs font-mono">INSURANCE & LEGAL COMPLIANT FORM • TAIR NO: {tairData.id}</p>
                                </div>

                                {/* Smart Actions for Accident */}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleSmartVoiceFill}
                                        className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold transition-all border ${
                                            isSmartFilling 
                                            ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {isSmartFilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
                                        SMART VOICE FILL
                                    </button>
                                </div>

                                {/* General Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Date & Time of Occurrence</label>
                                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <input type="text" value={tairData.dtpo} onChange={e => setTairData({...tairData, dtpo: e.target.value})} className="bg-transparent text-white text-sm w-full outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Place of Occurrence</label>
                                        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <input type="text" placeholder="Street / Intersection / City" value={tairData.location} onChange={e => setTairData({...tairData, location: e.target.value})} className="bg-transparent text-white text-sm w-full outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Environmental Factors */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Weather</label>
                                        <select value={tairData.weather} onChange={e => setTairData({...tairData, weather: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white">
                                            <option>Clear</option>
                                            <option>Cloudy</option>
                                            <option>Rainy</option>
                                            <option>Stormy</option>
                                            <option>Foggy</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Road Condition</label>
                                        <select value={tairData.roadCondition} onChange={e => setTairData({...tairData, roadCondition: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white">
                                            <option>Dry / Paved</option>
                                            <option>Wet / Slippery</option>
                                            <option>Under Construction</option>
                                            <option>Unpaved / Rough</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Parties Involved */}
                                <div className="space-y-4">
                                    {/* Party A */}
                                    <div className="bg-slate-800/50 p-4 rounded-lg border border-blue-900/30">
                                        <h3 className="text-blue-400 font-bold text-xs uppercase mb-3 border-b border-blue-900/30 pb-2">Party A (Vehicle 1)</h3>
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                            <input type="text" placeholder="Driver Name" className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyA.name} onChange={e => setTairData({...tairData, partyA: {...tairData.partyA, name: e.target.value}})} />
                                            <input type="text" placeholder="License No." className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyA.license} onChange={e => setTairData({...tairData, partyA: {...tairData.partyA, license: e.target.value}})} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 mb-2">
                                            <input type="text" placeholder="Plate No." className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyA.plate} onChange={e => setTairData({...tairData, partyA: {...tairData.partyA, plate: e.target.value}})} />
                                            <input type="text" placeholder="Insurance Co." className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyA.insurance} onChange={e => setTairData({...tairData, partyA: {...tairData.partyA, insurance: e.target.value}})} />
                                            <input type="text" placeholder="Policy No." className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyA.insurancePolicy} onChange={e => setTairData({...tairData, partyA: {...tairData.partyA, insurancePolicy: e.target.value}})} />
                                        </div>
                                        <textarea placeholder="Describe Damage (or use AI)" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white h-16 resize-none" value={tairData.partyA.damage} onChange={e => setTairData({...tairData, partyA: {...tairData.partyA, damage: e.target.value}})} />
                                    </div>

                                    {/* Party B */}
                                    <div className="bg-slate-800/50 p-4 rounded-lg border border-red-900/30">
                                        <h3 className="text-red-400 font-bold text-xs uppercase mb-3 border-b border-red-900/30 pb-2">Party B (Vehicle 2 / Pedestrian / Property)</h3>
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                            <input type="text" placeholder="Driver/Owner Name" className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyB.name} onChange={e => setTairData({...tairData, partyB: {...tairData.partyB, name: e.target.value}})} />
                                            <input type="text" placeholder="License No." className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyB.license} onChange={e => setTairData({...tairData, partyB: {...tairData.partyB, license: e.target.value}})} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 mb-2">
                                            <input type="text" placeholder="Plate No." className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyB.plate} onChange={e => setTairData({...tairData, partyB: {...tairData.partyB, plate: e.target.value}})} />
                                            <input type="text" placeholder="Insurance Co." className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyB.insurance} onChange={e => setTairData({...tairData, partyB: {...tairData.partyB, insurance: e.target.value}})} />
                                            <input type="text" placeholder="Policy No." className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={tairData.partyB.insurancePolicy} onChange={e => setTairData({...tairData, partyB: {...tairData.partyB, insurancePolicy: e.target.value}})} />
                                        </div>
                                        <textarea placeholder="Describe Damage (or use AI)" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white h-16 resize-none" value={tairData.partyB.damage} onChange={e => setTairData({...tairData, partyB: {...tairData.partyB, damage: e.target.value}})} />
                                    </div>
                                </div>

                                {/* Narrative */}
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Accident Narrative / Police Report</label>
                                    <textarea 
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-sm text-slate-300 font-mono h-40 focus:border-blue-500 outline-none"
                                        placeholder="Detailed account of the accident..."
                                        value={tairData.narrative}
                                        onChange={e => setTairData({...tairData, narrative: e.target.value})}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setMode('SCAN')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded font-bold">CANCEL</button>
                                    <button onClick={submitAccidentReport} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2">
                                        <Printer className="w-4 h-4" /> SUBMIT & PRINT
                                    </button>
                                </div>
                            </div>

                            {/* EVIDENCE / AI SIDEBAR */}
                            <div className="w-full md:w-80 bg-slate-950 border-l border-slate-800 p-6 flex flex-col gap-6">
                                <div>
                                    <h3 className="text-slate-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                        <Camera className="w-4 h-4" /> Visual Evidence
                                    </h3>
                                    
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-800 transition-all relative overflow-hidden"
                                    >
                                        {tairData.sketch ? (
                                            <img src={tairData.sketch} className="w-full h-full object-cover" alt="Evidence" />
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-slate-600 mb-2" />
                                                <span className="text-xs text-slate-500 font-bold">Upload Scene Photo</span>
                                                <span className="text-[9px] text-slate-600">Supports AI Analysis</span>
                                            </>
                                        )}
                                        {analyzingAccident && (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <span className="text-xs font-bold text-blue-400 animate-pulse">ANALYZING DAMAGE...</span>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAccidentImageUpload} />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                                        Capture wide shots showing position of vehicles and close-ups of damage.
                                    </p>
                                </div>

                                {tairData.aiAnalysis && (
                                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-y-auto">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                                            <ShieldAlert className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs font-bold text-purple-400">AI Damage Assessment</span>
                                        </div>
                                        <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                                            {tairData.aiAnalysis}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto bg-blue-900/10 border border-blue-900/30 p-3 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-blue-100">Insurance Ready</h4>
                                            <p className="text-[10px] text-blue-300/70 leading-tight mt-1">
                                                This report format complies with standard requirements for vehicle insurance claims.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* LICENSE SCAN MODAL */}
            {showLicenseModal && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-700 bg-slate-850 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-blue-500" /> LICENSE SCANNER
                            </h3>
                            <button onClick={() => setShowLicenseModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 relative bg-black flex flex-col">
                            {/* Live Cam */}
                            <div className="relative flex-1 bg-black">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
                                
                                {/* Overlay Guide */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-[85%] aspect-[1.58] border-2 border-white/50 rounded-xl relative shadow-[0_0_0_1000px_rgba(0,0,0,0.7)]">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="bg-black/50 text-white font-bold text-xs px-2 py-1 rounded backdrop-blur">
                                                {licenseSide} SIDE
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trigger */}
                            <div className="p-6 bg-slate-900 flex justify-center items-center gap-6">
                                <button 
                                    onClick={handleLicenseScan}
                                    className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center active:scale-95 shadow-lg"
                                />
                            </div>
                        </div>
                        
                        {/* Progress */}
                        <div className="p-2 bg-slate-800 text-[10px] text-center text-slate-400 font-mono">
                            {licenseSide === 'FRONT' ? 'STEP 1: CAPTURE FRONT ID' : 'STEP 2: CAPTURE BACK ID'}
                        </div>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default TrafficEnforcementView;
