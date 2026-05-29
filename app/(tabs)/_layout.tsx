import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 60,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
            />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="noticias"
        options={{
          title: "Noticias",
          tabBarIcon: ({ color }) => <Feather name="file-text" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="registrar"
        options={{
          title: "Registrar",
          tabBarIcon: ({ color }) => <Feather name="user-plus" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expedientes"
        options={{
          title: "Expedientes",
          tabBarIcon: ({ color }) => <Feather name="folder" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
