import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";

export default function ImageUseScreen() {
  const colors = useColors();
  return (
    <PublicScaffold title="Autorizacion de uso de imagen" subtitle="Referencia informativa para contenido visual institucional.">
      <View style={[styles.box, { backgroundColor: colors.card }]}>
        <Text style={[styles.text, { color: colors.foreground }]}>
          La publicacion de fotografias o videos de actividades debe realizarse con autorizacion y criterio institucional. El panel administrativo separa contenido publico de informacion privada y evita publicar expedientes, diagnosticos o historiales medicos.
        </Text>
      </View>
    </PublicScaffold>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 18, padding: 18 },
  text: { fontSize: 15, lineHeight: 24, fontFamily: "Inter_400Regular" },
});
