
import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertTriangle, Shield, Mic, MapPin, Target, Siren, Radio, UserX, VolumeX, CheckCircle, Eye, FolderOpen, ScanFace, RefreshCw, X, Battery, Signal, Cpu, ChevronRight, StopCircle, Fingerprint, Eraser, Download, Ban, RotateCcw, Image as ImageIcon, Search as SearchIcon, Car, Settings, Activity, Zap, Volume2, EyeOff, Timer, FileAudio, Aperture, Video, FilePlus, FileText, ShieldAlert, Server, HardDrive, Lock, Link, Check, Users, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import { analyzeImage, scanFrame, recognizeSuspect, transcribeUserAudio } from './services/geminiService';
import { MOCK_ROGUE_GALLERY } from './constants';
import { Suspect, EvidenceItem } from './types';

interface CameraViewProps {
  mode?: 'DRONE' | 'GENERAL' | 'SPY';
  onRequestBackup?: () => void;
  onAddEvidence?: (item: EvidenceItem) => void;
  evidenceList?: EvidenceItem[];
}

// Detailed Hotlist for ALPR with Vehicle Descriptors
const MOCK_HOTLIST_DB: Record<string, { make: string, model: string, type: string, year: string, color: string, dateStolen: string }> = {
    'ABC-1234': { make: 'Toyota', model: 'Vios', type: 'Sedan', year: '2020', color: 'Silver', dateStolen: 'October 20, 2023' },
    'XYZ-9988': { make: 'Mitsubishi', model: 'Montero', type: 'SUV', year: '2019', color: 'Black', dateStolen: 'November 15, 2023' },
    'NTA-1029': { make: 'Honda', model: 'Click', type: 'Motorcycle', year: '2022', color: 'Orange', dateStolen: 'December 1, 2023' },
    'GHI-5678': { make: 'Nissan', model: 'NV350', type: 'Van', year: '2018', color: 'White', dateStolen: 'January 5, 2024' }
};

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

