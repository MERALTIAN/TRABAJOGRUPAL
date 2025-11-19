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
                    <Text style={styles.name} numberOfLines={1}>{u.Nombre ? `${u.Nombre} ${u.Apellido || ''}`.trim() : (u.Usuario || u.email || u.id)}</Text>
                    <Text style={styles.meta}>{u.rol || u.Rol || 'N/A'}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreBtn} onPress={() => {
                    Alert.alert('Opciones', undefined, [
                      { text: 'Editar', onPress: () => editarUsuario(u) },
                      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarUsuario(u.id) },
                      { text: 'Cancelar', style: 'cancel' }
                    ]);
                  }}>
                    <MaterialIcons name="more-vert" size={22} color="#6B7280" />
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
  container: { padding: 12, alignItems: 'center', width: '100%' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 14, color: '#0b1320' },
  listTitle: { textAlign: 'center', width: '100%', marginBottom: 6 },
  list: { paddingBottom: 30, width: '100%' },
  empty: { color: '#666', padding: 8 },
  row: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e3e8ee', width: '100%', maxWidth: 560, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3 },
  rowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textBlock: { flex: 1, paddingRight: 8 },
  name: { fontWeight: '800', fontSize: 18, color: '#12323b' },
  meta: { color: '#6b7280', marginTop: 6, fontSize: 13 },
  roleText: { color: '#2563eb', fontWeight: '700' },
  moreBtn: { marginLeft: 12, alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20, backgroundColor: '#f7f8f8' },
});

export default TablaUsuario;
