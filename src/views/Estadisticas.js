import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Estadisticas = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>
      <View style={styles.card}>
        <Text style={styles.message}>Aquí irán las gráficas y métricas del sistema.</Text>
        <Text style={styles.note}>Por ahora este es un placeholder para evitar errores de importación.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6f8fa' },
  title: { fontSize: 22, fontWeight: '800', color: '#12323b', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, elevation: 3 },
  message: { fontSize: 16, color: '#333' },
  note: { marginTop: 8, color: '#666', fontSize: 13 }
});

export default Estadisticas;
