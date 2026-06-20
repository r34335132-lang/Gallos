import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";

export default function DocumentPolicyScreen() {
  const colors = useColors();
  return (
    <PublicScaffold title="Manejo de documentos e imagenes" subtitle="Politica publica para documentos, fotografias y videos.">
      <View style={[styles.box, { backgroundColor: colors.card }]}>
        <Text style={[styles.text, { color: colors.foreground }]}>
          Los documentos sensibles de beneficiarios no se muestran publicamente. Los tutores solo consultan estados de documentacion. Las imagenes, noticias, galeria y videos se publican como contenido institucional cuando la administracion los marca como publicos y cuenta con la autorizacion correspondiente.
        </Text>
      </View>
    </PublicScaffold>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 18, padding: 18 },
  text: { fontSize: 15, lineHeight: 24, fontFamily: "Inter_400Regular" },
});
