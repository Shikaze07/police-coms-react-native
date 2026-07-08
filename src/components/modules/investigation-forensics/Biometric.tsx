import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Fonts } from '../../../constants/theme';

export default function Biometric({ theme }: { theme: any; isDark: boolean }) {
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'FINISHED'>('IDLE');
  const [scanPercent, setScanPercent] = useState(0);

  const startScan = () => {
    setScanState('SCANNING');
    setScanPercent(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanPercent(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setScanState('FINISHED');
      }
    }, 250);
  };

  const resetScan = () => {
    setScanState('IDLE');
    setScanPercent(0);
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>BIOMETRIC PROFILE SEEKER</Text>

      {/* Scanner Visual Container */}
      <View style={[styles.scannerView, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {scanState === 'SCANNING' && (
          <View style={[styles.scannerLaser, { backgroundColor: theme.primary }]} />
        )}

        <Feather
          name="pocket"
          size={84}
          color={scanState === 'SCANNING' ? theme.primary : scanState === 'FINISHED' ? theme.success : theme.textSecondary}
          style={styles.fingerprintIcon}
        />

        {scanState === 'SCANNING' && (
          <Text style={[styles.scannerStatusText, { color: theme.primary, fontFamily: Fonts?.mono }]}>
            SCANNING IRIS & PRINT // {scanPercent}%
          </Text>
        )}

        {scanState === 'IDLE' && (
          <Text style={[styles.scannerStatusText, { color: theme.textSecondary }]}>
            PLACE SCANNER NEAR SUBJECT & INITIALIZE
          </Text>
        )}

        {scanState === 'FINISHED' && (
          <View style={styles.scanResults}>
            <Text style={[styles.resultsTitle, { color: theme.success }]}>✓ MATCH IDENTIFIED</Text>
            <Text style={[styles.resultsLabel, { color: theme.text }]}>NAME: JONATHAN D. ALLEY</Text>
            <Text style={[styles.resultsLabel, { color: theme.text }]}>DOB: 1989-11-23 // AGE: 36</Text>
            <Text style={[styles.resultsLabel, { color: theme.text }]}>WARRANT INDEX: OUTSTANDING (FELONY)</Text>
            <Text style={[styles.resultsLabel, { color: theme.danger, fontWeight: 'bold' }]}>THREAT INDEX: HIGH (ARMED & DANGEROUS)</Text>
          </View>
        )}
      </View>

      {/* Scanner Buttons */}
      {scanState === 'IDLE' && (
        <Pressable style={[styles.scanActionBtn, { backgroundColor: theme.primary }]} onPress={startScan}>
          <Feather name="pocket" size={18} color="#ffffff" style={{ marginRight: Spacing.one }} />
          <Text style={styles.scanActionBtnText}>INITIALIZE BIOMETRIC SCAN</Text>
        </Pressable>
      )}

      {scanState === 'SCANNING' && (
        <View style={[styles.scanActionBtn, { backgroundColor: theme.backgroundSelected, borderStyle: 'dashed', borderWidth: 1 }]}>
          <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: Spacing.one }} />
          <Text style={[styles.scanActionBtnText, { color: theme.primary }]}>SEARCHING CRIMINAL REGISTRY...</Text>
        </View>
      )}

      {scanState === 'FINISHED' && (
        <Pressable style={[styles.scanActionBtn, { backgroundColor: theme.danger }]} onPress={resetScan}>
          <Feather name="refresh-cw" size={18} color="#ffffff" style={{ marginRight: Spacing.one }} />
          <Text style={styles.scanActionBtnText}>CLEAR SCANNER</Text>
        </Pressable>
      )}
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
  scannerView: {
    height: 220,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: Spacing.three,
  },
  scannerLaser: {
    position: 'absolute',
    width: '100%',
    height: 3,
    top: '30%',
    boxShadow: '0px 0px 4px rgba(255,255,255,0.9)',
  },
  fingerprintIcon: {
    marginBottom: Spacing.three,
  },
  scannerStatusText: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scanResults: {
    width: '100%',
    alignItems: 'flex-start',
  },
  resultsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  resultsLabel: {
    fontSize: 10.5,
    marginVertical: 1.5,
  },
  scanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 6,
    marginTop: Spacing.three,
  },
  scanActionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11.5,
  },
});
