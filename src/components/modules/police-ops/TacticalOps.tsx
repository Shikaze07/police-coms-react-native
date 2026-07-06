import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Fonts } from '../../../constants/theme';

interface Operative {
  id: string;
  callsign: string;
  role: 'TL' | 'BREACH' | 'SNIPER' | 'MEDIC';
  status: 'READY' | 'DEPLOYED' | 'ENGAGED';
  primary: string;
  secondary: string;
  armor: string;
}

export default function TacticalOps({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [activeSubTab, setActiveSubTab] = useState<'ROSTER' | 'OPLAN' | 'GEAR'>('ROSTER');
  const [oplanText, setOplanText] = useState(`OPLAN: "IRON CLAD"
--------------------------------------------------
1. SITUATION:
   a. Enemy Forces: 4-6 Armed Hostiles confirmed inside Target Building A.
   b. Friendly Forces: SAF Assault Team Alpha, SWAT Perimeter.

2. MISSION:
   Conduct high-risk warrant service and neutralize threat at Sector-4.
   Secure High Value Target (HVT) "Alias Cobra".

3. EXECUTION:
   a. Concept: Stealth approach via rear alley. Explosive breach on Door 2.
   b. Phase 1: Isolation. Phase 2: Breach. Phase 3: Secure HVT.`);

  const [roster, setRoster] = useState<Operative[]>([
    { id: 'op1', callsign: 'ALPHA 1 (TL)', role: 'TL', status: 'READY', primary: 'HK416', secondary: 'Glock 19', armor: 'Lvl IV' },
    { id: 'op2', callsign: 'BRAVO 2 (BREACH)', role: 'BREACH', status: 'READY', primary: 'Mossberg 590', secondary: 'Glock 19', armor: 'Lvl IV' },
    { id: 'op3', callsign: 'CHARLIE 3 (DMR)', role: 'SNIPER', status: 'READY', primary: 'SR-25', secondary: 'Sig P320', armor: 'Lvl IIIA' },
    { id: 'op4', callsign: 'DELTA 4 (MED)', role: 'MEDIC', status: 'READY', primary: 'MP5', secondary: 'Glock 19', armor: 'Lvl IV' },
  ]);

  const deployRoster = () => {
    setRoster(roster.map(op => ({ ...op, status: 'DEPLOYED' })));
    Alert.alert('🛡️ DEPLOYMENT DIRECTIVE', 'SWAT Assault Elements deployed on tactical grid. Live status links initiated.');
  };

  const standDownRoster = () => {
    setRoster(roster.map(op => ({ ...op, status: 'READY' })));
  };

  return (
    <View style={styles.cardContainer}>
      {/* Sub Tabs */}
      <View style={styles.subTabContainer}>
        {['ROSTER', 'OPLAN', 'GEAR'].map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.subTab,
              { backgroundColor: theme.backgroundElement },
              activeSubTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveSubTab(tab as any)}
          >
            <Text style={[styles.subTabLabel, { color: theme.text }, activeSubTab === tab && { color: theme.primary }]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Roster tab */}
      {activeSubTab === 'ROSTER' && (
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>SAF ASSAULT ELEMENT</Text>
            <Pressable style={[styles.deployBtn, { backgroundColor: theme.danger }]} onPress={deployRoster}>
              <Text style={styles.deployBtnText}>DEPLOY SQUAD</Text>
            </Pressable>
          </View>

          <View style={styles.rosterGrid}>
            {roster.map((op) => (
              <View key={op.id} style={[styles.opCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.opHeader}>
                  <Text style={[styles.opCallsign, { color: theme.text }]}>{op.callsign}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: op.status === 'READY' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 77, 77, 0.15)' }]}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: op.status === 'READY' ? theme.success : theme.danger }}>
                      {op.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.opDivider} />

                <Text style={[styles.opDetails, { color: theme.textSecondary }]}>ROLE: {op.role}</Text>
                <Text style={[styles.opDetails, { color: theme.textSecondary }]}>PRIMARY: {op.primary}</Text>
                <Text style={[styles.opDetails, { color: theme.textSecondary }]}>ARMOR: {op.armor}</Text>

                <View style={styles.opVitals}>
                  <Feather name="activity" size={12} color={theme.success} />
                  <Text style={[styles.vitalsText, { color: theme.success, fontFamily: Fonts?.mono }]}>HR: 68 bpm | SpO2: 99%</Text>
                </View>
              </View>
            ))}
          </View>

          {roster[0].status === 'DEPLOYED' && (
            <Pressable style={[styles.standDownBtn, { borderColor: theme.border }]} onPress={standDownRoster}>
              <Text style={[styles.standDownBtnText, { color: theme.text }]}>RECALL / STAND DOWN SQUAD</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* OPLAN tab */}
      {activeSubTab === 'OPLAN' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>CONFIDENTIAL OPLAN TEMPLATE</Text>
          <TextInput
            multiline
            numberOfLines={10}
            style={[styles.oplanInput, { color: theme.text, backgroundColor: isDark ? '#06070a' : '#eceff1', borderColor: theme.border }]}
            value={oplanText}
            onChangeText={setOplanText}
          />
          <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={() => Alert.alert('✓ SAVED', 'OPLAN saved to encrypted directory.')}>
            <Feather name="save" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>COMMIT CHANGES</Text>
          </Pressable>
        </View>
      )}

      {/* GEAR tab */}
      {activeSubTab === 'GEAR' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>WEAPONS & ARMOR INVENTORY</Text>
          <View style={[styles.gearBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.gearRow}>
              <Text style={[styles.gearLabel, { color: theme.text }]}>Primary Carbine (HK416)</Text>
              <Text style={[styles.gearValue, { color: theme.success }]}>12 AVAILABLE</Text>
            </View>
            <View style={styles.opDivider} />
            <View style={styles.gearRow}>
              <Text style={[styles.gearLabel, { color: theme.text }]}>Breaching Shotgun (Mossberg)</Text>
              <Text style={[styles.gearValue, { color: theme.success }]}>4 AVAILABLE</Text>
            </View>
            <View style={styles.opDivider} />
            <View style={styles.gearRow}>
              <Text style={[styles.gearLabel, { color: theme.text }]}>Ceramic Plates (Lvl IV Armor)</Text>
              <Text style={[styles.gearValue, { color: theme.warning }]}>2 LOWSTOCK</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
  },
  subTabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  subTab: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  section: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  deployBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deployBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rosterGrid: {
    gap: Spacing.two,
  },
  opCard: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
  opHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opCallsign: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  opDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  opDetails: {
    fontSize: 10,
    marginVertical: 1,
  },
  opVitals: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  vitalsText: {
    fontSize: 9,
    marginLeft: 6,
  },
  standDownBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  standDownBtnText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  oplanInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    fontFamily: 'monospace',
    fontSize: 11,
    height: 180,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: Spacing.two,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  gearBox: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
  gearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gearLabel: {
    fontSize: 11.5,
  },
  gearValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
