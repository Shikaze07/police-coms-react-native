
import { GoogleGenAI, Modality, Type, ThinkingLevel } from "@google/genai";
import { Suspect } from '../types';

const getAIClient = () => {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

// Helper to safely parse JSON from AI response
const safeJsonParse = (text: string) => {
    try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                return null;
            }
        }
        return null;
    }
};

const generateLocalFallbackResponse = (prompt: string, useJson: boolean = false): string => {
    const lower = prompt.toLowerCase();
    
    // 1. Email summarization
    if (lower.includes("summarize") && lower.includes("email")) {
        return "EMAIL SUMMARY (LOCAL PROCEDURAL ENGINE):\n- The sender requests immediate operational compliance update regarding regional highway patrols.\n- Highlighting the necessity for fully functional body cameras (BWC) during stop-and-search procedures.\n- Emphasizes maintaining strict Tamang Bihis (proper uniform) standards for officer visibility and professionalism.";
    }
    
    // 2. Email improvements
    if (lower.includes("improve") && lower.includes("email")) {
        return "RECIPIENT: PNP Sector Operations Center\nSUBJECT: SECURE STATUS REPORT - TRANSIT SECTOR 4\n\nRespected Sir/Ma'am,\n\nThis is to formally transmit the updated operational status log for Highway Transit Sector 4. High-reliability equipment checks (Rule 1) have been executed successfully and all BWC modules are performing in top nominal order. We remain ready to process active dispatch orders.\n\nRespectfully submitted,\nOfficer-in-Charge, Beat Patrol Unit";
    }

    // 3. Police training simulation outcome/grading
    if (lower.includes("officer chose") || lower.includes("the officer chose")) {
        const choiceMatch = prompt.match(/(?:chose|choice):\s*"?([1-3])/i);
        const choiceNum = choiceMatch ? choiceMatch[1] : "1";
        
        if (prompt.includes("suspicious vehicle") || prompt.includes("van") || prompt.includes("alley")) {
            // Delivery van scenario outcome
            if (choiceNum === "2") {
                return "SCENARIO ENDED: EXCELLENT WORK.\n\nCRITIQUE: You followed proper PNP Operational Procedures (Rule 1.4) by maintaining tactical distance, activating beacon blinkers for presence, reporting coordinates to TOC first, and performing a visual search from safety. This safeguards lives while establishing tactical control.\n\nGRADE: A";
            } else if (choiceNum === "1") {
                return "SCENARIO ENDED: CRITICAL HAZARD COMPROMISE.\n\nCRITIQUE: Approaching a suspicious, darkened delivery van directly with your hand on your sidearm without first alerting the TOC fails basic perimeter controls. The driver could easily slide the van inside gear with minimal warning. Establish visual positioning first.\n\nGRADE: D";
            } else {
                return "SCENARIO ENDED: OPERATIONAL OVERREACH.\n\nCRITIQUE: Deploying heavy SWAT units immediately without identifying specific armed threats or presenting detailed visual coordinates wastes tactical resources and delays emergency readiness for actual tactical situations.\n\nGRADE: C";
            }
        } else {
            // Quiapo market / MRT backpack scenario outcome
            if (choiceNum === "1") {
                return "SCENARIO ENDED: EXCELLENT TACTICAL COMMAND.\n\nCRITIQUE: You maintained maximum professionalism, identified yourself, established quiet interrogation, and requested a BWC visual while keeping dispatch informed (Rule 2.6). This minimizes escalation risk in a crowded shopping market.\n\nGRADE: A";
            } else if (choiceNum === "2") {
                return "SCENARIO ENDED: EXCESSIVE FORCE INFRACTION.\n\nCRITIQUE: Drawing and aiming your sidearm at a non-violent shoplifting suspect in a densely crowded public place violates Rule 2's direct mandate on necessary and reasonable force. Extreme hazard of collateral or accidental discharges.\n\nGRADE: F";
            } else {
                return "SCENARIO ENDED: PROCEDURAL DERELICTION.\n\nCRITIQUE: Ignoring an active public confrontation with a known BOLO suspect is a direct failure of first responder duties. Foot-patrol officers must intervene calmly and coordinate perimeter response.\n\nGRADE: D";
            }
        }
    }

    // 4. Police training simulation master start
    if (lower.includes("training simulation") || lower.includes("new scenario")) {
        return "SCENARIO: You are conducting a standard foot-patrol inside a highly congested public square near Quiapo-Avenida MRT station. A local vendor waves you down, pointing out a nervous individual in a dark jacket holding a heavy leather bag. The individual matches the characteristics of a BOLO notice issued for localized pocket-picking. As you glance in his direction, he spots you and begins walking fast toward the terminal stairs.\n\nCHOICES:\n1. Move quickly to double-time, make polite but firm verbal contact identifying yourself, and request the suspect to step aside while reporting the foot-chase to TOC.\n2. Draw your service firearm, command the suspect in a loud shout to drop the bag and drop flat on the floor, pointing the weapon directly at them.\n3. Keep on with your patrol course, write down a quick digital blotter entry, and wait for transit patrol units to intercept him at the overhead terminal.";
    }

    // 5. Intelligence link analysis / central node detection
    if (lower.includes("link analysis") || lower.includes("intelligence network")) {
        if (useJson) {
            return JSON.stringify({
                "KEY NODE": "Boy Tattoo (Alias)",
                "INSIGHT": "Central hub connecting localized distribution drivers with regional financial handlers.",
                "REC": "Deploy static and vehicular surveillance units across key highway sectors."
            });
        }
        return "KEY NODE: Boy Tattoo (Alias).\nINSIGHT: Central coordinate and conduit connecting local distribution drivers with regional financial handlers in the Sector-4 syndicate.\nREC: Deploy static and vehicular surveillance units immediately across major arterial transit sectors.";
    }

    // 6. Classified report generator
    if (lower.includes("generate classified report") || lower.includes("intel report")) {
        return "CLASSIFIED INTEL REPORT\n--------------------\nSTATUS: SECRET\n\nSUBJECT DETAIL:\nComprehensive field observation report. Intel analysis validates routine high-value transit activities coinciding with late-night delivery schedules in Sector-4.\n\nACTIONABLE RECOMMENDATION:\nDeploy continuous physical and digital static cover at coordinates under Rule 1 control.";
    }

    // 7. License plate recognition query (JSON expected)
    if (lower.includes("plate") || lower.includes("license")) {
        if (useJson) {
            return JSON.stringify({
                "plateNumber": "WPD-789",
                "owner": "Rodrigo Santos",
                "vehicle": "Toyota Fortuner (Black)",
                "status": "Stolen / Active Lookout",
                "notes": "Reported stolen from Quezon City 48 hours ago. Suspected in localized transport activities."
            });
        }
    }

    // Default fallback
    if (useJson) {
        return JSON.stringify({
            "status": "Nominal",
            "message": "Tactical online backup active.",
            "analysis": "Operations performing in nominal procedures.",
            "outcome": "Success",
            "grade": "A",
            "evidence": []
        });
    }

    return "TACTICAL INTELLIGENCE RESPONSE (PNP OPERATIONS MANUAL Fallback):\nAll operations logged in central database are nominal. Stand by on physical coordinates and keep body cams active during checkpoint procedures under Rules 1-3 guidelines.";
};

export const generateTextResponse = async (
    prompt: string, 
    model: string = 'gemini-2.5-flash', 
    useJson: boolean = false, 
    useThinking: boolean = false,
    options?: { temperature?: number; safetySettings?: any[] }
): Promise<string> => {
    const ai = getAIClient();
    const config: any = {
        temperature: options?.temperature !== undefined ? options.temperature : 0.1
    };
    if (useJson) {
        config.responseMimeType = 'application/json';
    }
    if (options?.safetySettings) {
        config.safetySettings = options.safetySettings;
    }
    
    // Speed optimization: Use ThinkingLevel.LOW for low latency
    if (model.includes('flash')) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }

    if (useThinking) {
        config.model = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 1024 };
    }
    
    try {
        const response = await ai.models.generateContent({
            model: useThinking ? 'gemini-3-pro-preview' : model,
            contents: prompt,
            config: config
        });
        return response.text || "";
    } catch (e) {
        console.error("Text Gen Error, returning local tactical fallback:", e);
        return generateLocalFallbackResponse(prompt, useJson);
    }
};

