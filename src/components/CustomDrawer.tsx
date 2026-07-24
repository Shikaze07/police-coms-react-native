import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { DrawerContentComponentProps, DrawerContentScrollView } from 'expo-router/drawer';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { clearStoredSocketUrl, getStoredSocketUrl, setStoredSocketUrl } from './lib/network';
import { MODULE_CATEGORIES, ModuleItem } from '../constants/modules';
import { Colors, Fonts, Spacing } from '../constants/theme';

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'police-ops': true, // Keep first one open by default
  });

  const [socketUrlInput, setSocketUrlInput] = useState('');
  const [socketUrlStatus, setSocketUrlStatus] = useState('Auto-detecting computer IP');
  const [showSettings, setShowSettings] = useState(false);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Filter modules based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return MODULE_CATEGORIES;

    return MODULE_CATEGORIES.map((cat) => {
      const filteredModules = cat.modules.filter(
        (mod) =>
          mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mod.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        ...cat,
        modules: filteredModules,
      };
    }).filter((cat) => cat.modules.length > 0);
  }, [searchQuery]);

  // If search query is active, auto-expand matching categories
  const activeExpandedCategories = useMemo(() => {
    if (!searchQuery) return expandedCategories;

    const expanded: Record<string, boolean> = {};
    filteredCategories.forEach((cat) => {
      expanded[cat.id] = true;
    });
    return expanded;
  }, [searchQuery, filteredCategories, expandedCategories]);

  const handleModulePress = (module: ModuleItem) => {
    router.push(`/module/${module.id}` as any);
    props.navigation.closeDrawer();
  };

  const handleHomePress = () => {
    router.push('/');
    props.navigation.closeDrawer();
  };

  useEffect(() => {
    void (async () => {
      const stored = await getStoredSocketUrl();
      if (stored) {
        setSocketUrlInput(stored);
        setSocketUrlStatus('Using saved socket URL');
      } else {
        setSocketUrlStatus('Auto-detecting computer IP');
      }
    })();
  }, []);

  const triggerEmergency = () => {
    Alert.alert(
      '⚠️ EMERGENCY BROADCAST',
      'Encrypted distress beacon initiated. Location coordinates sent to HQ Dispatch. Local reinforcement request broadcasting...',
      [{ text: 'STAND DOWN', style: 'cancel' }, { text: 'CONFIRM ALERT', style: 'destructive' }]
    );
  };

  const handleSaveSocketUrl = async () => {
    const saved = await setStoredSocketUrl(socketUrlInput);
    if (saved) {
      setSocketUrlInput(saved);
      setSocketUrlStatus('Using saved socket URL');
      Alert.alert('Saved', `Socket URL saved as ${saved}`);
    } else {
      setSocketUrlStatus('Auto-detecting computer IP');
      Alert.alert('Cleared', 'Socket URL cleared. The app will auto-detect the host again.');
    }
  };

  const handleClearSocketUrl = async () => {
    await clearStoredSocketUrl();
    setSocketUrlInput('');
    setSocketUrlStatus('Auto-detecting computer IP');
    Alert.alert('Cleared', 'Saved socket URL removed.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderRightColor: theme.border }]}>
      {/* Officer Header Card */}
      <View style={[styles.header, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarGlow} />
          <View style={[styles.avatar, { borderColor: theme.primary, backgroundColor: theme.backgroundSelected }]}>
            <Feather name="shield" size={24} color={theme.primary} />
          </View>
          <View style={[styles.statusDot, { borderColor: theme.backgroundElement }]} />
        </View>
        <View style={styles.officerInfo}>
          <Text style={[styles.officerName, { color: theme.text }]}>POLICECOMS</Text>
          <Text style={[styles.officerBadge, { color: theme.textSecondary }]}>KNOX SECURED • TAC-DIV #7419</Text>
          <View style={styles.dutyIndicator}>
            <Text style={styles.dutyText}>ACTIVE DUTY</Text>
          </View>
        </View>
      </View>

      {/* Module Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Feather name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          placeholder="Search tactical modules..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Feather name="x" size={16} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Main Drawer Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HQ Command Center Shortcut */}
        <Pressable
          style={[
            styles.homeButton,
            pathname === '/' && {
              backgroundColor: isDark ? 'rgba(6, 182, 212, 0.12)' : 'rgba(29, 78, 216, 0.1)',
              borderColor: isDark ? 'rgba(6, 182, 212, 0.3)' : 'rgba(29, 78, 216, 0.2)',
              borderWidth: 1,
            },
          ]}
          onPress={handleHomePress}
        >
          <Feather
            name="grid"
            size={16}
            color={pathname === '/' ? (isDark ? '#22d3ee' : '#1d4ed8') : theme.textSecondary}
          />
          <Text
            style={[
              styles.homeButtonText,
              { color: pathname === '/' ? (isDark ? '#22d3ee' : '#1d4ed8') : theme.textSecondary },
            ]}
          >
            OPERATION CONSOLE
          </Text>
          {pathname === '/' && (
            <View style={[styles.activeIndicator, { backgroundColor: isDark ? '#22d3ee' : '#1d4ed8' }]} />
          )}
        </Pressable>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Categories & Submodules */}
        {filteredCategories.map((category) => {
          const isExpanded = activeExpandedCategories[category.id];

          const categoryTextColor = isExpanded
            ? isDark
              ? '#fde047' // yellow-300
              : '#1e3a8a' // blue-900
            : isDark
            ? '#eab308' // yellow-500
            : '#1d4ed8'; // blue-700

          const headerBgColor = isExpanded
            ? isDark
              ? 'rgba(234, 179, 8, 0.10)' // yellow-500/10 glow
              : '#eff6ff' // blue-50
            : 'transparent';

          const headerBorderColor = isExpanded
            ? isDark
              ? 'rgba(234, 179, 8, 0.25)' // yellow-500/25 border
              : 'rgba(191, 219, 254, 0.6)' // blue-200 border
            : 'transparent';

          return (
            <View key={category.id} style={styles.categoryContainer}>
              {/* Category Header with Yellow/Orange design */}
              <Pressable
                style={[
                  styles.categoryHeader,
                  {
                    backgroundColor: headerBgColor,
                    borderColor: headerBorderColor,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => !searchQuery && toggleCategory(category.id)}
              >
                <View style={styles.categoryTitleGroup}>
                  <Feather name={category.icon as any} size={15} color={categoryTextColor} />
                  <Text style={[styles.categoryName, { color: categoryTextColor }]}>{category.name}</Text>
                  {!isExpanded && !searchQuery && (
                    <View
                      style={[
                        styles.tapBadge,
                        {
                          borderColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#bfdbfe',
                          backgroundColor: isDark ? 'rgba(234, 179, 8, 0.05)' : '#eff6ff',
                        },
                      ]}
                    >
                      <Text style={[styles.tapBadgeText, { color: isDark ? 'rgba(250, 204, 21, 0.7)' : '#3b82f6' }]}>
                        TAP
                      </Text>
                    </View>
                  )}
                </View>
                {!searchQuery && (
                  <View style={styles.categoryBadgeGroup}>
                    <Feather
                      name={isExpanded ? 'chevron-down' : 'chevron-right'}
                      size={14}
                      color={categoryTextColor}
                    />
                  </View>
                )}
              </Pressable>

              {/* Collapsible Submodules */}
              {isExpanded && (
                <View style={styles.modulesList}>
                  {category.modules.map((module) => {
                    const modulePath = `/module/${module.id}`;
                    const isActive = pathname === modulePath;

                    const itemBgColor = isActive
                      ? isDark
                        ? 'rgba(6, 182, 212, 0.1)'
                        : 'rgba(29, 78, 216, 0.1)'
                      : 'transparent';

                    const itemBorderColor = isActive
                      ? isDark
                        ? 'rgba(6, 182, 212, 0.3)'
                        : 'rgba(29, 78, 216, 0.2)'
                      : 'transparent';

                    const itemTextColor = isActive
                      ? isDark
                        ? '#22d3ee'
                        : '#1d4ed8'
                      : theme.textSecondary;

                    return (
                      <Pressable
                        key={module.id}
                        style={[
                          styles.moduleItem,
                          {
                            backgroundColor: itemBgColor,
                            borderColor: itemBorderColor,
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => handleModulePress(module)}
                      >
                        <Feather name={module.icon as any} size={15} color={itemTextColor} />
                        <Text style={[styles.moduleNameText, { color: itemTextColor }]}>{module.name}</Text>
                        {isActive && (
                          <View style={[styles.activeIndicator, { backgroundColor: isDark ? '#22d3ee' : '#1d4ed8' }]} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Settings Panel — shown when toggled */}
        {showSettings && (
          <View style={styles.socketCard}>
            <View style={styles.socketHeaderRow}>
              <Text style={styles.socketTitle}>COMPUTER SOCKET URL</Text>
              <Text style={styles.socketStatus}>{socketUrlStatus}</Text>
            </View>
            <TextInput
              placeholder="http://192.168.1.50:3000"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.socketInput}
              value={socketUrlInput}
              onChangeText={setSocketUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.socketActions}>
              <Pressable style={styles.socketPrimaryBtn} onPress={() => void handleSaveSocketUrl()}>
                <Text style={styles.socketPrimaryBtnText}>SAVE</Text>
              </Pressable>
              <Pressable style={styles.socketSecondaryBtn} onPress={() => void handleClearSocketUrl()}>
                <Text style={styles.socketSecondaryBtnText}>CLEAR</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.networkStatus}>
          <View style={styles.greenPulse} />
          <Text style={styles.networkText}>SECURE TAC-NET ONLINE</Text>
        </View>

        <Pressable style={styles.emergencyButton} onPress={triggerEmergency}>
          <Feather name="alert-octagon" size={18} color="#ffffff" style={styles.emergencyIcon} />
          <Text style={styles.emergencyButtonText}>EMERGENCY BROADCAST</Text>
        </Pressable>

        {/* Settings button — very bottom */}
        <Pressable
          style={styles.settingsButton}
          onPress={() => setShowSettings((v) => !v)}
        >
          <Feather
            name="settings"
            size={14}
            color={showSettings ? Colors.dark.primary : Colors.dark.textSecondary}
          />
          <Text style={[styles.settingsButtonText, showSettings && styles.settingsButtonTextActive]}>
            {showSettings ? 'HIDE SETTINGS' : 'SETTINGS'}
          </Text>
          <Feather
            name={showSettings ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={showSettings ? Colors.dark.primary : Colors.dark.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    borderRightWidth: 1,
    borderRightColor: Colors.dark.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    paddingTop: Spacing.five,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.two,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.dark.primary,
  },
  avatarGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primary,
    opacity: 0.15,
    transform: [{ scale: 1.2 }],
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.success,
    borderWidth: 1.5,
    borderColor: Colors.dark.backgroundElement,
  },
  officerInfo: {
    justifyContent: 'center',
  },
  officerName: {
    fontFamily: Fonts?.rounded,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  officerBadge: {
    fontFamily: Fonts?.mono,
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  dutyIndicator: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  dutyText: {
    color: Colors.dark.success,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    margin: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: Spacing.one,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 12,
    padding: 0,
  },
  scrollContent: {
    paddingTop: Spacing.one,
    paddingBottom: Spacing.three,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    marginHorizontal: Spacing.two,
    borderRadius: 6,
    marginBottom: Spacing.two,
    position: 'relative',
  },
  homeButtonText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: Spacing.two,
    letterSpacing: 0.5,
  },
  activeItem: {
    backgroundColor: Colors.dark.backgroundSelected,
  },
  activeItemText: {
    color: Colors.dark.primary,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    height: '50%',
    width: 3,
    backgroundColor: Colors.dark.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    boxShadow: `1px 0px 3px ${Colors.dark.primary}`,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  categoryContainer: {
    marginBottom: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    marginHorizontal: Spacing.one,
    borderRadius: 8,
  },
  categoryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: Spacing.two,
    textTransform: 'uppercase',
  },
  tapBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: Spacing.two,
  },
  tapBadgeText: {
    fontSize: 8,
    fontFamily: Fonts?.mono,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  categoryBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  moduleCount: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    backgroundColor: Colors.dark.backgroundSelected,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: Spacing.one,
  },
  modulesList: {
    paddingLeft: Spacing.three + Spacing.one,
    marginTop: 3,
    marginBottom: 6,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: Spacing.three,
    marginVertical: 1,
    borderRadius: 6,
    marginRight: Spacing.two,
  },
  moduleNameText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginLeft: Spacing.two,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.success,
    marginRight: Spacing.one,
  },
  networkText: {
    color: Colors.dark.success,
    fontSize: 9,
    fontFamily: Fonts?.mono,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.danger,
    paddingVertical: Spacing.two,
    borderRadius: 6,
    boxShadow: `0px 2px 4px ${Colors.dark.danger}`,
  },
  emergencyIcon: {
    marginRight: Spacing.one,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    paddingVertical: 8,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundElement,
    gap: 6,
  },
  settingsButtonText: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    flex: 1,
    textAlign: 'center',
  },
  settingsButtonTextActive: {
    color: Colors.dark.primary,
  },
  socketCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 8,
    padding: Spacing.two,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  socketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  socketTitle: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  socketStatus: {
    color: Colors.dark.textSecondary,
    fontSize: 9,
    fontFamily: Fonts?.mono,
  },
  socketInput: {
    backgroundColor: Colors.dark.background,
    color: Colors.dark.text,
    fontSize: 11,
    fontFamily: Fonts?.mono,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 8,
  },
  socketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  socketPrimaryBtn: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  socketPrimaryBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  socketSecondaryBtn: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundSelected,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  socketSecondaryBtnText: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
