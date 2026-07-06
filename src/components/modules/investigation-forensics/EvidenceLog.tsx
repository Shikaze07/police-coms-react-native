import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Fonts } from '../../../constants/theme';

interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  custodyOf: string;
  status: 'LOCKED' | 'CHECKED_OUT';
}

export default function EvidenceLog({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([
    { id: 'EV-8941', name: '.38 Smith & Wesson Revolver', type: 'WEAPON', custodyOf: 'Sgt. M. Ross', status: 'LOCKED' },
    { id: 'EV-3022', name: 'Ziplock containing 2.4g crystalline powder', type: 'NARCOTICS', custodyOf: 'Officer J. Smith', status: 'LOCKED' },
    { id: 'EV-5942', name: 'Vios Car Keys (Plate ABC-1234)', type: 'VEHICLE_KEYS', custodyOf: 'Sgt. M. Ross', status: 'CHECKED_OUT' },
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('WEAPON');

  const addEvidence = () => {
    if (!newItemName.trim()) return;
    const newEv: EvidenceItem = {
      id: `EV-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newItemName.trim(),
      type: newItemType,
      custodyOf: 'Officer M. Ross',
      status: 'LOCKED',
    };
    setEvidenceList([newEv, ...evidenceList]);
    setNewItemName('');
    Alert.alert('✓ LOGGED', 'Evidence registered. Chain of custody initialized.');
  };

  const toggleStatus = (id: string) => {
    setEvidenceList(evidenceList.map(ev => {
      if (ev.id === id) {
        const nextStatus = ev.status === 'LOCKED' ? 'CHECKED_OUT' : 'LOCKED';
        Alert.alert(
          '🔄 CUSTODY UPDATE',
          `Evidence ${ev.id} status changed to ${nextStatus.replace('_', ' ')}.`
        );
        return { ...ev, status: nextStatus };
      }
      return ev;
    }));
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>SECURE LOG REGISTRY</Text>
      
      {/* Form block */}
      <View style={[styles.form, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <TextInput
          placeholder="Evidence item descriptor..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <View style={styles.typeSelector}>
          {['WEAPON', 'NARCOTICS', 'DOCUMENT'].map((type) => (
            <Pressable
              key={type}
              style={[
                styles.typeBtn,
                { backgroundColor: theme.backgroundSelected },
                newItemType === type && { backgroundColor: theme.primaryGlow, borderColor: theme.primary, borderWidth: 1 }
              ]}
              onPress={() => setNewItemType(type)}
            >
              <Text style={{ fontSize: 9, color: newItemType === type ? theme.primary : theme.text, fontWeight: 'bold' }}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={addEvidence}>
          <Text style={styles.submitBtnText}>INITIALIZE LOCKER REGISTRY</Text>
        </Pressable>
      </View>

      {/* Roster list */}
      <Text style={[styles.innerSectionTitle, { color: theme.text }]}>SECURE EVIDENCE LOCKERS</Text>
      <ScrollView style={styles.listBlock} showsVerticalScrollIndicator={false}>
        {evidenceList.map((item) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemId, { color: theme.primary, fontFamily: Fonts?.mono }]}>{item.id}</Text>
              <Pressable
                style={[styles.statusBadge, { backgroundColor: item.status === 'LOCKED' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 159, 67, 0.15)' }]}
                onPress={() => toggleStatus(item.id)}
              >
                <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: item.status === 'LOCKED' ? theme.success : theme.warning }}>
                  {item.status.replace('_', ' ')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.opDivider} />
            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>CUSTODY: {item.custodyOf}</Text>
          </View>
        ))}
      </ScrollView>
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
  form: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    fontSize: 11.5,
    height: 40,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  listBlock: {
    maxHeight: 250,
  },
  itemCard: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemId: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  opDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemMeta: {
    fontSize: 9.5,
    marginTop: 2,
  },
});
