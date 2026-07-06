import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawer from '../components/CustomDrawer';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Custom DarkTheme and DefaultTheme overrides to style screens
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.backgroundElement,
      text: Colors.dark.text,
      border: Colors.dark.border,
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.backgroundElement,
      text: Colors.light.text,
      border: Colors.light.border,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
        <Drawer
          drawerContent={(props) => <CustomDrawer {...(props as any)} />}
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.backgroundElement,
              shadowColor: 'transparent',
              elevation: 0,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            },
            headerTintColor: theme.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 13,
              letterSpacing: 1,
            },
            drawerStyle: {
              width: 300,
              backgroundColor: theme.background,
            },
            swipeEnabled: true,
          }}
        >
          <Drawer.Screen
            name="index"
            options={{
              title: 'HQ COMMAND CENTER',
            }}
          />
          <Drawer.Screen
            name="module/[id]"
            options={{
              title: 'POLICECOMS',
              // Hide from drawer header (it will be loaded dynamically)
            }}
          />
        </Drawer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