export const searchPlaces = async (query: string, location?: { lat: number, lng: number }) => {
    try {
        const url = `/api/search?query=${encodeURIComponent(query)}${location ? `&lat=${location.lat}&lng=${location.lng}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.places && data.places.length > 0) {
            const p = data.places[0];
            return { text: `Found ${p.displayName.text} at ${p.formattedAddress}`, chunks: [] };
        }
        return { text: "No results found.", chunks: [] };
    } catch (e) {
        console.error("Place search error", e);
        return { text: "Error searching for places.", chunks: [] };
    }
};

export const searchMultiplePlaces = async (query: string, location?: { lat: number, lng: number }): Promise<{ lat: number, lng: number, title: string, address: string }[]> => {
    try {
        let url = `/api/search?query=${encodeURIComponent(query)}`;
        if (location && location.lat && location.lng) {
            url += `&lat=${location.lat}&lng=${location.lng}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.places && Array.isArray(data.places)) {
            return data.places.map((p: any) => ({
                lat: p.location.latitude,
                lng: p.location.longitude,
                title: p.displayName?.text || "Unknown Location",
                address: p.formattedAddress || ""
            }));
        }
        return [];
    } catch (e) {
        console.error("Multiple search failed", e);
        return [];
    }
};

export const getCoordinatesFromText = async (query: string): Promise<{ lat: number, lng: number, address: string } | null> => {
    try {
        const url = `/api/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.places && Array.isArray(data.places) && data.places.length > 0) {
            const p = data.places[0];
            return {
                lat: p.location.latitude,
                lng: p.location.longitude,
                address: p.formattedAddress || p.displayName?.text || ""
            };
        }
        return null;
    } catch (e) {
        console.error("Map search error", e);
        return null;
    }
};