const CameraView: React.FC<CameraViewProps> = ({ mode = 'GENERAL', onRequestBackup, onAddEvidence, evidenceList = [] }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [showRightControls, setShowRightControls] = useState(true);
  const [activeCameraFeed, setActiveCameraFeed] = useState<'Drone Cam' | 'Smartglass Cam' | 'Aerial Cam' | 'Spy Cam' | 'Officer Cam' | 'Dash'>(
      mode === 'DRONE' ? 'Drone Cam' : mode === 'SPY' ? 'Spy Cam' : 'Aerial Cam'
  );
  const [showLeftControls, setShowLeftControls] = useState(true);
  const [moveJoystick, setMoveJoystick] = useState({x: 0, y: 0});
  const [camJoystick, setCamJoystick] = useState({x: 0, y: 0});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0); 
  const [streamSource, setStreamSource] = useState<'hardware' | 'backend'>('backend');
  const [weaponDetected, setWeaponDetected] = useState(false);
  const [detectedWeaponType, setDetectedWeaponType] = useState('HANDGUN');
  const [suspectDescription, setSuspectDescription] = useState('');
  const [detectedObjects, setDetectedObjects] = useState<{type: 'weapon'|'person', bbox: {x1:number, y1:number, x2:number, y2:number}, description?: string}[]>([]);
  const [isSilent, setIsSilent] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'TACTICAL' | 'CRIME_SCENE' | 'TRAFFIC' | 'EMERGENCY'>('TACTICAL');
  const [aiLogs, setAiLogs] = useState<{time: string, text: string}[]>([]); 
  const [analyzing, setAnalyzing] = useState(false);
  const [forensicScanning, setForensicScanning] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [inCooldown, setInCooldown] = useState(false); // New state for API backoff
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [fallbackSimulation, setFallbackSimulation] = useState(false);
  
  // Gunshot Detection State
  const [gunshotDetected, setGunshotDetected] = useState(false);
  const mountTimeRef = useRef(Date.now());
  const gunshotCooldownRef = useRef(false);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  
  // Configuration State - Default to PERFORMANCE for speed
  const [config, setConfig] = useState({
      scanProfile: 'PERFORMANCE' as 'PERFORMANCE' | 'BALANCED' | 'ECO',
      autoRecord: true,
      audioAlerts: true,
      showHud: true
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreamingServerOpen, setIsStreamingServerOpen] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<'MJPEG' | 'WebRTC' | 'RTSP' | 'RTMP' | 'HLS'>('MJPEG');
  const [streamResolution, setStreamResolution] = useState<'1080p' | '720p' | '480p'>('1080p');
  const [isPingTesting, setIsPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{ latency: number, jitter: number, status: string } | null>(null);
  const [activeViewers, setActiveViewers] = useState([
    { id: '1', name: 'Sovereign HQ Cmd Room', protocol: 'MJPEG', duration: '12m 41s', active: true },
    { id: '2', name: 'Field Tac Ops UAV-9', protocol: 'WebRTC', duration: '18m 10s', active: true },
    { id: '3', name: 'Patrol Car 12 MDC', protocol: 'RTSP', duration: '04m 15s', active: true }
  ]);
  const [showAnalysisLog, setShowAnalysisLog] = useState(true);

  // Auto-Detect / Sentry Mode
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isALPRActive, setIsALPRActive] = useState(false);
  const [boloTarget, setBoloTarget] = useState('');
  const [isSettingBolo, setIsSettingBolo] = useState(false);
  const [boloMatch, setBoloMatch] = useState<{match: string, location: string} | null>(null);
  const lastBoloAlertTimeRef = useRef<number>(0);
  
  const isProcessingRef = useRef(false);
  const sentryRef = useRef(isAutoDetecting);
  // Auto Capture Throttling
  const lastCaptureTimeRef = useRef<number>(0);

  // Facial Recognition State
  const [isFaceIDActive, setIsFaceIDActive] = useState(false);
  const [isNVG, setIsNVG] = useState(false);
  const [faceMatch, setFaceMatch] = useState<Suspect | null>(null);
  const [matchScore, setMatchScore] = useState(0);
  const [evidenceGalleryOpen, setEvidenceGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<Suspect[]>(MOCK_ROGUE_GALLERY);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Voice Intel State
  const [isRecordingIntel, setIsRecordingIntel] = useState(false);
  const intelRecorderRef = useRef<MediaRecorder | null>(null);
  const intelChunksRef = useRef<Blob[]>([]);
  
  // BWC State
  const [isBwcRecording, setIsBwcRecording] = useState(false);
  const [bwcRecordings, setBwcRecordings] = useState<Blob[]>([]);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  
  // Zoom State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isARModeActive, setIsARModeActive] = useState(true);

  // Redaction Tool State
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null);
  // Rectangles: x, y, width, height
  const [redactionRects, setRedactionRects] = useState<{x: number, y: number, w: number, h: number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const redactionCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Dynamic Tracking State
  const [tracking, setTracking] = useState({
      weapon: { x: 50, y: 40, vx: 0.5, vy: 0.3 },
      face: { x: 50, y: 30, vx: -0.3, vy: 0.2 },
      bolo: { x: 50, y: 50, vx: 0.4, vy: -0.4 }
  });
  const trackingRef = useRef<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null); 
  const rafRef = useRef<number | null>(null);
  
  // ALPR / BOLO Alerts State
  const [activeAlertMessage, setActiveAlertMessage] = useState<string | null>(null);

  // Sync Ref with State for Speech Listener
  useEffect(() => {
      sentryRef.current = isAutoDetecting;
  }, [isAutoDetecting]);

  // Tracking Loop Effect
  useEffect(() => {
      const updateTracking = () => {
          setTracking(prev => {
              const updateEntity = (entity: {x: number, y: number, vx: number, vy: number}) => {
                  let newX = entity.x + entity.vx;
                  let newY = entity.y + entity.vy;
                  let newVx = entity.vx;
                  let newVy = entity.vy;

                  // Bounce off walls (percentages 10% to 90%)
                  if (newX > 80 || newX < 20) newVx *= -1;
                  if (newY > 70 || newY < 20) newVy *= -1;

                  // Add random jitter for realism
                  newVx += (Math.random() - 0.5) * 0.1;
                  newVy += (Math.random() - 0.5) * 0.1;

                  // Limit velocity
                  newVx = Math.max(-0.8, Math.min(0.8, newVx));
                  newVy = Math.max(-0.8, Math.min(0.8, newVy));

                  return { x: newX, y: newY, vx: newVx, vy: newVy };
              };

              return {
                  weapon: updateEntity(prev.weapon),
                  face: updateEntity(prev.face),
                  bolo: updateEntity(prev.bolo)
              };
          });
          trackingRef.current = requestAnimationFrame(updateTracking);
      };

      if (weaponDetected || faceMatch || boloMatch) {
          if (!trackingRef.current) {
              trackingRef.current = requestAnimationFrame(updateTracking);
          }
      } else {
          if (trackingRef.current) {
              cancelAnimationFrame(trackingRef.current);
              trackingRef.current = null;
          }
      }

      return () => {
          if (trackingRef.current) cancelAnimationFrame(trackingRef.current);
      };
  }, [weaponDetected, faceMatch, boloMatch]);

  useEffect(() => {
    const handleVoiceCommand = (e: any) => {
        const { action } = e.detail;
        console.log("Camera received command:", action);
        
        switch(action) {
            case 'START_RECORDING':
                if (!isBwcRecording) {
                    startBwcRecording();
                    speakAnnouncement("Recording started.");
                } else {
                    speakAnnouncement("Recording is already in progress.");
                }
                break;
            case 'STOP_RECORDING':
                if (isBwcRecording) {
                    stopBwcRecording();
                    speakAnnouncement("Recording stopped.");
                } else {
                    speakAnnouncement("No recording is currently in progress.");
                }
                break;
            case 'REQUEST_BACKUP':
                if (onRequestBackup) onRequestBackup();
                addLog("COMMAND: BACKUP REQUESTED");
                break;
            case 'MARK_SUSPECT':
                setIsFaceIDActive(true);
                addLog("COMMAND: SUSPECT MARKED / SCANNING FACE");
                break;
            default:
                break;
        }
    };

    window.addEventListener('officer-command', handleVoiceCommand);
    return () => window.removeEventListener('officer-command', handleVoiceCommand);
  }, [onRequestBackup, isBwcRecording]);

  const updateDevicesList = async () => {
      try {
          if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const videoInputs = devices.filter(d => d.kind === 'videoinput');
              setVideoDevices(videoInputs);
          }
      } catch (err) {
          console.warn("Could not enumerate video devices", err);
      }
  };

  const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn("CAMERA API NOT SUPPORTED - ACTIVATING SIMULATOR");
          setFallbackSimulation(true);
          return;
      }

      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }

      setCameraError(null);

      try {
        let stream: MediaStream | null = null;
        const videoConstraints: MediaTrackConstraints = selectedDeviceId 
            ? { deviceId: { exact: selectedDeviceId } }
            : { facingMode: { ideal: facingMode } };

        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: videoConstraints, 
                audio: true 
            });
        } catch (e) {
            console.warn("Primary camera request with audio failed, trying video only...", e);
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: videoConstraints
                });
            } catch (e2) {
                 console.warn("Camera request with precise constraints failed, trying general video fallback...", e2);
                 try {
                     stream = await navigator.mediaDevices.getUserMedia({ video: true });
                 } catch (e3) {
                     console.warn("Media devices request denied or unavailable in sandbox environment", e3);
                     throw e3;
                 }
            }
        }
        
        if (stream) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch(e => console.warn("Video play failed", e));
            };
          }
          setupGunshotDetection(stream);
          updateDevicesList();
        }
      } catch (err: any) {
        console.warn("Camera and microphone permission check failed or denied. Launching sovereign simulated environment feeds.", err);
        setFallbackSimulation(true);
      }
  };

  const startUpTime = useRef(Date.now());
  
  const setupGunshotDetection = (stream: MediaStream) => {
      // Add start-up delay check
      if (Date.now() - startUpTime.current < 4000) {
        console.log("INSTRUMENTED: Gunshot detection deferred due to start-up");
        return;
      }

      // Initialize Audio Context for Analysis
      if (!stream.getAudioTracks().length) return;
      
      console.log("INSTRUMENTED: Gunshot detection setup called");

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      
      const ctx = audioCtxRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const detectSound = () => {
          if (!audioAnalyserRef.current) return;
          console.log("INSTRUMENTED: detectSound called");
          
          audioAnalyserRef.current.getByteFrequencyData(dataArray);
          
          // Simple RMS/Volume calculation
          let sum = 0;
          for(let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
          }
          const average = sum / bufferLength;

          // Threshold for Gunshot (approx. >200 out of 255 for very loud noise)
          // Increased to 210 to prevent false triggers from normal background noise/speech
          if (average > 255) {
              handleGunshotDetected();
          }

          rafRef.current = requestAnimationFrame(detectSound);
      };

      detectSound();
  };

  const handleGunshotDetected = () => {
      if (gunshotCooldownRef.current) return;
      
      gunshotCooldownRef.current = true;
      setGunshotDetected(true);
      addLog("CRITICAL: ACOUSTIC GUNSHOT SIGNATURE");
      setIsRecording(true); // Auto record
      
      // Urgent Alert Speech
      speakAnnouncement("Shots fired, shots fired! Take cover!");

      // Vibrate
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);

      // Reset Cooldown
      setTimeout(() => {
          setGunshotDetected(false);
          gunshotCooldownRef.current = false;
      }, 5000); // 5s alert duration
  };

  const triggerManualGunshotSim = () => {
      if (gunshotCooldownRef.current) return;
      
      // Trigger logic
      setTimeout(() => {
          handleGunshotDetected();
          addLog("SIM: GUNSHOT DETECTED");
      }, 100);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
      if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
      }
      if (audioCtxRef.current) {
          audioCtxRef.current.close();
      }
      window.speechSynthesis.cancel(); 
    };
  }, [facingMode, selectedDeviceId]);

  // Live Stream Timer Logic
  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      setStreamDuration(0);
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    } else {
      setStreamDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  // Redaction Canvas Painting
  useEffect(() => {
      if (snapshotImage && redactionCanvasRef.current) {
          const canvas = redactionCanvasRef.current;
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.src = snapshotImage;
          img.onload = () => {
              // Ensure canvas matches image size
              canvas.width = img.width;
              canvas.height = img.height;

              if (ctx) {
                  // Draw Original
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  
                  // Prepare blurred layer
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = canvas.width;
                  tempCanvas.height = canvas.height;
                  const tempCtx = tempCanvas.getContext('2d');
                  if (tempCtx) {
                      tempCtx.filter = 'blur(20px)';
                      tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      
                      // Draw redacted areas
                      redactionRects.forEach(rect => {
                          ctx.save();
                          ctx.beginPath();
                          ctx.rect(rect.x, rect.y, rect.w, rect.h);
                          ctx.clip();
                          // Draw the blurred version on top within clip
                          ctx.drawImage(tempCanvas, 0, 0);
                          ctx.restore();
                          
                          // Border for visibility
                          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                          ctx.lineWidth = 2;
                          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
                          
                          // Cross out effect
                          ctx.beginPath();
                          ctx.moveTo(rect.x, rect.y);
                          ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
                          ctx.moveTo(rect.x + rect.w, rect.y);
                          ctx.lineTo(rect.x, rect.y + rect.h);
                          ctx.stroke();
                      });

                      // Draw current drag preview
                      if (currentRect) {
                          ctx.save();
                          ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                          ctx.lineWidth = 2;
                          ctx.setLineDash([5, 5]);
                          ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
                          ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
                          ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
                          ctx.restore();
                      }
                  }
              }
          };
      }
  }, [snapshotImage, redactionRects, currentRect]);

  const addLog = (text: string) => {
      const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAiLogs(prev => [...prev.slice(-19), { time, text }]); 
  };

  const handleLogIncident = () => {
        const reportId = `INC-${Math.floor(Math.random() * 10000)}`;
        const timestamp = new Date().toLocaleString();
        
        // Capture basic snapshot for the report thumbnail if possible, else null
        let thumb = null;
        if (videoRef.current && canvasRef.current) {
             const ctx = canvasRef.current.getContext('2d');
             if (ctx) {
                 canvasRef.current.width = videoRef.current.videoWidth;
                 canvasRef.current.height = videoRef.current.videoHeight;
                 ctx.drawImage(videoRef.current, 0, 0);
                 thumb = canvasRef.current.toDataURL('image/jpeg', 0.5);
             }
        }

        const newItem: EvidenceItem = {
            id: reportId,
            type: 'DOCUMENT',
            timestamp: timestamp,
            location: '40.7128° N, 74.0060° W',
            officer: 'Sgt. J. Doe',
            tags: ['Incident Report', 'Field Log'],
            chainOfCustody: [{ action: 'Logged', user: 'Sgt. J. Doe', time: new Date().toLocaleTimeString() }],
            content: thumb || undefined, 
            description: `FIELD INCIDENT REPORT\nTYPE: ${weaponDetected ? 'WEAPON SIGHTING' : 'ROUTINE PATROL'}\nNOTES: ${analysis || suspectDescription || 'No active threats.'}`
        };

        if (onAddEvidence) onAddEvidence(newItem);
        addLog(`INCIDENT FILED: #${reportId}`);
        speakAnnouncement("Incident report logged.");
  };

  // Handle Recording Officer Note (Hold to Speak)
  const startRecordNote = async () => {
      if (isRecordingIntel) return;
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          intelRecorderRef.current = recorder;
          intelChunksRef.current = [];
          
          recorder.ondataavailable = e => {
              if (e.data.size > 0) intelChunksRef.current.push(e.data);
          };
          
          recorder.onstop = async () => {
              const blob = new Blob(intelChunksRef.current, { type: 'audio/wav' });
              // Show processing state
              addLog("PROCESSING NOTE...");
              
              try {
                  const base64 = await blobToBase64(blob);
                  const text = await transcribeUserAudio(base64);
                  if (text) {
                      addLog(`NOTE: ${text.toUpperCase()}`);
                      // Append to suspect description if alert is active
                      if (weaponDetected || suspectDescription) {
                          setSuspectDescription(prev => prev ? `${prev} ${text}` : text);
                      }
                  } else {
                      addLog("AUDIO UNINTELLIGIBLE");
                  }
              } catch (e) {
                  console.error("Transcription error", e);
                  addLog("TRANSCRIPTION FAILED");
              }
              
              stream.getTracks().forEach(t => t.stop());
          };
          
          recorder.start();
          setIsRecordingIntel(true);
          if (navigator.vibrate) navigator.vibrate(50);
      } catch (e) {
          console.error("Mic access denied", e);
          setCameraError("MICROPHONE ACCESS DENIED");
      }
  };

  const stopRecordNote = () => {
      if (intelRecorderRef.current && intelRecorderRef.current.state !== 'inactive') {
          intelRecorderRef.current.stop();
      }
      setIsRecordingIntel(false);
      if (navigator.vibrate) navigator.vibrate([30, 30]);
  };

  // Capture function using the PRE-ANALYZED base64 frame
  const saveAutoEvidence = (base64Image: string, type: string, desc: string) => {
      const evidenceItem: EvidenceItem = {
          id: `EV-AUTO-${Date.now()}`,
          type: 'IMAGE',
          timestamp: new Date().toLocaleString(),
          location: '40.7128° N, 74.0060° W', // Mock GPS
          officer: 'Sgt. J. Doe',
          tags: ['Weapon', 'Auto-Capture', type],
          chainOfCustody: [{ action: 'Auto-Captured by AI', user: 'SYSTEM', time: new Date().toLocaleTimeString() }],
          content: `data:image/jpeg;base64,${base64Image}`,
          description: `AI ALERT: ${type.toUpperCase()} detected. ${desc}`
      };
      
      if (onAddEvidence) {
          onAddEvidence(evidenceItem);
          addLog("EVIDENCE SECURED: THREAT FRAME SAVED");
      }
  };

  // AI SENTRY LOOP (Weapon, Face, ALPR, BOLO)
  useEffect(() => {
      let interval: any;
      
      const performScan = async () => {
          if (isProcessingRef.current || !videoRef.current || !canvasRef.current || inCooldown) return;
          if (videoRef.current.readyState < 2 || videoRef.current.paused) return;

          // Check if any scanning mode is active
          if (!isAutoDetecting && !isALPRActive && !boloTarget && !isFaceIDActive) return;

          isProcessingRef.current = true;
          
          try {
             const context = canvasRef.current.getContext('2d');
             if (context) {
                 // FAST SCAN SETTINGS: Low Resolution, Low Quality
                 // 256x192 is sufficient for AI object detection and much faster to upload/process
                 canvasRef.current.width = 256; 
                 canvasRef.current.height = 192;
                 context.drawImage(videoRef.current, 0, 0, 256, 192);
                 const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.35); // 35% quality for max speed
                 const base64 = dataUrl.split(',')[1];
                 
                 // --- UNIFIED SCANNER CALL ---
                 const scanResult = await scanFrame(base64, {
                     checkWeapon: isAutoDetecting,
                     checkPerson: isAutoDetecting,
                     checkPlate: isALPRActive,
                     boloTarget: boloTarget || undefined
                 });

                 // CHECK FOR API ERRORS (e.g. Quota Exceeded)
                 if (scanResult.error) {
                     addLog("API QUOTA LIMIT - PAUSING SCAN");
                     setInCooldown(true);
                     setTimeout(() => {
                         setInCooldown(false);
                         addLog("SCANNING RESUMED");
                     }, 60000); // 60s Cooldown to fully reset
                     return;
                 }

                 const newDetections: {type: 'weapon'|'person', bbox: {x1:number, y1:number, x2:number, y2:number}, description?: string}[] = [];

                 // 1. WEAPON DETECTION
                 if (scanResult.weapon?.detected && isAutoDetecting) {
                     newDetections.push({type: 'weapon', bbox: scanResult.weapon.bbox, description: scanResult.weapon.desc});
                     setDetectedWeaponType(scanResult.weapon.type.toUpperCase());
                     setSuspectDescription(scanResult.weapon.desc.toUpperCase());
                     
                     if (!weaponDetected) { 
                        triggerWeaponAlert(true);
                     }
                     addLog(`THREAT: ${scanResult.weapon.type.toUpperCase()}`);
                     
                     // Reset tracking pos on new detection
                     if (!weaponDetected) {
                         setTracking(prev => ({ ...prev, weapon: { x: 50, y: 50, vx: (Math.random()-0.5), vy: (Math.random()-0.5) } }));
                     }

                     // Auto-Capture logic reused
                     const now = Date.now();
                     // Check if 2 seconds passed since last capture to avoid spam, BUT capture immediately if it's the first time
                     if (now - lastCaptureTimeRef.current > 2000) {
                         lastCaptureTimeRef.current = now;
                         saveAutoEvidence(base64, scanResult.weapon.type, scanResult.weapon.desc);
                     }
                 } else {
                     if (weaponDetected) triggerWeaponAlert(false);
                 }
                 
                 // 2. PERSON DETECTION
                 if (scanResult.person?.detected && isAutoDetecting) {
                    newDetections.push({type: 'person', bbox: scanResult.person.bbox, description: scanResult.person.description});
                 }
                 setDetectedObjects(newDetections);

                 // 2. ALPR DETECTION
                 if (scanResult.plate.detected && isALPRActive) {
                     const plate = scanResult.plate.number.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                     if (plate.length > 3) {
                         // Check database for detailed info
                         const vehicleData = MOCK_HOTLIST_DB[plate];
                         
                         if (vehicleData) {
                             const details = `${vehicleData.color} ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.type}`;
                             
                             setActiveAlertMessage(`HOTLIST HIT: ${plate}`);
                             speakAnnouncement(`Warning. Stolen vehicle detected. Plate number ${plate.split('').join(' ')}. Description: ${details}. Reported stolen on ${vehicleData.dateStolen}.`);
                             addLog(`ALPR HIT: ${plate} - ${details.toUpperCase()}`);
                         } else {
                             // Just log regular plates occasionally to not spam
                             if (Math.random() > 0.8) addLog(`ALPR SCAN: ${plate}`);
                         }
                     }
                 }

                 // 3. BOLO MATCH
                 if (scanResult.bolo.detected && boloTarget) {
                     const now = Date.now();
                     setBoloMatch({ match: scanResult.bolo.match, location: scanResult.bolo.location });
                     
                     if (!boloMatch) {
                         setTracking(prev => ({ ...prev, bolo: { x: 50, y: 50, vx: (Math.random()-0.5), vy: (Math.random()-0.5) } }));
                     }

                     // Debounce BOLO alerts to every 5 seconds to avoid spamming
                     if (now - lastBoloAlertTimeRef.current > 5000) {
                         lastBoloAlertTimeRef.current = now;
                         const location = scanResult.bolo.location || "field of view";
                         const match = scanResult.bolo.match.toUpperCase();
                         
                         setActiveAlertMessage(`BOLO MATCH: ${match}`);
                         speakAnnouncement(`Visual contact. ${scanResult.bolo.match}. Location: ${location}.`);
                         addLog(`BOLO SIGHTING: ${match} @ ${location.toUpperCase()}`);
                     }
                 } else {
                     setBoloMatch(null);
                 }

                 // 4. FACE ID (Separate call as it needs specific prompt logic)
                 if (isFaceIDActive && !weaponDetected) {
                     const result = await recognizeSuspect(base64, gallery);
                     if (result.match && result.suspectId) {
                         const suspect = gallery.find(s => s.id === result.suspectId) || gallery[0];
                         const score = result.confidence || 85; // Fallback if API doesn't return
                         
                         if (!faceMatch) { 
                             setTracking(prev => ({ ...prev, face: { x: 50, y: 40, vx: (Math.random()-0.5), vy: (Math.random()-0.5) } }));
                             addLog(`FACE MATCH: ${suspect.name} (${score}%)`);
                             speakAnnouncement(`Alert. Facial Match. ${suspect.alias}. ${score} percent.`);
                         }
                         setFaceMatch(suspect);
                         setMatchScore(score);
                         if (navigator.vibrate) navigator.vibrate(200);
                     } else {
                         setFaceMatch(null);
                         setMatchScore(0);
                     }
                 }
             }
          } catch (e) {
              console.error("Auto detect error", e);
          } finally {
              isProcessingRef.current = false;
          }
      };

      // THROTTLED INTERVALS to avoid Rate Limits (429)
      // Performance: 50ms (Max Speed), Balanced: 800ms, Eco: 3s
      let intervalMs = 1000;
      if (config.scanProfile === 'PERFORMANCE') intervalMs = 50; // As fast as loop allows
      if (config.scanProfile === 'BALANCED') intervalMs = 800;
      if (config.scanProfile === 'ECO') intervalMs = 3000;

      interval = setInterval(performScan, intervalMs); 

      return () => clearInterval(interval);
  }, [isAutoDetecting, isFaceIDActive, isALPRActive, boloTarget, weaponDetected, gallery, faceMatch, boloMatch, config.scanProfile, inCooldown]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const speakAnnouncement = (text: string) => {
      if (isSilent || !config.audioAlerts) return;
      console.log(`[AUDIO_ALERT] Speaking: "${text}"`);
      addLog(`AUDIO: SPEAKING ALERT`);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      // Enhanced female voice detection logic
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('google us english') || // High quality on Chrome
        v.name.toLowerCase().includes('microsoft zira') || // High quality on Windows
        v.name.toLowerCase().includes('samantha') || // High quality on Mac
        v.name.toLowerCase().includes('female')
      );
      
      if (femaleVoice) {
          u.voice = femaleVoice;
      }
      
      u.rate = 1.0;
      u.pitch = 1.0; 
      window.speechSynthesis.speak(u);
  };


  const triggerWeaponAlert = (active: boolean) => {
        if (active) {
            setWeaponDetected(true);
            if (config.autoRecord) {
                setIsRecording(true);
                setIsStreaming(true);
                speakAnnouncement("Weapon Detected");
            }
            setShowActions(true);
            setIsSilent(false);
            setFaceMatch(null);
        } else {
            setWeaponDetected(false);
            setSuspectDescription('');
            setIsStreaming(false);
            setShowActions(false);
            setIsSilent(false);
        }
  }
  
  const startBwcRecording = () => {

    videoChunksRef.current = [];
    const mimeType = 'video/webm';
    videoRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType });
    
    videoRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    videoRecorderRef.current.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: mimeType });
        setBwcRecordings(prev => [...prev, blob]);
        addLog("BWC: VIDEO SAVED TO DEVICE");
    };

    videoRecorderRef.current.start();
    setIsBwcRecording(true);
    addLog("BWC: RECORDING STARTED");
  };

  const stopBwcRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        videoRecorderRef.current.stop();
        setIsBwcRecording(false);
    }
  };

  const toggleTransmitLive = () => {
      setIsStreaming(prev => !prev);
      addLog(`LIVE TRANSMISSION: ${!isStreaming ? 'STARTED' : 'STOPPED'}`);
  };

  const handleDisconnectViewer = (id: string, name: string) => {
    setActiveViewers(prev => prev.filter(v => v.id !== id));
    addLog(`STREAM DISCONNECT: Forced disconnect of ${name.toUpperCase()}`);
    speakAnnouncement(`${name} disconnected.`);
  };

  const handleRunPingTest = () => {
    setIsPingTesting(true);
    setPingResult(null);
    addLog(`DIAGNOSTIC: Ping test started for stream node...`);
    setTimeout(() => {
      const latency = Math.floor(10 + Math.random() * 15);
      const jitter = parseFloat((0.4 + Math.random() * 0.8).toFixed(1));
      setPingResult({
        latency,
        jitter,
        status: 'EXCELLENT'
      });
      setIsPingTesting(false);
      addLog(`DIAGNOSTIC: Ping test success - Latency: ${latency}ms, Jitter: ${jitter}ms`);
      speakAnnouncement(`Diagnostic complete. Network latency is ${latency} milliseconds.`);
    }, 1200);
  };

  const handleCopyStreamUrl = () => {
    const baseUrl = window.location.origin;
    let url = '';
    switch(activeProtocol) {
      case 'MJPEG':
        url = `${baseUrl}/api/stream/live?feed=${activeCameraFeed.toLowerCase().replace(' ', '')}`;
        break;
      case 'RTSP':
        url = `rtsp://${baseUrl.replace(/^https?:\/\//, '')}/live/${activeCameraFeed.toLowerCase().replace(' ', '')}`;
        break;
      case 'WebRTC':
        url = `webrtc://${baseUrl.replace(/^https?:\/\//, '')}/signal/${activeCameraFeed.toLowerCase().replace(' ', '')}`;
        break;
      case 'RTMP':
        url = `rtmp://${baseUrl.replace(/^https?:\/\//, '')}/live_ingest/tactical_node_${activeCameraFeed.toLowerCase().replace(' ', '')}`;
        break;
      case 'HLS':
        url = `${baseUrl}/live/${activeCameraFeed.toLowerCase().replace(' ', '')}/index.m3u8`;
        break;
    }
    navigator.clipboard.writeText(url);
    addLog(`COPIED STREAM URL (${activeProtocol}): ${url}`);
    speakAnnouncement("Stream URL copied.");
  };

  // --- AUDIO HELPERS ---
  const speakTextPromise = (text: string): Promise<void> => {
      return new Promise((resolve) => {
          if (isSilent || !config.audioAlerts) {
              setTimeout(resolve, 1000); // Small delay to simulate
              return;
          }

          console.log(`[AUDIO_ALERT] Looping Speech: "${text}"`);
          addLog(`AUDIO: "${text.toUpperCase()}"`);
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(v => 
            v.name.toLowerCase().includes('google us english') || 
            v.name.toLowerCase().includes('microsoft zira') || 
            v.name.toLowerCase().includes('samantha') || 
            v.name.toLowerCase().includes('female')
          );
          
          if (femaleVoice) u.voice = femaleVoice;
          u.rate = 1.0;
          u.pitch = 1.0;
          
          u.onend = () => resolve();
          u.onerror = () => resolve();
          
          window.speechSynthesis.speak(u);
      });
  };

  // Weapon Alert Logic
  useEffect(() => {
    if (weaponDetected) {
        if (Date.now() - mountTimeRef.current < 3000) {
            console.log("Startup alert suppressed");
            return;
        }
        if (navigator.vibrate) navigator.vibrate([500, 100, 500]);
        
        // Speak Message once
        const desc = suspectDescription ? `Suspect: ${suspectDescription}.` : '';
        const msg = `Warning! ${detectedWeaponType} Detected. ${desc}`;
        speakTextPromise(msg);
    } else {
        window.speechSynthesis.cancel();
    }

    return () => { 
        window.speechSynthesis.cancel();
    };
  }, [weaponDetected, detectedWeaponType, suspectDescription, isSilent, config.audioAlerts]);

  // Generic Analysis
  const triggerAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalyzing(true);
    setAnalysisComplete(false);
    setShowAnalysisLog(true);
    
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      const base64 = dataUrl.split(',')[1];
      
      let prompt = "Describe the scene tactically. Identify any potential threats, weapons, or vehicles. Return as a plain text numbered list. Do NOT use markdown symbols like * or #.";
      if (analysisType === 'CRIME_SCENE') {
          prompt = "Perform a detailed Crime Scene Analysis. Focus on and enumerate as: 1. Location details, 2. Lighting conditions, 3. Structural layout, 4. Potential evidence items (casings, biologicals, prints), 5. Points of entry/exit. Return as plain text only. Do NOT use markdown symbols like * or #.";
      } else if (analysisType === 'TRAFFIC') {
          prompt = "Perform a Traffic Accident Scene Analysis. Focus on and enumerate as: 1. Location conditions, 2. Lighting/Visibility, 3. Road Layout/Debris, 4. Vehicle positions, 5. CASUALTIES/STATUS. Return as plain text only. Do NOT use markdown symbols like * or #.";
      } else if (analysisType === 'EMERGENCY') {
          prompt = "Perform an Emergency Medical Assessment for a potential gunshot wound. Focus on and enumerate as: 1. Patient status, 2. Visible injuries, 3. Immediate life-saving priorities. 4. Recommended First Aid Protocol: [LINK: GUNSHOT_WOUND]. Return as plain text only. Do NOT use markdown symbols like * or #.";
      }

      const result = await analyzeImage(base64, prompt);
      const safeResult = result || "Analysis failed or returned no result.";
      setAnalysis(safeResult);
      addLog(safeResult);
      setAnalysisComplete(true);
      setTimeout(() => setAnalysisComplete(false), 2500);

      if (!isSilent) {
          speakAnnouncement(`Scan complete. ${analysisType.split('_').join(' ')} analysis recorded.`);
      }
    }
    setAnalyzing(false);
  };

  const handleSnapshot = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setSnapshotImage(dataUrl);
        setRedactionRects([]); 
      }
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
      if (!redactionCanvasRef.current) return { x: 0, y: 0 };
      const canvas = redactionCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
      };
  };

  const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); // Prevent scrolling on touch
      const { x, y } = getCanvasCoords(e);
      setIsDrawing(true);
      setStartPos({ x, y });
      setCurrentRect({ x, y, w: 0, h: 0 });
  };

  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      setCurrentRect({
          x: startPos.x,
          y: startPos.y,
          w: x - startPos.x,
          h: y - startPos.y
      });
  };

  const handleDrawEnd = () => {
      if (!isDrawing) return;
      if (currentRect && (Math.abs(currentRect.w) > 5 || Math.abs(currentRect.h) > 5)) {
          // Normalize negative width/height
          const normalizedRect = {
              x: currentRect.w < 0 ? currentRect.x + currentRect.w : currentRect.x,
              y: currentRect.h < 0 ? currentRect.y + currentRect.h : currentRect.y,
              w: Math.abs(currentRect.w),
              h: Math.abs(currentRect.h)
          };
          setRedactionRects(prev => [...prev, normalizedRect]);
      }
      setIsDrawing(false);
      setCurrentRect(null);
  };

  const undoRedaction = () => {
      setRedactionRects(prev => prev.slice(0, -1));
  };

  const handleSaveSnapshot = () => {
      if (!redactionCanvasRef.current) return;
      const dataUrl = redactionCanvasRef.current.toDataURL('image/jpeg');
      
      // Manual Save to Evidence Log
      const newItem: EvidenceItem = {
          id: `EV-MAN-${Date.now()}`,
          type: 'IMAGE',
          timestamp: new Date().toLocaleString(),
          location: '40.7128° N, 74.0060° W',
          officer: 'Sgt. J. Doe',
          tags: ['Manual Capture', 'Redacted'],
          chainOfCustody: [{ action: 'Captured & Redacted', user: 'Sgt. J. Doe', time: new Date().toLocaleTimeString() }],
          content: dataUrl,
          description: 'Manual snapshot with user redactions. Original Securely Archived.'
      };
      
      if (onAddEvidence) onAddEvidence(newItem);

      // Download file
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `CAMERA_EVIDENCE_${Date.now()}_REDACTED.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnapshotImage(null); 
      addLog("EVIDENCE SAVED TO GALLERY");
  };
  
  const toggleWeaponSim = () => {
    if (!weaponDetected) {
        setDetectedWeaponType('HANDGUN');
        setSuspectDescription('MALE IN DARK HOODIE');
        setTracking(prev => ({ ...prev, weapon: { x: 50, y: 50, vx: (Math.random()-0.5), vy: (Math.random()-0.5) } }));
        triggerWeaponAlert(true);
        addLog("SIMULATION STARTED: HANDGUN");
        // We do not auto-capture in sim mode to keep evidence clean
    } else {
        triggerWeaponAlert(false);
        addLog("SIMULATION ENDED");
    }
  };

  const handleJoystickMove = (e: React.MouseEvent | React.TouchEvent, setter: React.Dispatch<React.SetStateAction<{x: number, y: number}>>) => {
      if (!e.currentTarget) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
      } else if ('clientX' in e) {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      } else {
          return; // No valid position
      }
      
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      const maxDist = 30; // Radius limit
      if (dist < maxDist) {
          setter({x, y});
      } else {
          setter({x: (x / dist) * maxDist, y: (y / dist) * maxDist});
      }
  };

  const toggleFaceSim = () => {
      if (!faceMatch) {
          const simSuspect: Suspect = {
              id: 'SIM-ZALDY',
              name: 'Zaldy Co',
              alias: 'ZALDY CO',
              crime: 'PLUNDER, GRAFT & CORRUPTION. ARMED & DANGEROUS.',
              riskLevel: 'HIGH',
              imageUrl: '', // Not used in overlay
              status: 'WANTED'
          };

          setFaceMatch(simSuspect);
          setMatchScore(98);
          setTracking(prev => ({ ...prev, face: { x: 50, y: 40, vx: (Math.random()-0.5), vy: (Math.random()-0.5) } }));
          speakAnnouncement(`Alert. Facial Match. ${simSuspect.name}. Wanted for Plunder and Corruption. Warning: Subject is armed and dangerous. Approach with extreme caution.`);
          addLog(`SIM: FACE DETECTED - ${simSuspect.name.toUpperCase()}`);
          if (navigator.vibrate) navigator.vibrate(200);
      } else {
          setFaceMatch(null);
          setMatchScore(0);
          addLog("SIM: FACE CLEARED");
      }
  };

  const togglePlateSim = () => {
      if (!activeAlertMessage) {
          // Select a random vehicle from the database
          const keys = Object.keys(MOCK_HOTLIST_DB);
          const simPlate = keys[Math.floor(Math.random() * keys.length)];
          const vehicleData = MOCK_HOTLIST_DB[simPlate];
          
          if (vehicleData) {
              const details = `${vehicleData.color} ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.type}`;
              setActiveAlertMessage(`HOTLIST HIT: ${simPlate}`);
              speakAnnouncement(`Warning. Stolen vehicle detected. Plate number ${simPlate.split('').join(' ')}. Description: ${details}. Reported stolen on ${vehicleData.dateStolen}.`);
              addLog(`SIM: ALPR HIT - ${simPlate} (${details.toUpperCase()})`);
          }
      } else {
          setActiveAlertMessage(null);
          addLog("SIM: ALPR CLEARED");
      }
  };

  const handleAction = (action: string) => {
      if (action === 'SILENT') {
          setIsSilent(true);
          window.speechSynthesis.cancel();
      } else if (action === 'BACKUP') {
          setAnalysis("ALERT: BACKUP REQUESTED TO LOCATION. CODE 3.");
          addLog("BACKUP REQUESTED");
          setShowActions(false);
          if (onRequestBackup) onRequestBackup();
      } else if (action === 'MARK') {
          setAnalysis("SUBJECT MARKED: TRACKING ID #9921.");
          addLog("SUBJECT MARKED #9921");
          setShowActions(false);
      }
  };

  const toggleSentry = () => {
      if (isAutoDetecting) {
          setIsAutoDetecting(false);
          triggerWeaponAlert(false); 
          addLog("SENTRY MODE DEACTIVATED");
      } else {
          setIsAutoDetecting(true);
          addLog("SENTRY MODE ACTIVATED");
      }
  };
  
  const handleBoloVoiceInput = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          const chunks: Blob[] = [];
          
          recorder.ondataavailable = e => chunks.push(e.data);
          recorder.onstop = async () => {
              const blob = new Blob(chunks, { type: 'audio/wav' });
              const base64 = await blobToBase64(blob);
              const text = await transcribeUserAudio(base64);
              if (text) {
                  setBoloTarget(text);
                  setIsSettingBolo(false);
                  addLog(`BOLO TARGET SET: ${text.toUpperCase()}`);
              }
              stream.getTracks().forEach(t => t.stop());
          };
          
          recorder.start();
          setTimeout(() => recorder.stop(), 3000); // Record for 3s
      } catch (e) {
          console.error("Mic error", e);
      }
  };

  // AI Module Button Component
  const ModuleToggle = ({ icon: Icon, label, isActive, onClick, color }: { icon: any, label: string, isActive: boolean, onClick: () => void, color: string }) => (
      <button 
          onClick={onClick}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all w-16 h-16 shadow-lg active:scale-95 backdrop-blur-md ${
              isActive 
              ? `${color.replace('text-', 'bg-').replace('500', '500/20')} border-${color.split('-')[1]}-500 ${color} shadow-[0_0_15px_rgba(0,0,0,0.3)]` 
              : 'bg-black/40 border-white/10 text-slate-400 hover:bg-black/60 hover:text-white hover:border-white/30'
          }`}
      >
          <Icon className={`w-6 h-6 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
          <span className="text-[9px] font-bold font-tech tracking-wider">{label}</span>
      </button>
  );

  // Camera Feed Selector Button Component
  const CameraFeedToggle = ({ icon: Icon, label, isActive, onClick, color }: { icon: any, label: string, isActive: boolean, onClick: () => void, color: string }) => (
      <button 
          onClick={onClick}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all w-16 h-16 shadow-lg active:scale-95 backdrop-blur-md ${
              isActive 
              ? `${color.replace('text-', 'bg-').replace('500', '500/20').replace('400', '400/20')} border-${color.split('-')[1]}-500 ${color} shadow-[0_0_15px_rgba(0,0,0,0.3)]` 
              : 'bg-black/40 border-white/10 text-slate-400 hover:bg-black/60 hover:text-white hover:border-white/30'
          }`}
      >
          <Icon className={`w-5 h-5 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
          <span className="text-[8px] font-bold font-tech tracking-wider text-center flex-1 flex items-center leading-tight">{label}</span>
      </button>
  );

  return (
    <div className="flex h-full w-full bg-black select-none overflow-hidden relative group">
      
      {/* --- TOP STATUS BAR (Overlay) --- */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
          <div className="flex flex-col gap-1 pointer-events-auto">
              <div className="flex items-center gap-4 text-white font-mono text-xs">
                  <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                      <span className="font-bold">{isRecording ? 'REC 00:04:23' : 'STBY'}</span>
                      <span className="text-slate-500 mx-1">|</span>
                      <span className="text-slate-400">4921 (DOE)</span>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 pointer-events-auto">
                      <button onClick={toggleWeaponSim} className={`text-[8px] h-5 px-1.5 rounded transition-all ${weaponDetected ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                           SIM:WPN
                      </button>
                      <button onClick={toggleFaceSim} className={`text-[8px] h-5 px-1.5 rounded transition-all ${faceMatch ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                           SIM:FACE
                      </button>
                      <button onClick={togglePlateSim} className={`text-[8px] h-5 px-1.5 rounded transition-all ${activeAlertMessage?.includes('HOTLIST') ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                           SIM:PLT
                      </button>
                      <button 
                          onClick={triggerManualGunshotSim}
                          className={`text-[8px] h-5 px-1.5 rounded transition-all ${gunshotDetected ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                      >
                          SIM:SHOT
                      </button>
                      <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                      <button 
                          onClick={() => setStreamSource('backend')} 
                          className={`text-[8px] h-5 px-2 rounded font-black tracking-wider transition-all flex items-center gap-1 ${streamSource === 'backend' ? 'bg-cyan-600/90 text-white font-extrabold shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-cyan-400 hover:text-cyan-300 hover:bg-white/5'}`}
                          title="View Live Backend MJPEG Video Stream Feed"
                      >
                          <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-300" />
                          <span>LIVE STREAM</span>
                      </button>
                      <button 
                          onClick={() => { setStreamSource('hardware'); startCamera(); }} 
                          className={`text-[8px] h-5 px-2 rounded font-black tracking-wider transition-all flex items-center gap-1 ${streamSource === 'hardware' ? 'bg-emerald-600/90 text-white font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'text-emerald-400 hover:text-emerald-300 hover:bg-white/5'}`}
                          title="Use Native Device Camera Hardware"
                      >
                          <Camera className="w-2.5 h-2.5" />
                          <span>HW CAM</span>
                      </button>
                      <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                      <button 
                          onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')} 
                          className="text-[8px] h-5 px-1.5 rounded transition-all text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/15 flex items-center gap-1 cursor-pointer"
                          title="Flip Camera (Front/Back)"
                      >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>FLIP</span>
                      </button>
                      <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                      <button 
                          onClick={() => setIsStreamingServerOpen(true)}
                          className="text-[8px] h-5 px-2 rounded font-black tracking-wider transition-all text-purple-400 border border-purple-500/25 hover:bg-purple-500/15 flex items-center gap-1 cursor-pointer"
                          title="Sovereign Broadcast Server & Live Streaming Protocols"
                      >
                          <Server className="w-2.5 h-2.5 text-purple-400 animate-pulse" />
                          <span>BROADCAST CONFIG</span>
                      </button>
                      <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                      <button onClick={() => setIsSettingsOpen(true)} className="h-5 w-6 rounded text-slate-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center">
                          <Settings className="w-2.5 h-2.5" />
                      </button>
                  </div>
              </div>
          </div>

          {/* Center Status Indicators */}
          <div className="flex gap-2 pointer-events-none">
              {inCooldown && (
                  <div className="flex items-center gap-2 bg-slate-900/80 text-red-400 px-3 py-1 rounded-full border border-red-500/50 font-tech text-[10px] font-bold animate-pulse">
                      <Timer className="w-3 h-3" /> COOLING DOWN
                  </div>
              )}
              {isStreaming && (
                  <div className="flex items-center gap-2 bg-cyan-900/80 text-cyan-100 px-3 py-1 rounded-full border border-cyan-500/50 animate-pulse font-tech text-[10px]">
                      <Radio className="w-3 h-3" /> LIVE HQ
                  </div>
              )}
          </div>

          <div className="flex flex-col items-end gap-1 text-xs text-slate-300 font-mono pointer-events-none">
              <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-green-500" /> 88%
                  <Signal className="w-4 h-4 text-blue-500" /> 5G
              </div>
              <div className="text-[10px] text-slate-500">40.7128°N 74.0060°W</div>
          </div>
      </div>

      {/* --- LEFT SIDEBAR: CAMERA SELECTION (with slide-out toggle) --- */}
      <div className={`absolute left-0 top-16 bottom-24 flex z-20 transition-transform duration-300 ${showLeftControls ? 'translate-x-[0px]' : '-translate-x-[80px]'}`}>
          <div className="w-20 flex flex-col gap-3 items-center pl-2 overflow-y-auto no-scrollbar py-2 bg-black/60 backdrop-blur-md border-r border-white/5">
              <CameraFeedToggle icon={Radio} label="DRONE CAM" isActive={activeCameraFeed === 'Drone Cam'} onClick={() => setActiveCameraFeed('Drone Cam')} color="text-cyan-400" />
              <CameraFeedToggle icon={Eye} label="SMARTGLASS" isActive={activeCameraFeed === 'Smartglass Cam'} onClick={() => setActiveCameraFeed('Smartglass Cam')} color="text-red-400" />
              <CameraFeedToggle icon={Aperture} label="AERIAL CAM" isActive={activeCameraFeed === 'Aerial Cam'} onClick={() => setActiveCameraFeed('Aerial Cam')} color="text-emerald-400" />
              <CameraFeedToggle icon={EyeOff} label="SPY CAM" isActive={activeCameraFeed === 'Spy Cam'} onClick={() => setActiveCameraFeed('Spy Cam')} color="text-purple-400" />
              <CameraFeedToggle icon={Shield} label="OFFICER CAM" isActive={activeCameraFeed === 'Officer Cam'} onClick={() => setActiveCameraFeed('Officer Cam')} color="text-blue-400" />
              <CameraFeedToggle icon={Car} label="DASH" isActive={activeCameraFeed === 'Dash'} onClick={() => setActiveCameraFeed('Dash')} color="text-amber-400" />
          </div>
          
          {/* Toggle Button */}
          <button 
              onClick={() => setShowLeftControls(!showLeftControls)}
              className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-16 bg-black/60 border border-white/10 rounded-r-lg flex items-center justify-center text-white"
          >
              <ChevronRight className={`w-5 h-5 transition-transform ${showLeftControls ? 'rotate-180' : ''}`} />
          </button>
      </div>

      {/* --- RIGHT SIDEBAR: AI MODULES (with slide-out toggle) --- */}
      <div className={`absolute right-0 top-16 bottom-24 flex z-20 transition-transform duration-300 ${showRightControls ? 'translate-x-0' : 'translate-x-[60px]'}`}>
          {/* Toggle Button */}
          <button 
              onClick={() => setShowRightControls(!showRightControls)}
              className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-black/60 border border-white/10 rounded-l-lg flex items-center justify-center text-white"
          >
              <ChevronRight className={`w-5 h-5 transition-transform ${showRightControls ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="w-20 flex flex-col gap-3 items-center pr-2 overflow-y-auto no-scrollbar py-2 bg-black/60 backdrop-blur-md border-l border-white/5">
              <ModuleToggle icon={Eye} label="SENTRY" isActive={isAutoDetecting} onClick={toggleSentry} color="text-emerald-400" />
              <ModuleToggle icon={Car} label="ALPR" isActive={isALPRActive} onClick={() => setIsALPRActive(!isALPRActive)} color="text-blue-400" />
              <ModuleToggle icon={ScanFace} label="FACE ID" isActive={isFaceIDActive} onClick={() => setIsFaceIDActive(!isFaceIDActive)} color="text-cyan-400" />
              <ModuleToggle icon={Target} label="AR MODE" isActive={isARModeActive} onClick={() => setIsARModeActive(!isARModeActive)} color="text-purple-400" />
              <ModuleToggle icon={SearchIcon} label="BOLO" isActive={!!boloTarget} onClick={() => setIsSettingBolo(true)} color="text-blue-400" />
          </div>
      </div>

      {/* --- CENTER PANEL: VIDEO FEED --- */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
        {/* GUNSHOT ALERT OVERLAY */}
        {gunshotDetected && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-flash">
                <div className="absolute inset-0 border-[20px] border-red-600 animate-pulse"></div>
                <div className="bg-red-600 text-white px-8 py-4 rounded-xl border-4 border-white shadow-[0_0_50px_red] flex flex-col items-center">
                    <div className="flex items-center gap-4 mb-2">
                        <AlertTriangle className="w-12 h-12 animate-bounce" />
                        <h1 className="text-4xl font-black tracking-widest font-tech">SHOTS FIRED!</h1>
                        <AlertTriangle className="w-12 h-12 animate-bounce" />
                    </div>
                    <div className="text-xl font-bold uppercase tracking-widest animate-pulse">TAKE COVER IMMEDIATELY</div>
                </div>
            </div>
        )}

        {/* Redaction Overlay would go here */}
        {snapshotImage && (
            <div className="absolute inset-0 z-50 bg-black flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-900 border-b border-slate-700 p-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-red-500 font-bold">
                        <Ban className="w-5 h-5" /> REDACTION MODE
                    </div>
                    <div className="text-xs text-slate-400">DRAG BOX TO BLUR SENSITIVE DATA</div>
                    <button onClick={() => setSnapshotImage(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div 
                    className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden cursor-crosshair touch-none"
                    onMouseDown={handleDrawStart}
                    onMouseMove={handleDrawMove}
                    onMouseUp={handleDrawEnd}
                    onMouseLeave={handleDrawEnd}
                    onTouchStart={handleDrawStart}
                    onTouchMove={handleDrawMove}
                    onTouchEnd={handleDrawEnd}
                >
                    <canvas 
                        ref={redactionCanvasRef} 
                        className="max-w-full max-h-full object-contain shadow-2xl border border-slate-800"
                    />
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-between items-center gap-4">
                    <button 
                        onClick={undoRedaction}
                        disabled={redactionRects.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs disabled:opacity-50"
                    >
                        <RotateCcw className="w-4 h-4" /> UNDO
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setSnapshotImage(null)}
                            className="px-6 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs"
                        >
                            DISCARD
                        </button>
                        <button 
                            onClick={handleSaveSnapshot}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-bold text-xs shadow-lg flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> SAVE EVIDENCE
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Video Element */}
        <div 
            className={`relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-linear origin-center ${isNVG ? 'nvg-active' : ''}`}
            style={{ 
                transform: `scale(${zoomLevel})`,
                filter: isNVG ? 'grayscale(100%) brightness(1.2) contrast(1.5) sepia(100%) hue-rotate(100deg) saturate(1000%)' : 'none'
            }}
        >
            {isNVG && (
                <div className="absolute inset-0 bg-green-500/10 pointer-events-none z-10 mix-blend-overlay">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.5)_100%)]"></div>
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>
            )}

            {/* Drone Cam Custom Telemetry */}
            {activeCameraFeed === 'Drone Cam' && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 font-mono text-cyan-400 text-[10px] tracking-wider">
                    <div className="flex justify-between items-start mt-12 w-full">
                        <div className="bg-black/60 border border-cyan-500/20 px-3 py-2 rounded-lg backdrop-blur-sm self-start flex flex-col gap-0.5 text-left">
                            <div className="text-cyan-300 font-bold font-tech uppercase">UAV PATROL LINK</div>
                            <div>ALTITUDE: 124.5 m</div>
                            <div>HEADING: 184.2° S</div>
                            <div>BATTERY: 92% OPT</div>
                            <div>SIGNAL: 124 ms LAT</div>
                        </div>
                        <div className="bg-black/60 border border-cyan-500/20 px-3 py-2 rounded-lg backdrop-blur-sm self-start flex flex-col gap-0.5 text-right">
                            <div className="text-cyan-300 font-bold font-tech uppercase animate-pulse">GIMBAL DECK</div>
                            <div>ZOOM: {zoomLevel}x OPT</div>
                            <div>PITCH: +22.4°</div>
                            <div>ROLL: -1.2°</div>
                            <div>WIND: 11 km/h NW</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Smartglass Cam Custom Telemetry */}
            {activeCameraFeed === 'Smartglass Cam' && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 font-mono text-red-500 text-[10px] tracking-wider">
                    <div className="flex justify-between items-start mt-12 w-full">
                        <div className="bg-black/60 border border-red-500/20 px-3 py-2 rounded-lg backdrop-blur-sm flex flex-col gap-0.5 text-left">
                            <div className="text-red-300 font-bold font-tech uppercase animate-pulse">SMARTGLASS HUD</div>
                            <div>EYE-LINK: STABLE</div>
                            <div>IRIS REGISTRATION: ON</div>
                            <div>RESOL: 8K RETINA</div>
                        </div>
                        <div className="bg-black/60 border border-red-500/20 px-3 py-2 rounded-lg backdrop-blur-sm flex flex-col gap-0.5 text-right">
                            <div className="text-red-300 font-bold font-tech uppercase">HEALTH SECURE</div>
                            <div>HR: 76 BPM (NORM)</div>
                            <div>TEMP: 36.8°C</div>
                            <div>SPO2: 99%</div>
                        </div>
                    </div>
                    {/* Glass reticle markers */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-4 h-4 border-t-2 border-l-2 border-red-500 absolute top-0 left-0"></div>
                        <div className="w-4 h-4 border-t-2 border-r-2 border-red-500 absolute top-0 right-0"></div>
                        <div className="w-4 h-4 border-b-2 border-l-2 border-red-500 absolute bottom-0 left-0"></div>
                        <div className="w-4 h-4 border-b-2 border-r-2 border-red-500 absolute bottom-0 right-0"></div>
                        <span className="text-[8px] text-red-500 font-bold tracking-widest uppercase animate-pulse">EYE_TRACKING</span>
                    </div>
                </div>
            )}

            {/* Aerial Cam Custom Telemetry */}
            {activeCameraFeed === 'Aerial Cam' && null}

            {/* Spy Cam Custom Telemetry */}
            {activeCameraFeed === 'Spy Cam' && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 font-mono text-purple-400 text-[10px] tracking-wider">
                    <div className="absolute inset-0 bg-purple-500/5 mix-blend-color"></div>
                    <div className="flex justify-between items-start mt-12 w-full">
                        <div className="bg-black/60 border border-purple-500/20 px-3 py-2 rounded-lg backdrop-blur-sm flex flex-col gap-0.5 text-left">
                            <div className="text-purple-300 font-bold font-tech uppercase animate-pulse">COVERT SPY CH</div>
                            <div>MODE: SILENT</div>
                            <div>IR FILTER: HIGH</div>
                            <div>GAIN: AUTO-MATCH</div>
                        </div>
                        <div className="bg-black/60 border border-purple-500/20 px-3 py-2 rounded-lg backdrop-blur-sm flex flex-col gap-0.5 text-right">
                            <div className="text-purple-300 font-bold font-tech uppercase">DECRYPTER</div>
                            <div>DECRYPTION: AES256</div>
                            <div>PING: 42 ms</div>
                            <div>DE-NOISE: ON</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Officer Cam Custom Telemetry */}
            {activeCameraFeed === 'Officer Cam' && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 font-mono text-blue-400 text-[10px] tracking-wider">
                    <div className="flex justify-between items-start mt-12 w-full">
                        <div className="bg-black/60 border border-blue-500/20 px-3 py-2 rounded-lg backdrop-blur-sm flex flex-col gap-0.5 text-left">
                            <div className="text-blue-300 font-bold font-tech uppercase flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                                BWC AXON-V
                            </div>
                            <div>UNIT ID: P-201</div>
                            <div>OFFICER: DOE, J</div>
                            <div>CODE: TACTICAL-2</div>
                        </div>
                        <div className="bg-black/60 border border-blue-500/20 px-3 py-2 rounded-lg backdrop-blur-sm flex flex-col gap-0.5 text-right">
                            <div className="text-blue-300 font-bold font-tech uppercase">AUDIT AUDIO</div>
                            <div>MIC: BUILT-IN ON</div>
                            <div>STABILIZER: ACTIVE</div>
                            <div>WTRPROOF: IP68</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dash Custom Telemetry */}
            {activeCameraFeed === 'Dash' && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 font-mono text-yellow-400 text-[10px] tracking-wider">
                    <div className="flex justify-between items-start mt-12 w-full">
                        <div className="bg-black/60 border border-yellow-500/20 px-3 py-2 rounded-lg backdrop-blur-sm flex flex-col gap-0.5 text-left">
                            <div className="text-yellow-300 font-bold font-tech uppercase">CRUISER-D81</div>
                            <div>RADAR: ENABLED</div>
                            <div>FRONT SPEED: 54 MPH</div>
                            <div>LIMIT: 45 MPH</div>
                        </div>
                        <div className="bg-black/60 border border-yellow-500/20 px-3 py-2 rounded-lg backdrop-blur-sm flex flex-col gap-0.5 text-right">
                            <div className="text-yellow-300 font-bold font-tech uppercase">CRUISER TELEM</div>
                            <div>CRUISER SPEED: 65 MPH</div>
                            <div>SIREN STATUS: WALE</div>
                            <div>ENGINE: 184°F NORM</div>
                        </div>
                    </div>
                </div>
            )}

             {activeCameraFeed === 'Drone Cam' && (
                <div className="absolute inset-x-0 bottom-24 flex justify-between px-10 z-40">
                   {/* Left Joystick: Movement */}
                   <div className="flex flex-col items-center gap-2">
                        <div 
                           className="w-32 h-32 rounded-full bg-black/40 border-2 border-white/20 backdrop-blur-md flex items-center justify-center relative touch-none select-none shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer"
                           onMouseDown={(e) => handleJoystickMove(e, setMoveJoystick)}
                           onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e, setMoveJoystick)}
                           onTouchMove={(e) => handleJoystickMove(e, setMoveJoystick)}
                           onMouseUp={() => setMoveJoystick({x: 0, y: 0})}
                           onMouseLeave={() => setMoveJoystick({x: 0, y: 0})}
                           onTouchEnd={() => setMoveJoystick({x: 0, y: 0})}
                        >
                            <div 
                                className="w-12 h-12 rounded-full bg-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.8)] border border-cyan-300 absolute"
                                style={{ transform: `translate(${moveJoystick.x}px, ${moveJoystick.y}px)` }}
                            ></div>
                        </div>
                        <span className="text-cyan-200/90 font-tech text-[12px] tracking-widest uppercase font-bold">MOVE</span>
                   </div>
                   
                   {/* Right Joystick: Camera */}
                   <div className="flex flex-col items-center gap-2">
                        <div 
                           className="w-32 h-32 rounded-full bg-black/40 border-2 border-white/20 backdrop-blur-md flex items-center justify-center relative touch-none select-none shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer"
                           onMouseDown={(e) => handleJoystickMove(e, setCamJoystick)}
                           onMouseMove={(e) => e.buttons === 1 && handleJoystickMove(e, setCamJoystick)}
                           onTouchMove={(e) => handleJoystickMove(e, setCamJoystick)}
                           onMouseUp={() => setCamJoystick({x: 0, y: 0})}
                           onMouseLeave={() => setCamJoystick({x: 0, y: 0})}
                           onTouchEnd={() => setCamJoystick({x: 0, y: 0})}
                        >
                            <div 
                                className="w-12 h-12 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.8)] border border-emerald-300 absolute"
                                style={{ transform: `translate(${camJoystick.x}px, ${camJoystick.y}px)` }}
                            ></div>
                        </div>
                        <span className="text-emerald-200/90 font-tech text-[12px] tracking-widest uppercase font-bold">CAM</span>
                   </div>
                </div>
            )}
            {cameraError ? (
                <div className="flex flex-col items-center justify-center text-red-500 p-8 text-center border-2 border-red-900/50 bg-slate-950/80 rounded-xl backdrop-blur-md pointer-events-auto z-10 font-mono">
                    <AlertTriangle className="w-16 h-16 mb-4 animate-pulse" />
                    <h2 className="text-xl font-black tracking-widest uppercase mb-2 font-tech">FEED DISCONNECTED</h2>
                    <p className="font-mono text-xs text-red-400 mb-6">{cameraError}</p>
                    <div className="flex gap-4">
                        <button onClick={() => startCamera()} className="bg-red-900/50 hover:bg-red-800 text-white border border-red-500 px-4 py-2 rounded text-xs font-bold uppercase transition-transform active:scale-95 cursor-pointer">RETRY CONNECTION</button>
                        <button onClick={() => { setCameraError(null); setFallbackSimulation(true); }} className="bg-cyan-950/40 hover:bg-cyan-900 text-cyan-400 border border-cyan-500 px-4 py-2 rounded text-xs font-bold uppercase transition-transform active:scale-95 cursor-pointer">ACTIVATE SURVEILLANCE FEED</button>
                    </div>
                </div>
            ) : fallbackSimulation ? (
                <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                    {/* Scanning Radar Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.3)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950"></div>
                    
                    {/* Scanning Line overlay */}
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-bounce pointer-events-none"></div>

                    {/* Tactical camera frame elements */}
                    <div className="absolute top-12 left-12 right-12 bottom-12 border border-cyan-500/10 rounded flex flex-col justify-between p-4 pointer-events-none">
                        <div className="flex justify-between font-mono text-[9px] text-cyan-400/70">
                            <div>SIM: DECK_BWC [ONLINE]</div>
                            <div>FPS: 60.0</div>
                        </div>
                        <div className="flex justify-between font-mono text-[9px] text-cyan-400/70 text-right">
                            <div>LQR: ENCRYPTED_SSL</div>
                            <div>THRM: PASSIVE_HEAT</div>
                        </div>
                    </div>

                    {/* Rotating target ring */}
                    <div className="relative w-64 h-64 rounded-full border border-dashed border-cyan-500/20 flex items-center justify-center animate-spin duration-10000">
                        <div className="w-56 h-56 rounded-full border border-cyan-500/10 flex items-center justify-center">
                            <div className="w-44 h-44 rounded-full border border-cyan-500/30 flex items-center justify-center">
                                <Aperture className="w-12 h-12 text-cyan-400/30 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Dynamic simulated object bounds */}
                    <div className="absolute top-1/4 left-1/4 p-2 border-2 border-red-500/50 bg-red-950/45 backdrop-blur-md rounded font-mono text-[9px] text-red-400 flex flex-col gap-1 shadow-lg shadow-red-950/50 animate-pulse">
                        <div className="font-extrabold flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500 animate-ping" /> SECURE_ALARM: RETINAL</div>
                        <div>CONFIDENCE: 99.4%</div>
                        <div>OBJECT: CONCEALED_THREAT</div>
                    </div>

                    <div className="absolute bottom-1/4 right-1/4 p-3 border border-emerald-500/50 bg-emerald-950/45 backdrop-blur-md rounded font-mono text-[9px] text-emerald-400 flex flex-col gap-1 shadow-xl shadow-emerald-950/20">
                        <div className="font-extrabold flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> SOURCE_DETECTED: MOBILE</div>
                        <div>ID: XYZ-9988 (BOLO_ALARM)</div>
                        <div>TYPE: STOLEN_SUVS</div>
                    </div>

                    <div className="absolute bottom-6 flex flex-col items-center gap-2">
                        <span className="font-mono text-[10px] tracking-widest text-cyan-400 bg-slate-900/80 px-4 py-1.5 rounded-full border border-cyan-500/25 animate-pulse uppercase">
                            SURVEILLANCE RADAR VECTOR ACTIVE
                        </span>
                        <button onClick={() => { setFallbackSimulation(false); startCamera(); }} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1 rounded text-[9px] font-bold uppercase transition-all tracking-wider cursor-pointer">
                            RE-ACTIVATE CAMERA DEVICE
                        </button>
                    </div>
                </div>
            ) : streamSource === 'backend' ? (
                <img 
                    src={`/api/stream/live?feed=${encodeURIComponent(activeCameraFeed)}`} 
                    alt="Tactical Live Stream Feed" 
                    className="w-full h-full object-cover select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                />
            ) : (
                <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-all ${weaponDetected ? 'border-4 border-red-600' : ''}`} />
            )}
            
            {/* ALERTS & NOTIFICATIONS */}
            {isARModeActive && activeAlertMessage && (() => {
                const plateMatch = activeAlertMessage.match(/HOTLIST HIT:\s*([A-Z0-9-]+)/);
                const foundPlate = plateMatch ? plateMatch[1] : null;
                const alertVehicle = foundPlate ? MOCK_HOTLIST_DB[foundPlate] : null;
                return (
                    <div className="absolute top-1/4 left-0 right-0 flex justify-center pointer-events-none z-50">
                        <div className="bg-black/90 text-white px-6 py-4 rounded-xl border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-bounce flex items-center gap-4 pointer-events-auto">
                            <AlertTriangle className="w-10 h-10 text-blue-500 flex-shrink-0" />
                            <div className="text-left">
                                <h2 className="text-2xl font-black uppercase font-tech tracking-widest text-blue-400">ALERT</h2>
                                <p className="text-lg font-bold uppercase">{activeAlertMessage}</p>
                                {alertVehicle && (
                                    <div className="mt-2 pt-2 border-t border-white/10 text-xs font-mono text-slate-300">
                                        <div className="font-extrabold text-blue-300 uppercase leading-snug">VEHICLE INFORMATION</div>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <div>TYPE: {alertVehicle.type}</div>
                                            <div>MAKE/MODEL: {alertVehicle.year} {alertVehicle.make} {alertVehicle.model}</div>
                                            <div>COLOR: {alertVehicle.color}</div>
                                            <div className="text-red-400 font-bold mt-1 text-[10px]">REPORTED STOLEN: {alertVehicle.dateStolen.toUpperCase()}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* FACE ID MATCH INFO PANEL */}
            {isARModeActive && faceMatch && !weaponDetected && (
                <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex justify-center pointer-events-none z-50 w-full max-w-sm px-4">
                    <div className="bg-slate-950/95 text-white rounded-xl border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)] flex flex-col p-4 w-full pointer-events-auto backdrop-blur-md font-mono">
                        <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-2 mb-2">
                             <ScanFace className="w-6 h-6 text-cyan-400 animate-pulse flex-shrink-0" />
                             <div className="flex-1 text-left">
                                 <div className="text-[9px] text-cyan-400/80 font-bold uppercase tracking-widest leading-none">FACIAL MATCH IDENTIFIED</div>
                                 <h3 className="text-base font-black text-cyan-200 mt-1 uppercase font-tech tracking-wider">{faceMatch.name}</h3>
                             </div>
                             <div className="bg-cyan-500/10 border border-cyan-400/30 px-2 py-1 rounded text-right flex flex-col justify-center">
                                 <span className="text-[10px] font-black text-cyan-400 tracking-tighter">{matchScore}% MATCH</span>
                                 <div className="w-10 h-1 bg-cyan-950 rounded-full mt-0.5 overflow-hidden">
                                     <div className="h-full bg-cyan-400" style={{ width: `${matchScore}%` }}></div>
                                 </div>
                             </div>
                        </div>
                        
                        <div className="text-left flex flex-col gap-1.5 text-[10px] text-slate-300 font-sans">
                             <div>
                                 <span className="text-cyan-400 font-extrabold uppercase font-mono">ALIAS:</span> <span className="font-mono text-cyan-100 font-semibold">{faceMatch.alias.toUpperCase()}</span>
                             </div>
                             <div>
                                 <span className="text-cyan-400 font-extrabold uppercase font-mono">CRIMINAL CASE / CHARGES:</span>
                                 <p className="text-red-400 font-semibold font-mono mt-1 text-[10px] uppercase leading-relaxed tracking-wide bg-red-950/20 border border-red-500/20 rounded-md p-2">
                                     {faceMatch.crime}
                                 </p>
                             </div>
                             <div className="flex justify-between items-center mt-1 border-t border-cyan-500/15 pt-2">
                                 <div>
                                     <span className="text-cyan-400 font-extrabold uppercase text-[9px] font-mono">RISK LEVEL:</span> <span className="bg-red-600/20 text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase font-mono">{faceMatch.riskLevel}</span>
                                 </div>
                                 <div>
                                     <span className="text-cyan-400 font-extrabold uppercase text-[9px] font-mono">STATUS:</span> <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase animate-pulse font-mono">{faceMatch.status}</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BOLO MATCH OVERLAY - DYNAMIC TRACKING */}
                {isARModeActive && boloMatch && !weaponDetected && (
                <div 
                    className="absolute z-30 flex items-center justify-center pointer-events-none transition-all duration-300 ease-out"
                    style={{ left: `${tracking.bolo.x}%`, top: `${tracking.bolo.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="w-64 h-64 border-4 border-blue-500/80 rounded-lg animate-pulse relative shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                        {/* Status Label */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                            TARGET MATCH: {boloMatch.match.toUpperCase()}
                        </div>
                        {/* Location Label */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-blue-400 text-[10px] font-mono px-2 py-0.5 border border-blue-500 rounded shadow-lg whitespace-nowrap">
                            LOC: {boloMatch.location.toUpperCase()}
                        </div>
                        {/* Tactical Corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                    </div>
                </div>
                )}
                     {/* Detections Overlay */}
             {isARModeActive && detectedObjects.map((obj, i) => (
                 <div
                    key={i}
                    className={`absolute z-10 pointer-events-none ${obj.type === 'weapon' ? 'border-red-500' : 'border-blue-500'}`}
                    style={{
                        left: `${((obj.bbox?.x1 || 0)/256)*100}%`,
                        top: `${((obj.bbox?.y1 || 0)/192)*100}%`,
                        width: `${(((obj.bbox?.x2 || 0) - (obj.bbox?.x1 || 0))/256)*100}%`,
                        height: `${(((obj.bbox?.y2 || 0) - (obj.bbox?.y1 || 0))/192)*100}%`,
                        border: '2px solid'
                    }}
                 >
                    <span className="absolute -top-6 left-0 bg-black/80 text-white text-[10px] px-1 whitespace-nowrap">
                        {obj.type.toUpperCase()} {obj.description || ''}
                    </span>
                 </div>
             ))}

            {/* FACE MATCH BOUNDING BOX - DYNAMIC TRACKING */}
            {isARModeActive && faceMatch && !weaponDetected && !boloMatch && (
                <div 
                    className="absolute z-10 pointer-events-none transition-all duration-300 ease-out"
                    style={{ left: `${tracking.face.x}%`, top: `${tracking.face.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                     <div className="w-40 h-56 relative">
                         <div className="absolute inset-0 border-2 border-cyan-500 rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.6)] animate-pulse opacity-90">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 -mt-1 -ml-1 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 -mt-1 -mr-1 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 -mb-1 -ml-1 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 -mb-1 -mr-1 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                            
                            {/* Percentage Indicator */}
                            {matchScore > 0 && (
                                <div className="absolute top-2 right-2 flex flex-col items-end">
                                    <div className="text-cyan-300 text-xs font-black font-mono tracking-tighter drop-shadow-md">{matchScore}% MATCH</div>
                                    <div className="w-12 h-1 bg-cyan-900 rounded-full mt-0.5">
                                        <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]" style={{ width: `${matchScore}%` }}></div>
                                    </div>
                                </div>
                            )}
                         </div>
                         <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center w-72 z-20">
                              <div className="bg-cyan-950/90 backdrop-blur-md border border-cyan-500/50 px-4 py-2 rounded-t-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] w-full text-center">
                                  <div className="text-cyan-300 font-black text-lg uppercase tracking-widest font-tech flex items-center justify-center gap-2 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
                                      <ScanFace className="w-5 h-5 animate-pulse" /> {faceMatch.alias.toUpperCase()}
                                  </div>
                              </div>
                              <div className="bg-black/80 border-x border-b border-cyan-500/30 w-full text-center py-1.5 rounded-b-lg">
                                  <div className="text-[10px] text-cyan-100 font-mono font-bold tracking-wide uppercase animate-pulse">
                                      CRIME: {faceMatch.crime}
                                  </div>
                              </div>
                         </div>
                    </div>
                </div>
            )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        
        {/* Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
            <div className={`w-64 h-64 border border-cyan-500/30 rounded-lg relative`}>
                 <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                 <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                 <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                 <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-cyan-400"></div>
                 </div>
            </div>
        </div>

        {/* WEAPON ALERTS (Bottom Center Pop-up) */}
        {weaponDetected && (
          <div className="absolute bottom-32 left-0 right-0 flex justify-center animate-flash z-40 pointer-events-none">
              <div className="bg-red-600/90 text-white px-6 py-3 rounded border border-white shadow-xl flex items-center gap-3 backdrop-blur-md">
                 <AlertTriangle className="w-8 h-8" />
                 <div className="text-center">
                   <h2 className="text-lg font-black tracking-widest uppercase leading-none font-tech">{detectedWeaponType} DETECTED</h2>
                   {suspectDescription && <div className="text-xs font-bold text-red-100 uppercase tracking-wide mt-1">{suspectDescription}</div>}
                   <p className="font-mono text-[10px] uppercase tracking-wide leading-none mt-1">Lethal Threat • Auto-Record Active</p>
                 </div>
              </div>
          </div>
        )}

        {/* Analysis Complete Indicator */}
        {analysisComplete && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 pointer-events-none">
                <div className="bg-emerald-500/90 p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.6)] backdrop-blur-md border border-emerald-400">
                        <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="mt-4 bg-black/80 text-emerald-400 font-mono font-bold px-4 py-2 rounded border border-emerald-500/50 shadow-lg">
                    SCAN COMPLETE
                </div>
            </div>
        )}

        {/* AI Analysis Log (Overlay) */}
        {config.showHud && showAnalysisLog && (analysis || isRecordingIntel || activeAlertMessage) && (
           <div 
             id="bwc-analysis-log"
             className="absolute top-16 left-3 w-[272px] h-[176px] glass-panel px-2 py-4 rounded-lg text-xs text-cyan-100 font-mono z-20 border-l-4 border-cyan-500 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-y-auto custom-scrollbar text-left flex flex-col gap-2"
           >
              <button 
                  onClick={() => setShowAnalysisLog(false)}
                  className="absolute top-1 right-1 text-slate-500 hover:text-white"
              >
                  <X className="w-4 h-4" />
              </button>
              {activeAlertMessage ? (
                  <div className="font-black text-blue-400 animate-pulse text-center py-2 border-b border-blue-500/30 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {activeAlertMessage}
                  </div>
              ) : isRecordingIntel ? (
                   <div className="font-bold text-cyan-400 animate-pulse text-center">
                     <Mic className="w-4 h-4 inline mr-2 text-red-500" />
                     RECORDING OFFICER NOTE...
                   </div>
              ) : (
                   <div className="whitespace-pre-line leading-relaxed tracking-wide">
                     <div className="font-black text-cyan-400 mb-3 border-b border-cyan-500/30 pb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                        {analysisType === 'CRIME_SCENE' ? <Fingerprint className="w-4 h-4 text-orange-500" /> : 
                         analysisType === 'TRAFFIC' ? <Car className="w-4 h-4 text-blue-500" /> : <Shield className="w-4 h-4 text-cyan-500" />}
                        {analysisType.replace('_', ' ')} ANALYSIS
                     </div>
                     <div className="text-slate-200 space-y-1">
                        {analysis.replace(/[#*]/g, '').trim().split('\n').map((line, lineIdx) => (
                          <motion.div 
                            key={lineIdx} 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="flex gap-1.5"
                           >
                            <span className="text-cyan-500 font-mono text-[9px] shrink-0">
                              [{new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{new Date().getMilliseconds().toString().padStart(3, '0')}]
                            </span>
                            <div className="flex-1 break-words">
                              {line.split(/\[LINK: (.*?)\]/).map((part, i) => {
                                  if (i % 2 === 1) {
                                      return (
                                          <button 
                                              key={i} 
                                              onClick={() => {
                                                   const target = part.toLowerCase();
                                                   (window as any).PENDING_FIRST_AID_SECTION = target;
                                                   window.dispatchEvent(new CustomEvent('officer-command', { detail: { action: 'NAVIGATE', view: 'FIRST_AID' } }));
                                                   addLog(`NAVIGATING TO: ${target.replace('_', ' ').toUpperCase()}`);
                                              }}
                                              className="bg-red-600 hover:bg-red-500 text-white font-black px-2 py-1 rounded text-[9px] mx-1 uppercase"
                                          >
                                              Open {part.replace('_', ' ')}
                                          </button>
                                      );
                                  }
                                  return part;
                              })}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                   </div>
              )}
           </div>
        )}
      </div>

      {/* --- BOTTOM CONTROL DECK (Solid Panel - No Blur) --- */}
      <div className="absolute bottom-0 left-0 right-0 h-18 bg-black/40 border-t border-white/10 flex items-center justify-between px-6 z-30">
          
          {/* Left Group */}
          <div className="flex items-center gap-4">
              <button 
                  onMouseDown={startRecordNote}
                  onMouseUp={stopRecordNote}
                  onMouseLeave={stopRecordNote}
                  onTouchStart={(e) => { e.preventDefault(); startRecordNote(); }}
                  onTouchEnd={(e) => { e.preventDefault(); stopRecordNote(); }}
                  className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isRecordingIntel ? 'bg-red-500/40 border-red-500 text-white scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                  title="Hold to Speak"
              >
                  {isRecordingIntel && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                  )}
                  <Mic className={`w-5 h-5 ${isRecordingIntel ? 'animate-pulse' : ''}`} />
              </button>
              <div className="relative group/types flex items-center">
                <button 
                    onClick={triggerAnalysis}
                    disabled={analyzing}
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 flex items-center justify-center transition-all disabled:opacity-50"
                    title={analysisType.replace('_', ' ') + " ANALYSIS"}
                >
                    {analyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                        analysisType === 'CRIME_SCENE' ? <Fingerprint className="w-5 h-5" /> :
                        analysisType === 'TRAFFIC' ? <Car className="w-5 h-5" /> : <Aperture className="w-5 h-5" />
                    )}
                </button>
                
                {/* Analysis Mode Selector */}
                <div className="absolute bottom-full left-0 mb-4 hidden group-hover/types:flex flex-col gap-2 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl pointer-events-auto">
                    {[
                        { type: 'TACTICAL', label: 'Tactical', icon: Aperture },
                        { type: 'CRIME_SCENE', label: 'Crime Scene', icon: Fingerprint },
                        { type: 'TRAFFIC', label: 'Traffic', icon: Car },
                        { type: 'EMERGENCY', label: 'Emergency', icon: ShieldAlert }
                    ].map(mode => (
                        <button 
                            key={mode.type}
                            onClick={() => setAnalysisType(mode.type as any)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${analysisType === mode.type ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <mode.icon className="w-3 h-3" /> {mode.label.toUpperCase()}
                        </button>
                    ))}
                </div>
              </div>
          </div>

          {/* Center Record Button */}
          <div className="flex items-center justify-center">
              <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95 ${
                      isRecording 
                      ? 'border-red-500 bg-red-600' 
                      : 'border-white bg-transparent hover:bg-white/10'
                  }`}
              >
                  <div className={`transition-all rounded-sm ${isRecording ? 'w-6 h-6 bg-white' : 'w-12 h-12 bg-red-600 rounded-full'}`} />
              </button>
          </div>

          {/* Right Group */}
          <div className="flex items-center gap-4">
              <button 
                  onClick={handleLogIncident}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
                  title="Log Incident"
              >
                  <FilePlus className="w-5 h-5" />
              </button>
              <button 
                  onClick={() => setIsNVG(!isNVG)}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all active:scale-95 ${isNVG ? 'bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                  title="Toggle NVG"
              >
                  <Eye className={`w-5 h-5 ${isNVG ? 'animate-pulse' : ''}`} />
              </button>
              <button 
                  onClick={handleSnapshot}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
                  title="Snapshot"
              >
                  <Camera className="w-5 h-5" />
              </button>
              <button 
                  onClick={() => setEvidenceGalleryOpen(true)}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 flex items-center justify-center transition-all relative"
                  title="Gallery"
              >
                  <FolderOpen className="w-5 h-5" />
                  {evidenceList.length > 0 && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border border-black"></div>
                  )}
              </button>
              <button 
                  onClick={isBwcRecording ? stopBwcRecording : startBwcRecording}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all active:scale-95 ${isBwcRecording ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                  title="Toggle BWC Recording"
              >
                  <Video className={`w-5 h-5 ${isBwcRecording ? 'animate-pulse' : ''}`} />
              </button>
              <button 
                  onClick={toggleTransmitLive}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all active:scale-95 ${isStreaming ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(5,150,105,0.5)]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                  title="Toggle Live Stream"
              >
                  <Radio className={`w-5 h-5 ${isStreaming ? 'animate-pulse' : ''}`} />
              </button>
          </div>
      </div>

      {/* EVIDENCE GALLERY MODAL */}
        {evidenceGalleryOpen && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom-10">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-black font-tech tracking-wider flex items-center gap-2 text-lg">
                            <FolderOpen className="w-5 h-5 text-blue-500" /> EVIDENCE GALLERY
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono">CAPTURED SNAPSHOTS & METADATA</p>
                    </div>
                    <button onClick={() => setEvidenceGalleryOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {evidenceList.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-10">
                            <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-xs">No evidence captures yet.</p>
                        </div>
                    ) : (
                        evidenceList.filter(item => item.type === 'IMAGE' || item.type === 'DOCUMENT').map(item => (
                            <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden group hover:border-blue-500 transition-colors">
                                <div className="aspect-video relative bg-black">
                                    {item.type === 'DOCUMENT' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500 border-b border-slate-700">
                                            <FileText className="w-12 h-12 mb-2 text-blue-400 opacity-50" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">INCIDENT REPORT</span>
                                        </div>
                                    ) : item.content ? (
                                        <img src={item.content} alt="Evidence" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon /></div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-mono">
                                        {item.timestamp}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="text-[10px] text-blue-500 font-bold mb-1 uppercase tracking-wider">{item.id}</div>
                                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2">
                                        {item.description || "No description provided."}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* SETTINGS MODAL */}
        {isSettingsOpen && (
            <div 
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setIsSettingsOpen(false)}
            >
                <div 
                    className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-cyan-400 font-bold font-tech flex items-center gap-2 text-lg tracking-wider">
                            <Settings className="w-5 h-5 animate-spin-slow" /> SYSTEM CONFIG
                        </h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        {/* Scan Profile */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Activity className="w-3 h-3 text-cyan-500" /> AI Scan Frequency
                            </label>
                            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                                {['PERFORMANCE', 'BALANCED', 'ECO'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setConfig({ ...config, scanProfile: mode as any })}
                                        className={`flex-1 py-2 text-[10px] font-bold rounded transition-all ${
                                            config.scanProfile === mode 
                                            ? 'bg-cyan-600 text-white shadow-lg' 
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 text-center">
                                {config.scanProfile === 'PERFORMANCE' && "High-speed polling (~50ms). Fastest reaction time."}
                                {config.scanProfile === 'BALANCED' && "Optimal detection (~800ms). Balanced battery usage."}
                                {config.scanProfile === 'ECO' && "Low frequency (~3s). Best battery life."}
                            </p>
                        </div>

                        {/* Camera Hardware Selector */}
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Aperture className="w-3.5 h-3.5 text-cyan-500" /> Active Lens / Camera
                            </label>
                            {videoDevices.length > 0 ? (
                                <select
                                    value={selectedDeviceId}
                                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono outline-none focus:border-cyan-500"
                                >
                                    <option value="">Auto-select (by Facing Mode)</option>
                                    {videoDevices.map((device, idx) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${idx + 1}`}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-[10px] text-slate-500 italic bg-slate-800/40 p-2.5 rounded border border-slate-800">
                                    No physical lenses registered. Grant camera permission to enumerate.
                                </div>
                            )}
                            <div className="flex gap-2 justify-between items-center text-[10px] font-mono">
                                <span className="text-slate-500">Mode: <strong className="text-cyan-400 uppercase">{facingMode}</strong></span>
                                <button 
                                    onClick={() => {
                                        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
                                        setSelectedDeviceId(''); // Reset manual ID to trigger facingMode fallback
                                    }} 
                                    className="text-cyan-400 hover:underline hover:text-cyan-300 font-bold"
                                >
                                    Force Flip Camera
                                </button>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${config.autoRecord ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-500'}`}>
                                        <Radio className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">Auto-Record on Threat</div>
                                        <div className="text-[10px] text-slate-500">Starts recording when weapon detected</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setConfig({ ...config, autoRecord: !config.autoRecord })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${config.autoRecord ? 'bg-cyan-600' : 'bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${config.autoRecord ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${config.audioAlerts ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`}>
                                        <Volume2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">Voice Alerts</div>
                                        <div className="text-[10px] text-slate-500">Audible warnings for threats/BOLO</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setConfig({ ...config, audioAlerts: !config.audioAlerts })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${config.audioAlerts ? 'bg-cyan-600' : 'bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${config.audioAlerts ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${config.showHud ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`}>
                                        <EyeOff className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">HUD Overlay</div>
                                        <div className="text-[10px] text-slate-500">Show telemetry and status bars</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setConfig({ ...config, showHud: !config.showHud })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${config.showHud ? 'bg-cyan-600' : 'bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${config.showHud ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800">
                        <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg text-xs tracking-wider shadow-lg">
                            APPLY CONFIGURATION
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* BOLO INPUT MODAL */}
        {isSettingBolo && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-blue-500/50 rounded-xl p-6 w-full max-w-sm">
                    <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                        <SearchIcon className="w-5 h-5" /> VOICE SEARCH (BOLO)
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Describe the target (e.g., "Red truck", "Person in yellow shirt"). The AI will alert you upon visual confirmation.
                    </p>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={boloTarget}
                            onChange={(e) => setBoloTarget(e.target.value)}
                            placeholder="Enter description..."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                        />
                        <button 
                            onClick={handleBoloVoiceInput}
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button onClick={() => setIsSettingBolo(false)} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded font-bold text-xs">CLOSE</button>
                        <button onClick={() => { setBoloTarget(''); setIsSettingBolo(false); }} className="flex-1 bg-red-900/30 text-red-400 py-2 rounded font-bold text-xs">CLEAR BOLO</button>
                    </div>
                </div>
            </div>
        )}

        {/* STREAMING SERVER & PROTOCOL DASHBOARD MODAL */}
        {isStreamingServerOpen && (
            <div 
                className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => setIsStreamingServerOpen(false)}
            >
                <div 
                    className="bg-slate-900 border border-purple-500/45 rounded-xl p-5 w-full max-w-lg shadow-[0_0_30px_rgba(147,51,234,0.15)] animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                        <div>
                            <h3 className="text-purple-400 font-extrabold font-tech flex items-center gap-2 text-base tracking-widest uppercase">
                                <Server className="w-5 h-5 animate-pulse text-purple-400" /> Tactical Stream Server
                            </h3>
                            <p className="text-[10px] text-slate-500 font-mono tracking-wider">C6ISR BROADCAST NODE v4.9.1</p>
                        </div>
                        <button 
                            onClick={() => setIsStreamingServerOpen(false)} 
                            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Server State Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg flex items-center gap-3">
                                <div className={`p-2 rounded-md ${isStreaming ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                    <Wifi className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Server Status</div>
                                    <div className={`text-xs font-black font-tech uppercase ${isStreaming ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        {isStreaming ? 'BROADCASTING' : 'STANDBY'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg flex items-center gap-3">
                                <div className="p-2 rounded-md bg-purple-500/10 text-purple-400">
                                    <Cpu className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] text-slate-500 uppercase font-mono font-bold">Active Camera</div>
                                    <div className="text-xs font-black font-tech uppercase text-purple-300 truncate">
                                        {activeCameraFeed}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Protocol Selection */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                                📡 Select Tactical Protocol
                            </label>
                            <div className="grid grid-cols-5 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                {(['MJPEG', 'WebRTC', 'RTSP', 'RTMP', 'HLS'] as const).map((proto) => (
                                    <button
                                        key={proto}
                                        onClick={() => {
                                            setActiveProtocol(proto);
                                            addLog(`PROTOCOL SWITCH: Activated ${proto}`);
                                            speakAnnouncement(`Protocol set to ${proto}.`);
                                        }}
                                        className={`py-1.5 text-[10px] font-black rounded font-tech transition-all uppercase ${
                                            activeProtocol === proto 
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                        }`}
                                    >
                                        {proto}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Protocol Specific Diagnostic Info Box */}
                        <div className="bg-slate-950 border border-purple-500/15 p-3 rounded-lg space-y-2 text-left font-mono">
                            <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
                                <span className="text-[10px] text-purple-400 font-extrabold font-tech uppercase tracking-wider">{activeProtocol} Engine Diagnostics</span>
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">SECURE DISCOVERY</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-1 text-[10px] text-slate-300">
                                {activeProtocol === 'MJPEG' && (
                                    <>
                                        <div><span className="text-slate-500">MIME-Type:</span> multipart/x-mixed-replace</div>
                                        <div><span className="text-slate-500">Boundary ID:</span> --tacticalframe</div>
                                        <div><span className="text-slate-500">Encoding:</span> JPEG Stream</div>
                                        <div><span className="text-slate-500">Ingest Path:</span> /api/stream/live</div>
                                        <div className="col-span-2 text-slate-400 text-[9px] mt-1 border-t border-slate-900 pt-1">
                                            High compatibility low-overhead motion compression. Stream server pushes static high-resolution frame boundaries natively.
                                        </div>
                                    </>
                                )}
                                {activeProtocol === 'WebRTC' && (
                                    <>
                                        <div><span className="text-slate-500">Peer Connection:</span> Connected</div>
                                        <div><span className="text-slate-500">ICE Gathering:</span> Complete</div>
                                        <div><span className="text-slate-500">Video/Audio:</span> VP8 / OPUS</div>
                                        <div><span className="text-slate-500">Signaling Path:</span> /api/signal</div>
                                        <div><span className="text-slate-500">Packet Loss:</span> 0.01%</div>
                                        <div><span className="text-slate-500">Transport:</span> UDP/DTLS</div>
                                        <div className="col-span-2 text-slate-400 text-[9px] mt-1 border-t border-slate-900 pt-1">
                                            Sovereign ultra-low latency channel (&lt;100ms lag). Native peer handshake encrypted via end-to-end SRTP algorithms.
                                        </div>
                                    </>
                                )}
                                {activeProtocol === 'RTSP' && (
                                    <>
                                        <div><span className="text-slate-500">Server Target:</span> rtsp://0.0.0.0:554</div>
                                        <div><span className="text-slate-500">Codec Map:</span> RTP / H.264</div>
                                        <div><span className="text-slate-500">RTP Sequence:</span> RTP-Seq: 49122</div>
                                        <div><span className="text-slate-500">Payload Typ:</span> 96 (Dynamic)</div>
                                        <div><span className="text-slate-500">Auth Method:</span> HMAC-SHA256</div>
                                        <div><span className="text-slate-500">Control Mode:</span> PLAY, PAUSE</div>
                                        <div className="col-span-2 text-slate-400 text-[9px] mt-1 border-t border-slate-900 pt-1">
                                            Direct tactical network stream integration. Supports standard-issue local CCTV routers and vehicle telemetry interfaces.
                                        </div>
                                    </>
                                )}
                                {activeProtocol === 'RTMP' && (
                                    <>
                                        <div><span className="text-slate-500">Server Host:</span> rtmp://10.128.0.2:1935</div>
                                        <div><span className="text-slate-500">Handshake:</span> C0, C1, C2 Ver 3</div>
                                        <div><span className="text-slate-500">Keyframe Int:</span> 2.0s (Fixed)</div>
                                        <div><span className="text-slate-500">Audio Codec:</span> AAC-LC 128kbps</div>
                                        <div><span className="text-slate-500">Buffer Size:</span> 1500ms</div>
                                        <div><span className="text-slate-500">State:</span> Broadcasting</div>
                                        <div className="col-span-2 text-slate-400 text-[9px] mt-1 border-t border-slate-900 pt-1">
                                            Broadcasting ingest mechanism to server-side archive. Splices incoming video frame streams into immutable tactical forensic logs.
                                        </div>
                                    </>
                                )}
                                {activeProtocol === 'HLS' && (
                                    <>
                                        <div><span className="text-slate-500">Master Play:</span> index.m3u8</div>
                                        <div><span className="text-slate-500">Segment Len:</span> 2.0s chunks</div>
                                        <div><span className="text-slate-500">Bitrate Multi:</span> 3 adaptive layers</div>
                                        <div><span className="text-slate-500">Active Chunk:</span> chunk_0481.ts</div>
                                        <div><span className="text-slate-500">Buffer Target:</span> 3 Segments</div>
                                        <div><span className="text-slate-500">Latency:</span> 6.0s (Safe)</div>
                                        <div className="col-span-2 text-slate-400 text-[9px] mt-1 border-t border-slate-900 pt-1">
                                            Segmented HTTP streaming fallback. Dynamically drops stream quality on low-bandwidth satellite links to prevent frame freezing.
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stream parameters & Quality Controls */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Resolution Picker */}
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                                    <HardDrive className="w-3 h-3 text-purple-400" /> Frame Resolution
                                </label>
                                <select
                                    value={streamResolution}
                                    onChange={(e) => {
                                        setStreamResolution(e.target.value as any);
                                        addLog(`STREAM QUALITY: Set resolution to ${e.target.value}`);
                                        speakAnnouncement(`Resolution set to ${e.target.value}.`);
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono outline-none focus:border-purple-500"
                                >
                                    <option value="1080p">1080p FHD (5.2 Mbps)</option>
                                    <option value="720p">720p HD (2.4 Mbps)</option>
                                    <option value="480p">480p SD (850 Kbps)</option>
                                </select>
                            </div>

                            {/* Ingest Key and Encryption Status */}
                            <div className="space-y-1.5 text-left font-mono text-[10px]">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Lock className="w-3 h-3 text-purple-400" /> Encrypt Status
                                </div>
                                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 flex flex-col justify-center h-[34px]">
                                    <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-slate-500">SECURE TYPE:</span>
                                        <span className="text-emerald-400 font-bold">AES-GCM-256</span>
                                    </div>
                                    <div className="text-[8px] text-purple-400 truncate font-mono">KEY: pc_sec_v4_8e2a...</div>
                                </div>
                            </div>
                        </div>

                        {/* Diagnostic Ping section */}
                        <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg flex flex-col gap-2 text-left">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Stream Diagnostic Utility</span>
                                <button
                                    onClick={handleRunPingTest}
                                    disabled={isPingTesting}
                                    className="px-3 py-1 bg-purple-600/25 border border-purple-500/50 hover:bg-purple-600/40 text-purple-300 font-bold font-tech text-[9px] uppercase tracking-wider rounded transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    {isPingTesting ? 'DIAGNOSING...' : 'PING SERVER'}
                                </button>
                            </div>

                            {isPingTesting && (
                                <div className="flex items-center gap-2 py-1">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
                                    <span className="text-[9px] font-mono text-purple-400">Measuring latency to sovereign ingest gateway...</span>
                                </div>
                            )}

                            {pingResult && !isPingTesting && (
                                <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2 rounded border border-purple-500/10 text-center font-mono animate-in fade-in duration-150">
                                    <div>
                                        <div className="text-[8px] text-slate-500 uppercase">PING LATENCY</div>
                                        <div className="text-xs font-extrabold text-emerald-400">{pingResult.latency}ms</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] text-slate-500 uppercase">JITTER</div>
                                        <div className="text-xs font-extrabold text-emerald-400">{pingResult.jitter}ms</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] text-slate-500 uppercase">LINK RATING</div>
                                        <div className="text-xs font-extrabold text-purple-400">{pingResult.status}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active Subscribers / Viewers */}
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-purple-400" /> Connected Subscribers ({activeViewers.length})
                            </label>
                            
                            {activeViewers.length > 0 ? (
                                <div className="space-y-1.5 max-h-24 overflow-y-auto no-scrollbar pr-1">
                                    {activeViewers.map((viewer) => (
                                        <div 
                                            key={viewer.id} 
                                            className="bg-slate-950 border border-slate-800 p-2 rounded-lg flex justify-between items-center text-[10px] font-mono"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-slate-200 font-bold">{viewer.name}</span>
                                                <div className="flex items-center gap-2 text-slate-500 text-[8px] mt-0.5">
                                                    <span>PROTO: <strong className="text-purple-400">{viewer.protocol}</strong></span>
                                                    <span>•</span>
                                                    <span>ACTIVE: {viewer.duration}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDisconnectViewer(viewer.id, viewer.name)}
                                                className="px-2 py-1 bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-900/30 hover:border-red-500/50 rounded font-bold text-[8px] transition-all cursor-pointer"
                                            >
                                                TERMINATE
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[9px] text-slate-500 bg-slate-950/50 p-3 rounded-lg text-center border border-slate-900 italic">
                                    No active external viewer handshakes registered.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Utility buttons */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex gap-2">
                        <button 
                            type="button"
                            onClick={handleCopyStreamUrl}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                        >
                            <Link className="w-3.5 h-3.5" /> COPY {activeProtocol} URL
                        </button>
                        <button 
                            type="button"
                            onClick={toggleTransmitLive}
                            className={`flex-1 font-bold py-2.5 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                                isStreaming 
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                            }`}
                        >
                            <Radio className={`w-3.5 h-3.5 ${isStreaming ? 'animate-pulse' : ''}`} />
                            {isStreaming ? 'SUSPEND BROADCAST' : 'START BROADCAST'}
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default CameraView;
