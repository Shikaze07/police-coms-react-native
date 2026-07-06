
import React, { useState, useRef, useEffect } from 'react';
/* Fixed error: Added missing 'Download' to the import list from 'lucide-react' */
import { 
  PenTool, Save, RotateCcw, User, Loader2, Mic, ChevronDown, ChevronUp, 
  Box, ScanFace, Plus, Accessibility, X, Camera, 
  Video, Settings, Activity, Zap, Scissors, Glasses, FilePlus, Play, Send,
  Ghost, UserMinus, Contact2, VenetianMask, GraduationCap, Ruler,
  Rotate3d, Eye, UserRound, LayoutGrid, Undo2, ClipboardCheck, History,
  Download, Images, ImagePlus
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { generateCompositeSketch, generateRotatingHeadVideo, generatePhotorealisticImage } from './services/geminiService';

const RACE_OPTIONS = ['Asian (Filipino/Malay)', 'East Asian', 'South Asian', 'Caucasian', 'Black/African', 'Hispanic/Latino', 'Middle Eastern', 'Mixed/Other'];
const SKIN_TONE_OPTIONS = ['Fair', 'Light', 'Medium', 'Tan', 'Olive', 'Brown', 'Dark Brown', 'Black'];
const FACE_SHAPE_OPTIONS = ['Oval', 'Round', 'Square', 'Long', 'Heart', 'Diamond', 'Triangle'];
const HAIR_STYLE_OPTIONS = ['Short/Crew Cut', 'Bald/Shaven', 'Medium Length', 'Long/Shoulder Length', 'Curly/Wavy', 'Afro', 'Receding Hairline', 'Ponytail/Bun'];
const FACIAL_HAIR_OPTIONS = ['None', 'Stubble', 'Mustache', 'Goatee', 'Full Beard', 'Soul Patch'];
const EYE_OPTIONS = ['Almond', 'Round', 'Monolid', 'Protruding', 'Downturned', 'Upturned', 'Close-Set', 'Wide-Set', 'Deep-Set', 'Hooded'];
const NOSE_OPTIONS = ['Straight', 'Pointed', 'Flat', 'Broad', 'Aquiline (Hooked)', 'Button', 'Turned-up'];
const LIP_OPTIONS = ['Full', 'Thin', 'Wide', 'Bow-shaped', 'Heart-shaped'];
const JAW_OPTIONS = ['Strong/Chiseled', 'Receding', 'Pointed/V-Shape', 'Rounded', 'Wide/Square'];

const EYE_SAMPLES = [
  "https://i.ibb.co/LzN23pL/eyes-1.png",
  "https://i.ibb.co/WkP2p9K/eyes-2.png",
  "https://i.ibb.co/mqQ0Xn5/eyes-3.png",
  "https://i.ibb.co/vYvH0Z1/eyes-4.png",
  "https://i.ibb.co/RhN08p4/eyes-5.png",
  "https://via.placeholder.com/150/upturned-eyes",
  "https://via.placeholder.com/150/close-set-eyes",
  "https://via.placeholder.com/150/wide-set-eyes",
  "https://via.placeholder.com/150/deep-set-eyes",
  "https://via.placeholder.com/150/hooded-eyes"
];

interface GeneratedAsset {
    id: string;
    url: string;
    type: 'IMG' | 'VID';
    mode: string;
    metadata: string;
}

const CompositeSketchView: React.FC = () => {
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [generatingVideo, setGeneratingVideo] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('Features');
    const [history, setHistory] = useState<GeneratedAsset[]>(() => {
        const saved = localStorage.getItem('sketch-history');
        try {
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    
    useEffect(() => {
        localStorage.setItem('sketch-history', JSON.stringify(history));
    }, [history]);

    const [showGallery, setShowGallery] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [activeMode, setActiveMode] = useState<'FAST' | 'FULL_BODY' | 'PHOTO'>('FAST');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [activeGeneration, setActiveGeneration] = useState<'SKETCH' | 'PHOTO' | '3D' | null>(null);
    const [progress, setProgress] = useState(0);
    const [activeFeature, setActiveFeature] = useState<string | null>('Basic');
    const fileRef = useRef<HTMLInputElement>(null);
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [editableDescription, setEditableDescription] = useState<string>('');
    const recognitionRef = useRef<any>(null);

    const [age, setAge] = useState(30);
    const [gender, setGender] = useState('Male');
    const [race, setRace] = useState('Asian (Filipino/Malay)');
    const [skinTone, setSkinTone] = useState('Medium');
    const [faceShape, setFaceShape] = useState('Oval');
    const [hairStyle, setHairStyle] = useState('Short/Crew Cut');
    const [facialHair, setFacialHair] = useState('None');
    const [eyes, setEyes] = useState('Almond');
    const [nose, setNose] = useState('Straight');
    const [jaw, setJaw] = useState('Strong/Chiseled');
    const [eyebrowStyle, setEyebrowStyle] = useState('Average');
    const [eyebrowThickness, setEyebrowThickness] = useState(0);
    const [foreheadWidth, setForeheadWidth] = useState(0);
    const [foreheadSize, setForeheadSize] = useState(0);
    const [noseBridgeWidth, setNoseBridgeWidth] = useState(0);
    const [noseBridgeShape, setNoseBridgeShape] = useState(0);
    const [noseShape, setNoseShape] = useState('Straight');
    const [noseWidth, setNoseWidth] = useState(0);
    const [noseLength, setNoseLength] = useState(0);
    const [cheekboneProminence, setCheekboneProminence] = useState(0);
    const [chinShape, setChinShape] = useState(0);
    const [jawShapeSlider, setJawShapeSlider] = useState(0);
    const [eyeWidth, setEyeWidth] = useState(0);
    const [eyeHeight, setEyeHeight] = useState(0);

    // Auto-generate sketch when structural parameters change
    // Removed automatic generation to reduce API calls and prevent rate limiting errors.
    // Use the manual 'Sketch' button in the toolbar instead.

    const FEATURE_CONFIG: Record<string, { label: string, url: string }[]> = {
        'Eyes': [
            { label: "Almond", url: "https://i.ibb.co/LzN23pL/eyes-1.png" },
            { label: "Round", url: "https://i.ibb.co/WkP2p9K/eyes-2.png" },
            { label: "Monolid", url: "https://i.ibb.co/mqQ0Xn5/eyes-3.png" },
            { label: "Protruding", url: "https://i.ibb.co/vYvH0Z1/eyes-4.png" },
            { label: "Downturned", url: "https://i.ibb.co/RhN08p4/eyes-5.png" },
            { label: "Upturned", url: "https://placehold.co/150?text=Upturned" },
            { label: "Close-Set", url: "https://placehold.co/150?text=Close-Set" },
            { label: "Wide-Set", url: "https://placehold.co/150?text=Wide-Set" },
            { label: "Deep-Set", url: "https://placehold.co/150?text=Deep-Set" },
            { label: "Hooded", url: "https://placehold.co/150?text=Hooded" }
        ],
        'Eye Brows': [
            { label: "Thin", url: "https://i.ibb.co/R9XkX5N/eyebrows-1.png" },
            { label: "Average", url: "https://i.ibb.co/S7f0J9L/eyebrows-2.png" },
            { label: "Thick", url: "https://i.ibb.co/wJm8PzC/eyebrows-3.png" },
            { label: "Arched", url: "https://i.ibb.co/D7N1K2J/eyebrows-4.png" }
        ],
        'Face Shape': [],
        'Basic': [],
        'Structural': [],
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (generating) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 2, 99));
            }, 100);
        } else {
            setProgress(100);
        }
        return () => clearInterval(interval);
    }, [generating]);

    useEffect(() => {
        // Initialize SpeechRecognition
        try {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        transcript += event.results[i][0].transcript;
                    }
                    setAiPrompt(transcript);
                };
                recognitionRef.current.onend = () => setIsRecording(false);
            }
        } catch(e) {
            console.error("Speech Recognition initialization failed", e);
        }
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }
        try {
            if (isRecording) {
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
            }
            setIsRecording(!isRecording);
        } catch (e) {
            console.error("Speech Recognition toggle failed", e);
        }
    };

    const [disguise, setDisguise] = useState({
        beard: false, bald: false, wig: false, glasses: false, cap: false, mask: false
    });
    
    // Parameters

    const getPromptDescription = () => {
        const baseDesc = `SUBJECT: ${gender}, ${race}, ${skinTone}, age ${age}. FACE: ${faceShape} shape, ${hairStyle} hair, ${facialHair} facial hair, ${eyes} eyes (width: ${eyeWidth}, height: ${eyeHeight}), ${nose} nose (shape: ${noseShape}, width: ${noseWidth}, length: ${noseLength}), ${jaw} jawline, ${eyebrowStyle} eyebrows with thickness ${eyebrowThickness}, forehead width ${foreheadWidth}, forehead size ${foreheadSize}, nose bridge width ${noseBridgeWidth}, nose bridge shape ${noseBridgeShape}, cheekbone prominence ${cheekboneProminence}, chin shape ${chinShape}, jaw shape ${jawShapeSlider}.`;
        return `${baseDesc} \n Extra: ${editableDescription}`;
    };

    const handleGenerate = async (mode?: 'FAST' | 'FULL_BODY' | 'PHOTO') => {
        console.log("Starting handleGenerate:", mode);
        setGenerating(true);
        const modeToUse = mode || activeMode;
        setActiveGeneration(modeToUse === 'PHOTO' ? 'PHOTO' : 'SKETCH');
        setVideoUrl(null);
        const description = aiPrompt || getPromptDescription();
        const prompt = modeToUse === 'PHOTO'
            ? `Photorealistic, high-detail, portrait photography on a clean white background of the subject based on this sketch: ${description}`
            : `Nano Banana Engine Sketch: ${description}. Style: ${modeToUse}`;
        try {
            console.log("Calling generation service...");
            let result: string | null = null;
            const refImg = referenceImages.length > 0 ? referenceImages[referenceImages.length - 1] : undefined;
            if (modeToUse === 'PHOTO' && generatedImage) {
                console.log("Calling generatePhotorealisticImage...");
                result = await generatePhotorealisticImage(generatedImage, prompt);
            } else {
                console.log("Calling generateCompositeSketch with prompt:", prompt);
                result = await generateCompositeSketch(prompt, modeToUse === 'FULL_BODY' ? 'BODY' : 'HEAD', refImg);
            }
            console.log("Generation complete, result length:", result?.length);
            if (result && (result.startsWith('data:image/') || result.startsWith('data:image/png;base64,'))) {
                setGeneratedImage(result);
                setHistory(prev => [{ id: Date.now().toString(), url: result!, type: 'IMG', mode: modeToUse, metadata: description }, ...prev]);
            } else {
                console.error("Invalid image result format from service:", result?.substring(0, 50));
                setGeneratedImage(null);
                setAiPrompt(prev => prev + "\n[System: Last generation returned invalid format.]");
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
            console.error("Error in handleGenerate:", e);
            setAiPrompt(prev => prev + `\n[System: Error during generation: ${errorMessage}]`);
        } finally {
            console.log("Finally block of handleGenerate");
            setGenerating(false);
            setActiveGeneration(null);
        }
    };

    const handleRefresh = () => {
        setGeneratedImage(null);
        setVideoUrl(null);
        setAiPrompt('');
    };

    const handleSave = () => {
        if (generatedImage) {
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = `composite-sketch-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleGenerate3D = async () => {
        console.log("Starting handleGenerate3D, generatedImage URL exists:", !!generatedImage);
        if (!generatedImage) {
            console.error("Cannot generate 3D: No generated image found.");
            return;
        }
        setGeneratingVideo(true);
        setGenerating(true);
        setActiveGeneration('3D');
        try {
            console.log("Calling generateRotatingHeadVideo...");
            const video = await generateRotatingHeadVideo(generatedImage, activeMode === 'FULL_BODY' ? 'BODY' : 'HEAD');
            console.log("Video generation service returned:", !!video);
            if (video) {
                console.log("Setting videoUrl to:", video.substring(0, 50) + "...");
                setVideoUrl(video);
                setHistory(prev => [{ id: Date.now().toString(), url: video!, type: 'VID', mode: '3D', metadata: getPromptDescription() }, ...prev]);
            } else {
                console.error("Video generation returned no result.");
            }
        } catch (e: unknown) { 
            console.error("Error in handleGenerate3D:", e);
            const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'An unknown error occurred');
            console.error(`Video generation failed: ${errorMessage}`);
            // Explicitly reset on error
            setVideoUrl(null);
        } finally {
            console.log("Finally block of handleGenerate3D");
            setGeneratingVideo(false);
            setGenerating(false);
            setActiveGeneration(null);
        }
    };

    const handleSelectHistory = (item: GeneratedAsset) => {
        if (item.type === 'IMG') {
            setGeneratedImage(item.url);
            setVideoUrl(null);
        } else {
            setVideoUrl(item.url);
        }
    };

    const SectionHeader = ({ title, id, icon: Icon }: any) => (
        <button 
            onClick={() => setActiveSection(activeSection === id ? '' : id)} 
            className={`w-full flex justify-between items-center px-5 py-4 border-b border-white/5 transition-all duration-300 ${activeSection === id ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${activeSection === id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${activeSection === id ? 'text-blue-400' : 'text-slate-400'}`}>{title}</span>
            </div>
            {activeSection === id ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>
    );

    return (
        <div className="h-screen flex flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden">
            {/* Top Toolbar */}
            <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center px-4 gap-4 shrink-0">
                <div className="flex gap-2 h-full items-center">
                    <Tooltip text="New Sketch">
                        <button onClick={handleRefresh} className="p-2 text-slate-400 hover:text-white"><PenTool className="w-5 h-5" /></button>
                    </Tooltip>
                    <Tooltip text="Save">
                        <button onClick={handleSave} className="p-2 text-slate-400 hover:text-white"><Save className="w-5 h-5" /></button>
                    </Tooltip>
                    <Tooltip text="Gallery">
                        <button onClick={() => setShowGallery(true)} className="p-2 text-slate-400 hover:text-white"><Images className="w-5 h-5" /></button>
                    </Tooltip>
                    <Tooltip text="Refresh">
                        <button onClick={handleRefresh} className="p-2 text-slate-400 hover:text-white"><RotateCcw className="w-5 h-5" /></button>
                    </Tooltip>
                    <Tooltip text="Upload Reference Image">
                      <button onClick={() => fileRef.current?.click()} className="p-2 text-slate-400 hover:text-white"><ImagePlus className="w-5 h-5" /></button>
                    </Tooltip>
                    <Tooltip text={isRecording ? "Stop Recording" : "Start Recording"}>
                        <button onClick={toggleRecording} className={`p-2 border rounded ${isRecording ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'text-blue-500 hover:text-white border border-blue-500'}`}><Mic className="w-5 h-5" /></button>
                    </Tooltip>
                </div>
                <input type="file" ref={fileRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="flex-1 font-black tracking-widest text-blue-500 text-lg px-3"></div>
                    {/* Header Action Buttons */}
                    <div className="flex gap-2">
                        <button onClick={() => handleGenerate('FAST')} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded hover:bg-slate-700 ${activeGeneration === 'SKETCH' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                            <PenTool size={14} className={activeGeneration === 'SKETCH' ? 'text-white' : 'text-slate-400'} />
                            <span className="text-[8px] uppercase tracking-wider">Sketch</span>
                        </button>
                        <button onClick={() => handleGenerate('PHOTO')} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded hover:bg-slate-700 ${activeGeneration === 'PHOTO' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                            <Camera size={14} className={activeGeneration === 'PHOTO' ? 'text-white' : 'text-slate-400'} />
                            <span className="text-[8px] uppercase tracking-wider">Photo</span>
                        </button>
                        <button onClick={handleGenerate3D} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded hover:bg-slate-700 ${activeGeneration === '3D' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                            <Rotate3d size={14} className={activeGeneration === '3D' ? 'text-white' : 'text-slate-400'} />
                            <span className="text-[8px] uppercase tracking-wider">3D</span>
                        </button>
                    </div>
                </header>

            {/* Main Content Body */}
            <div className="flex-1 flex min-h-0 bg-slate-950 overflow-hidden">
                {/* Left Panel: Feature Options (Scrollable) */}
                <aside className="w-[117px] border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-4 gap-2 overflow-y-auto">
                    {/* Basic Controls */}
                    <div className="w-full px-2 mb-4 space-y-2">
                        <div className="text-[9px] text-slate-500 uppercase font-black">Age: {age}</div>
                        <input type="range" min="1" max="100" value={age} onChange={e => setAge(parseInt(e.target.value))} className="w-full h-1 bg-slate-800 accent-blue-500" />
                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-slate-800 text-[10px] p-1 text-slate-300">
                             <option>Male</option>
                             <option>Female</option>
                             <option>Non-Binary</option>
                        </select>
                    </div>

                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{activeFeature || 'Options'}</span>
                    {activeFeature && FEATURE_CONFIG[activeFeature] && FEATURE_CONFIG[activeFeature].map((option, i) => (
                        <div key={i} className="flex flex-col items-center mb-2">
                            <img 
                                src={option.url} 
                                alt={option.label} 
                                className="w-16 h-16 bg-slate-800 border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer object-cover" 
                                onClick={() => {
                                    if (activeFeature === 'Eyes') {
                                        setEyes(option.label);
                                    }
                                }}
                            />
                            <span className="text-[8px] text-slate-400 mt-1 uppercase">{option.label}</span>
                        </div>
                    ))}
                </aside>


                {/* Center: Workspace */}
                <main className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 border-r border-slate-800 bg-slate-950 p-4 flex items-center justify-center">
                        <div className="w-full h-full max-w-sm border border-slate-700 bg-slate-900 shadow-2xl relative flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 z-20 pointer-events-none"></div>
                            {videoUrl ? (
                                <video 
                                    src={videoUrl} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        console.error("Video element error:", e);
                                        const video = e.currentTarget;
                                        console.error("  src:", video.src);
                                        if (video.error) {
                                            console.error("  code:", video.error.code);
                                            console.error("  message:", video.error.message);
                                        }
                                        setVideoUrl(null);
                                    }}
                                />
                            ) : generatedImage ? (
                                <img 
                                    src={generatedImage} 
                                    className="w-full h-full object-cover" 
                                    alt="Composite" 
                                    onError={(e) => console.error("Image loading error:", e)}
                                />
                            ) : (
                                <div className="text-slate-700 font-mono text-xs uppercase tracking-widest">Empty Canvas</div>
                            )}
                            {generating && (
                                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                                    <div className="relative w-20 h-20 flex items-center justify-center">
                                       <div className="w-20 h-20 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                                       <div className="absolute font-black text-blue-500">{progress}%</div>
                                    </div>
                                    <p className="text-blue-500 mt-4 font-black uppercase text-xs tracking-widest animate-pulse">Synthesizing {activeGeneration}...</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Reference Images Thumbnails */}
                    {referenceImages.length > 0 && (
                        <div className="flex gap-2 p-2 bg-slate-900 border-t border-slate-800">
                           {referenceImages.map((img, i) => (
                             <img key={i} src={img} className="w-16 h-16 object-cover border border-slate-700" />
                           ))}
                        </div>
                    )}
                    {/* Editable Description */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <textarea
                            value={editableDescription}
                            onChange={e => setEditableDescription(e.target.value)}
                            className="w-full bg-slate-950 p-2 text-white border border-slate-700 h-20 text-xs"
                            placeholder="Name, Crime, Extra details..."
                        />
                    </div>
                </main>

                {/* Right Panel: Feature Grid */}
                <aside className="w-[227px] flex flex-col bg-slate-900 border-l border-slate-800">
                    <div className="p-3 border-b border-slate-800">
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="bg-slate-950 border border-slate-700 w-full p-3 text-xs text-slate-300 h-24 placeholder:text-slate-600"
                            placeholder="Nano Banana Engine Prompt..."
                        />
                    </div>
                    
                    <div className="flex-1 p-3 overflow-y-auto space-y-4">
                        {activeFeature === 'Eyes' ? (
                             <div className="space-y-4 p-4 bg-slate-950 border border-slate-700/50">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Eye Settings</label>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">Eye Width: {eyeWidth}</label>
                                    <input 
                                        type="range" min="-2" max="2" value={eyeWidth} 
                                        onChange={e => setEyeWidth(parseInt(e.target.value))} 
                                        className="w-full h-1 bg-slate-700 accent-blue-500" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">Eye Height: {eyeHeight}</label>
                                    <input 
                                        type="range" min="-2" max="2" value={eyeHeight} 
                                        onChange={e => setEyeHeight(parseInt(e.target.value))} 
                                        className="w-full h-1 bg-slate-700 accent-blue-500" 
                                    />
                                </div>
                                <button onClick={() => setActiveFeature(null)} className="text-[10px] text-blue-500 hover:text-blue-400 uppercase font-bold">Back to Features</button>
                             </div>
                        ) : activeFeature === 'Nose' ? (
                             <div className="space-y-4 p-4 bg-slate-950 border border-slate-700/50">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Nose Settings</label>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">Shape</label>
                                    <select 
                                        value={noseShape} 
                                        onChange={e => setNoseShape(e.target.value)} 
                                        className="bg-slate-900 border border-slate-700 w-full p-2 text-xs text-slate-300"
                                    >
                                        {NOSE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">Width: {noseWidth}</label>
                                    <input 
                                        type="range" min="-2" max="2" value={noseWidth} 
                                        onChange={e => setNoseWidth(parseInt(e.target.value))} 
                                        className="w-full h-1 bg-slate-700 accent-blue-500" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">Length: {noseLength}</label>
                                    <input 
                                        type="range" min="-2" max="2" value={noseLength} 
                                        onChange={e => setNoseLength(parseInt(e.target.value))} 
                                        className="w-full h-1 bg-slate-700 accent-blue-500" 
                                    />
                                </div>
                                <button onClick={() => setActiveFeature(null)} className="text-[10px] text-blue-500 hover:text-blue-400 uppercase font-bold">Back to Features</button>
                             </div>
                        ) : activeFeature === 'Eye Brows' ? (
                            <div className="space-y-4 p-4 bg-slate-950 border border-slate-700/50">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Eyebrow Settings</label>
                                <select 
                                    value={eyebrowStyle} 
                                    onChange={e => setEyebrowStyle(e.target.value)} 
                                    className="bg-slate-900 border border-slate-700 w-full p-2 text-xs text-slate-300"
                                >
                                    <option>Thin</option>
                                    <option>Average</option>
                                    <option>Thick</option>
                                    <option>Arched</option>
                                </select>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400">Thickness: {eyebrowThickness}</label>
                                    <input 
                                        type="range" min="-2" max="2" value={eyebrowThickness} 
                                        onChange={e => setEyebrowThickness(parseInt(e.target.value))} 
                                        className="w-full h-1 bg-slate-700 accent-blue-500" 
                                    />
                                </div>
                                <button onClick={() => setActiveFeature(null)} className="text-[10px] text-blue-500 hover:text-blue-400 uppercase font-bold">Back to Features</button>
                            </div>
                        ) : activeFeature === 'Structural' ? (
                            <div className="space-y-4 p-4 bg-slate-950 border border-slate-700/50 overflow-y-auto max-h-full">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Structural Settings</label>
                                {[
                                    { label: 'Forehead Width', val: foreheadWidth, setter: setForeheadWidth },
                                    { label: 'Forehead Size', val: foreheadSize, setter: setForeheadSize },
                                    { label: 'Nose Bridge Width', val: noseBridgeWidth, setter: setNoseBridgeWidth },
                                    { label: 'Nose Bridge Shape', val: noseBridgeShape, setter: setNoseBridgeShape },
                                    { label: 'Cheekbone Prominence', val: cheekboneProminence, setter: setCheekboneProminence },
                                    { label: 'Chin Shape', val: chinShape, setter: setChinShape },
                                    { label: 'Jaw Shape', val: jawShapeSlider, setter: setJawShapeSlider },
                                ].map((setting) => (
                                    <div key={setting.label} className="space-y-1">
                                        <label className="text-[10px] text-slate-400">{setting.label}: {setting.val}</label>
                                        <input 
                                            type="range" min="-2" max="2" value={setting.val} 
                                            onChange={e => setting.setter(parseInt(e.target.value))} 
                                            className="w-full h-1 bg-slate-700 accent-blue-500" 
                                        />
                                    </div>
                                ))}
                                <button onClick={() => setActiveFeature(null)} className="text-[10px] text-blue-500 hover:text-blue-400 uppercase font-bold">Back to Features</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 text-center">
                               {['Gender', 'Age', 'Race', 'Face Shape', 'Hair', 'Forehead', 'Eyes', 'Facial Hair', 'Nose', 'Eye Brows', 'Structural'].map(feature => (
                                   <button 
                                       key={feature}
                                       onClick={() => setActiveFeature(feature)}
                                       className={`p-3 border text-xs font-bold uppercase ${activeFeature === feature ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                   >
                                       {feature}
                                   </button>
                               ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Selector Tools */}
                    <div className="p-3 border-t border-slate-800 flex justify-center gap-4">
                        <button className="text-slate-500 hover:text-white p-2">⬅️</button>
                        <button className="text-slate-500 hover:text-white p-2">➡️</button>
                    </div>
                </aside>
            </div>

            {showGallery && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-96 overflow-y-auto p-4 flex flex-wrap gap-4 relative">
                         <button onClick={() => setShowGallery(false)} className="absolute top-4 right-4 text-white p-2 hover:bg-slate-700 rounded"><X/></button>
                         <h2 className="text-white font-black w-full text-lg">GALLERY</h2>
                         {history.map(item => (
                             <div key={item.id} className="w-32 h-32 cursor-pointer border border-slate-700 hover:border-blue-500 overflow-hidden relative" onClick={() => { handleSelectHistory(item); setShowGallery(false); }}>
                                 {item.type === 'IMG' ? <img src={item.url} className="w-full h-full object-cover" /> : <div className="text-white w-full h-full flex items-center justify-center bg-slate-800">VIDEO</div>}
                                 <button
                                     className="absolute bottom-1 right-1 bg-slate-800 p-1 rounded text-white text-[8px]"
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         const blob = new Blob([item.metadata], { type: 'text/plain' });
                                         const url = URL.createObjectURL(blob);
                                         const link = document.createElement('a');
                                         link.href = url;
                                         link.download = `metadata-${item.id}.txt`;
                                         link.click();
                                         URL.revokeObjectURL(url);
                                     }}
                                 >TXT</button>
                             </div>
                         ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompositeSketchView;
