import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants/theme';

interface Substance {
  id: string;
  name: string;
  alias: string[];
  appearance: string;
  effects: string;
  packaging: string;
  law: string;
}

export default function AntiDrugOps({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [activeSubTab, setActiveSubTab] = useState<'SCAN' | 'SUBSTANCES' | 'ASSESSMENT'>('SCAN');
  
  // SCAN state
  const [scanPercent, setScanPercent] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // SUBSTANCES state
  const [substances, setSubstances] = useState<Substance[]>([
    {
      id: 'd1',
      name: 'Methamphetamine HCl',
      alias: ['Shabu', 'Bato', 'Item'],
      appearance: 'White crystalline solid, odorless, bitter taste.',
      effects: 'Euphoria, wakefulness, paranoia, grinding teeth.',
      packaging: 'Heat-sealed transparent plastic sachets.',
      law: 'RA 9165 Art II Sec 5 (Sale), Sec 11 (Possession)',
    },
    {
      id: 'd2',
      name: 'Cannabis Sativa',
      alias: ['Marijuana', 'Weed', 'Ganja'],
      appearance: 'Dried leaves, flowering tops, fruity/skunky smell.',
      effects: 'Red eyes, dry mouth, impaired coordination.',
      packaging: 'Compressed bricks, foil wraps.',
      law: 'RA 9165 Art II Sec 11',
    },
    {
      id: 'd3',
      name: 'MDMA / Ecstasy',
      alias: ['E', 'X', 'Party Pill'],
      appearance: 'Colorful tablets/pills with logos (Tesla, Superman).',
      effects: 'Enhanced empathy, energy, teeth clenching.',
      packaging: 'Ziplock bags, loose pills.',
      law: 'RA 9165 Art II Sec 11',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // ASSESSMENT state
  const [checklist, setChecklist] = useState({
    possession: false,
    saleIntent: false,
    paraphernalia: false,
    witnessesPresent: false,
  });

  const performSubstanceScan = () => {
    setIsScanning(true);
    setScanPercent(0);
    setScanResult(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setScanPercent(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setScanResult('Methamphetamine HCl (Shabu) detected. Weight: 2.4g. Flag: RA 9165 Sec 11.');
      }
    }, 400);
  };

  const filteredSubstances = substances.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.alias.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.cardContainer}>
      {/* Sub Tabs */}
      <View style={styles.subTabContainer}>
        {['SCAN', 'SUBSTANCES', 'ASSESSMENT'].map((tab) => (
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

      {/* SCAN view */}
      {activeSubTab === 'SCAN' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>AI CHEMICAL SCANNER</Text>
          <View style={[styles.scannerBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Feather name="activity" size={48} color={theme.primary} />
            {isScanning ? (
              <View style={styles.scanningGroup}>
                <ActivityIndicator color={theme.primary} />
                <Text style={[styles.scannerText, { color: theme.text }]}>Scanning substance spectrometer... {scanPercent}%</Text>
              </View>
            ) : (
              <Text style={[styles.scannerText, { color: theme.textSecondary }]}>
                Hold scan nozzle near substance and initialize chemical lookup.
              </Text>
            )}

            {scanResult && (
              <View style={[styles.resultCard, { borderColor: theme.danger }]}>
                <Text style={[styles.resultTitle, { color: theme.danger }]}>🚨 FLAGGED POSITIVE</Text>
                <Text style={[styles.resultText, { color: theme.text }]}>{scanResult}</Text>
              </View>
            )}
          </View>

          {!isScanning && (
            <Pressable style={[styles.scanBtn, { backgroundColor: theme.primary }]} onPress={performSubstanceScan}>
              <Text style={styles.scanBtnText}>INITIALIZE SCANNER</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* SUBSTANCES view */}
      {activeSubTab === 'SUBSTANCES' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>DRUG INDEX & RA 9165 LAW REFERENCE</Text>
          <TextInput
            placeholder="Search substance index (e.g. Shabu, Weed)"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView style={styles.substanceScroll} showsVerticalScrollIndicator={false}>
            {filteredSubstances.map((sub) => (
              <View key={sub.id} style={[styles.subCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Text style={[styles.subName, { color: theme.text }]}>{sub.name}</Text>
                <Text style={[styles.subAliases, { color: theme.primary }]}>ALIASES: {sub.alias.join(', ')}</Text>
                <View style={styles.opDivider} />
                <Text style={[styles.subDetail, { color: theme.text }]}>APPEARANCE: {sub.appearance}</Text>
                <Text style={[styles.subDetail, { color: theme.text }]}>EFFECTS: {sub.effects}</Text>
                <Text style={[styles.subDetail, { color: theme.text }]}>PACKAGING: {sub.packaging}</Text>
                <Text style={[styles.subLaw, { color: theme.warning }]}>LAW SECTION: {sub.law}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ASSESSMENT view */}
      {activeSubTab === 'ASSESSMENT' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>RAID SCENE ASSESSMENT PROTOCOLS</Text>
          <View style={styles.checklist}>
            <Pressable
              style={styles.checkRow}
              onPress={() => setChecklist({ ...checklist, possession: !checklist.possession })}
            >
              <View style={[styles.checkbox, { borderColor: theme.textSecondary }, checklist.possession && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {checklist.possession && <Feather name="check" size={10} color="#ffffff" />}
              </View>
              <Text style={[styles.checkLabel, { color: theme.text }]}>Drugs actively recovered from subject's possession</Text>
            </Pressable>

            <Pressable
              style={styles.checkRow}
              onPress={() => setChecklist({ ...checklist, saleIntent: !checklist.saleIntent })}
            >
              <View style={[styles.checkbox, { borderColor: theme.textSecondary }, checklist.saleIntent && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {checklist.saleIntent && <Feather name="check" size={10} color="#ffffff" />}
              </View>
              <Text style={[styles.checkLabel, { color: theme.text }]}>Weighing scale / small packing bags present (Intent to Sell)</Text>
            </Pressable>

            <Pressable
              style={styles.checkRow}
              onPress={() => setChecklist({ ...checklist, paraphernalia: !checklist.paraphernalia })}
            >
              <View style={[styles.checkbox, { borderColor: theme.textSecondary }, checklist.paraphernalia && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {checklist.paraphernalia && <Feather name="check" size={10} color="#ffffff" />}
              </View>
              <Text style={[styles.checkLabel, { color: theme.text }]}>Inhalation tubes / lighters present (Paraphernalia)</Text>
            </Pressable>

            <Pressable
              style={styles.checkRow}
              onPress={() => setChecklist({ ...checklist, witnessesPresent: !checklist.witnessesPresent })}
            >
              <View style={[styles.checkbox, { borderColor: theme.textSecondary }, checklist.witnessesPresent && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {checklist.witnessesPresent && <Feather name="check" size={10} color="#ffffff" />}
              </View>
              <Text style={[styles.checkLabel, { color: theme.text }]}>Legal media / DOJ / barangay representative present</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.assessBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              if (checklist.possession && checklist.witnessesPresent) {
                Alert.alert('🛡️ ASSESSMENT', 'Protocol criteria matches POSSESSION with SECURED custody CHAIN.');
              } else {
                Alert.alert('⚠️ WARNING', 'Ensure representative witnesses are present to complete chains of custody under RA 9165 Sec 21.');
              }
            }}
          >
            <Text style={styles.assessBtnText}>EVALUATE PROTOCOL</Text>
          </Pressable>
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing.two,
  },
  scannerBox: {
    height: 180,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  scanningGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.two,
  },
  scannerText: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: Spacing.two,
    marginTop: Spacing.two,
    width: '100%',
  },
  resultTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  resultText: {
    fontSize: 10,
    marginTop: 2,
  },
  scanBtn: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    height: 40,
    fontSize: 11.5,
    marginBottom: Spacing.three,
  },
  substanceScroll: {
    maxHeight: 250,
  },
  subCard: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  subName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  subAliases: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  opDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  subDetail: {
    fontSize: 10,
    marginVertical: 1.5,
  },
  subLaw: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 6,
  },
  checklist: {
    gap: Spacing.two,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderRadius: 3,
    marginRight: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    fontSize: 11,
    flex: 1,
  },
  assessBtn: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  assessBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
