import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Stub para el formulario de administración de solicitudes
export default function FormularioSolicitudAdmin({ onUpdated }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>[Formulario Solicitud Admin] (stub)</Text>
      <Text style={styles.note}>Placeholder para la interfaz de administración de solicitudes.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => onUpdated && onUpdated()}>
        <Text style={styles.btnText}>Actualizar (simulado)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginVertical: 8 },
  title: { fontWeight: '700', marginBottom: 6, color: '#0b60d9' },
  note: { color: '#444', marginBottom: 8 },
  btn: { backgroundColor: '#0b60d9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  btnText: { color: '#fff', fontWeight: '700' },
});
