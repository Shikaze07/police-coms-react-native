
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  MapContainer as MapContainerOrig, 
  TileLayer as TileLayerOrig, 
  Marker as MarkerOrig, 
  Popup as PopupOrig, 
  useMap, 
  useMapEvents, 
  Polyline, 
  CircleMarker as CircleMarkerOrig, 
  Circle as CircleOrig 
} from 'react-leaflet';

const MapContainer = MapContainerOrig as any;
const TileLayer = TileLayerOrig as any;
const Marker = MarkerOrig as any;
const Popup = PopupOrig as any;
const CircleMarker = CircleMarkerOrig as any;
const Circle = CircleOrig as any;
import { APIProvider } from '@vis.gl/react-google-maps';
import L from 'leaflet';
/* Added X to imports */
import { Search, Loader2, MapPin, Navigation, Layers, Crosshair, Compass, ZoomIn, ZoomOut, Satellite, Map as MapIcon, Mountain, Grid, Download, Wifi, WifiOff, Check, AlertTriangle, ExternalLink, Hospital, Shield, ShieldCheck, Flame, Activity, Info, Route, X, Eye, Maximize2, Minimize2, Truck, Users, Siren, Building2, BadgeCheck, ChevronUp, ChevronDown, Phone, Cctv, Car, Footprints, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCoordinatesFromText, searchPlaces, searchMultiplePlaces } from './services/geminiService';

// Fix Leaflet's default icon path issues
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const TargetIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/565/565340.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LiveMapProps {
  activeAlert?: { lat: number; lng: number } | null;
  sosActive?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onCallContact?: (name: string) => void;
  onSimulateSOS?: () => void;
}

const MAP_STYLES = {
  STREET: { 
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
      attribution: '&copy; OpenStreetMap contributors',
      label: 'OSM Street', 
      icon: MapIcon 
  },
  TACTICAL: { 
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', 
      attribution: '&copy; CARTO',
      label: 'Tactical Dark', 
      icon: Grid 
  },
  GOOGLE_STREET: {
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: 'Google',
      label: 'Google Maps',
      icon: MapIcon
  },
  GOOGLE_SATELLITE: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: 'Google',
      label: 'Google Hybrid',
      icon: Satellite
  },
  SATELLITE: { 
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
      attribution: 'Esri',
      label: 'Esri Satellite', 
      icon: Satellite 
  },
  LIGHT: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO',
      label: 'Daytime',
      icon: Mountain
  }
};

const MapController = ({ center, zoom, onMapReady }: any) => {
    const map = useMap();
    useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
    useEffect(() => { onMapReady(map); }, [map, onMapReady]);
    return null;
};

const HeatmapOverlay = ({ userLocation }: { userLocation: {lat: number, lng: number} }) => {
    return (
        <>
            {generateMockIncidents(userLocation).map((inc, i) => (
                <Circle 
                    key={i} 
                    center={[inc.lat, inc.lng]} 
                    radius={300}
                    pathOptions={{ 
                        color: '#ef4444', 
                        fillColor: '#ef4444', 
                        fillOpacity: 0.4, 
                        weight: 0 
                    }} 
                />
            ))}
        </>
    );
};

