import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const TablaUsuario = ({ usuarios = [], eliminarUsuario = () => {}, seleccionar = () => {} }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Usuarios ({usuarios.length})</Text>
      <ScrollView>
        {usuarios.map(u => (
          <View key={u.id} style={styles.row}>
            <Text style={styles.cell}>{u.Usuario}</Text>
            <Text style={styles.cell}>{u.rol}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => seleccionar(u)} style={styles.btn}><Text>Ver</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => eliminarUsuario(u.id)} style={[styles.btn, styles.delete]}><Text>Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  cell: { flex: 1, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f1f1f1', borderRadius: 6 },
  delete: { backgroundColor: '#ffdddd' }
});

export default TablaUsuario;
