import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const TablaUsuario = ({ usuarios = [], eliminarUsuario = () => {}, editarUsuario = () => {}, useScrollView = false }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Usuarios</Text>
      {usuarios.length === 0 ? (
        <Text style={styles.empty}>No hay usuarios registrados.</Text>
      ) : (
        useScrollView ? (
          <View style={styles.list}>
            {usuarios.map(u => (
              <View key={u.id} style={styles.row}>
                <View style={styles.leftBlock}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{((u.Nombre || '').split(' ').map(s=>s[0]).join('').slice(0,2) || (u.id || '').slice(0,2)).toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.info}>
                  <Text style={styles.name}>{u.Nombre ? `${u.Nombre} ${u.Apellido || ''}`.trim() : (u.email || u.id)}</Text>
                  <Text style={styles.meta}>Rol: <Text style={styles.roleText}>{u.rol || u.Rol || 'N/A'}</Text></Text>
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
          </View>
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item: u }) => (
              <View key={u.id} style={styles.row}>
                <View style={styles.leftBlock}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{((u.Nombre || '').split(' ').map(s=>s[0]).join('').slice(0,2) || (u.id || '').slice(0,2)).toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.info}>
                  <Text style={styles.name}>{u.Nombre ? `${u.Nombre} ${u.Apellido || ''}`.trim() : (u.email || u.id)}</Text>
                  <Text style={styles.meta}>Rol: <Text style={styles.roleText}>{u.rol || u.Rol || 'N/A'}</Text></Text>
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
  container: { padding: 8 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 10, color: '#0b1320' },
  list: { paddingBottom: 30 },
  empty: { color: '#666', padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 0, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  leftBlock: { width: 56, alignItems: 'center', justifyContent: 'center' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e6f0ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0b60d9', fontWeight: '800' },
  info: { flex: 1, paddingLeft: 8 },
  name: { fontWeight: '800', fontSize: 16, color: '#0b1320' },
  meta: { color: '#666', marginTop: 6, fontSize: 13 },
  roleText: { color: '#2563eb', fontWeight: '700' },
  actions: { flexDirection: 'row', marginLeft: 8 },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8, minWidth: 86, alignItems: 'center' },
  edit: { backgroundColor: '#0b84ff' },
  delete: { backgroundColor: '#ff5b5b' },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default TablaUsuario;
