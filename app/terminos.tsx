import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";

export default function TermsScreen() {
  const colors = useColors();
  return (
    <PublicScaffold title="Terminos y condiciones" subtitle="Uso responsable de la plataforma Gallos Smiling.">
      <View style={[styles.box, { backgroundColor: colors.card }]}>
        <Text style={[styles.text, { color: colors.foreground }]}>
          Esta plataforma se utiliza para comunicacion institucional, noticias, eventos, actividades, patrocinadores y acceso seguro por rol. El contenido publico es informativo. El acceso a paneles internos requiere autenticacion con Supabase y permisos asignados por la administracion.
        </Text>
      </View>
    </PublicScaffold>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 18, padding: 18 },
  text: { fontSize: 15, lineHeight: 24, fontFamily: "Inter_400Regular" },
});
