import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const TablaUsuario = ({ usuarios = [], eliminarUsuario = () => {}, editarUsuario = () => {} }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Usuarios</Text>
      <ScrollView style={styles.list}>
        {usuarios.length === 0 && <Text style={styles.empty}>No hay usuarios registrados.</Text>}
        {usuarios.map((u) => (
          <View key={u.id} style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{u.Nombre ? `${u.Nombre} ${u.Apellido || ''}`.trim() : (u.email || u.id)}</Text>
              <Text style={styles.meta}>Rol: {u.rol || u.Rol || 'N/A'}</Text>
              {u.Telefono ? <Text style={styles.meta}>Tel: {u.Telefono}</Text> : null}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.edit]} onPress={() => editarUsuario(u)}>
                <Text style={styles.btnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.delete]} onPress={() => eliminarUsuario(u.id)}>
                <Text style={styles.btnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  list: { maxHeight: 420 },
  empty: { color: '#666', padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eef2f5' },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: 16, color: '#12323b' },
  meta: { color: '#666', marginTop: 4 },
  actions: { flexDirection: 'row' },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  edit: { backgroundColor: '#1e90ff' },
  delete: { backgroundColor: '#ff4444' },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default TablaUsuario;
