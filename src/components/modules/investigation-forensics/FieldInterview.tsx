import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants/theme';

interface InterviewLog {
  id: string;
  name: string;
  dob: string;
  offense: string;
  statement: string;
}

export default function FieldInterview({ theme }: { theme: any; isDark: boolean }) {
  const [susName, setSusName] = useState('');
  const [susDob, setSusDob] = useState('');
  const [susOffense, setSusOffense] = useState('');
  const [susStatement, setSusStatement] = useState('');
  const [logs, setLogs] = useState<InterviewLog[]>([
    {
      id: '1',
      name: 'Carl Miller',
      dob: '1992-05-14',
      offense: 'Trespassing',
      statement: 'Suspect claimed he was looking for his lost dog inside the closed railway yard, but was carrying bolt cutters.',
    },
  ]);

  const submitLog = () => {
    if (!susName.trim() || !susOffense.trim()) {
      Alert.alert('⚠️ MISSING FIELDS', 'Suspect Name and Incident Offense are required to log an interview.');
      return;
    }

    const newLog: InterviewLog = {
      id: String(Date.now()),
      name: susName.trim(),
      dob: susDob.trim() || 'UNKNOWN',
      offense: susOffense.trim(),
      statement: susStatement.trim() || 'No statement logged.',
    };

    setLogs((prev) => [newLog, ...prev]);
    setSusName('');
    setSusDob('');
    setSusOffense('');
    setSusStatement('');
    Alert.alert('✓ LOGGED', 'Field interview record registered securely.');
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>FIELD INTERVIEW REGISTRY</Text>

      {/* Input Form */}
      <View style={[styles.formContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <TextInput
          placeholder="Suspect Full Name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
          value={susName}
          onChangeText={setSusName}
        />
        <TextInput
          placeholder="Suspect Date of Birth (YYYY-MM-DD)"
          placeholderTextColor={theme.textSecondary}
          style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
          value={susDob}
          onChangeText={setSusDob}
        />
        <TextInput
          placeholder="Alleged Offense / Code"
          placeholderTextColor={theme.textSecondary}
          style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
          value={susOffense}
          onChangeText={setSusOffense}
        />
        <TextInput
          placeholder="Subject Statement / Field observations"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
          style={[styles.formInput, styles.textArea, { color: theme.text, borderColor: theme.border }]}
          value={susStatement}
          onChangeText={setSusStatement}
        />

        <Pressable style={[styles.formSubmitBtn, { backgroundColor: theme.primary }]} onPress={submitLog}>
          <Feather name="file-text" size={16} color="#ffffff" style={{ marginRight: Spacing.one }} />
          <Text style={styles.formSubmitBtnText}>REGISTER FIELD INTERVIEW</Text>
        </Pressable>
      </View>

      {/* Log list */}
      <Text style={[styles.innerSectionTitle, { color: theme.text }]}>LOGGED SHIFT INTERVIEWS</Text>
      <View style={styles.loggedInterviews}>
        {logs.map((log) => (
          <View key={log.id} style={[styles.interviewCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Text style={[styles.interviewName, { color: theme.text }]}>{log.name.toUpperCase()}</Text>
            <Text style={[styles.interviewMeta, { color: theme.textSecondary }]}>DOB: {log.dob} // CODE: {log.offense}</Text>
            <View style={styles.interviewDivider} />
            <Text style={[styles.interviewStatement, { color: theme.text }]}>{log.statement}</Text>
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
  formContainer: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 11.5,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  formSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: Spacing.one,
  },
  formSubmitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  loggedInterviews: {
    gap: Spacing.two,
  },
  interviewCard: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
  interviewName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  interviewMeta: {
    fontSize: 9.5,
    marginTop: 2,
  },
  interviewDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: Spacing.one,
  },
  interviewStatement: {
    fontSize: 11,
    lineHeight: 15,
  },
});
