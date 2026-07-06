
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Bot, StopCircle, Volume2, Sparkles, Brain, Loader2, VolumeX, Power, ChevronLeft, Maximize2, X, RotateCw, ShieldAlert, Car, ScanFace, HeartPulse, FileText } from 'lucide-react';
import { generateTextResponse, createChatSession, transcribeUserAudio, generateSpeech, interpretVoiceCommand } from './services/geminiService';
import { ChatMessage, ViewState } from './types';

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

interface BuddyChatProps {
    onBack?: () => void;
    onExpand?: () => void;
    isFloating?: boolean;
    variant?: 'floating' | 'header' | 'default';
    autoStartVoice?: boolean;
}

const HolographicAvatar: React.FC<{ isActive: boolean, isSpeaking: boolean, isThinking: boolean, size?: 'xs' | 'sm' | 'md' }> = ({ isActive, isSpeaking, isThinking, size = 'md' }) => {
    const dim = size === 'xs' ? 'w-8 h-8' : size === 'sm' ? 'w-24 h-24' : 'w-48 h-48';
    const coreDim = size === 'xs' ? 'w-6 h-6' : size === 'sm' ? 'w-16 h-16' : 'w-32 h-32';
    const ballDim = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-6 h-6' : 'w-12 h-12';
    const eyeDim = size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-2 h-2' : 'w-4 h-4';

    return (
        <div className={`relative ${dim} flex items-center justify-center my-2`}>
            {/* Core Glow */}
            <div className={`absolute inset-0 bg-cyan-400/25 rounded-full blur-2xl transition-all duration-1000 ${isActive ? 'opacity-100 scale-110' : 'opacity-20 scale-100'} ${isSpeaking ? 'animate-pulse' : ''}`}></div>
            
            {/* 3D Gyroscope Container */}
            <div className={`relative ${coreDim}`} style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
                
                {/* Outer Ring */}
                <div className={`absolute inset-0 border-[2px] border-cyan-500/60 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-[20s] linear ${isActive ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                     style={{ transform: 'rotateX(60deg) rotateY(0deg)' }}>
                </div>

                {/* Central Core */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`bg-cyan-400 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.9)] transition-all duration-300 relative flex items-center justify-center ${ballDim} ${isSpeaking ? 'scale-110 animate-pulse' : isThinking ? 'scale-90 animate-pulse bg-sky-400 shadow-sky-500/80' : 'scale-100'}`}>
                        {/* Core Eye */}
                        <div className={`${eyeDim} bg-white rounded-full blur-[2px]`}></div>
                        {isSpeaking && (
                            <div className="absolute inset-0 border-2 border-white rounded-full animate-ping opacity-50"></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BuddyChat: React.FC<BuddyChatProps> = ({ onBack, onExpand, isFloating = false, variant, autoStartVoice = false }) => {
  const effectiveVariant = variant || (isFloating ? 'floating' : 'default');
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(effectiveVariant === 'default' || autoStartVoice);
  const [activeFeatures, setActiveFeatures] = useState({weapon: false, lpr: false, face: false, bio: false});
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'system', text: isFloating ? "Officer Standby." : "Officer initialized. Say 'Hey Officer' to activate.", timestamp: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [useThinking, setUseThinking] = useState(false);
  
  // WAKE WORD STATE
  const [wakeStatus, setWakeStatus] = useState<'OFF' | 'PASSIVE' | 'ACTIVE'>('OFF');
  const wakeRecognitionRef = useRef<any>(null);
  const wakeStatusRef = useRef<'OFF' | 'PASSIVE' | 'ACTIVE'>('OFF'); 
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef(false);

  const processAudioQueue = async () => {
    if (isPlayingQueueRef.current || audioQueueRef.current.length === 0) return;
    isPlayingQueueRef.current = true;
    while (audioQueueRef.current.length > 0) {
        const audioData = audioQueueRef.current.shift();
        if (audioData) {
            await playAudioData(audioData);
        }
    }
    isPlayingQueueRef.current = false;
  };

  const queueAudioForPlayback = (audioData: string) => {
    audioQueueRef.current.push(audioData);
    processAudioQueue();
  };

  // Initialize Chat Session on Mount/Change
  useEffect(() => {
    const initChat = async () => {
        try {
            const chat = await createChatSession(useThinking ? 'gemini-3-pro-preview' : 'gemini-2.5-flash');
            if (chat) {
                chatSessionRef.current = chat;
                console.log("Officer Session Re-Initialized with model:", useThinking ? 'gemini-3-pro-preview' : 'gemini-2.5-flash');
            }
        } catch (e) {
            console.error("Failed to init chat session", e);
        }
        
        // Auto-start wake listener on mount for hands-free experience
        setTimeout(() => {
            if (autoStartVoice) {
                handleWakeDetected(null);
            } else if (effectiveVariant === 'default') {
                startWakeListener();
                setWakeStatus('PASSIVE');
                wakeStatusRef.current = 'PASSIVE';
            }
        }, 1500);
    };
    initChat();
    return () => {
        if (audioContextRef.current) audioContextRef.current.close();
        window.speechSynthesis.cancel();
        stopWakeListener();
    }
}, [useThinking]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync refs with state
  useEffect(() => {
      wakeStatusRef.current = wakeStatus;
  }, [wakeStatus]);

  useEffect(() => {
     isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // --- WAKE WORD LOGIC ---
  const toggleWakeSystem = () => {
      if (wakeStatus === 'OFF') {
          startWakeListener();
      } else {
          stopWakeListener();
      }
  };

  const startWakeListener = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          console.warn("Speech recognition not supported");
          setWakeStatus('OFF');
          wakeStatusRef.current = 'OFF';
          return;
      }

      if (wakeRecognitionRef.current) return;
      if (isSpeaking) return; // Don't listen while speaking

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
          setWakeStatus('PASSIVE');
          wakeStatusRef.current = 'PASSIVE';
      };

      recognition.onresult = (event: any) => {
          // If we are already handling a wake event or speaking, ignore
          if (wakeStatusRef.current === 'ACTIVE' || isSpeakingRef.current) return;

          for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcript = event.results[i][0].transcript.trim().toLowerCase();
              
              // Detect wake words
              const wakeWords = ["officer", "hey officer", "hi officer", "buddy", "hey buddy", "offcier", "hey offcier", "hi offcier"];
              const detectedWakeWord = wakeWords.find(w => transcript.includes(w));

              if (detectedWakeWord) {
                  console.log("Wake detected:", transcript);
                  const remainingText = transcript.slice(detectedWakeWord.length).trim();
                  handleWakeDetected(recognition, remainingText);
                  break;
              }
          }
      };

      recognition.onerror = (event: any) => {
          const errorType = event.error;
          console.warn("Wake recognition error:", errorType);
          if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
              setWakeStatus('OFF');
              wakeStatusRef.current = 'OFF';
              return;
          }
          // For other errors, we expect onend to trigger and restart
      };

      recognition.onend = () => {
          if (wakeStatusRef.current === 'PASSIVE') {
              console.log("Recognition ended naturally, restarting...");
              setTimeout(() => {
                   if (wakeStatusRef.current === 'PASSIVE') {
                       try { 
                           wakeRecognitionRef.current = null;
                           startWakeListener(); 
                       } catch(e) {}
                   }
              }, 300);
          } else {
              wakeRecognitionRef.current = null;
          }
      };

      try {
          recognition.start();
          wakeRecognitionRef.current = recognition;
      } catch (e) {
          setWakeStatus('OFF');
      }
  };

  const stopWakeListener = () => {
      wakeStatusRef.current = 'OFF';
      setWakeStatus('OFF');
      if (wakeRecognitionRef.current) {
          wakeRecognitionRef.current.stop();
          wakeRecognitionRef.current = null;
      }
  };

  const handleWakeDetected = (recognition: any, oneShotQuery?: string) => {
      // Ensure we don't trigger twice
      if (wakeStatusRef.current === 'ACTIVE' || isSpeakingRef.current) return;
      
      console.log("Handling wake detection. One-shot:", oneShotQuery);

      // Update state AND ref immediately to prevent race conditions from interim results
      setWakeStatus('ACTIVE');
      wakeStatusRef.current = 'ACTIVE';

      if (recognition) {
          try { recognition.stop(); } catch(e) {}
      }
      
      // Visual feedback
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      
      if (oneShotQuery && oneShotQuery.length > 2) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: `WAKE: "${oneShotQuery.toUpperCase()}"`, timestamp: new Date() }]);
          handleSend(oneShotQuery);
          return;
      }

      setIsSpeaking(true); 
      isSpeakingRef.current = true;
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "WAKE WORD DETECTED. READY.", timestamp: new Date() }]);
      
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance("Yes Officer");
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
          const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Male')));
          if (preferredVoice) utterance.voice = preferredVoice;
      }

      utterance.volume = 1.0;
      utterance.pitch = 1.0;
      utterance.rate = 1.1; 
      
      let started = false;
      utterance.onstart = () => { started = true; };
      
      utterance.onend = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          setTimeout(() => startRecording(), 50);
      };

      utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
      
      // Safety timeout: if speech fails to fire onend (e.g., engine crash), start recording anyway
      setTimeout(() => {
          if (wakeStatusRef.current === 'ACTIVE' && !isRecording && isSpeakingRef.current) {
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              startRecording();
          }
      }, 2000);
  };

  // --- MAIN CHAT LOGIC ---

  const handleLocalCommandResponse = async (responseText: string) => {
    const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText, 
        timestamp: new Date()
    };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);

    if (autoSpeak || wakeStatusRef.current === 'ACTIVE') {
        const audioData = await generateSpeech(responseText);
        if (audioData) {
            window.speechSynthesis.cancel();
            if (navigator.vibrate) navigator.vibrate(10);
            await playAudioData(audioData);
        }
    }

    if (wakeStatusRef.current === 'ACTIVE') {
        setWakeStatus('PASSIVE');
        wakeStatusRef.current = 'PASSIVE';
        setTimeout(() => startWakeListener(), 1000);
    }
  };

  const playAudioData = async (base64Audio: string) => {
      return new Promise<void>((resolve) => {
          try {
              setIsSpeaking(true);
              isSpeakingRef.current = true;
              if (!audioContextRef.current) {
                  audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
              }
              const ctx = audioContextRef.current;
              
              const startPlay = async () => {
                  try {
                      if (ctx.state === 'suspended') {
                          await ctx.resume();
                      }
                      
                      const binaryString = window.atob(base64Audio);
                      const len = binaryString.length;
                      const bytes = new Uint8Array(len);
                      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                      const int16Data = new Int16Array(bytes.buffer);
                      const float32Data = new Float32Array(int16Data.length);
                      for (let i=0; i<int16Data.length; i++) float32Data[i] = int16Data[i] / 32768.0;
                      const buffer = ctx.createBuffer(1, float32Data.length, 24000);
                      buffer.copyToChannel(float32Data, 0);
                      const source = ctx.createBufferSource();
                      source.buffer = buffer;
                      source.connect(ctx.destination);
                      source.onended = () => {
                          setIsSpeaking(false);
                          isSpeakingRef.current = false;
                          resolve();
                      };
                      source.start();
                  } catch (innerErr) {
                      console.error("Audio internal playback failed:", innerErr);
                      setIsSpeaking(false);
                      isSpeakingRef.current = false;
                      resolve();
                  }
              };

              startPlay().catch(err => {
                  console.error("Async startPlay failed:", err);
                  setIsSpeaking(false);
                  isSpeakingRef.current = false;
                  resolve();
              });
          } catch (e) {
              console.error("Audio playback failed:", e);
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              resolve();
          }
      });
  };

  const handleSend = async (textInput?: string) => {
    const textToSend = textInput || input;
    if (!textToSend.trim()) return;

    // --- ROBUST COMMAND PARSING ---
    const command = await interpretVoiceCommand(textToSend);
    if (command.action !== 'UNRECOGNIZED') {
        if (command.action === 'RECITE_MIRANDA') {
            const mirandaText = "You have the right to remain silent. Any statement you make can be used against you in a court of law in the Philippines. You have the right to have a competent and independent counsel preferably of your own choice. If you cannot afford the services of a counsel, the government will provide you with one at no cost. Do you understand these rights?";
            handleLocalCommandResponse(`${command.verbalAcknowledgment}\n\n${mirandaText}`);
            return;
        }
        
        const detail: any = { action: command.action };
        if (command.view) detail.view = command.view;
        
        window.dispatchEvent(new CustomEvent('officer-command', { detail }));
        handleLocalCommandResponse(command.verbalAcknowledgment);
        return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    if (navigator.vibrate) navigator.vibrate(20);

    try {
        let responseText = "";
        
        // Ensure chat session is alive
        if (!chatSessionRef.current && !useThinking) {
            console.log("Re-initializing stale chat session...");
            const chat = await createChatSession();
            if (chat) chatSessionRef.current = chat;
        }

        const lowerInput = textToSend.toLowerCase();
        
        // Backup request is already handled in the quick command section at the top of handleSend
        // but keeping it here as a safety fallback since it's already implemented.

        let currentSentence = "";
        const processedSentences = new Set<string>();
        
        if (useThinking) {
             responseText = await generateTextResponse(textToSend, 'gemini-3.1-pro-preview', false, true);
        } else if (chatSessionRef.current) {
            const stream = await chatSessionRef.current.sendMessageStream({ message: textToSend });
            
            const botMsgId = (Date.now() + 1).toString();
            const botMsg: ChatMessage = { 
                id: botMsgId, 
                role: 'model', 
                text: "", 
                timestamp: new Date(),
                isThinking: false
            };
            setMessages(prev => [...prev, botMsg]);
            setLoading(false); 

            // Correct iteration for sendMessageStream in newer SDK
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (!chunkText) continue;
                
                responseText += chunkText;
                currentSentence += chunkText;
                
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: responseText } : m));

                // If sentence is complete, speak it
                if ((autoSpeak || wakeStatusRef.current === 'ACTIVE') && /[.!?]/.test(currentSentence)) {
                    const sentenceToSpeak = currentSentence.trim();
                    if (sentenceToSpeak && !processedSentences.has(sentenceToSpeak)) {
                        processedSentences.add(sentenceToSpeak);
                        currentSentence = ""; 
                        
                        generateSpeech(sentenceToSpeak).then(audioData => {
                            if (audioData) queueAudioForPlayback(audioData);
                        }).catch(err => {
                            console.error("Speech generation failed for sentence:", err);
                        });
                    }
                }
            }

            // Speak remaining fragment
            if ((autoSpeak || wakeStatusRef.current === 'ACTIVE') && currentSentence.trim()) {
                const remaining = currentSentence.trim();
                if (!processedSentences.has(remaining)) {
                    generateSpeech(remaining).then(audioData => {
                        if (audioData) queueAudioForPlayback(audioData);
                    }).catch(err => {
                        console.error("Speech generation failed for remaining:", err);
                    });
                }
            }
               } else {
            responseText = await generateTextResponse(textToSend);
        }

        if (useThinking || !chatSessionRef.current) {
            const botMsg: ChatMessage = { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: responseText, 
                timestamp: new Date(),
                isThinking: useThinking
            };
            setMessages(prev => [...prev, botMsg]);
        }

        if ((useThinking || !chatSessionRef.current) && (autoSpeak || wakeStatusRef.current === 'ACTIVE')) {
            const audioData = await generateSpeech(responseText);
            if (audioData) {
                window.speechSynthesis.cancel();
                if (navigator.vibrate) navigator.vibrate(10);
                queueAudioForPlayback(audioData);
            }
        }

    } catch (error) {
        console.error("BuddyChat handleSend error:", error);
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'system', 
            text: `System error: ${error instanceof Error ? error.message : 'Unknown error'}. Connection reset.`, 
            timestamp: new Date() 
        }]);
    } finally {
        setLoading(false);
        if (wakeStatusRef.current === 'ACTIVE') {
            console.log("Transaction complete, restarting wake listener");
            setWakeStatus('PASSIVE');
            wakeStatusRef.current = 'PASSIVE';
            setTimeout(() => {
                startWakeListener();
            }, 1000);
        }
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
  };

  const startRecording = async () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
          // Fallback to MediaRecorder if SR is not available
          startMediaRecorder(); 
          return;
      }

      try {
          if (wakeRecognitionRef.current) {
              try { wakeRecognitionRef.current.stop(); } catch(e) {}
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          let finalTranscript = '';

          recognition.onstart = () => {
              setIsRecording(true);
          };

          recognition.onresult = (event: any) => {
              let interimTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  const transcript = event.results[i][0].transcript;
                  if (event.results[i].isFinal) {
                      finalTranscript += transcript;
                  } else {
                      interimTranscript += transcript;
                  }
              }
              setInput(finalTranscript || interimTranscript);
          };

          recognition.onend = () => {
              setIsRecording(false);
              const result = finalTranscript.trim();
              if (result.length > 1) {
                  handleSend(result);
              } else {
                  if (wakeStatusRef.current === 'ACTIVE') {
                      setWakeStatus('PASSIVE');
                      wakeStatusRef.current = 'PASSIVE';
                      setTimeout(() => startWakeListener(), 500);
                  }
              }
          };

          recognition.onerror = (event: any) => {
              console.warn("Recognition error:", event.error);
              setIsRecording(false);
              if (wakeStatusRef.current === 'ACTIVE') {
                  setWakeStatus('PASSIVE');
                  wakeStatusRef.current = 'PASSIVE';
                  setTimeout(() => startWakeListener(), 500);
              }
          };

          recognition.start();
      } catch (e) {
          console.error("Speech Recognition failed", e);
          startMediaRecorder();
      }
  };

  const startMediaRecorder = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];

          // Silence Detection logic
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);
          const analyzer = audioContext.createAnalyser();
          analyzer.fftSize = 256;
          source.connect(analyzer);
          
          const bufferLength = analyzer.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          let silenceStart = Date.now();
          const SILENCE_THRESHOLD = 15; // Low threshold for silence
          const SILENCE_DURATION = 1000; // 1.0 seconds of silence to stop
          const MAX_RECORDING_TIME = 10000; // 10 seconds max
          const startTime = Date.now();

          const checkSilence = () => {
              if (recorder.state === 'inactive') {
                  audioContext.close();
                  return;
              }

              analyzer.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                  sum += dataArray[i];
              }
              const average = sum / bufferLength;

              if (average > SILENCE_THRESHOLD) {
                  silenceStart = Date.now(); // Reset silence timer if sound detected
              }

              const now = Date.now();
              if (now - silenceStart > SILENCE_DURATION || now - startTime > MAX_RECORDING_TIME) {
                  if (recorder.state === 'recording') {
                      recorder.stop();
                      setIsRecording(false);
                  }
              } else {
                  requestAnimationFrame(checkSilence);
              }
          };

          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
              const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
              const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
              const base64Audio = await blobToBase64(audioBlob);
              
              setLoading(true);
              const transcription = await transcribeUserAudio(base64Audio, mimeType);
              setLoading(false);
              
              if (transcription && transcription.trim().length > 2) {
                  handleSend(transcription);
              } else {
                   // If nothing heard, go back to passive mode
                   if (wakeStatusRef.current === 'ACTIVE') {
                        console.log("No response heard, resetting to passive");
                        setWakeStatus('PASSIVE');
                        wakeStatusRef.current = 'PASSIVE';
                        setTimeout(() => startWakeListener(), 500);
                   }
              }
              stream.getTracks().forEach(track => track.stop());
              try { audioContext.close(); } catch(e) {}
          };

          recorder.start();
          setIsRecording(true);
          
          // Only auto-stop if triggered by wake word
          if (wakeStatusRef.current === 'ACTIVE') {
            checkSilence();
          }
      } catch (e) {
          console.error("Mic access denied", e);
      }
  };

  const handleMicClick = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  if (effectiveVariant === 'header' && !isExpanded) {
    return (
        <div className="flex items-center gap-2 pointer-events-auto">
            <button 
                onClick={() => onExpand ? onExpand() : setIsExpanded(true)}
                className="relative flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group"
            >
                <HolographicAvatar 
                    isActive={wakeStatus === 'PASSIVE' || wakeStatus === 'ACTIVE' || isRecording} 
                    isSpeaking={isSpeaking} 
                    isThinking={loading}
                    size="xs"
                />
                
                {wakeStatus !== 'OFF' && (
                   <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white/20 shadow-[0_0_8px_rgba(6,182,212,0.6)] ${wakeStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-cyan-500 animate-pulse'}`}></div>
                )}
                
                <div className="absolute left-full ml-2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 px-2 py-0.5 rounded text-[8px] text-cyan-400 font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase whitespace-nowrap">
                    Officer AI
                </div>
            </button>
        </div>
    );
  }

  if (effectiveVariant === 'floating' && !isExpanded) {
    return (
        <div className="fixed bottom-6 right-6 z-[6000] flex flex-col items-center group">
            <div className="absolute bottom-full mb-4 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[10px] text-cyan-400 font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase whitespace-nowrap">
                Say "Hey Officer"
            </div>
            <button 
                onClick={() => onExpand ? onExpand() : setIsExpanded(true)}
                className="relative flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
                <HolographicAvatar 
                    isActive={wakeStatus === 'PASSIVE' || wakeStatus === 'ACTIVE' || isRecording} 
                    isSpeaking={isSpeaking} 
                    isThinking={loading}
                    size="sm"
                />
                
                {wakeStatus === 'PASSIVE' && (
                   <div className="absolute top-full mt-1 flex flex-col items-center">
                       <div className="text-[7px] text-cyan-400/70 font-mono tracking-[0.3em] animate-pulse">LISTENING</div>
                   </div>
                )}

                {wakeStatus !== 'OFF' && (
                   <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white/20 shadow-[0_0_8px_rgba(6,182,212,0.6)] ${wakeStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-cyan-500 animate-pulse'}`}></div>
                )}
            </button>
        </div>
    );
  }

  return (
    <div className={`${effectiveVariant !== 'default' ? 'fixed bottom-6 right-6 z-[6000] w-[300px] h-[300px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden' : 'flex flex-col h-full bg-slate-950'} bg-slate-950 relative overflow-hidden flex flex-col`}>
        {/* Background Ambient Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/30 via-slate-950 to-slate-950 pointer-events-none"></div>

        {/* 3D AVATAR HEADER */}
        <div className={`flex flex-col items-center justify-center p-4 relative z-10 shrink-0 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm ${effectiveVariant !== 'default' ? 'pt-2' : ''}`}>
             <div className="w-full flex justify-between items-center mb-2 px-2">
                <div className="flex items-center gap-3">
                    {effectiveVariant !== 'default' ? (
                        <button 
                            onClick={() => {
                                if (wakeStatus === 'ACTIVE') setWakeStatus('PASSIVE');
                                setIsExpanded(false);
                            }} 
                            className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    ) : (
                        <button onClick={() => onBack?.()} className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div className="flex flex-col">
                        <h2 className="font-black text-white text-base tracking-widest font-tech leading-tight">OFFICER AI</h2>
                        <span className={`text-[9px] font-mono tracking-wider ${useThinking ? 'text-sky-400' : 'text-slate-500'}`}>
                            {useThinking ? 'DEEP REASONING' : 'STANDARD'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button 
                        onClick={() => setMessages([{ id: '0', role: 'system', text: "Chat history cleared.", timestamp: new Date() }])}
                        className="p-1.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                        title="Clear History"
                    >
                        <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    {isFloating && (
                        <button 
                            onClick={() => onExpand?.()} 
                            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Open Full Page"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={toggleWakeSystem}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                            wakeStatus === 'ACTIVE' ? 'bg-green-500 border-green-300 shadow-[0_0_15px_rgba(34,197,94,0.8)]' :
                            wakeStatus === 'PASSIVE' ? 'bg-blue-500 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                            'bg-slate-800 border-slate-600 opacity-50'
                        }`}
                        title="Voice Activation"
                    >
                        <Power className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button 
                        onClick={() => setUseThinking(!useThinking)}
                        className={`p-1.5 rounded-full border transition-all ${useThinking ? 'bg-sky-900/30 border-sky-500 text-sky-300' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                        title="Deep Reasoning Mode"
                    >
                        <Brain className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            
            {/* HOLOGRAPHIC CORE */}
            <HolographicAvatar 
                isActive={wakeStatus !== 'OFF' || isRecording} 
                isSpeaking={isSpeaking} 
                isThinking={loading} 
                size={isFloating ? 'sm' : 'md'}
            />
            {/* Status Label (Condensed for floating) */}
            <div className={`font-black text-[9px] tracking-[0.2em] uppercase mt-1 px-3 py-0.5 rounded-full border transition-colors ${
                isSpeaking ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 
                loading ? 'text-sky-400 border-sky-500/30 bg-sky-500/10' : 
                wakeStatus === 'ACTIVE' ? 'text-green-400 border-green-500/30 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                (isRecording || wakeStatus === 'PASSIVE') ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' : 
                'text-slate-500 border-slate-700 bg-slate-900/50'
            }`}>
                {isSpeaking ? 'TRANSMITTING' : loading ? 'ANALYZING' : wakeStatus === 'ACTIVE' ? 'LISTENING' : wakeStatus === 'PASSIVE' ? 'ACTIVE' : 'STANDBY'}
            </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 no-scrollbar" ref={scrollRef}>
            {/* Tactical AI Feature Panel */}
            <div className="bg-slate-900/50 p-2 rounded-xl grid grid-cols-5 gap-2 mb-2 border border-slate-800">
                {[
                  { id: 'weapon', label: 'Weapon', icon: ShieldAlert },
                  { id: 'lpr', label: 'LPR', icon: Car },
                  { id: 'face', label: 'Face', icon: ScanFace },
                  { id: 'bio', label: 'Bio', icon: HeartPulse },
                  { id: 'report', label: 'Report', icon: FileText },
                ].map(feat => (
                  <button 
                    key={feat.id} 
                    onClick={() => feat.id === 'report' ? window.dispatchEvent(new CustomEvent('officer-command', { detail: { action: 'NAVIGATE', view: 'REPORTS' } })) : setActiveFeatures(prev => ({...prev, [feat.id]: !prev[feat.id as keyof typeof prev]}))}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${activeFeatures[feat.id as keyof typeof activeFeatures] || feat.id === 'report' ? 'bg-cyan-900/40 text-cyan-400' : 'bg-slate-800/50 text-slate-500'}`}
                  >
                    <feat.icon className="w-4 h-4 mb-1" />
                    <span className="text-[8px] font-bold uppercase">{feat.label}</span>
                  </button>
                ))}
            </div>

            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[90%] rounded-2xl p-3 shadow-lg backdrop-blur-md border ${
                        msg.role === 'user' 
                            ? 'bg-blue-600/20 border-blue-500/30 text-blue-100 rounded-br-none' 
                            : msg.role === 'system'
                            ? 'bg-slate-800/50 text-slate-400 text-[10px] font-mono border-slate-700 text-center w-full'
                            : 'bg-slate-800/80 border-slate-600/50 text-slate-200 rounded-bl-none'
                    }`}>
                        <div className="markdown-body text-xs leading-relaxed whitespace-pre-wrap font-sans">
                            {msg.text}
                        </div>
                        <div className="text-[8px] opacity-40 mt-1.5 flex justify-end gap-1 items-center font-mono">
                            {msg.isThinking && <Brain className="w-2.5 h-2.5 text-sky-400" />}
                            {msg.role === 'model' && !msg.isThinking && <Sparkles className="w-2.5 h-2.5 text-cyan-500" />}
                            {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 rounded-bl-none flex items-center gap-3">
                        <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                        <span className="text-[10px] text-cyan-400 font-mono animate-pulse tracking-widest">
                            PROCESSING...
                        </span>
                    </div>
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 relative z-20">
            <div className="flex gap-2 items-center">
                <button 
                    onClick={handleMicClick}
                    disabled={loading}
                    className={`p-3 rounded-full transition-all duration-300 shadow-lg ${
                        isRecording 
                        ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-105 animate-pulse' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600'
                    }`}
                >
                    {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl flex items-center px-1 focus-within:border-cyan-500 transition-colors">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isRecording ? "Listening..." : "Try 'Record On', 'Need Backup'..."}
                        className="flex-1 bg-transparent px-3 py-2 text-slate-200 focus:outline-none placeholder:text-slate-700 font-mono text-[11px]"
                        disabled={isRecording}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed m-1 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BuddyChat;
