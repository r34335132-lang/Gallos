import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Bienvenido a Gallos Smiling",
    body: "Una comunidad que apoya, informa y transforma vidas.",
    icon: "🌟",
    accent: "#0D2B6E",
  },
  {
    id: "2",
    title: "Expedientes digitales",
    body: "Registra beneficiarios, sube documentos y da seguimiento a cada solicitud.",
    icon: "📋",
    accent: "#1A4FA8",
  },
  {
    id: "3",
    title: "Noticias y comunidad",
    body: "Mantente informado sobre la fundación, el club y nuestros beneficiarios.",
    icon: "📰",
    accent: "#0D2B6E",
  },
];

export default function Onboarding() {
  const colors = useColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex((i) => i + 1);
    } else {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {item.id === "1" ? (
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.iconContainer, { backgroundColor: item.accent + "15" }]}>
                <View style={[styles.iconInner, { backgroundColor: item.accent + "25" }]}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>
              </View>
            )}
            <View style={[styles.blueLine, { backgroundColor: item.accent }]} />
            <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex ? colors.primary : colors.border,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "Comenzar" : "Siguiente"}
          </Text>
        </Pressable>

        {currentIndex < SLIDES.length - 1 && (
          <Pressable
            style={styles.skip}
            onPress={async () => {
              await AsyncStorage.setItem("hasSeenOnboarding", "true");
              router.replace("/login");
            }}
          >
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
              Omitir
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 20,
    paddingTop: Platform.OS === "web" ? 67 : 0,
  },
  logoImg: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 56,
  },
  blueLine: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === "web" ? 50 : 40,
    gap: 16,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  skip: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
