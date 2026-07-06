import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants/theme';

export default function EsaadCard({ theme }: { theme: any; isDark: boolean }) {
  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>OPERATIONAL LOGS</Text>
      <View style={[styles.consoleContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.consoleLine, { color: theme.text }]}>[13:10:01] Loaded nodes for ESAAD Card...</Text>
        <Text style={[styles.consoleLine, { color: theme.text }]}>[13:10:02] Connected successfully to HQ link.</Text>
        <Text style={[styles.consoleLine, { color: theme.primary }]}>[13:10:03] State: IDLE & MONITORING.</Text>
      </View>

      
      <Text style={[styles.sectionTitle, { color: theme.text }]}>TRANS-LINK LOGS</Text>
      <View style={[styles.box, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>CREDIT ALLOCATION</Text>
          <Text style={[styles.val, { color: theme.success }]}>$4,890.00 / SECURED</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>ACTIVE REQUISITIONS</Text>
          <Text style={[styles.val, { color: theme.text }]}>3 Pending Admin</Text>
        </View>
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  consoleContainer: {
    borderRadius: 6,
    borderWidth: 1,
    padding: Spacing.two,
  },
  consoleLine: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    lineHeight: 14,
  },
  box: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  val: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
});
