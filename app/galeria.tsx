import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");
const CARD_RADIUS = 20;
const CARD_RADIUS_SM = 16;

interface GroupedPost {
  id: string;
  title: string;
  description: string;
  tournamentName?: string | null;
  images: string[];
}

// ─── VISOR FULLSCREEN (Pantalla Completa) ──────────────────────────────────────
const ImageViewer = ({ post, onClose }: { post: GroupedPost; onClose: () => void }) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View style={vs.bg}>
        {/* Barra Superior */}
        <View style={[vs.topBar, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={onClose} hitSlop={14} style={vs.closeBtn}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <Text style={vs.counter}>{activeIndex + 1} / {post.images.length}</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Galería deslizable */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          style={{ flex: 1 }}
        >
          {post.images.map((uri, i) => (
            <View key={i} style={[vs.imgWrapper, { width }]}>
              <Image source={{ uri }} style={vs.img} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {/* Información en la parte inferior */}
        <View style={[vs.infoBar, { paddingBottom: insets.bottom + 24 }]}>
          {post.tournamentName && (
            <View style={vs.tournRow}>
              <Feather name="award" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={vs.tournText}>{post.tournamentName}</Text>
            </View>
          )}
          
          <Text style={vs.infoTitle}>{post.title}</Text>
          
          {!!post.description && (
            <Text style={vs.infoDesc} numberOfLines={3}>{post.description}</Text>
          )}
          
          {post.images.length > 1 && (
            <View style={vs.dotsRow}>
              {post.images.map((_, i) => (
                <View key={i} style={[vs.dot, {
                  width: i === activeIndex ? 20 : 6,
                  opacity: i === activeIndex ? 1 : 0.3,
                }]} />
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const vs = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  counter: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  imgWrapper: { justifyContent: "center", alignItems: "center" },
  img: { width, flex: 1 },
  infoBar: { paddingHorizontal: 20, paddingTop: 20, gap: 8, backgroundColor: "rgba(0,0,0,0.6)" },
  tournRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tournText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" },
  infoTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 26 },
  infoDesc: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  dotsRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  dot: { height: 6, borderRadius: 3, backgroundColor: "#fff" },
});

// ─── CARD ANCHA (Ocupa toda la fila) ───────────────────────────────────────────
const WideCard = ({ post, onPress, index, accentColor }: { post: GroupedPost; onPress: () => void; index: number; accentColor: string; }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay: (index % 4) * 80, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 400, delay: (index % 4) * 80, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: ty }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [wc.card, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <Image source={{ uri: post.images[0] }} style={wc.img} resizeMode="cover" />
        <View style={wc.scrim} />

        {post.images.length > 1 && (
          <View style={wc.multiBadge}>
            <Feather name="layers" size={12} color="#fff" />
            <Text style={wc.multiText}>{post.images.length}</Text>
          </View>
        )}

        <View style={wc.body}>
          {post.tournamentName && (
            <View style={[wc.badge, { backgroundColor: accentColor + "E6" }]}>
              <Feather name="award" size={10} color="#FFF" />
              <Text style={wc.badgeText} numberOfLines={1}>{post.tournamentName}</Text>
            </View>
          )}
          <Text style={wc.title} numberOfLines={2}>{post.title}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const wc = StyleSheet.create({
  card: { height: 220, borderRadius: CARD_RADIUS, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  img: { position: "absolute", width: "100%", height: "100%" },
  scrim: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", backgroundColor: "rgba(0,0,0,0.5)" },
  multiBadge: { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  multiText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  body: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, gap: 6 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#FFF", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", lineHeight: 24, textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});

// ─── CARD PEQUEÑA (Ocupa mitad de fila) ────────────────────────────────────────
const SmallCard = ({ post, onPress, index }: { post: GroupedPost; onPress: () => void; index: number; }) => {
  const cardWidth = (width - 44) / 2;
  const fade = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay: (index % 4) * 80 + 50, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 400, delay: (index % 4) * 80 + 50, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: ty }], width: cardWidth }}>
      <Pressable onPress={onPress} style={({ pressed }) => [sc.card, { width: cardWidth, opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <Image source={{ uri: post.images[0] }} style={sc.img} resizeMode="cover" />
        <View style={sc.scrim} />

        {post.images.length > 1 && (
          <View style={sc.multiBadge}>
            <Feather name="layers" size={10} color="#fff" />
            <Text style={sc.multiText}>{post.images.length}</Text>
          </View>
        )}

        <View style={sc.body}>
          <Text style={sc.title} numberOfLines={2}>{post.title}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const sc = StyleSheet.create({
  card: { height: 160, borderRadius: CARD_RADIUS_SM, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  img: { position: "absolute", width: "100%", height: "100%" },
  scrim: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", backgroundColor: "rgba(0,0,0,0.5)" },
  multiBadge: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  multiText: { color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  body: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12 },
  title: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold", lineHeight: 18, textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
});

// ─── SISTEMA DE REJILLA (Masonry Layout) ───────────────────────────────────────
type Row = | { type: "wide"; post: GroupedPost; postIndex: number } | { type: "pair"; left: GroupedPost; right: GroupedPost; li: number; ri: number };

function buildRows(posts: GroupedPost[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  while (i < posts.length) {
    rows.push({ type: "wide", post: posts[i], postIndex: i });
    i++;
    if (i < posts.length) {
      if (i + 1 < posts.length) {
        rows.push({ type: "pair", left: posts[i], right: posts[i + 1], li: i, ri: i + 1 });
        i += 2;
      } else {
        rows.push({ type: "wide", post: posts[i], postIndex: i });
        i++;
      }
    }
  }
  return rows;
}

// ─── COMPONENTE PRINCIPAL DE LA PANTALLA ───────────────────────────────────────
const FILTER_ALL = "Todos";

export default function Galeria() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<GroupedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GroupedPost | null>(null);
  const [filter, setFilter] = useState(FILTER_ALL);

  const tournaments = [FILTER_ALL, ...Array.from(new Set(posts.map((p) => p.tournamentName).filter(Boolean) as string[]))];
  const filtered = filter === FILTER_ALL ? posts : posts.filter((p) => p.tournamentName === filter);
  const rows = buildRows(filtered);

  const fetchAndGroupPhotos = async () => {
    const { data } = await supabase.from("gallery_photos").select(`*, tournaments(name)`).order("upload_date", { ascending: false });

    const grouped = (data || []).reduce((acc: GroupedPost[], curr) => {
      const key = `${curr.title}|${curr.description}`;
      const existing = acc.find((g) => `${g.title}|${g.description}` === key);
      if (existing) {
        existing.images.push(curr.image_url);
      } else {
        acc.push({
          id: curr.id,
          title: curr.title,
          description: curr.description,
          tournamentName: curr.tournaments?.name,
          images: [curr.image_url],
        });
      }
      return acc;
    }, []);

    setPosts(grouped);
    setLoading(false);
  };

  useEffect(() => { fetchAndGroupPhotos(); }, []);

  const renderRow = ({ item }: { item: Row }) => {
    if (item.type === "wide") {
      return <WideCard post={item.post} index={item.postIndex} accentColor={colors.primary} onPress={() => setSelected(item.post)} />;
    }
    return (
      <View style={{ flexDirection: "row", gap: 12 }}>
        <SmallCard post={item.left} index={item.li} onPress={() => setSelected(item.left)} />
        <SmallCard post={item.right} index={item.ri} onPress={() => setSelected(item.right)} />
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      
      {/* HEADER DE LA APP */}
      <View style={[s.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.iconBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Text style={s.headerTitle}>Galería de Fotos</Text>
          <View style={s.iconBtn} />
        </View>

        {/* Filtros de Torneos (Píldoras) */}
        {tournaments.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {tournaments.map((t) => (
              <Pressable
                key={t}
                onPress={() => setFilter(t)}
                style={[s.filterChip, filter === t ? { backgroundColor: "#fff" } : { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" }]}
              >
                <Text style={[s.filterChipText, { color: filter === t ? colors.primary : "#FFF" }]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* FEED (Cuadrícula Alternada) */}
      {loading ? (
        <View style={s.empty}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <View style={[s.emptyIconWrap, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="image" size={32} color={colors.primary} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>Sin fotos en esta sección</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={s.feed}
          showsVerticalScrollIndicator={false}
          renderItem={renderRow}
        />
      )}

      {/* MODAL (El visor de fotos interactivo) */}
      {selected && (
        <ImageViewer post={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  
  filterRow: { gap: 10, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: "transparent" },
  filterChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  feed: { padding: 16, gap: 12, paddingBottom: 48 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
});