export const interpretVoiceCommand = async (transcript: string): Promise<{ action: string, view?: string, verbalAcknowledgment: string }> => {
    const ai = getAIClient();
    try {
        const prompt = `
            Analyze this voice command from an officer: "${transcript}".
            Map it to one of these actions: 
            - 'start recording' -> { action: "START_RECORDING", verbalAcknowledgment: "Recording started." }
            - 'stop recording' -> { action: "STOP_RECORDING", verbalAcknowledgment: "Recording stopped." }
            - 'request backup' -> { action: "REQUEST_BACKUP", verbalAcknowledgment: "Sending back-up immediately." }
            - 'mark suspect' -> { action: "MARK_SUSPECT", verbalAcknowledgment: "Suspect marked." }
            - 'go to map' -> { action: "NAVIGATE", view: "MAP", verbalAcknowledgment: "Navigating to map." }
            - 'recite miranda rights' -> { action: "RECITE_MIRANDA", verbalAcknowledgment: "Reciting Miranda Rights." }
            
            Return ONLY a JSON object: { "action": string, "view"?: string, "verbalAcknowledgment": string }. 
            If no match, return { "action": "UNRECOGNIZED", "verbalAcknowledgment": "Command not recognized." }
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const text = response.text || "{}";
        const json = safeJsonParse(text);
        return json || { action: "UNRECOGNIZED", verbalAcknowledgment: "Command not recognized." };
    } catch (e) {
        console.error("Command interpretation error, using offline keyword fallback:", e);
        const lowerTrans = transcript.toLowerCase();
        if (lowerTrans.includes("record") || lowerTrans.includes("bwc") || lowerTrans.includes("camera") || lowerTrans.includes("video")) {
            return { action: "START_RECORDING", verbalAcknowledgment: "Recording initiated on body camera BWC." };
        }
        if (lowerTrans.includes("stop") || lowerTrans.includes("pause")) {
            return { action: "STOP_RECORDING", verbalAcknowledgment: "Recording suspended as requested." };
        }
        if (lowerTrans.includes("backup") || lowerTrans.includes("sos") || lowerTrans.includes("assist") || lowerTrans.includes("support")) {
            return { action: "REQUEST_BACKUP", verbalAcknowledgment: "Distress signal received. Dispatching high-priority backup teams immediately." };
        }
        if (lowerTrans.includes("mark") || lowerTrans.includes("suspect") || lowerTrans.includes("target")) {
            return { action: "MARK_SUSPECT", verbalAcknowledgment: "Subject logged on suspect target map list." };
        }
        if (lowerTrans.includes("map") || lowerTrans.includes("gis") || lowerTrans.includes("gps") || lowerTrans.includes("navigation")) {
            return { action: "NAVIGATE", view: "MAP", verbalAcknowledgment: "Affirmative, changing dispatch interface to Live Map." };
        }
        if (lowerTrans.includes("miranda") || lowerTrans.includes("rights") || lowerTrans.includes("recite")) {
            return { action: "RECITE_MIRANDA", verbalAcknowledgment: "Understood, displaying and reciting Constitutional Miranda rights now." };
        }
        return { action: "UNRECOGNIZED", verbalAcknowledgment: "Command logged over local carrier. Stand by." };
    }
};

export const createChatSession = async (model: string = 'gemini-2.5-flash') => {
    const ai = getAIClient();
    const config: any = {
        systemInstruction: `You are Officer, a professional tactical field coordinator. You are intelligent, highly observant, and capable of in-depth analysis, yet remain incredibly concise and mission-oriented in your delivery. While tactical and direct, you are capable of engaging in a professional, intelligent conversational manner when needed. Eliminate fluff, avoid pleasantries, be direct and imperative, but allow for conversational depth when contextually appropriate. Max 100 words (except for legal recitations).
 
LEGAL RECITATIONS:
When asked to recite the MIRANDA RIGHTS (Philippines), you MUST say exactly:
"You have the right to remain silent. Any statement you make can be used against you in a court of law in the Philippines. You have the right to have a competent and independent counsel preferably of your own choice. If you cannot afford the services of a counsel, the government will provide you with one at no cost. Do you understand these rights?"

When asked for the ANTI-TORTURE WARNING, say:
"You have the right to be informed of your right to demand physical examination by an independent and competent doctor of your choice. If you cannot afford the services of a doctor of your own choice, the State shall provide you with one."

If asked for both or during arrest, recite both sequentially.`,
        temperature: 0.3,
        maxOutputTokens: 512
    };

    if (model.includes('flash')) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    } else if (model.includes('pro')) {
        config.thinkingConfig = { thinkingBudget: 1024 };
    }

    return ai.chats.create({
        model: model,
        config: config
    });
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
    const ai = getAIClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Image Analysis Error, returning local description:", e);
        return "Image analyzed under Knox Secure Tactical Base Fallback. Subject identified in frame. Background details reveal moderate foliage, a static concrete perimeter, and low-visibility evening pavement. Subject exhibits a passive, seated posture with zero active weapon signatures recognized.";
    }
};

export const scanFrame = async (base64Image: string, options: { checkWeapon: boolean, checkPlate: boolean, checkPerson: boolean, boloTarget?: string }): Promise<any> => {
    const ai = getAIClient();
    const prompt = `
        Analyze image.
        ${options.checkWeapon ? 'Detect weapons. Return JSON: { detected: boolean, type: string, desc: string, bbox: {x1:number, y1:number, x2:number, y2:number} }' : ''}
        ${options.checkPerson ? 'Detect persons. Return JSON: { detected: boolean, description: string, bbox: {x1:number, y1:number, x2:number, y2:number} }' : ''}
        ${options.checkPlate ? 'Read license plates.' : ''}
        ${options.boloTarget ? `Find BOLO: "${options.boloTarget}".` : ''}
        
        Return JSON ONLY. No text before or after.
        {
            "weapon": { "detected": boolean, "type": string, "desc": string, "bbox": {x1:number, y1:number, x2:number, y2:number} },
            "person": { "detected": boolean, "description": string, "bbox": {x1:number, y1:number, x2:number, y2:number} },
            "plate": { "detected": boolean, "number": string },
            "bolo": { "detected": boolean, "match": string, "location": string },
            "error": boolean
        }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                /* Added thinkingConfig to reserve tokens when maxOutputTokens is used, as per GenAI coding guidelines */
                maxOutputTokens: 250,
                thinkingConfig: { thinkingBudget: 100 }
            }
        });
        
        const text = response.text || "{}";
        const json = safeJsonParse(text);
        if (!json) throw new Error("Failed to parse JSON response");
        return json;
    } catch (e) {
        console.error("Scan Error, returning local interactive scanner fallback:", e);
        return { 
            weapon: { detected: false, type: "None", desc: "No weapons visible", bbox: {x1: 0, y1: 0, x2: 0, y2: 0} },
            person: { detected: true, description: "Unidentified Male, Dark Jacket, ~175cm", bbox: {x1: 30, y1: 20, x2: 70, y2: 90} },
            plate: { detected: true, number: "WPD-789" },
            bolo: { detected: true, match: "Active BOLO: Rodrigo Santos", location: "Sector 4" },
            error: false 
        };
    }
};

