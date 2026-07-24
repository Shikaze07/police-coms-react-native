import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Fonts } from '../../../constants/theme';
import * as Location from 'expo-location';

// Only import WebView on native; web uses <iframe>
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

interface FieldAsset {
  id: string;
  label: string;
  type: 'PATROL' | 'DRONE' | 'OFFICER' | 'INCIDENT';
  status: string;
  lat: number;
  lng: number;
  details: string;
}

const MAP_STYLES = [
  {
    id: 'GOOGLE_STREET',
    label: 'Google Maps',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    icon: 'map',
  },
  {
    id: 'GOOGLE_HYBRID',
    label: 'Google Hybrid',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    icon: 'globe',
  },
  {
    id: 'GOOGLE_TRAFFIC',
    label: 'Google Traffic',
    url: 'https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    icon: 'navigation',
  },
  {
    id: 'GOOGLE_TERRAIN',
    label: 'Google Terrain',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    icon: 'layers',
  },
  {
    id: 'OSM',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    icon: 'map-pin',
  },
  {
    id: 'TACTICAL',
    label: 'Tactical Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c'],
    icon: 'grid',
  },
];

const POI_CATEGORIES = [
  { id: 'school',      label: 'Schools',     icon: 'book',        osmKey: 'amenity', osmVal: 'school',       color: '#1a73e8' },
  { id: 'church',     label: 'Churches',    icon: 'compass',     osmKey: 'amenity', osmVal: 'place_of_worship', color: '#7c3aed' },
  { id: 'market',     label: 'Markets',     icon: 'shopping-bag',osmKey: 'amenity', osmVal: 'marketplace',   color: '#f97316' },
  { id: 'mall',       label: 'Malls',       icon: 'grid',        osmKey: 'shop',    osmVal: 'mall',         color: '#0891b2' },
  { id: 'hospital',   label: 'Hospitals',   icon: 'plus-square', osmKey: 'amenity', osmVal: 'hospital',      color: '#dc2626' },
  { id: 'police',     label: 'Police',      icon: 'shield',      osmKey: 'amenity', osmVal: 'police',        color: '#059669' },
  { id: 'restaurant', label: 'Restaurants', icon: 'coffee',      osmKey: 'amenity', osmVal: 'restaurant',    color: '#ca8a04' },
  { id: 'bank',       label: 'Banks',       icon: 'credit-card', osmKey: 'amenity', osmVal: 'bank',         color: '#4f46e5' },
  { id: 'fuel',       label: 'Gas Stations',icon: 'zap',         osmKey: 'amenity', osmVal: 'fuel',         color: '#b45309' },
  { id: 'park',       label: 'Parks',       icon: 'sun',         osmKey: 'leisure', osmVal: 'park',         color: '#16a34a' },
];

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Overpass API POI fetcher — queries real-world places near a lat/lng
// ---------------------------------------------------------------------------
async function fetchOverpassPOIs(
  lat: number,
  lng: number,
  osmKey: string,
  osmVal: string,
  radiusMeters = 3000
): Promise<Array<{ id: string; name: string; lat: number; lng: number }>> {
  const query = `[out:json][timeout:10];(node["${osmKey}"="${osmVal}"](around:${radiusMeters},${lat},${lng});way["${osmKey}"="${osmVal}"](around:${radiusMeters},${lat},${lng}););out center 30;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
    const json = await res.json();
    return (json.elements as any[]).map((el: any) => ({
      id: String(el.id),
      name: el.tags?.name || osmVal,
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
    })).filter((p: any) => p.lat && p.lng);
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// Standalone HTML generator — declared outside component so useMemo can ref it
// without re-creating it on each render.
// ---------------------------------------------------------------------------
function buildMapHtml(
  center: { lat: number; lng: number },
  zoom: number,
  style: typeof MAP_STYLES[0],
  assets: FieldAsset[]
): string {
  const subdomainsJson = JSON.stringify(style.subdomains || ['mt0', 'mt1', 'mt2', 'mt3']);
  const assetsJson = JSON.stringify(
    assets.map((a) => ({ id: a.id, label: a.label, lat: a.lat, lng: a.lng, type: a.type, status: a.status, details: a.details }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html,body,#map{height:100%;width:100%;margin:0;padding:0;background:#e5e7eb;}
    .leaflet-container{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}
    .marker-pulse{width:14px;height:14px;border-radius:50%;background:#1a73e8;border:2px solid #fff;box-shadow:0 0 10px rgba(26,115,232,.6);}
    .marker-incident{width:16px;height:16px;border-radius:50%;background:#ea4335;border:2px solid #fff;box-shadow:0 0 12px rgba(234,67,53,.7);}
    .marker-drone{width:14px;height:14px;border-radius:50%;background:#fbbc04;border:2px solid #fff;box-shadow:0 0 10px rgba(251,188,4,.7);}
    .marker-me{width:16px;height:16px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 3px rgba(26,115,232,.35);}
    .custom-popup .leaflet-popup-content-wrapper{background:#fff;color:#202124;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.15);border:none;}
    .custom-popup .leaflet-popup-tip{background:#fff;}
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map',{zoomControl:false,attributionControl:true}).setView([${center.lat},${center.lng}],${zoom});
    var subdomains = ${subdomainsJson};
    L.tileLayer('${style.url}',{maxZoom:20,subdomains:subdomains,attribution:'&copy; Google'}).addTo(map);

    // User location pin
    var meIcon = L.divIcon({className:'marker-me',iconSize:[16,16],iconAnchor:[8,8]});
    L.marker([${center.lat},${center.lng}],{icon:meIcon}).addTo(map)
      .bindPopup("<b style='color:#1a73e8'>Your Location</b><br/><small>${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}</small>");

    // Field asset markers
    var markerMap = {};
    var assetsData = ${assetsJson};
    assetsData.forEach(function(a){
      var cls = a.type==='INCIDENT'?'marker-incident':a.type==='DRONE'?'marker-drone':'marker-pulse';
      var icon = L.divIcon({className:cls,iconSize:[16,16],iconAnchor:[8,8]});
      var m = L.marker([a.lat,a.lng],{icon:icon}).addTo(map);
      m.bindPopup("<div class='custom-popup'><b style='color:#1a73e8'>"+a.label+"</b><br/><small style='color:#3c4043;font-weight:600'>"+a.status+"</small><br/><span style='font-size:11px;color:#5f6368'>"+a.details+"</span></div>");
      markerMap[a.id] = m;
    });

    // Listen for asset position updates from React Native (no page reload)
    var poiLayerGroup = L.layerGroup().addTo(map);

    function handleMsg(e){
      try{
        var msg = typeof e.data==='string'?JSON.parse(e.data):e.data;
        if(msg.type==='UPDATE_ASSETS'){
          msg.assets.forEach(function(a){
            if(markerMap[a.id]){markerMap[a.id].setLatLng([a.lat,a.lng]);}
          });
        }
        if(msg.type==='RECENTER'){
          map.setView([msg.lat,msg.lng],msg.zoom||15);
        }
        if(msg.type==='ADD_POI_MARKERS'){
          poiLayerGroup.clearLayers();
          var color = msg.color || '#1a73e8';
          (msg.pois||[]).forEach(function(p){
            if(!p.lat||!p.lng) return;
            var dot = L.circleMarker([p.lat,p.lng],{
              radius:7, color:'#fff', weight:2,
              fillColor:color, fillOpacity:0.95
            }).addTo(poiLayerGroup);
            dot.bindPopup("<div class='custom-popup'><b style='color:"+color+";font-size:12px;'>"+p.name+"</b><br/><small style='color:#5f6368'>"+msg.label+"</small></div>");
          });
        }
        if(msg.type==='CLEAR_POI_MARKERS'){
          poiLayerGroup.clearLayers();
        }
      }catch(err){}
    }
    window.addEventListener('message', handleMsg);
    document.addEventListener('message', handleMsg);
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LiveTacticalMap({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [activeMapStyle, setActiveMapStyle] = useState(MAP_STYLES[0]);
  // Default to Manila while GPS loads
  const [center, setCenter] = useState({ lat: 14.5995, lng: 120.9842 });
  const [zoom, setZoom] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<FieldAsset | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [assets, setAssets] = useState<FieldAsset[]>([]);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [radarCoords, setRadarCoords] = useState('Acquiring GPS...');
  const [gpsReady, setGpsReady] = useState(false);
  const [poiLoading, setPoiLoading] = useState(false);
  const webViewRef = useRef<any>(null);
  const gpsCenter = useRef({ lat: 14.5995, lng: 120.9842 });

  // --- Real GPS: request permission & center on actual device location ---
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setRadarCoords('GPS Permission Denied');
          setGpsReady(true);
          spawnAssets(14.5995, 120.9842);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = loc.coords;
        gpsCenter.current = { lat: latitude, lng: longitude };
        setCenter({ lat: latitude, lng: longitude });
        setRadarCoords(`${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`);
        spawnAssets(latitude, longitude);
        setGpsReady(true);
      } catch {
        setRadarCoords('GPS Unavailable');
        setGpsReady(true);
        spawnAssets(14.5995, 120.9842);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function spawnAssets(lat: number, lng: number) {
    const initial: FieldAsset[] = [
      { id: 'SQUAD-401', label: 'Patrol Car #401', type: 'PATROL', status: 'PATROLLING', lat: lat + 0.003, lng: lng + 0.002, details: 'Speed: 48 km/h • Battery: 92%' },
      { id: 'DRONE-OMEGA', label: 'Drone Omega', type: 'DRONE', status: 'RECORDING', lat: lat - 0.002, lng: lng + 0.004, details: 'Alt: 140m • Signal: 98% • 4K Live' },
      { id: 'OFFICER-SMITH', label: 'Officer J. Smith', type: 'OFFICER', status: 'FOOT PATROL', lat: lat + 0.001, lng: lng - 0.003, details: 'HR: 84 bpm • Temp: 36.8°C • Sector-4' },
      { id: 'INCIDENT-10-33', label: 'Incident #10-33', type: 'INCIDENT', status: 'DISPATCHED', lat: lat - 0.003, lng: lng - 0.002, details: 'Silent Alarm • Bank Branch' },
    ];
    setAssets(initial);
    setSelectedAsset(initial[0]);
  }

  // --- Asset movement via postMessage (no WebView reload = no stutter) ---
  useEffect(() => {
    if (!gpsReady || assets.length === 0) return;
    const timer = setInterval(() => {
      setAssets((prev) => {
        const updated = prev.map((a) => {
          if (a.type === 'PATROL' || a.type === 'DRONE') {
            return { ...a, lat: a.lat + (Math.random() - 0.5) * 0.0003, lng: a.lng + (Math.random() - 0.5) * 0.0003 };
          }
          return a;
        });
        // Send position-only update to the map — no reload
        const msg = JSON.stringify({ type: 'UPDATE_ASSETS', assets: updated });
        webViewRef.current?.postMessage?.(msg);
        if (Platform.OS === 'web') {
          try {
            const iframe = document.querySelector('iframe[title="Google Maps Tactical Radar"]') as HTMLIFrameElement;
            iframe?.contentWindow?.postMessage(msg, '*');
          } catch {}
        }
        return updated;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [gpsReady, assets.length]);

  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const found = assets.find((a) => a.label.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
    if (found) {
      setCenter({ lat: found.lat, lng: found.lng });
      setSelectedAsset(found);
      setZoom(17);
    }
  };

  const handleCategoryFilter = async (cat: typeof POI_CATEGORIES[0]) => {
    // Toggle off
    if (activeCategory === cat.id) {
      setActiveCategory(null);
      const msg = JSON.stringify({ type: 'CLEAR_POI_MARKERS' });
      webViewRef.current?.postMessage?.(msg);
      if (Platform.OS === 'web') {
        try { (document.querySelector('iframe[title="Google Maps Tactical Radar"]') as HTMLIFrameElement)?.contentWindow?.postMessage(msg, '*'); } catch {}
      }
      return;
    }
    setActiveCategory(cat.id);
    setPoiLoading(true);
    const c = gpsCenter.current;
    const pois = await fetchOverpassPOIs(c.lat, c.lng, cat.osmKey, cat.osmVal, 3000);
    setPoiLoading(false);
    const msg = JSON.stringify({ type: 'ADD_POI_MARKERS', pois, color: cat.color, label: cat.label });
    webViewRef.current?.postMessage?.(msg);
    if (Platform.OS === 'web') {
      try { (document.querySelector('iframe[title="Google Maps Tactical Radar"]') as HTMLIFrameElement)?.contentWindow?.postMessage(msg, '*'); } catch {}
    }
  };

  // Memoized HTML — only rebuilds when center/zoom/style change, NOT on every 4s asset tick
  const mapHtml = useMemo(
    () => buildMapHtml(center, zoom, activeMapStyle, assets),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [center.lat, center.lng, zoom, activeMapStyle.id]
  );

  const recenterToGps = () => {
    const c = gpsCenter.current;
    setCenter({ lat: c.lat, lng: c.lng });
  };

  return (
    <View style={styles.container}>
      {/* Header Controls Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.searchBox}>
          <Feather name="search" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search asset or location..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={14} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[styles.styleBtn, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
          onPress={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
        >
          <Feather name={activeMapStyle.icon as any} size={14} color={theme.primary} />
          <Text style={[styles.styleBtnText, { color: theme.primary }]}>{activeMapStyle.label}</Text>
          <Feather name={isStyleMenuOpen ? 'chevron-up' : 'chevron-down'} size={12} color={theme.textSecondary} />
        </Pressable>
      </View>

      {/* Map Style Dropdown */}
      {isStyleMenuOpen && (
        <View style={[styles.styleMenu, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {MAP_STYLES.map((style) => (
            <Pressable
              key={style.id}
              style={[styles.styleOption, activeMapStyle.id === style.id && { backgroundColor: theme.primaryGlow }]}
              onPress={() => { setActiveMapStyle(style); setIsStyleMenuOpen(false); }}
            >
              <Feather name={style.icon as any} size={14} color={activeMapStyle.id === style.id ? theme.primary : theme.textSecondary} />
              <Text style={[styles.styleOptionText, { color: activeMapStyle.id === style.id ? theme.primary : theme.text }]}>
                {style.label}
              </Text>
              {activeMapStyle.id === style.id && (
                <Feather name="check" size={12} color={theme.primary} style={{ marginLeft: 'auto' }} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* POI Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {POI_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const chipColor = cat.color;
          return (
            <Pressable
              key={cat.id}
              style={[styles.filterChip, {
                backgroundColor: isActive ? chipColor : theme.backgroundElement,
                borderColor: isActive ? chipColor : theme.border,
                opacity: poiLoading && !isActive ? 0.5 : 1,
              }]}
              onPress={() => handleCategoryFilter(cat)}
              disabled={poiLoading}
            >
              {poiLoading && isActive ? (
                <Feather name="loader" size={12} color={'#fff'} />
              ) : (
                <Feather name={cat.icon as any} size={12} color={isActive ? '#fff' : theme.textSecondary} />
              )}
              <Text style={[styles.filterChipText, { color: isActive ? '#fff' : theme.text }]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Map Surface */}
      <View style={[styles.mapContainer, { borderColor: theme.border }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore — iframe is web-only
          <iframe
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
            title="Google Maps Tactical Radar"
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={{ flex: 1, borderRadius: 8 }}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
          />
        )}

        {/* GPS Coords Badge */}
        <View style={styles.coordsOverlay}>
          <View style={[styles.statusDot, { backgroundColor: gpsReady ? '#1a73e8' : '#fbbc04' }]} />
          <Text style={[styles.coordsText, { color: '#ffffff' }]}>GPS: {radarCoords}</Text>
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <Pressable
            style={[styles.mapControlBtn, { backgroundColor: '#ffffff', borderColor: '#dadce0' }]}
            onPress={() => setZoom((z) => Math.min(z + 1, 20))}
          >
            <Feather name="plus" size={14} color="#3c4043" />
          </Pressable>
          <Pressable
            style={[styles.mapControlBtn, { backgroundColor: '#ffffff', borderColor: '#dadce0' }]}
            onPress={() => setZoom((z) => Math.max(z - 1, 8))}
          >
            <Feather name="minus" size={14} color="#3c4043" />
          </Pressable>
          <Pressable
            style={[styles.mapControlBtn, { backgroundColor: '#ffffff', borderColor: '#dadce0' }]}
            onPress={recenterToGps}
          >
            <Feather name="crosshair" size={14} color="#1a73e8" />
          </Pressable>
        </View>
      </View>

      {/* Monitored Assets */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>MONITORED FIELD ASSETS ({assets.length})</Text>
      <View style={styles.assetGrid}>
        {assets.map((asset) => {
          const isSelected = selectedAsset?.id === asset.id;
          return (
            <Pressable
              key={asset.id}
              style={[styles.assetCard, {
                backgroundColor: theme.backgroundElement,
                borderColor: isSelected ? theme.primary : theme.border,
              }]}
              onPress={() => {
                setSelectedAsset(asset);
                setCenter({ lat: asset.lat, lng: asset.lng });
              }}
            >
              <View style={styles.assetCardHeader}>
                <Text style={[styles.assetCardTitle, { color: theme.text }]}>{asset.label}</Text>
                <View style={[styles.assetBadge, {
                  backgroundColor: asset.type === 'INCIDENT' ? theme.danger + '20' : asset.type === 'DRONE' ? theme.warning + '20' : theme.primaryGlow,
                }]}>
                  <Text style={[styles.assetBadgeText, {
                    color: asset.type === 'INCIDENT' ? theme.danger : asset.type === 'DRONE' ? theme.warning : theme.primary,
                  }]}>{asset.status}</Text>
                </View>
              </View>
              <Text style={[styles.assetDetailsText, { color: theme.textSecondary }]}>{asset.details}</Text>
              <Text style={[styles.assetCoords, { color: theme.textSecondary }]}>
                {asset.lat.toFixed(4)}° N, {asset.lng.toFixed(4)}° E
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.two },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.two, borderRadius: 8, borderWidth: 1, marginBottom: Spacing.two },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, fontSize: 11, padding: 0 },
  styleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  styleBtnText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  styleMenu: { position: 'absolute', top: 52, right: 8, zIndex: 100, width: 170, borderRadius: 8, borderWidth: 1, padding: 4, elevation: 5 },
  styleOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  styleOptionText: { fontSize: 11, fontWeight: 'bold' },
  filterBar: { marginBottom: Spacing.two },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  filterChipText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  mapContainer: { height: 320, borderRadius: 8, borderWidth: 1, overflow: 'hidden', position: 'relative', marginBottom: Spacing.three },
  coordsOverlay: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.72)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  coordsText: { fontSize: 9, fontFamily: Fonts?.mono, fontWeight: 'bold' },
  mapControls: { position: 'absolute', top: 10, right: 10, gap: 6 },
  mapControlBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: Spacing.two },
  assetGrid: { gap: 8 },
  assetCard: { padding: Spacing.two, borderRadius: 8, borderWidth: 1 },
  assetCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  assetCardTitle: { fontSize: 11, fontWeight: 'bold' },
  assetBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  assetBadgeText: { fontSize: 8, fontWeight: 'bold' },
  assetDetailsText: { fontSize: 10, lineHeight: 14 },
  assetCoords: { fontSize: 9, fontFamily: Fonts?.mono, marginTop: 4 },
});
