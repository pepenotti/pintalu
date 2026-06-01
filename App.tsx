import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import GalleryScreen from './src/screens/GalleryScreen';
import CanvasScreen from './src/screens/CanvasScreen';
import { LanguageProvider } from './src/i18n';
import type { RootStackParamList } from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Gallery"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Gallery" component={GalleryScreen} />
            <Stack.Screen name="Canvas" component={CanvasScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