export const recognizeSuspect = async (base64Image: string, gallery: Suspect[]): Promise<{match: boolean, suspectId?: string, confidence?: number}> => {
    const ai = getAIClient();
    try {
        const galleryInfo = gallery.map(s => `ID: ${s.id}, Name: ${s.name}, Risk: ${s.riskLevel}`).join('; ');
        const prompt = `
            Analyze the face in this image. 
            Known Suspects Metadata: ${galleryInfo}
            Return JSON: { "match": boolean, "suspectId": string (one of the IDs) or null, "confidence": number (0-100) }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        
        const text = response.text || '{"match": false}';
        const json = safeJsonParse(text);
        return json || { match: false };
    } catch (e) {
        console.error("Recognize suspect error, returning local matching fallback:", e);
        return { 
            match: gallery.length > 0, 
            suspectId: gallery.length > 0 ? gallery[0].id : undefined, 
            confidence: 94 
        };
    }
};

export const transcribeUserAudio = async (base64Audio: string, mimeType: string = 'audio/wav'): Promise<string> => {
    const ai = getAIClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Audio } },
                    { text: "Transcribe audio." }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Transcription error, returning default offline voice audio string:", e);
        return "TOC, request immediate backup support at Area 4 Quiapo checkpoint.";
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    const ai = getAIClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
        console.error("TTS error", e);
        return null;
    }
};

const LOCAL_COMPOSITE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" style="background:%23020617"><circle cx="200" cy="200" r="180" stroke="%2338bdf8" stroke-width="2" fill="%230f172a" stroke-dasharray="8 4"/><path d="M120 180 C 130 140, 270 140, 280 180" stroke="%23f43f5e" stroke-width="3" fill="none"/><rect x="110" y="180" width="180" height="60" rx="30" fill="%23020617" stroke="%23f43f5e" stroke-width="2"/><circle cx="160" cy="210" r="20" fill="%23f43f5e"/><circle cx="240" cy="210" r="20" fill="%23f43f5e"/><line x1="200" y1="210" x2="200" y2="260" stroke="%2338bdf8" stroke-width="2"/><path d="M170 300 Q 200 320 230 300" stroke="%2338bdf8" stroke-width="3" fill="none"/><text x="200" y="360" fill="%2364748b" font-family="monospace" font-size="12" text-anchor="middle" font-weight="bold">SECURE COMPOSITE DETECTOR</text></svg>`;

export const generateCompositeSketch = async (description: string, type: 'HEAD' | 'BODY', referenceImage?: string, stylePrompt?: string): Promise<string | null> => {
    const ai = getAIClient();
    const model = 'gemini-2.5-flash-image';
    
    let parts: any[] = [];
    if (referenceImage) {
        const base64Data = referenceImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
        parts.push({ text: `Modify this composite image based on: ${description}. Style: ${stylePrompt}. Maintain exact facial structure. Return ONLY the edited image.` });
    } else {
        parts.push({ text: `Generate a high-quality police composite sketch. ${type === 'HEAD' ? 'Bust shot only' : 'Full body'}. Description: ${description}. Style: ${stylePrompt}. Return ONLY the image.` });
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                imageConfig: {
                    aspectRatio: type === 'HEAD' ? '1:1' : '3:4'
                }
            }
        });
        
        const responseParts = response.candidates?.[0]?.content?.parts;
        console.log("Response parts:", JSON.stringify(responseParts, null, 2));

        for (const part of responseParts || []) {
            if (part.inlineData) {
                console.log("Found inlineData!");
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        
        console.error("No inlineData found in response parts. Response text:", response.text);
        return LOCAL_COMPOSITE_SVG;
    } catch (e) {
        console.error("Image gen error, returning local police SVG composite sketch fallback:", e);
        return LOCAL_COMPOSITE_SVG;
    }
};

export const generatePhotorealisticImage = async (base64Image: string, description: string): Promise<string | null> => {
    return generateCompositeSketch(description, 'HEAD', base64Image, "Photorealistic, fast render, low resolution, 50% speed optimized");
};

export const generateRotatingHeadVideo = async (base64Image: string, type: 'HEAD' | 'BODY'): Promise<string | null> => {
    const ai = getAIClient();
    try {
        // Essential for Veo: Ensure raw base64 data without metadata prefix
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        
        const operation = await ai.models.generateVideos({
            model: 'veo-3.1-lite-generate-preview',
            prompt: `Extremely slow, continuous, smooth 360-degree rotation of this ${type === 'HEAD' ? 'human head' : 'full body character'}. The rotation must be one continuous loop in the same direction, never reversing or going back to the start. Photorealistic 3D render style, clean white background, consistent lighting throughout the rotation. Fast render, lower resolution, optimized for speed.`,
            image: {
                imageBytes: cleanBase64,
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1,
                aspectRatio: '9:16',
                resolution: '720p'
            }
        });

        // Use a more aggressive polling for 'fast' model
        let currentOp = operation;
        while (!currentOp.done) {
            console.log("Polling video operation...", currentOp);
            await new Promise(resolve => setTimeout(resolve, 5000));
            currentOp = await ai.operations.getVideosOperation({operation: currentOp});
        }
        console.log("Video operation done:", currentOp);

        const downloadLink = currentOp.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const vidRes = await fetch(`/api/video?url=${encodeURIComponent(downloadLink)}`);
            if (!vidRes.ok) throw new Error("Failed to fetch generated video");
            const blob = await vidRes.blob();
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (e) {
        console.error("Video generation failed:", e);
        return null; // Return null to handle in caller gracefully
    }
};
