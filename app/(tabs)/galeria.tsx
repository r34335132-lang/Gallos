import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { mapGalleryItem, type GalleryItem } from "@/lib/appData";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");
const CARD_RADIUS = 24;
const CARD_RADIUS_SM = 18;
const FILTER_ALL = "Todos";

type Row = { type: "wide"; item: GalleryItem; index: number } | { type: "pair"; left: GalleryItem; right: GalleryItem; li: number; ri: number };

function buildRows(items: GalleryItem[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  while (i < items.length) {
    rows.push({ type: "wide", item: items[i], index: i });
    i++;
    if (i < items.length) {
      if (i + 1 < items.length) {
        rows.push({ type: "pair", left: items[i], right: items[i + 1], li: i, ri: i + 1 });
        i += 2;
      } else {
        rows.push({ type: "wide", item: items[i], index: i });
        i++;
      }
    }
  }
  return rows;
}

function MediaViewer({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  const playVideo = () => {
    if (item.mediaUrl) Linking.openURL(item.mediaUrl);
  };

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View style={vs.bg}>
        <View style={[vs.topBar, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={onClose} hitSlop={20} style={vs.closeBtn}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <Text style={vs.counter}>{item.type === "video" ? "VIDEO" : "FOTO"}</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={[vs.imgWrapper, { width }]}>
          {item.type === "video" ? (
            <Pressable style={vs.videoPanel} onPress={playVideo}>
              {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={vs.videoThumb} resizeMode="cover" /> : null}
              <View style={vs.videoOverlay}>
                <View style={vs.playButton}>
                  <Feather name="play" size={34} color="#fff" />
                </View>
                <Text style={vs.videoText}>Reproducir video</Text>
              </View>
            </Pressable>
          ) : (
            <Image source={{ uri: item.mediaUrl }} style={vs.img} resizeMode="contain" />
          )}
        </View>

        <View style={[vs.infoBar, { paddingBottom: insets.bottom + 30 }]}>
          {item.tournamentName && (
            <View style={vs.tournRow}>
              <Feather name="award" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={vs.tournText}>{item.tournamentName}</Text>
            </View>
          )}
          <Text style={vs.infoTitle}>{item.title}</Text>
          {!!item.description && <Text style={vs.infoDesc} numberOfLines={3}>{item.description}</Text>}
        </View>
      </View>
    </Modal>
  );
}

function TypeBadge({ type }: { type: GalleryItem["type"] }) {
  return (
    <View style={badgeStyles.badge}>
      <Feather name={type === "video" ? "play-circle" : "camera"} size={12} color="#fff" />
      <Text style={badgeStyles.text}>{type === "video" ? "Video" : "Foto"}</Text>
    </View>
  );
}

function WideCard({ item, onPress, index, accentColor }: { item: GalleryItem; onPress: () => void; index: number; accentColor: string }) {
  const fade = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, delay: (index % 4) * 100, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 500, delay: (index % 4) * 100, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: ty }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [wc.card, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={wc.img} resizeMode="cover" />
        ) : (
          <View style={[wc.img, wc.videoFallback]}><Feather name="play-circle" size={42} color="#fff" /></View>
        )}
        <View style={[wc.scrim, { height: "100%", backgroundColor: "rgba(0,0,0,0.2)" }]} />
        <View style={wc.scrim} />
        <View style={wc.typeBadge}><TypeBadge type={item.type} /></View>
        <View style={wc.body}>
          {item.tournamentName && (
            <View style={[wc.badge, { backgroundColor: accentColor }]}>
              <Feather name="star" size={10} color="#FFF" />
              <Text style={wc.badgeText} numberOfLines={1}>{item.tournamentName}</Text>
            </View>
          )}
          <Text style={wc.title} numberOfLines={2}>{item.title}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function SmallCard({ item, onPress, index }: { item: GalleryItem; onPress: () => void; index: number }) {
  const cardWidth = (width - 48) / 2;
  const fade = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, delay: (index % 4) * 100 + 50, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 500, delay: (index % 4) * 100 + 50, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: ty }], width: cardWidth }}>
      <Pressable onPress={onPress} style={({ pressed }) => [sc.card, { width: cardWidth, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={sc.img} resizeMode="cover" /> : <View style={[sc.img, wc.videoFallback]} />}
        <View style={[sc.scrim, { height: "100%", backgroundColor: "rgba(0,0,0,0.1)" }]} />
        <View style={sc.scrim} />
        <View style={sc.typeBadge}><TypeBadge type={item.type} /></View>
        <View style={sc.body}>
          <Text style={sc.title} numberOfLines={2}>{item.title}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Galeria() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState(FILTER_ALL);

  const filters = [FILTER_ALL, "Foto", "Video"];
  const filtered = items.filter((item) => filter === FILTER_ALL || (filter === "Foto" ? item.type === "imagen" : item.type === "video"));
  const rows = buildRows(filtered);

  const fetchGallery = async () => {
    const { data, error } = await supabase.from("gallery_photos").select("*, tournaments(name)").order("upload_date", { ascending: false });
    if (!error) setItems((data || []).map(mapGalleryItem).filter((item) => Boolean(item.mediaUrl)));
    setLoading(false);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const renderRow = ({ item }: { item: Row }) => {
    if (item.type === "wide") {
      return <WideCard item={item.item} index={item.index} accentColor={colors.primary} onPress={() => setSelected(item.item)} />;
    }
    return (
      <View style={{ flexDirection: "row", gap: 16 }}>
        <SmallCard item={item.left} index={item.li} onPress={() => setSelected(item.left)} />
        <SmallCard item={item.right} index={item.ri} onPress={() => setSelected(item.right)} />
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={15} style={s.iconBtn}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <View style={s.titleContainer}>
            <Text style={s.headerTitle}>Galería Smiling</Text>
            <Text style={s.headerSubTitle}>Fotos y videos</Text>
          </View>
          <View style={s.iconBtn} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {filters.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[
                s.filterChip,
                filter === item
                  ? { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
                  : { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)", borderWidth: 1 },
              ]}
            >
              <Text style={[s.filterChipText, { color: filter === item ? colors.primary : "#FFF" }]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.empty}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <View style={[s.emptyIconWrap, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="camera-off" size={36} color={colors.primary} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Aún no hay multimedia</Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
            Pronto compartiremos fotos y videos de actividades Gallos Smiling.
          </Text>
        </View>
      ) : (
        <FlatList data={rows} keyExtractor={(_, i) => String(i)} contentContainerStyle={s.feed} showsVerticalScrollIndicator={false} renderItem={renderRow} />
      )}

      {selected && <MediaViewer item={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.58)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  text: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
});

const vs = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.98)" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  counter: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  imgWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  img: { width, flex: 1 },
  videoPanel: { width: "100%", flex: 1, alignItems: "center", justifyContent: "center" },
  videoThumb: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", opacity: 0.55 },
  videoOverlay: { alignItems: "center", gap: 14 },
  playButton: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  videoText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  infoBar: { paddingHorizontal: 24, paddingTop: 30, gap: 8, backgroundColor: "rgba(0,0,0,0.7)" },
  tournRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tournText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1 },
  infoTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  infoDesc: { color: "rgba(255,255,255,0.8)", fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
});

const wc = StyleSheet.create({
  card: { height: 240, borderRadius: CARD_RADIUS, overflow: "hidden", elevation: 6, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  img: { position: "absolute", width: "100%", height: "100%" },
  videoFallback: { backgroundColor: "#1A4FA8", alignItems: "center", justifyContent: "center" },
  scrim: { position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", backgroundColor: "rgba(0,0,0,0.6)" },
  typeBadge: { position: "absolute", top: 16, right: 16 },
  body: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: "#FFF", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 26, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
});

const sc = StyleSheet.create({
  card: { height: 180, borderRadius: CARD_RADIUS_SM, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  img: { position: "absolute", width: "100%", height: "100%" },
  scrim: { position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", backgroundColor: "rgba(0,0,0,0.6)" },
  typeBadge: { position: "absolute", top: 10, right: 10 },
  body: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
  title: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold", lineHeight: 20, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  titleContainer: { alignItems: "center", flex: 1 },
  headerTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  headerSubTitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  filterRow: { gap: 12, paddingBottom: 6, paddingHorizontal: 4 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  filterChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  feed: { padding: 16, gap: 16, paddingBottom: 60 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});
