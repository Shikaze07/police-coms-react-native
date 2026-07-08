import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Fonts } from '../../../constants/theme';

export default function LiveTacticalMap({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [mapGridCoords, setMapGridCoords] = useState('25.1972° N, 55.2744° E');

  const assets = [
    { id: 'SQUAD-401', label: 'Unit 401 (Patrol Car)', status: 'PATROLLING', details: 'Speed: 45 km/h • Battery: 92%' },
    { id: 'DRONE-OMEGA', label: 'Drone Omega (Aerial)', status: 'RECORDING', details: 'Alt: 120m • Signal: HIGH' },
    { id: 'TAC-OFFICER-12', label: 'Officer J. Smith (Field)', status: 'FOOT PATROL', details: 'HR: 82 bpm • Temp: 36.8°C' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      const lat = 25.1972 + (Math.random() - 0.5) * 0.002;
      const lng = 55.2744 + (Math.random() - 0.5) * 0.002;
      setMapGridCoords(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>LIVE TACTICAL RADAR</Text>

      {/* Radar Map Graphic Grid */}
      <View style={[styles.radarMap, { backgroundColor: isDark ? '#08120d' : '#e8f5e9', borderColor: theme.border }]}>
        {/* Glowing Radar Circle grid */}
        <View style={[styles.radarCircle, { borderColor: theme.success + '30', width: 220, height: 220, borderRadius: 110 }]} />
        <View style={[styles.radarCircle, { borderColor: theme.success + '30', width: 140, height: 140, borderRadius: 70 }]} />
        <View style={[styles.radarCircle, { borderColor: theme.success + '40', width: 60, height: 60, borderRadius: 30 }]} />

        {/* Sweep arm mock */}
        <View style={[styles.radarSweep, { backgroundColor: theme.success + '15' }]} />

        {/* Sector coordinates indicator overlay */}
        <View style={styles.radarCoordsPanel}>
          <Text style={[styles.radarCoordsText, { color: theme.success, fontFamily: Fonts?.mono }]}>
            CENTER COORDS: {mapGridCoords}
          </Text>
        </View>

        {/* Pulsing GPS Points */}
        <View style={[styles.radarDot, { left: '35%', top: '40%', backgroundColor: theme.success }]} />
        <View style={[styles.radarDot, { left: '60%', top: '25%', backgroundColor: theme.success }]} />
        <View style={[styles.radarDot, { left: '48%', top: '65%', backgroundColor: theme.warning }]} />
      </View>

      {/* Active Field Assets list */}
      <Text style={[styles.innerSectionTitle, { color: theme.text }]}>MONITORED FIELD ASSETS</Text>
      <View style={styles.assetList}>
        {assets.map((asset) => (
          <View key={asset.id} style={[styles.assetRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.assetHeader}>
              <Text style={[styles.assetName, { color: theme.text }]}>{asset.id}</Text>
              <View style={[styles.assetStatus, { backgroundColor: theme.primaryGlow }]}>
                <Text style={[styles.assetStatusText, { color: theme.primary }]}>{asset.status}</Text>
              </View>
            </View>
            <Text style={[styles.assetDetails, { color: theme.textSecondary }]}>{asset.details}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  innerSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  radarMap: {
    height: 240,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircle: {
    position: 'absolute',
    borderWidth: 1,
  },
  radarSweep: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderTopLeftRadius: 250,
    transform: [{ rotate: '45deg' }],
  },
  radarDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    boxShadow: '0px 0px 2px rgba(0,0,0,0.8)',
  },
  radarCoordsPanel: {
    position: 'absolute',
    bottom: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  radarCoordsText: {
    fontSize: 8.5,
  },
  assetList: {
    gap: Spacing.two,
  },
  assetRow: {
    padding: Spacing.two,
    borderRadius: 6,
    borderWidth: 1,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetName: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  assetStatus: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  assetStatusText: {
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  assetDetails: {
    fontSize: 9.5,
    marginTop: 2,
  },
});
