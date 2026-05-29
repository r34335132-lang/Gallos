import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function SponsorCard({ sponsor }: { sponsor: any }) {
  const isGold = sponsor.level?.toLowerCase() === 'oro';
  const isSilver = sponsor.level?.toLowerCase() === 'plata';
  
  // Asignamos colores según el nivel
  const gradientColors = isGold 
    ? ['#F59E0B', '#D97706'] 
    : isSilver 
      ? ['#9CA3AF', '#6B7280'] 
      : ['#B45309', '#78350F'];

  const height = isGold ? 180 : isSilver ? 120 : 80;

  return (
    <View style={[styles.card, { height }]}>
      <LinearGradient colors={gradientColors} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.content}>
          <View style={[styles.iconWrapper, isGold ? styles.iconLg : styles.iconSm]}>
            <Feather name="award" size={isGold ? 32 : 20} color={gradientColors[0]} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, isGold && styles.nameLg]} numberOfLines={1}>
              {sponsor.name}
            </Text>
            {isGold && sponsor.description && (
              <Text style={styles.desc} numberOfLines={2}>
                {sponsor.description}
              </Text>
            )}
            {!isGold && (
              <Text style={styles.levelBadge}>{sponsor.level}</Text>
            )}
          </View>
        </View>
        {isGold && (
          <View style={styles.goldBadge}>
            <Text style={styles.goldBadgeText}>PATROCINADOR ORO</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: { flex: 1, padding: 16, justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrapper: { backgroundColor: '#FFF', borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  iconLg: { width: 64, height: 64 },
  iconSm: { width: 44, height: 44 },
  info: { flex: 1, justifyContent: 'center' },
  name: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  nameLg: { fontSize: 24, marginBottom: 8 },
  desc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  levelBadge: { color: '#FFF', fontSize: 12, fontFamily: 'Inter_600SemiBold', opacity: 0.8 },
  goldBadge: { position: 'absolute', top: 12, right: 16, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  goldBadgeText: { color: '#FFF', fontSize: 10, fontFamily: 'Inter_700Bold' }
});