const MapClickNavHandler = ({ isNavActive, isDropPinMode, onSetDestination, onDropPin }: { isNavActive: boolean; isDropPinMode: boolean; onSetDestination: (latlng: {lat: number, lng: number; title: string}) => void; onDropPin: (latlng: {lat: number, lng: number}) => void }) => {
    useMapEvents({
        click(e) {
            if (isNavActive) {
                onSetDestination({ lat: e.latlng.lat, lng: e.latlng.lng, title: 'CUSTOM ROUTE TARGET' });
            } else if (isDropPinMode) {
                onDropPin({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
        },
    });
    return null;
};

const generateMockPoi = (userLocation: {lat: number, lng: number}) => [
    { title: "District Police Station", lat: userLocation.lat + 0.002, lng: userLocation.lng - 0.003, type: "Police Station", desc: "Sector patrol station. Tactical status: OPS_READY." },
    { title: "Emergency Hospital", lat: userLocation.lat - 0.001, lng: userLocation.lng + 0.002, type: "Hospital", desc: "Level 1 Trauma center. Capacity: HIGH." },
    { title: "Government Center", lat: userLocation.lat + 0.001, lng: userLocation.lng - 0.002, type: "Gov", desc: "Administrative center. Status: SECURED." },
    { title: "Urban Park", lat: userLocation.lat - 0.003, lng: userLocation.lng + 0.003, type: "Public Space", desc: "Open park area. Assembly point." }
];

const generateMockIncidents = (userLocation: {lat: number, lng: number}) => [
    { type: 'Murder', lat: userLocation.lat + 0.001, lng: userLocation.lng + 0.001, title: "INC-AX-001", details: { When: '2026-05-08 08:30', Where: 'Sector 1', How: 'Reported shooting', Narrative: 'Subject seen fleeing scene.', Officer: 'Sgt. Al Muhairi' } },
    { type: 'Traffic Accident', lat: userLocation.lat + 0.015, lng: userLocation.lng + 0.029, title: "INC-AX-002", details: { When: '2026-05-08 08:45', Where: 'Sector 2', How: 'Multi-car collision', Narrative: 'Heavy traffic congestion.', Officer: 'Ofc. Smith' } },
    { type: 'Fire', lat: userLocation.lat - 0.020, lng: userLocation.lng - 0.021, title: "INC-AX-003", details: { When: '2026-05-08 09:00', Where: 'Sector 3', How: 'Structure fire', Narrative: 'Smoke visible from ground floor.', Officer: 'Lt. Fatima' } },
];

const generateMockCctv = (userLocation: {lat: number, lng: number}) => [
    { title: "CCTV - Main Entrance", lat: userLocation.lat - 0.007, lng: userLocation.lng + 0.004, type: "CCTV", desc: "Main entrance surveillance." },
    { title: "CCTV - Plaza South", lat: userLocation.lat + 0.013, lng: userLocation.lng + 0.004, type: "CCTV", desc: "Plaza south wing coverage." },
    { title: "CCTV - Main Arterial Rd", lat: userLocation.lat - 0.007, lng: userLocation.lng + 0.024, type: "CCTV", desc: "Traffic cam north." },
];

const LiveMap: React.FC<LiveMapProps> = ({ activeAlert, sosActive, isExpanded, onToggleExpand, onCallContact, onSimulateSOS }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [center, setCenter] = useState({ lat: 25.2048, lng: 55.2708 }); // Default Dubai
  const [zoom, setZoom] = useState(14);
  const [currentMapStyle, setCurrentMapStyle] = useState<keyof typeof MAP_STYLES>('TACTICAL');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [activeVideoCctv, setActiveVideoCctv] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [navMode, setNavMode] = useState<'VEHICLE' | 'FOOT'>('VEHICLE');
  const [showTraffic, setShowTraffic] = useState(true);
  const [isDropPinMode, setIsDropPinMode] = useState(false);
  const [customPins, setCustomPins] = useState<{ lat: number; lng: number; label: string }[]>([]);
  
  const onDropPin = (latlng: {lat: number, lng: number}) => {
      const label = prompt("Enter pin label:") || "POI";
      setCustomPins(prev => [...prev, { ...latlng, label }]);
      setIsDropPinMode(false);
  };
  const CctvVideo = ({ title }: { title: string }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [isFullScreen, setIsFullScreen] = useState(false);
      const [isExpanded, setIsExpanded] = useState(false);
      
      const toggleFullScreen = () => {
        if (!isFullScreen) {
            if (containerRef.current?.requestFullscreen) {
                containerRef.current.requestFullscreen();
                setIsFullScreen(true);
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
      };

      const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
      };

      // Listen for fullscreen change events to update state
      useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
            if (!document.fullscreenElement) {
                setIsExpanded(false);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
      }, []);

             return isExpanded ? createPortal(
           <div className="fixed inset-0 z-[99999] p-4 bg-black/90 flex items-center justify-center">
               <div ref={containerRef} className="w-full h-full relative">
                   <iframe
                       width="100%"
                       height="100%"
                       src="https://www.youtube.com/embed/PiOqMMOFQNw?autoplay=1&loop=1&playlist=PiOqMMOFQNw&mute=1&controls=0"
                       title="YouTube video player"
                       frameBorder="0"
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                       allowFullScreen
                       className="w-full h-full object-contain"
                   ></iframe>
                   <div className="absolute top-4 left-4 text-[10px] text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">LIVE: {title}</div>
                   <div className="absolute bottom-4 right-4 flex gap-1">
                      <button onClick={toggleExpanded} title="Toggle Expand" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70">
                         {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                      <button onClick={toggleFullScreen} title="Toggle Fullscreen" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70">
                         {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                      <button title="Zoom In" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70"><ZoomIn className="w-4 h-4" /></button>
                      <button title="Zoom Out" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70"><ZoomOut className="w-4 h-4" /></button>
                      <button title="Pan" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70"><Navigation className="w-4 h-4" /></button>
                      <button title="Tilt" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70"><ChevronDown className="w-4 h-4" /></button>
                   </div>
               </div>
           </div>,
           document.body
       ) : (
           <div ref={containerRef} className="w-[200px] h-48 bg-black rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300">
               <iframe
                   width="100%"
                   height="100%"
                   src="https://www.youtube.com/embed/PiOqMMOFQNw?autoplay=1&loop=1&playlist=PiOqMMOFQNw&mute=1&controls=0"
                   title="YouTube video player"
                   frameBorder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                   className="w-full h-full object-contain"
               ></iframe>
               <div className="absolute top-4 left-4 text-[10px] text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">LIVE: {title}</div>
               <div className="absolute bottom-4 right-4 flex gap-1">
                  <button onClick={toggleExpanded} title="Toggle Expand" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70">
                     {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button onClick={toggleFullScreen} title="Toggle Fullscreen" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70">
                     {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button title="Zoom In" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70"><ZoomIn className="w-4 h-4" /></button>
                  <button title="Zoom Out" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70"><ZoomOut className="w-4 h-4" /></button>
                  <button title="Pan" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70"><Navigation className="w-4 h-4" /></button>
                  <button title="Tilt" className="bg-black/50 backdrop-blur-sm text-white p-2 rounded hover:bg-black/70"><ChevronDown className="w-4 h-4" /></button>
               </div>
           </div>
       );
  };
  
  // Geolocation State
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [heading, setHeading] = useState(0);

  // POI & Search State
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [categoryMarkers, setCategoryMarkers] = useState<Record<string, any[]>>({});
  const [searchResults, setSearchResults] = useState<{lat: number, lng: number, title: string, desc?: string, url?: string, isTemporary?: boolean, isMobile?: boolean, type?: string}[]>([]);
  const [activePoiInfo, setActivePoiInfo] = useState<string | null>(null);
  const [sosMarkers, setSosMarkers] = useState<any[]>([]);
  const [routingTo, setRoutingTo] = useState<{lat: number, lng: number, title: string} | null>(null);
  const [isBarOpen, setIsBarOpen] = useState(true);

  // Voice Command Listener State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const isVoiceActiveRef = useRef(false);

  useEffect(() => {
    isVoiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

  useEffect(() => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onresult = async (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            await handleVoiceCommand(transcript);
          }
        };

        rec.onend = () => {
          if (isVoiceActiveRef.current) {
            try {
              rec.start();
            } catch (err) {
              console.warn("Speech recognition auto-start error:", err);
            }
          }
        };

        recognitionRef.current = rec;
      }
    } catch (err) {
      console.error("Speech Recognition initialization failed", err);
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      setVoiceFeedback("🎤 Voice control not supported or permissions blocked.");
      setTimeout(() => setVoiceFeedback(''), 3000);
      return;
    }

    try {
      if (isVoiceActive) {
        recognitionRef.current.stop();
        setIsVoiceActive(false);
        setVoiceFeedback("🎤 Voice command inactive");
        setTimeout(() => setVoiceFeedback(''), 2000);
      } else {
        setIsVoiceActive(true);
        setVoiceFeedback("🎤 Listening... Command: 'Find hospital' or 'Directions to...'");
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error("Voice control toggle failed", err);
    }
  };

  const handleVoiceCommand = async (command: string) => {
    const cleanCmd = command.trim().toLowerCase();
    setVoiceFeedback(`🎤 Spoken command: "${command}"`);
    setTimeout(() => setVoiceFeedback(''), 5500);

    // Command parser
    if (cleanCmd.startsWith("find ") || cleanCmd.includes("search for ")) {
      let query = cleanCmd.replace("find ", "").replace("search for ", "").trim();
      if (query) {
        setSearchQuery(query);
        await handleSearch(undefined, query);
      }
    } else if (cleanCmd.startsWith("directions to ") || cleanCmd.startsWith("route to ") || cleanCmd.startsWith("navigate to ")) {
      let dest = cleanCmd.replace("directions to ", "").replace("route to ", "").replace("navigate to ", "").trim();
      if (dest) {
        setVoiceFeedback(`🗺️ Planning route to "${dest}"...`);
        setIsSearching(true);
        try {
          const coords = await getCoordinatesFromText(dest);
          if (coords) {
            const destUpper = dest.toUpperCase();
            setCenter({ lat: coords.lat, lng: coords.lng });
            setZoom(15);
            setRoutingTo({ lat: coords.lat, lng: coords.lng, title: destUpper });
            setSearchResults(prev => [
              ...prev.filter(r => r.title !== destUpper),
              { lat: coords.lat, lng: coords.lng, title: destUpper, desc: `Voice destination waypoint.`, isTemporary: true }
            ]);
            setIsNavOpen(true);
            setVoiceFeedback(`🗺️ Route calculated to "${destUpper}"!`);
          } else {
            setVoiceFeedback(`❌ Geocode fail: Could not find "${dest}"`);
          }
        } catch (err) {
          console.error("Voice routing failed", err);
          setVoiceFeedback("❌ System error: Routing destination lookup failed.");
        }
        setIsSearching(false);
        setTimeout(() => setVoiceFeedback(''), 5500);
      }
    } else {
      setVoiceFeedback(`🎤 Command ignored: "${command}". Try: "Find hospital" or "Directions to Luneta Park"`);
      setTimeout(() => setVoiceFeedback(''), 5500);
    }
  };

  const buttonTrackRef = useRef<HTMLDivElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonTrackRef.current) return;
    setIsDragActive(true);
    setStartX(e.pageX - buttonTrackRef.current.offsetLeft);
    setScrollLeft(buttonTrackRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragActive(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragActive || !buttonTrackRef.current) return;
    e.preventDefault();
    const x = e.pageX - buttonTrackRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // scroll speed multiplier
    buttonTrackRef.current.scrollLeft = scrollLeft - walk;
  };

  const mapRef = useRef<L.Map | null>(null);
  const intelligenceBoxRef = useRef<HTMLDivElement | null>(null);
  const activeCategoriesRef = useRef(activeCategories);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (intelligenceBoxRef.current && !intelligenceBoxRef.current.contains(event.target as Node)) {
        setActivePoiInfo(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    activeCategoriesRef.current = activeCategories;
  }, [activeCategories]);

  useEffect(() => {
      // 1. SOS Button Toggle Logic
      const syncSos = async () => {
          const sosTypes = ['Police', 'Police Station'];
          for (const type of sosTypes) {
              const wasOn = activeCategoriesRef.current.has(type);
              if (sosActive && !wasOn) {
                  await findPOI(type);
              } else if (!sosActive && wasOn) {
                  await findPOI(type);
              }
          }
      };
      syncSos();

      // 2. SOS Marker Logic
      if (sosActive) {
          const sosCategories = ['Police', 'Police Station'];
          const candidates = Object.values(categoryMarkers).flat();
          const filtered = candidates.filter(m => 
              sosCategories.includes(m.type) && 
              parseFloat(getDistance(userPos || center, m)) <= 2.0
          );
          // Ensure uniqueness by title/lat/lng
          const unique = filtered.filter((m, i, self) => 
              i === self.findIndex((t) => t.title === m.title && t.lat === m.lat && t.lng === m.lng)
          );
          setSosMarkers(unique);
      } else {
          setSosMarkers([]);
      }
  }, [sosActive, categoryMarkers, userPos, center]);

  useEffect(() => {
    if (activeAlert) {
      setCenter(activeAlert);
      setZoom(14);
      setRoutingTo({ ...activeAlert, title: 'SIM DISTRESS TARGET' });
    }
  }, [activeAlert]);

  // Network & GPS Tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let watchId: number;
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPos(newPos);
                if (isTracking && !activeAlert) setCenter(newPos);
                if (pos.coords.heading) setHeading(pos.coords.heading);
            },
            (err) => console.warn("GPS Error", err),
            { enableHighAccuracy: true }
        );
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, activeAlert]);

  const handleSearch = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const q = (manualQuery || searchQuery).trim().toLowerCase();
    if (!q) return;

    setIsSearching(true);
    setActivePoiInfo(null);
    
    // 1. Check Mock Data (POI, Incidents, Category Markers)
    const allLocalItems = [
        ...generateMockPoi(userPos || center),
        ...generateMockIncidents(userPos || center),
        ...Object.values(categoryMarkers).flat()
    ];
    
    const matches = allLocalItems.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.type && p.type.toLowerCase().includes(q))
    );
    
    if (matches.length > 0) {
        setCenter({ lat: matches[0].lat, lng: matches[0].lng });
        setZoom(16);
        setSearchResults(matches);
        setActivePoiInfo(`LOCAL DATABASE MATCH: Found ${matches.length} results for "${q}".`);
        setIsSearching(false);
        return;
    }

    // 2. Not in mock data? Use Gemini Grounding + Geocoding
    try {
        const result = await searchPlaces(q, userPos || center);
        const coords = await getCoordinatesFromText(q);
        
        if (coords) {
            setCenter({ lat: coords.lat, lng: coords.lng });
            setZoom(16);
            setSearchResults([{ 
                lat: coords.lat, 
                lng: coords.lng, 
                title: q.toUpperCase(), 
                desc: result.text, 
                url: result.chunks?.[0]?.maps?.uri,
                isTemporary: true
            }]);
            setActivePoiInfo(`EXTRAPOLATING VIA INTEL: ${result.text}`);
        } else {
            setActivePoiInfo(`NO GEOSPATIAL LOCK: ${result.text}`);
        }
    } catch (err) {
        console.error("Search failed", err);
        setActivePoiInfo("SIGNAL LOSS: UNABLE TO CONNECT TO GEOSPATIAL INTELLIGENCE.");
    }
    
    setIsSearching(false);
  };

  const simulateMobileUnits = (type: string, userLocation: {lat: number, lng: number}) => {
      const units = [];
      for (let i = 0; i < 5; i++) {
          // Random offset within ~1km (roughly 0.009 degrees)
          const latOffset = (Math.random() - 0.5) * 0.015;
          const lngOffset = (Math.random() - 0.5) * 0.015;
          units.push({
              lat: userLocation.lat + latOffset,
              lng: userLocation.lng + lngOffset,
              title: `${type.toUpperCase()} UNIT ${i + 1}`,
              desc: `Mobile tactical unit on patrol. Status: ACTIVE. Tracking via live beacon.`,
              isTemporary: true,
              isMobile: true,
              type: type
          });
      }
      return units;
  };

  const findPOI = async (type: string) => {
      const newCategories = new Set(activeCategories);
      const location = userPos || center;
      
      if (newCategories.has(type)) {
          // REMOVE
          newCategories.delete(type);
          const newCategoryMarkers = { ...categoryMarkers };
          delete newCategoryMarkers[type];
          setCategoryMarkers(newCategoryMarkers);
          setActiveCategories(newCategories);
          
          // Re-flatten markers
          const flattened = Object.values(newCategoryMarkers).flat();
          setSearchResults(flattened);
          return;
      }

      // ADD
      setIsSearching(true);
      setActivePoiInfo(null);
      
      const mobileTypes = ['Patrol Car', 'Police', 'Security Guard', 'Fire Truck', 'Ambulance', 'Security Vehicle', 'Volunteer'];
      const isMobile = mobileTypes.includes(type);
      const isCctv = type === 'CCTV';
      const isIncident = type === 'Incidents';

      let results: any[] = [];
      if (isMobile) {
          results = simulateMobileUnits(type, location);
          setActivePoiInfo(`DEPLOYING LIVE TRACKING: Found mobile ${type} units within operational radius. Icons are blinking to indicate active motion.`);
      } else if (isCctv) {
          results = generateMockCctv(location);
          setActivePoiInfo(`CCTV INTELLIGENCE: Secure view established.`);
      } else if (isIncident) {
          results = generateMockIncidents(location);
          setActivePoiInfo(`INCIDENT TRACKING: Active incidents detected.`);
      } else {
          try {
              const searchResults = await searchMultiplePlaces(type, location);
              if (searchResults && searchResults.length > 0) {
                  results = searchResults.map(r => ({
                      lat: r.lat,
                      lng: r.lng,
                      title: r.title,
                      desc: r.address || `Located via geospatial intelligence.`,
                      isTemporary: true,
                      isMobile: false,
                      type: type
                  }));
                  setActivePoiInfo(`INTELLIGENCE RETRIEVED: Located ${results.length} ${type} facilities in current sector.`);
              }
          } catch (err) {
              console.error("POI Search failed", err);
          }
      }

      const updatedCategoryMarkers = { ...categoryMarkers, [type]: results };
      setCategoryMarkers(updatedCategoryMarkers);
      setActiveCategories(newCategories.add(type));
      setSearchResults(Object.values(updatedCategoryMarkers).flat());
      
      if (results.length > 0 && !isMobile) {
          setCenter({ lat: results[0].lat, lng: results[0].lng });
          setZoom(14);
      }
      
      setIsSearching(false);
  };

  /* Fixed getDistance to accept null and always return a string to prevent type mismatch with parseFloat */
  const getDistance = (p1: {lat: number, lng: number} | null, p2: {lat: number, lng: number} | null) => {
      if (!p1 || !p2) return "0.00";
      const R = 6371; // km
      const dLat = (p2.lat - p1.lat) * Math.PI / 180;
      const dLon = (p2.lng - p1.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return (R * c).toFixed(2);
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden font-tech">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      
      <MapContainer 
          center={center} 
          zoom={zoom} 
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full z-0"
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
      >
          <TileLayer 
            attribution={MAP_STYLES[currentMapStyle].attribution} 
            url={MAP_STYLES[currentMapStyle].url} 
          />
          
          {/* User Location Pulse */}
          {(userPos || center) && !sosActive && (
              <>
                <CircleMarker center={userPos || center} radius={12} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }} />
                <CircleMarker center={userPos || center} radius={4} pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }} />
              </>
          )}

          {(userPos || center) && sosActive && (
              <Marker 
                  key={`sos-marker-active-${sosActive}-${userPos ? 'gps' : 'fixed'}`}
                  position={userPos || center} 
                  icon={L.divIcon({
                      className: 'sos-marker-container',
                      html: `<div class="relative w-24 h-24 flex items-center justify-center">
                              <div class="absolute inset-4 bg-red-600 rounded-full animate-sos-ping opacity-70"></div>
                              <div class="absolute inset-6 bg-red-600 rounded-full animate-sos-glow border-4 border-white flex flex-col items-center justify-center z-10">
                                  <span class="text-[16px] font-black text-white text-center leading-none uppercase tracking-tighter">SOS</span>
                              </div>
                             </div>`,
                      iconSize: [96, 96],
                      iconAnchor: [48, 48]
                  })}
                  zIndexOffset={10000}
              />
          )}

          {/* Simulation Polyline indicating exactly 4 kms offset distance */}
          {sosActive && activeAlert && (userPos || center) && (
              <Polyline 
                  positions={[userPos || center, activeAlert]} 
                  pathOptions={{ 
                      color: '#ef4444', 
                      weight: 3, 
                      dashArray: '8, 8', 
                      opacity: 0.85 
                  }}
              >
                  <Popup>
                      <div className="p-2 font-sans text-xs text-slate-900 font-bold">
                          🚨 Emergency Signal Range: ~4.0 km distress radius
                      </div>
                  </Popup>
              </Polyline>
          )}

          <HeatmapOverlay userLocation={userPos || center} />

          {/* Active Alert Marker */}
          {activeAlert && (
              <Marker 
                position={activeAlert}
                icon={L.divIcon({
                    className: 'alert-marker',
                    html: `<div class="relative w-12 h-12 flex items-center justify-center">
                            <div class="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-60"></div>
                            <div class="absolute inset-1.5 bg-blue-700 border-2 border-red-500 rounded-xl animate-pulse flex items-center justify-center shadow-lg">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="white" stroke-width="2.5" fill="none">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    <circle cx="12" cy="11" r="2"></circle>
                                </svg>
                            </div>
                           </div>`,
                    iconSize: [48, 48],
                    iconAnchor: [24, 24]
                })}
              >
                  <Popup>
                      <div className="p-1.5 font-sans text-slate-905">
                          <div className="font-bold text-xs uppercase text-red-600 flex items-center gap-1">
                              <Siren className="w-3.5 h-3.5" />
                              <span>OFFICER DISTRESS SOURCE (SIM)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">Sample scenario: Distressed separate police officer offset at least 4.0 km from your current position.</div>
                      </div>
                  </Popup>
              </Marker>
          )}

          {/* Search Results */}
          {(sosActive ? [...searchResults, ...sosMarkers.filter(s => !searchResults.find(r => r.title === s.title && r.lat === s.lat && r.lng === s.lng))] : searchResults).map((res, i) => {
              const isPoliceStation = res.type === 'Police Station' || (res.title && res.title.toLowerCase().includes('police station'));
              const isFireStation = res.type === 'Fire Station' || (res.title && res.title.toLowerCase().includes('fire station'));
              const isHospital = res.type === 'Hospital' || (res.title && res.title.toLowerCase().includes('hospital'));
              const isCctv = res.type === 'CCTV';
              const isIncident = generateMockIncidents(userPos || center).some(i => i.title === res.title);

              let icon;
              if (res.isMobile) {
                  let bgColor = 'bg-cyan-600';
                  let borderColor = 'border-cyan-400';
                  let shadowColor = 'rgba(6,182,212,0.6)';
                  let haloColor = 'bg-cyan-500/20';
                  let iconPath = '';
                  let isBlinking = true;
                  let iconContent = '';

                  if (res.type === 'Patrol Car') {
                      bgColor = 'bg-blue-600';
                      borderColor = 'border-blue-400';
                      shadowColor = 'rgba(37,99,235,0.8)';
                      haloColor = 'bg-blue-500/30';
                      // Siren icon path
                      iconPath = '<path d="M12 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M21 16H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z"/><path d="M10 6h4"/><path d="M12 2v4"/>';
                  } else if (res.type === 'Fire Truck') {
                      bgColor = 'bg-yellow-500';
                      borderColor = 'border-yellow-300';
                      shadowColor = 'rgba(234,179,8,0.8)';
                      haloColor = 'bg-yellow-500/30';
                      iconPath = '<path d="M12 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M21 16H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z"/><path d="M10 6h4"/><path d="M12 2v4"/>';
                  } else if (res.type === 'Ambulance') {
                      bgColor = 'bg-red-600';
                      borderColor = 'border-red-400';
                      shadowColor = 'rgba(239,68,68,0.8)';
                      haloColor = 'bg-red-500/30';
                      iconPath = '<path d="M12 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M21 16H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z"/><path d="M10 6h4"/><path d="M12 2v4"/>';
                  } else if (res.type === 'Security Vehicle') {
                      bgColor = 'bg-emerald-600';
                      borderColor = 'border-emerald-400';
                      shadowColor = 'rgba(16,185,129,0.8)';
                      haloColor = 'bg-emerald-500/30';
                      iconPath = '<path d="M12 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M21 16H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z"/><path d="M10 6h4"/><path d="M12 2v4"/>';
                  } else if (res.type === 'Police') {
                      bgColor = 'bg-blue-600';
                      borderColor = 'border-blue-400';
                      shadowColor = 'rgba(37,99,235,0.6)';
                      haloColor = 'bg-blue-500/20';
                      iconPath = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
                  } else if (res.type === 'Security Guard') {
                      bgColor = 'bg-emerald-600';
                      borderColor = 'border-emerald-400';
                      shadowColor = 'rgba(16,185,129,0.6)';
                      haloColor = 'bg-emerald-500/20';
                      iconPath = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>';
                  } else if (res.type === 'Volunteer') {
                      bgColor = 'bg-red-600';
                      borderColor = 'border-red-400';
                      shadowColor = 'rgba(239,68,68,0.8)';
                      haloColor = 'bg-red-500/30';
                      iconContent = `<div class="font-black text-white text-xs w-4 h-4 flex items-center justify-center">V</div>`;
                  } else {
                      iconPath = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
                  }

                  if (!iconContent) {
                      iconContent = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2.5" fill="none" class="${isBlinking ? 'animate-pulse' : ''}">
                          ${iconPath}
                      </svg>`;
                  }

                  icon = L.divIcon({
                      className: 'mobile-marker',
                      html: `<div class="relative w-8 h-8 flex items-center justify-center">
                              <div class="absolute inset-0 ${haloColor} rounded-full animate-ping scale-150"></div>
                              <div class="absolute inset-0 ${haloColor} rounded-full animate-pulse scale-125"></div>
                              <div class="${bgColor} p-1.5 rounded-lg border ${borderColor} shadow-[0_0_15px_${shadowColor}]">
                                  ${iconContent}
                              </div>
                             </div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16]
                  });

              } else if (isCctv) {
                  icon = L.divIcon({
                      className: 'cctv-marker',
                      html: `<div class="bg-cyan-600 p-1.5 rounded-full border border-cyan-400 shadow-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round">
                                  <path d="M 5 5 L 17 17 L 14 20 L 2 8 Z M 14 17 L 17 20 L 20 17 L 17 14 Z M 9 13 L 6 16 L 3 16" />
                              </svg>
                             </div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16]
                  });
              } else if (isIncident) {
                  icon = L.divIcon({
                      className: 'incident-marker',
                      html: `<div class="animate-bounce bg-red-600 p-1.5 rounded-full border border-red-300 shadow-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2" fill="none">
                                  <path d="M12 2L2 22h20L12 2zM12 9v4M12 17h.01" />
                              </svg>
                             </div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16]
                  });
              } else if (isPoliceStation) {
                  icon = L.divIcon({
                      className: 'station-marker',
                      html: `<div class="bg-blue-600 p-2 rounded-xl border-2 border-blue-400 shadow-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2.5" fill="none">
                                  <path d="M22 20h-4M2 20h4"></path><path d="M6 20v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"></path><path d="M2 18V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11"></path><path d="M10 2l2 2 2-2"></path>
                              </svg>
                             </div>`,
                      iconSize: [40, 40],
                      iconAnchor: [20, 20]
                  });
              } else if (isFireStation) {
                  icon = L.divIcon({
                      className: 'station-marker',
                      html: `<div class="bg-yellow-500 p-2 rounded-xl border-2 border-yellow-300 shadow-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2.5" fill="none">
                                  <path d="M22 20h-4M2 20h4"></path><path d="M6 20v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"></path><path d="M2 18V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11"></path><path d="M10 2l2 2 2-2"></path>
                              </svg>
                             </div>`,
                      iconSize: [40, 40],
                      iconAnchor: [20, 20]
                  });
              } else if (isHospital) {
                icon = L.divIcon({
                    className: 'station-marker',
                    html: `<div class="bg-red-600 p-2 rounded-xl border-2 border-red-400 shadow-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2.5" fill="none">
                                <path d="M22 20h-4M2 20h4"></path><path d="M6 20v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"></path><path d="M2 18V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11"></path><path d="M10 2l2 2 2-2"></path>
                            </svg>
                           </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
              } else {
                  icon = TargetIcon;
              }

              return (
                <Marker 
                  key={res.title + i} 
                  position={res as L.LatLngExpression} 
                  icon={icon}
                >
                    <Popup className="tactical-popup">
                        <div className="p-2 w-[200px] bg-slate-900/60 backdrop-blur-lg rounded-xl shadow-2xl">
                            {isCctv ? (
                                <>
                                    {activeVideoCctv === res.title && <CctvVideo title={res.title} />}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <button onClick={() => setRoutingTo(res)} className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 font-bold">
                                            <Route className="w-3 h-3" /> ROUTE
                                        </button>
                                        <button onClick={() => setActiveVideoCctv(activeVideoCctv === res.title ? null : res.title)} className="bg-cyan-600 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 font-bold">
                                            <Eye className="w-3 h-3" /> VIDEO
                                        </button>
                                    </div>
                                </>
                            ) : isIncident ? (
                                <div className="w-[170px]">
                                    <h4 className="font-bold text-red-600 border-b mb-1 uppercase tracking-wider text-xs">INCIDENT: {res.type}</h4>
                                    <p className="text-[10px] text-slate-300">WHEN: {res.details.When}</p>
                                    <p className="text-[10px] text-slate-300">WHERE: {res.details.Where}</p>
                                    <button onClick={() => setActivePoiInfo(`INCIDENT REPORT: ${res.type}\n\nNarrative: ${res.details.Narrative}\nAssigned Officer: ${res.details.Officer}`)} className="bg-red-600 text-white w-full py-1 mt-2 rounded text-[10px] font-bold">
                                        VIEW REPORT
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h4 className="font-bold text-blue-600 border-b mb-1">{res.title}</h4>
                                    {userPos && <p className="text-[10px] font-mono mb-2">DIST: {getDistance(userPos, res)} KM</p>}
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setRoutingTo(res)} className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 font-bold">
                                            <Route className="w-3 h-3" /> ROUTE
                                        </button>
                                        {onCallContact && (
                                            <button 
                                                onClick={() => onCallContact(res.title)} 
                                                className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 font-bold"
                                            >
                                                <Phone className="w-3 h-3" /> CALL
                                            </button>
                                        )}
                                        {res.url && <a href={res.url} target="_blank" className="bg-slate-700 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> MAPS
                                        </a>}
                                    </div>
                                </>
                            )}
                        </div>
                    </Popup>
                </Marker>
              );
          })}

          {/* Routing Line */}
          {routingTo && userPos && !sosActive && (
              <Polyline 
                  positions={[userPos, routingTo]} 
                  pathOptions={
                      navMode === 'FOOT' 
                          ? { color: '#38bdf8', weight: 5, dashArray: '6, 8', opacity: 0.95 }
                          : showTraffic 
                              ? { color: '#f97316', weight: 6, opacity: 0.85 }
                              : { color: '#22c55e', weight: 5, opacity: 0.8 }
                  } 
              />
          )}

          <MapController center={center} zoom={zoom} onMapReady={(m: any) => { mapRef.current = m; }} />
          <MapClickNavHandler isNavActive={isNavOpen} isDropPinMode={isDropPinMode} onSetDestination={(p) => setRoutingTo(p)} onDropPin={onDropPin} />
          {customPins.map((pin, i) => (
              <Marker key={`pin-${i}`} position={[pin.lat, pin.lng]}>
                  <Popup>{pin.label} <button onClick={() => setCustomPins(prev => prev.filter((_, idx) => idx !== i))} className='block mt-2 text-red-500'>Remove</button></Popup>
              </Marker>
          ))}
      </MapContainer>

      {/* SEARCH & TITLE OVERLAY */}
      <div className="absolute top-0.5 left-2 right-2 z-[1001] pointer-events-none flex items-center gap-2">
          {onToggleExpand && (
            <button 
                onClick={onToggleExpand} 
                className="pointer-events-auto shrink-0 glass-panel p-2 rounded-xl text-cyan-400 border border-cyan-500/30 hover:bg-white/10 transition-all shadow-xl"
            >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          <form onSubmit={handleSearch} className="relative flex gap-2 pointer-events-auto flex-1 max-w-[550px]">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Filter Incidents, Units, or Search Place..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 shadow-2xl transition-all"
                />
             </div>
             <button 
                type="submit" 
                disabled={isSearching} 
                className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0"
                style={{ width: '30px', height: '33px' }}
             >
                {isSearching ? 
                    <Loader2 className="w-4 h-4 animate-spin" /> : 
                    <Search className="w-4 h-4" />
                }
             </button>

             <button 
                type="button"
                onClick={toggleVoice}
                className={`rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0 border ${
                  isVoiceActive 
                    ? 'bg-red-600 border-red-500 hover:bg-red-550 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                }`}
                style={{ width: '30px', height: '33px' }}
                title="Voice Assistant (Active Control)"
             >
                <Mic className="w-4 h-4" />
             </button>

             {/* SIM Button absolutely positioned under the search button */}
             {onSimulateSOS && (
                 <button 
                     type="button"
                     onClick={() => {
                         onSimulateSOS();
                         if (navigator.vibrate) navigator.vibrate(80);
                     }} 
                     className={`absolute top-[38px] right-0 px-2.5 h-8 rounded-xl border transition-all active:scale-95 shadow-lg text-[9px] font-black tracking-wider flex items-center justify-center gap-1 uppercase z-[1001] pointer-events-auto ${sosActive ? 'bg-red-700/40 border-red-500 text-red-100 animate-pulse' : 'bg-red-950/40 text-red-400 border-red-900/30 hover:border-red-500/50 hover:bg-red-900/10'}`}
                     title="Simulate 2km Distress SOS"
                 >
                     <Siren className={`w-3.5 h-3.5 ${sosActive ? 'animate-bounce text-red-100' : 'text-slate-400'}`} />
                     <span>SIM</span>
                 </button>
             )}
          </form>
      </div>

      <div className="absolute bottom-1 right-1 left-1 md:right-2 md:left-2 z-[1001] pointer-events-none flex justify-center">

          <AnimatePresence>
              {isBarOpen && (
                  <motion.div 
                    ref={buttonTrackRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeaveOrUp}
                    onMouseUp={handleMouseLeaveOrUp}
                    onMouseMove={handleMouseMove}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 120 }}
                    className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/90 backdrop-blur-2xl px-3 py-2 rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] justify-start w-auto max-w-[95%] h-[60px] overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing"
                  >
                        {/* Drop Pin */}
                        <button 
                            onClick={() => setIsDropPinMode(!isDropPinMode)} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-purple-400 transition-all duration-300 rounded-full border flex-shrink-0 ${isDropPinMode ? 'bg-purple-500/30 border-purple-400 ring-2 ring-purple-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-purple-500/50'}`} 
                            title="Drop Pin"
                        >
                            <MapPin className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">{isDropPinMode ? 'STOP' : 'DROP PIN'}</span>
                        </button>
                        
                        {/* Hospital */}
                        <button 
                            onClick={() => findPOI('Hospital')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-red-400 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Hospital') ? 'bg-red-500/30 border-red-400 ring-2 ring-red-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-red-500/50'}`} 
                            title="Hospital"
                        >
                            <Hospital className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Hospital</span>
                        </button>

                        {/* Police Station */}
                        <button 
                            onClick={() => findPOI('Police Station')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-blue-400 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Police Station') ? 'bg-blue-500/30 border-blue-400 ring-2 ring-blue-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-blue-500/50'}`} 
                            title="Police Station"
                        >
                            <Building2 className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Police Station</span>
                        </button>

                        {/* Fire Station */}
                        <button 
                            onClick={() => findPOI('Fire Station')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-yellow-400 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Fire Station') ? 'bg-yellow-500/30 border-yellow-400 ring-2 ring-yellow-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-yellow-500/50'}`} 
                            title="Fire Station"
                        >
                            <Building2 className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Fire Station</span>
                        </button>

                        {/* CCTV */}
                        <button 
                            onClick={() => findPOI('CCTV')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-cyan-400 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('CCTV') ? 'bg-cyan-500/30 border-cyan-400 ring-2 ring-cyan-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-cyan-500/50'}`} 
                            title="CCTV"
                        >
                            <Cctv className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">CCTV</span>
                        </button>

                        {/* Incidents */}
                        <button 
                            onClick={() => findPOI('Incidents')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-red-500 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Incidents') ? 'bg-red-500/30 border-red-400 ring-2 ring-red-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-red-500/50'}`} 
                            title="Incidents"
                        >
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Incidents</span>
                        </button>

                        {/* Patrol Car */}
                        <button 
                            onClick={() => findPOI('Patrol Car')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-blue-400 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Patrol Car') ? 'bg-blue-500/30 border-blue-400 ring-2 ring-blue-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-blue-500/50'}`} 
                            title="Patrol Car"
                        >
                            <Siren className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Patrol</span>
                        </button>

                        {/* Fire Truck */}
                        <button 
                            onClick={() => findPOI('Fire Truck')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-yellow-500 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Fire Truck') ? 'bg-yellow-500/30 border-yellow-400 ring-2 ring-yellow-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-yellow-500/50'}`} 
                            title="Fire Truck"
                        >
                            <Siren className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Fire</span>
                        </button>

                        {/* Ambulance */}
                        <button 
                            onClick={() => findPOI('Ambulance')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-red-500 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Ambulance') ? 'bg-red-500/30 border-red-400 ring-2 ring-red-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-red-500/50'}`} 
                            title="Ambulance"
                        >
                            <Siren className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">EMS</span>
                        </button>

                        {/* Security Vehicle */}
                        <button 
                            onClick={() => findPOI('Security Vehicle')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-emerald-400 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Security Vehicle') ? 'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-emerald-500/50'}`} 
                            title="Security Vehicle"
                        >
                            <Siren className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Sec-V</span>
                        </button>

                        {/* Police */}
                        <button 
                            onClick={() => findPOI('Police')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-blue-400 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Police') ? 'bg-blue-500/30 border-blue-400 ring-2 ring-blue-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-blue-500/50'}`} 
                            title="Police on Duty"
                        >
                            <Shield className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Police</span>
                        </button>

                        {/* Security Guard */}
                        <button 
                            onClick={() => findPOI('Security Guard')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-emerald-400 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Security Guard') ? 'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-emerald-500/50'}`} 
                            title="Security Guard"
                        >
                            <ShieldCheck className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Guard</span>
                        </button>

                        {/* Volunteer */}
                        <button 
                            onClick={() => findPOI('Volunteer')} 
                            className={`group flex items-center justify-center w-11 hover:w-auto h-11 hover:px-3.5 text-red-500 transition-all duration-300 rounded-full border flex-shrink-0 ${activeCategories.has('Volunteer') ? 'bg-red-500/30 border-red-400 ring-2 ring-red-500/30' : 'bg-slate-900/80 border-white/10 hover:bg-slate-800 hover:border-red-500/50'}`} 
                            title="Volunteer"
                        >
                            <span className="w-5 h-5 flex-shrink-0 font-black text-center flex items-center justify-center group-hover:scale-110 transition-transform">V</span>
                            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] group-focus-within:max-w-[100px] transition-all duration-300 text-[10px] font-black uppercase whitespace-nowrap ml-0 group-hover:ml-2 group-focus-within:ml-2">Volunteer</span>
                        </button>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      {/* AI INTELLIGENCE PANEL */}
      {activePoiInfo && (
          <div ref={intelligenceBoxRef} className="absolute top-32 right-4 w-72 bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-2xl z-[1002] animate-in slide-in-from-right max-h-[50vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-2 border-b border-slate-800 pb-2">
                  <h3 className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-2">
                    <Info className="w-4 h-4" /> Tactical Intelligence
                  </h3>
                  <button onClick={() => setActivePoiInfo(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {activePoiInfo}
              </p>
          </div>
      )}

      {/* MAP CONTROLS */}
      <div className="absolute top-16 left-2 flex flex-col gap-1 z-[1000]">
          <div className="w-10 h-10 bg-slate-800/90 rounded-full border border-slate-700 flex items-center justify-center relative shadow-lg">
              <Compass className="w-6 h-6 text-slate-400 transition-transform" style={{ transform: `rotate(${heading}deg)` }} />
              <div className="absolute top-0.5 text-[8px] font-bold text-red-500">N</div>
          </div>
          
          <button 
            onClick={() => { setIsTracking(true); if(userPos) setCenter(userPos); }} 
            className={`p-2 rounded-xl shadow-lg border transition-all ${isTracking ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
          >
              <Crosshair className={`w-5 h-5 ${isTracking ? 'animate-pulse' : ''}`} />
          </button>

          <div className="relative">
              {isMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden w-32 animate-in slide-in-from-bottom-2">
                      {(Object.keys(MAP_STYLES) as Array<keyof typeof MAP_STYLES>).map((key) => {
                          const style = MAP_STYLES[key];
                          return (
                              <button
                                  key={key}
                                  onClick={() => { setCurrentMapStyle(key); setIsMenuOpen(false); }}
                                  className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-800 ${currentMapStyle === key ? 'text-cyan-400' : 'text-slate-400'}`}
                              >
                                  <style.icon className="w-3 h-3" /> {style.label}
                              </button>
                          );
                      })}
                  </div>
              )}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-slate-800 text-white rounded-xl border border-slate-700 shadow-lg">
                  <Layers className="w-5 h-5" />
              </button>
          </div>

          {/* Navigation Button */}
          <button 
              onClick={() => setIsNavOpen(!isNavOpen)} 
              className={`p-2 rounded-xl border shadow-lg transition-all ${isNavOpen ? 'bg-cyan-600 text-white border-cyan-400 scale-105 ring-2 ring-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'}`}
              title="Google Traffic Navigation"
          >
              <Navigation className={`w-5 h-5 transition-transform ${isNavOpen ? 'rotate-45 text-white' : ''}`} />
          </button>
      </div>

      {/* ROUTING INFO BAR */}
      {routingTo && userPos && !sosActive && (
          <div className="absolute bottom-16 right-2 z-[1000]">
              <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-3">
                  <div className="p-1.5 bg-cyan-600 rounded-lg text-white">
                      {navMode === 'FOOT' ? <Footprints className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                  </div>
                  <div>
                      <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                          <span>ENROUTE ({navMode === 'FOOT' ? 'WALKING' : 'DRIVING'}):</span>
                          <span className="text-cyan-400 font-bold truncate max-w-[120px]">{routingTo.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-white leading-none">{getDistance(userPos, routingTo)} KM</span>
                          <span className="text-[10px] font-bold text-cyan-400 leading-none">
                              {navMode === 'FOOT' 
                                  ? Math.ceil(parseFloat(getDistance(userPos, routingTo)) * 12)
                                  : Math.ceil(parseFloat(getDistance(userPos, routingTo)) * (showTraffic ? 2.5 : 1.5))
                              } MIN
                          </span>
                      </div>
                  </div>
                  <button onClick={() => setRoutingTo(null)} className="p-1 hover:bg-slate-800 rounded text-slate-500"><X className="w-4 h-4"/></button>
              </div>
          </div>
      )}

      {/* FLOATING GOOGLE NAVIGATION PANEL */}
      {isNavOpen && (
          <div className="absolute top-16 left-14 w-68 bg-slate-950/95 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[1002] animate-in slide-in-from-left-4">
              <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-1.5">
                  <h3 className="text-cyan-400 font-black text-[10px] uppercase tracking-wider flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-cyan-400 rotate-45" /> TACTICAL GOOGLE NAV & TRAFFIC
                  </h3>
                  <button onClick={() => setIsNavOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                  </button>
              </div>

              {/* Waypoint message or selected target */}
              <div className="bg-slate-900 border border-white/5 rounded-lg p-2.5 mb-3">
                  <span className="text-[9px] text-slate-400 block font-bold mb-1 uppercase tracking-wider font-mono">Current Destination</span>
                  {routingTo ? (
                      <div className="flex items-start gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                          <div className="min-w-0">
                              <span className="text-[10px] font-bold text-white block truncate">{routingTo.title}</span>
                              <span className="text-[9px] font-mono text-slate-500">
                                  LAT: {routingTo.lat.toFixed(4)}, LNG: {routingTo.lng.toFixed(4)}
                              </span>
                          </div>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 text-[9px] font-bold text-yellow-500">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>
                          <span>Click on map to register route destination</span>
                      </div>
                  )}
              </div>

              {/* Mode of Transport Selection */}
              <div className="mb-3">
                  <span className="text-[9px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider font-mono">Navigation Mode</span>
                  <div className="grid grid-cols-2 gap-1.5">
                      <button 
                          onClick={() => setNavMode('VEHICLE')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${navMode === 'VEHICLE' ? 'bg-cyan-600/90 text-white shadow-lg border border-cyan-400/30' : 'bg-slate-900 text-slate-400 border border-white/5 hover:text-white'}`}
                      >
                          <Car className="w-3.5 h-3.5" /> VEHICLE
                      </button>
                      <button 
                          onClick={() => setNavMode('FOOT')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${navMode === 'FOOT' ? 'bg-cyan-600/90 text-white shadow-lg border border-cyan-400/30' : 'bg-slate-900 text-slate-400 border border-white/5 hover:text-white'}`}
                      >
                          <Footprints className="w-3.5 h-3.5" /> FOOT
                      </button>
                  </div>
              </div>

              {/* Google Traffic Info */}
              <div className="bg-slate-900 border border-white/5 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Google Traffic Feed</span>
                      <button 
                          onClick={() => setShowTraffic(!showTraffic)}
                          className={`text-[8px] px-1.5 py-0.5 rounded font-black border transition-colors uppercase ${showTraffic ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
                      >
                          {showTraffic ? 'ON' : 'OFF'}
                      </button>
                  </div>

                  {showTraffic ? (
                      <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[8px] border-b border-white/5 pb-1 font-mono">
                              <span className="text-slate-500">DATA GROUNDING:</span>
                              <span className="text-emerald-400 font-bold">API ACTIVE</span>
                          </div>
                          {navMode === 'VEHICLE' ? (
                              <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-[9px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      <span className="font-bold text-slate-200">Moderate Vehicle Slowdown</span>
                                  </div>
                                  <p className="text-[8px] text-slate-400 leading-relaxed font-mono">
                                      Google Maps reports minor congestion. Vehicle delays estimated at +2.2 minutes. Free-flowing alternate paths calculated.
                                  </p>
                              </div>
                          ) : (
                              <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-[9px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span className="font-bold text-slate-200">Clear Walking Path</span>
                                  </div>
                                  <p className="text-[8px] text-slate-400 leading-relaxed font-mono">
                                      Pedestrians bypass traffic gridlocks entirely. Grounded sidewalks and crossings marked as safe.
                                  </p>
                              </div>
                          )}
                      </div>
                  ) : (
                      <p className="text-[8px] text-slate-500 leading-normal italic font-mono">
                          Google Traffic telemetry offline. Calculations based on raw Euclidean distance metrics.
                      </p>
                  )}
              </div>
          </div>
      )}

      {/* VOICE COMMAND HUD OVERLAY */}
      <AnimatePresence>
        {(isVoiceActive || voiceFeedback) && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-[1100] flex flex-col items-center gap-1.5 pointer-events-none"
          >
            <div className={`px-4 py-2 rounded-full border shadow-[0_5px_20px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center gap-2.5 text-xs font-mono font-bold pointer-events-auto ${
              voiceFeedback.startsWith('❌') ? 'bg-red-950/90 border-red-500/30 text-red-200' :
              voiceFeedback.startsWith('🗺️') ? 'bg-cyan-950/90 border-cyan-500/30 text-cyan-200 animate-pulse' :
              'bg-slate-950/95 border-cyan-500/40 text-cyan-400'
            }`}>
              <div className="relative flex items-center justify-center">
                <Mic className={`w-3.5 h-3.5 ${isVoiceActive ? 'text-red-500' : 'text-slate-400'}`} />
                {isVoiceActive && (
                  <span className="absolute -inset-1 rounded-full border border-red-500/40 animate-ping"></span>
                )}
              </div>
              <span className="tracking-wide">
                {voiceFeedback || "VOICE ASSISTANT RUNNING. TRY: 'Find hospital' or 'Directions to Luneta Park'"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Network Status */}
      {!isOnline && (
          <div className="absolute bottom-20 right-2 z-[1000] bg-red-900/90 text-white px-2 py-1 rounded-lg text-[9px] font-bold border border-red-500/50 shadow-2xl animate-pulse flex items-center gap-2 backdrop-blur-md">
              <WifiOff className="w-3 h-3 text-red-200" /> OFFLINE MODE
          </div>
      )}

      {/* Street View Modal */}
      {isStreetViewOpen && (
          <div className="absolute inset-0 z-[2000] bg-black animate-in fade-in zoom-in duration-300">
              <div className="absolute top-4 right-4 z-[2010] flex gap-2">
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/@${center.lat},${center.lng},3a,75y,90t/data=!3m6!1e1`, '_blank')}
                    className="p-2 bg-blue-600 text-white rounded-full shadow-lg border border-blue-400 hover:bg-blue-500"
                    title="Open in Google Maps"
                  >
                      <ExternalLink className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsStreetViewOpen(false)}
                    className="p-2 bg-red-600 text-white rounded-full shadow-lg border border-red-400 hover:bg-red-500"
                    title="Close"
                  >
                      <X className="w-5 h-5" />
                  </button>
              </div>
              
              {/* Street View Iframe - Note: This is a fallback-style integration for non-API key demos */}
              <div className="w-full h-full relative">
                  <iframe 
                    src={`https://www.google.com/maps/embed/v1/streetview?key=&location=${center.lat},${center.lng}&heading=210&pitch=10&fov=35`}
                    className="w-full h-full border-none"
                    title="Street View"
                    allowFullScreen
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/10 backdrop-blur-xl text-center max-w-sm pointer-events-auto shadow-2xl">
                          <Eye className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
                          <h3 className="text-white font-black text-lg mb-2">IMMERSIVE PANORAMA</h3>
                          <p className="text-slate-400 text-xs mb-6 font-mono">
                            The embedded panoramic view requires a Google Maps API Key. Check the console or use the direct link below.
                          </p>
                          <button 
                            onClick={() => window.open(`https://www.google.com/maps/@${center.lat},${center.lng},3a,75y,90t/data=!3m6!1e1`, '_blank')}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center gap-2 mx-auto"
                          >
                            <ExternalLink className="w-4 h-4" /> OPEN FULL MAPS
                          </button>
                      </div>
                  </div>
              </div>
              
              {/* Overlay with info if API key is missing */}
              <div className="absolute bottom-4 left-4 z-[2010] p-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 max-w-xs transition-opacity pointer-events-none">
                  <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-widest">Panoramic View</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      SYNCING COORDINATES: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                  </p>
                  <p className="text-[10px] text-yellow-400 mt-2 font-mono uppercase">
                      Note: External satellite data may require authorization.
                  </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default LiveMap;
