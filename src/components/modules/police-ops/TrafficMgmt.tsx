import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants/theme';

interface Violation {
  code: string;
  type: string;
  amount: number;
}

export default function TrafficMgmt({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [activeSubTab, setActiveSubTab] = useState<'SCAN' | 'TICKET' | 'ACCIDENT'>('SCAN');
  
  // SCAN state
  const [searchPlate, setSearchPlate] = useState('');
  const [scanResult, setScanResult] = useState<{ plate: string; status: string; make: string; owner: string } | null>(null);

  // TICKET state
  const [ticketData, setTicketData] = useState({
    driverName: '',
    licenseNo: '',
    plateNo: '',
    location: '',
  });
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);

  const violations: Violation[] = [
    { code: '001', type: 'Disregarding Traffic Sign', amount: 1500 },
    { code: '002', type: 'Obstruction', amount: 500 },
    { code: '003', type: 'Driving without Helmet', amount: 1500 },
    { code: '004', type: 'Illegal Parking', amount: 1000 },
    { code: '006', type: 'Reckless Driving', amount: 2000 },
  ];

  // ACCIDENT state
  const [accidentData, setAccidentData] = useState({
    location: '',
    weather: 'Clear',
    vehiclesInvolved: '',
    narrative: '',
  });

  const performPlateSearch = () => {
    if (!searchPlate.trim()) return;
    const plate = searchPlate.trim().toUpperCase();
    if (plate === 'ABC-1234' || plate === 'XYZ-9988' || plate === 'NTA-1029') {
      setScanResult({
        plate,
        status: plate === 'ABC-1234' ? 'WANTED / STOLEN' : 'UNREGISTERED',
        make: plate === 'ABC-1234' ? 'Toyota Vios (Silver)' : 'Honda Click (Orange)',
        owner: plate === 'ABC-1234' ? 'John Doe' : 'Jane Smith',
      });
    } else {
      setScanResult({
        plate,
        status: 'CLEAR',
        make: 'Unknown Vehicle',
        owner: 'No active flag',
      });
    }
  };

  const toggleViolation = (code: string) => {
    if (selectedViolations.includes(code)) {
      setSelectedViolations(selectedViolations.filter(c => c !== code));
    } else {
      setSelectedViolations([...selectedViolations, code]);
    }
  };

  const submitTicket = () => {
    if (!ticketData.driverName || !ticketData.licenseNo) {
      Alert.alert('⚠️ ERROR', 'Driver Name and License Number are required.');
      return;
    }
    const totalAmount = selectedViolations.reduce((acc, code) => {
      const v = violations.find(vi => vi.code === code);
      return acc + (v ? v.amount : 0);
    }, 0);

    Alert.alert(
      '✓ CITATION GENERATED',
      `Ticket Number: UOVR-${Math.floor(100000 + Math.random() * 900000)}\nDriver: ${ticketData.driverName}\nTotal Fine: $${totalAmount}`,
      [{ text: 'OK', onPress: () => {
        setTicketData({ driverName: '', licenseNo: '', plateNo: '', location: '' });
        setSelectedViolations([]);
      }}]
    );
  };

  const submitAccident = () => {
    if (!accidentData.location || !accidentData.vehiclesInvolved) {
      Alert.alert('⚠️ ERROR', 'Location and Vehicles Involved are required.');
      return;
    }
    Alert.alert(
      '✓ RECORDED',
      `Accident log registered successfully under ID TAIR-${Date.now().toString().slice(-6)}`,
      [{ text: 'OK', onPress: () => {
        setAccidentData({ location: '', weather: 'Clear', vehiclesInvolved: '', narrative: '' });
      }}]
    );
  };

  return (
    <View style={styles.cardContainer}>
      {/* Sub Tabs */}
      <View style={styles.subTabContainer}>
        {['SCAN', 'TICKET', 'ACCIDENT'].map((tab) => (
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>ALPR SEARCH / HOTLIST LOOKUP</Text>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Enter License Plate (e.g. ABC-1234)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={searchPlate}
              onChangeText={setSearchPlate}
              autoCapitalize="characters"
            />
            <Pressable style={[styles.searchBtn, { backgroundColor: theme.primary }]} onPress={performPlateSearch}>
              <Feather name="search" size={16} color="#ffffff" />
            </Pressable>
          </View>

          {scanResult && (
            <View style={[styles.resultCard, { backgroundColor: theme.backgroundElement, borderColor: scanResult.status === 'CLEAR' ? theme.success : theme.danger }]}>
              <Text style={[styles.resultPlate, { color: theme.text }]}>PLATE: {scanResult.plate}</Text>
              <Text style={[styles.resultStatus, { color: scanResult.status === 'CLEAR' ? theme.success : theme.danger }]}>
                STATUS: {scanResult.status}
              </Text>
              <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>MAKE: {scanResult.make}</Text>
              <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>OWNER: {scanResult.owner}</Text>
            </View>
          )}
        </View>
      )}

      {/* TICKET view */}
      {activeSubTab === 'TICKET' && (
        <ScrollView style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>UOVR CITATION REGISTRY</Text>
          <View style={styles.formGroup}>
            <TextInput
              placeholder="Driver Last Name, First Name"
              placeholderTextColor={theme.textSecondary}
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={ticketData.driverName}
              onChangeText={(text) => setTicketData({ ...ticketData, driverName: text })}
            />
            <TextInput
              placeholder="Driver License Number"
              placeholderTextColor={theme.textSecondary}
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={ticketData.licenseNo}
              onChangeText={(text) => setTicketData({ ...ticketData, licenseNo: text })}
            />
            <TextInput
              placeholder="Vehicle Plate Number"
              placeholderTextColor={theme.textSecondary}
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={ticketData.plateNo}
              onChangeText={(text) => setTicketData({ ...ticketData, plateNo: text })}
            />
            <TextInput
              placeholder="Incident Location / Street"
              placeholderTextColor={theme.textSecondary}
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={ticketData.location}
              onChangeText={(text) => setTicketData({ ...ticketData, location: text })}
            />
          </View>

          <Text style={[styles.innerSectionTitle, { color: theme.text }]}>SELECT VIOLATIONS</Text>
          <View style={styles.violationList}>
            {violations.map((v) => {
              const isSelected = selectedViolations.includes(v.code);
              return (
                <Pressable
                  key={v.code}
                  style={[styles.violationItem, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, isSelected && { borderColor: theme.primary }]}
                  onPress={() => toggleViolation(v.code)}
                >
                  <View style={[styles.checkbox, { borderColor: theme.textSecondary }, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                    {isSelected && <Feather name="check" size={10} color="#ffffff" />}
                  </View>
                  <Text style={[styles.violationText, { color: theme.text }]}>{v.type} (${v.amount})</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={submitTicket}>
            <Text style={styles.submitBtnText}>GENERATE SECURED CITATION</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ACCIDENT view */}
      {activeSubTab === 'ACCIDENT' && (
        <ScrollView style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>TAIR TRAFFIC ACCIDENT REPORT</Text>
          <View style={styles.formGroup}>
            <TextInput
              placeholder="Accident Location"
              placeholderTextColor={theme.textSecondary}
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={accidentData.location}
              onChangeText={(text) => setAccidentData({ ...accidentData, location: text })}
            />
            <TextInput
              placeholder="Weather (e.g. Clear, Raining, Foggy)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={accidentData.weather}
              onChangeText={(text) => setAccidentData({ ...accidentData, weather: text })}
            />
            <TextInput
              placeholder="Vehicles Involved (Plates / Types)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={accidentData.vehiclesInvolved}
              onChangeText={(text) => setAccidentData({ ...accidentData, vehiclesInvolved: text })}
            />
            <TextInput
              placeholder="Accident Narrative / Details"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              style={[styles.formInput, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              value={accidentData.narrative}
              onChangeText={(text) => setAccidentData({ ...accidentData, narrative: text })}
            />
          </View>

          <Pressable style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={submitAccident}>
            <Text style={styles.submitBtnText}>LOG ACCIDENT DOSSIER</Text>
          </Pressable>
        </ScrollView>
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
  innerSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    height: 40,
    fontSize: 12,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  resultPlate: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  resultDetail: {
    fontSize: 10,
    marginVertical: 1,
  },
  formGroup: {
    gap: Spacing.two,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    fontSize: 11.5,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  violationList: {
    gap: Spacing.two,
  },
  violationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: 6,
    borderWidth: 1,
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
  violationText: {
    fontSize: 11,
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
