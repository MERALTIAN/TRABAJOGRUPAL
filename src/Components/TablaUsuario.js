import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TablaUsuario = ({ usuarios = [], eliminarUsuario = () => {}, editarUsuario = () => {}, useScrollView = false }) => {
  const { width } = useWindowDimensions();
  const cardMax = Math.min(560, Math.max(320, width - 32));

  return (
    <View style={styles.container}>
      <Text style={[styles.title, styles.listTitle]}>Lista de Usuarios</Text>
      {usuarios.length === 0 ? (
        <Text style={styles.empty}>No hay usuarios registrados.</Text>
      ) : (
        useScrollView ? (
          <View style={styles.list}>
            {usuarios.map(u => (
              <View key={u.id} style={[styles.row, { maxWidth: cardMax }]}>
                <View style={styles.rowContent}>
                  <View style={styles.textBlock}>
                    <Text style={styles.name} numberOfLines={1}>{u.Nombre ? `${u.Nombre} ${u.Apellido || ''}`.trim() : (u.email || u.id)}</Text>
                    <Text style={styles.meta}>{u.rol || u.Rol || 'N/A'}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreBtn} onPress={() => {
                    Alert.alert('Opciones', undefined, [
                      { text: 'Editar', onPress: () => editarUsuario(u) },
                      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarUsuario(u.id) },
                      { text: 'Cancelar', style: 'cancel' }
                    ]);
                  }}>
                    <MaterialIcons name="more-vert" size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item: u }) => (
              <View key={u.id} style={[styles.row, { maxWidth: cardMax }]}>
                <View style={styles.rowContent}>
                  <View style={styles.textBlock}>
                    <Text style={styles.name} numberOfLines={1}>{u.Nombre ? `${u.Nombre} ${u.Apellido || ''}`.trim() : (u.email || u.id)}</Text>
                    <Text style={styles.meta}>{u.rol || u.Rol || 'N/A'}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreBtn} onPress={() => {
                    Alert.alert('Opciones', undefined, [
                      { text: 'Editar', onPress: () => editarUsuario(u) },
                      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarUsuario(u.id) },
                      { text: 'Cancelar', style: 'cancel' }
                    ]);
                  }}>
                    <MaterialIcons name="more-vert" size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 8, alignItems: 'stretch' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 10, color: '#0b1320' },
  listTitle: { textAlign: 'center', width: '100%', marginBottom: 12 },
  list: { paddingBottom: 30, width: '100%' },
  empty: { color: '#666', padding: 8 },
    row: { flexDirection: 'column', alignItems: 'stretch', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eef0f2', width: '100%', maxWidth: 560 },
  rowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
    textBlock: { flex: 1, paddingRight: 8 },
  name: { fontWeight: '800', fontSize: 16, color: '#0b1320' },
  meta: { color: '#7a8a95', marginTop: 6, fontSize: 13 },
  roleText: { color: '#2563eb', fontWeight: '700' },
  moreBtn: { marginLeft: 12, alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff' },
});

export default TablaUsuario;
