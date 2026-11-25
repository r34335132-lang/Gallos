import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePublicPushNotifications } from "@/hooks/usePublicPushNotifications";

SplashScreen.preventAutoHideAsync();

function PushNotificationsBridge() {
  usePublicPushNotifications();
  return null;
}

export default function PublicRootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="noticias" />
          <Stack.Screen name="noticia/[id]" />
          <Stack.Screen name="galeria" />
          <Stack.Screen name="campanas" />
          <Stack.Screen name="eventos" />
          <Stack.Screen name="sobre-nosotros" />
          <Stack.Screen name="contacto" />
          <Stack.Screen name="apoyar" />
          <Stack.Screen name="patrocinadores" />
          <Stack.Screen name="privacidad" />
          <Stack.Screen name="terminos" />
        </Stack>
        <PushNotificationsBridge />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
