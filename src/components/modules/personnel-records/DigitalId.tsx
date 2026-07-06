import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts } from '../../../constants/theme';

export default function DigitalId({ theme, isDark }: { theme: any; isDark: boolean }) {
  const router = useRouter();
  const [showSummary, setShowSummary] = useState(false);

  const officer = {
    name: "Officer Marcus Ross",
    rank: "Tactical Specialist",
    badge: "PCT-7419",
    assignment: "Tactical Response Unit - Zone 01",
    dob: "1988-05-12",
    address: "123 Sovereign Way, Sector 7",
    unit: "TRU-01",
    bloodType: "O+",
    allergies: "None",
  };

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>SECURE LOG CREDENTIALS</Text>

      {/* Main Grid Equivalent Layout */}
      <View style={styles.grid}>
        {/* ID Card Display */}
        <View style={[styles.badgeCard, { backgroundColor: isDark ? '#0b0f19' : '#f1f5f9', borderColor: theme.border }]}>
          <View style={styles.badgeSecureBadge}>
            <Text style={[styles.secureText, { color: theme.primary }]}>SECURE</Text>
          </View>

          <View style={styles.badgeBody}>
            <View style={[styles.badgePhotoContainer, { backgroundColor: isDark ? '#1a2035' : '#e2e8f0', borderColor: theme.border }]}>
              <Feather name="user" size={44} color={theme.textSecondary} />
            </View>

            <View style={styles.badgeDetails}>
              <Text style={[styles.officerName, { color: theme.text }]}>{officer.name.toUpperCase()}</Text>
              <Text style={[styles.officerRank, { color: theme.primary }]}>{officer.rank.toUpperCase()}</Text>
              <Text style={[styles.badgeValue, { color: theme.textSecondary, fontFamily: Fonts?.mono }]}>Badge: {officer.badge}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.metadataList}>
            <Text style={[styles.metaText, { color: theme.text }]}>
              <Text style={styles.metaLabel}>ASSIGNMENT: </Text>{officer.assignment}
            </Text>
            <Text style={[styles.metaText, { color: theme.text }]}>
              <Text style={styles.metaLabel}>UNIT: </Text>{officer.unit}
            </Text>
            <Text style={[styles.metaText, { color: theme.text }]}>
              <Text style={styles.metaLabel}>DOB: </Text>{officer.dob}
            </Text>
            <Text style={[styles.metaText, { color: theme.text }]}>
              <Text style={styles.metaLabel}>ADDRESS: </Text>{officer.address}
            </Text>
          </View>
        </View>

        {/* Quick Access Grid */}
        <View style={styles.quickAccessGrid}>
          <Pressable
            style={[styles.quickAccessCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => handleNavigate('/module/digital-wallet')}
          >
            <Feather name="credit-card" size={24} color={theme.success} />
            <Text style={[styles.quickAccessText, { color: theme.text }]}>DIGITAL WALLET</Text>
          </Pressable>

          <Pressable
            style={[styles.quickAccessCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => handleNavigate('/module/fitness')}
          >
            <Feather name="heart" size={24} color={theme.danger} />
            <Text style={[styles.quickAccessText, { color: theme.text }]}>HEALTH / FITNESS</Text>
          </Pressable>

          <Pressable
            style={[styles.quickAccessCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => handleNavigate('/module/copnet')}
          >
            <Feather name="share-2" size={24} color={theme.primary} />
            <Text style={[styles.quickAccessText, { color: theme.text }]}>COPNET NETWORK</Text>
          </Pressable>

          <Pressable
            style={[styles.quickAccessCard, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
            onPress={() => setShowSummary(true)}
          >
            <Feather name="file-text" size={24} color={theme.warning} />
            <Text style={[styles.quickAccessText, { color: theme.text }]}>DOSSIER SUMMARY</Text>
          </Pressable>
        </View>
      </View>

      {/* Summary Overlay Modal */}
      <Modal
        visible={showSummary}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>SUMMARY OF INFORMATION</Text>
              <Pressable onPress={() => setShowSummary(false)}>
                <Feather name="x" size={18} color={theme.text} />
              </Pressable>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.primary }]}>Schooling:</Text>
                <Text style={[styles.summaryText, { color: theme.text }]}>
                  Police Academy (Tactical Ops Master), University of Law (Forensics)
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.primary }]}>Awards:</Text>
                <Text style={[styles.summaryText, { color: theme.text }]}>
                  Medal of Valor, Outstanding Tactical Response (2024)
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.primary }]}>Past Assignments:</Text>
                <Text style={[styles.summaryText, { color: theme.text }]}>
                  Zone 04 (Counter-Terrorism), Zone 02 (Patrol Command)
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.primary }]}>Certifications:</Text>
                <Text style={[styles.summaryText, { color: theme.text }]}>
                  Advanced Forensic Analysis, First Aid Response Level 3
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  grid: {
    gap: Spacing.three,
  },
  badgeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    position: 'relative',
  },
  badgeSecureBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  secureText: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  badgeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  badgePhotoContainer: {
    width: 64,
    height: 72,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDetails: {
    flex: 1,
  },
  officerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  officerRank: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 2,
  },
  badgeValue: {
    fontSize: 9,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  metadataList: {
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  metaLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  quickAccessCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  quickAccessText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '75%',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalScroll: {
    marginTop: Spacing.one,
  },
  summaryRow: {
    marginBottom: Spacing.two,
  },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 15,
  },
});
