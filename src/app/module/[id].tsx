import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { ModuleRegistry } from '../../components/modules';
import { MODULE_CATEGORIES } from '../../constants/modules';
import { Colors, Spacing } from '../../constants/theme';

export default function ModuleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Find module details
  const moduleItem = React.useMemo(() => {
    for (const cat of MODULE_CATEGORIES) {
      const found = cat.modules.find((mod) => mod.id === id);
      if (found) return found;
    }
    return null;
  }, [id]);

  if (!moduleItem) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Feather name="alert-octagon" size={48} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.text }]}>TACTICAL MODULE NOT FOUND</Text>
        <Pressable style={[styles.backBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/')}>
          <Text style={styles.backBtnText}>RETURN TO HQ</Text>
        </Pressable>
      </View>
    );
  }

  // Look up component from registry
  const SelectedModuleComponent = ModuleRegistry[moduleItem.id];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Module Title Header Panel */}
      {/* <View style={[styles.moduleHeaderPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.categoryIconCircle, { backgroundColor: theme.primaryGlow }]}>
            <Feather name={moduleItem.icon as any} size={20} color={theme.primary} />
          </View>
          <View style={styles.titleInfo}>
            <Text style={[styles.moduleTitle, { color: theme.text }]}>{moduleItem.name.toUpperCase()}</Text>
            <Text style={[styles.moduleCategory, { color: theme.textSecondary }]}>
              SYSTEM NODE // {moduleItem.category.toUpperCase().replace('-', '_')}
            </Text>
          </View>
        </View>
        <Text style={[styles.moduleDescription, { color: theme.textSecondary }]}>
          {moduleItem.description}
        </Text>
      </View> */}

      {/* Render Specific Interactive Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {SelectedModuleComponent ? (
          <SelectedModuleComponent theme={theme} isDark={isDark} />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.textSecondary }}>NO INTERFACE CORRESPONDENCE FOUND</Text>
          </View>
        )}
        <View style={{ height: Spacing.four }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    marginTop: Spacing.four,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: Spacing.three,
  },
  backBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  moduleHeaderPanel: {
    padding: Spacing.three,
    borderBottomWidth: 1,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  titleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  moduleCategory: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  moduleDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
