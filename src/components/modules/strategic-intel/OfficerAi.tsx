import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants/theme';

export default function OfficerAi({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [messages, setMessages] = useState<{ sender: 'OFFICER' | 'AI'; text: string }[]>([
    { sender: 'AI', text: 'Officer AI assistant online. Ready to consult legal codes, operational protocols, or local stats.' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const presets = [
    { title: 'Vehicular pursuit rules', text: 'Summarize standard protocol for vehicular high-speed pursuits.' },
    { title: 'Local crime analysis', text: 'Provide a quick security risk analysis for Sector-4 district.' },
    { title: 'Search warrant criteria', text: 'What is the required legal standard for establishing probable cause?' },
  ];

  const handlePresetSelect = (presetText: string) => {
    sendMessage(presetText);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'OFFICER', text }]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let aiText = 'I am scanning the databases, but I could not find a specific protocol for that request. Please clarify.';

      if (text.toLowerCase().includes('pursuit')) {
        aiText = '🚨 VEHICULAR PURSUIT PROTOCOL (SOP-409):\n1. Notify Dispatch: Immediatly call in vehicle description, license, speed, and heading.\n2. Emergency Gear: Active siren and all flashing lights.\n3. Safe Buffer: Do not follow closer than 2 vehicle lengths.\n4. Grounding approval: Supervisor approval must be actively maintained to continue pursuit.';
      } else if (text.toLowerCase().includes('crime') || text.toLowerCase().includes('sector')) {
        aiText = '📊 CRIME ANALYTICS - SECTOR-4:\n- Risk level: MODERATE\n- Major Activity: 12% spike in retail breaking-and-enters during Shift B.\n- Recommendations: Direct officers to increase vehicle visibility patrols near retail blocks. Dispatch anti-theft sensors.';
      } else if (text.toLowerCase().includes('warrant') || text.toLowerCase().includes('probable')) {
        aiText = '⚖️ PROBABLE CAUSE LEGAL SPECIFICATION:\nProbable cause exists when there are reasonably trustworthy facts and circumstances sufficient to lead a prudent officer to believe that a crime has been committed and evidence exists at the site. Must be supported by affidavit.';
      }

      setMessages((prev) => [...prev, { sender: 'AI', text: aiText }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>TACTICAL AI CONSULTANT</Text>

      {/* Preset options */}
      <View style={styles.presetContainer}>
        {presets.map((preset, idx) => (
          <Pressable
            key={idx}
            style={[styles.presetCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => handlePresetSelect(preset.text)}
          >
            <Text style={[styles.presetTextLabel, { color: theme.primary }]}>{preset.title}</Text>
          </Pressable>
        ))}
      </View>

      {/* Chat messages viewport */}
      <View style={[styles.chatView, { backgroundColor: isDark ? '#06070a' : '#eceff1', borderColor: theme.border }]}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.chatMessage,
                msg.sender === 'OFFICER' ? styles.messageOfficer : styles.messageAi,
                { backgroundColor: msg.sender === 'OFFICER' ? theme.primary : theme.backgroundElement },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: msg.sender === 'OFFICER' ? '#ffffff' : theme.text },
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}
          {isTyping && (
            <View style={[styles.chatMessage, styles.messageAi, { backgroundColor: theme.backgroundElement }]}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          )}
        </ScrollView>
      </View>

      {/* Chat Inputs */}
      <View style={styles.chatInputRow}>
        <TextInput
          placeholder="Consult tactical copilot..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.chatInput, { color: theme.text, borderColor: theme.border }]}
          value={inputText}
          onChangeText={setInputText}
        />
        <Pressable style={[styles.chatSendBtn, { backgroundColor: theme.primary }]} onPress={() => sendMessage(inputText)}>
          <Feather name="send" size={18} color="#ffffff" />
        </Pressable>
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
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  presetCard: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  presetTextLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  chatView: {
    height: 240,
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  chatMessage: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '85%',
  },
  messageOfficer: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  messageAi: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 11,
    lineHeight: 15,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    fontSize: 12,
    height: 40,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
