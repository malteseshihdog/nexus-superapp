import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppConfigProvider } from "@/contexts/AppConfigContext";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PhoneAuthProvider, usePhoneAuth } from "@/contexts/PhoneAuthContext";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = usePhoneAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === "auth";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/phone");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isReady, segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/phone"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="auth/otp"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="chat/call"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="chat/group-call"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="chat/family"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="peep/live"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="wallet/qr"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="wallet/send"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="wallet/cards"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="wallet/crypto-wallet"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="market/esim"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="market/satellite"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="market/ghost"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            headerShown: false,
            presentation: "formSheet",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppConfigProvider>
          <PhoneAuthProvider>
            <AuthProvider>
              <UserProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </UserProvider>
            </AuthProvider>
          </PhoneAuthProvider>
        </AppConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
