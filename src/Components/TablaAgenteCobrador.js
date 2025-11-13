import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

const TablaAgenteCobrador = ({ agentes = [], eliminarAgenteCobrador, editarAgenteCobrador, onSelectAgente, desvincularUsuario }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agentes Cobradores</Text>
      {agentes.length === 0 ? (
        <Text style={{ color: '#666', padding: 8 }}>No hay agentes registrados.</Text>
      ) : (
        <FlatList
          data={agentes}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item: a }) => (
            <View key={a.id} style={styles.card}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => onSelectAgente && onSelectAgente(a)}>
                <Text style={styles.name}>{a.Nombre || a.Usuario || a.id}</Text>
                <Text style={styles.meta}>Tel: {a.Telefono || '-'}</Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => editarAgenteCobrador && editarAgenteCobrador(a)}><Text style={styles.btnText}>🖋️</Text></TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => eliminarAgenteCobrador && eliminarAgenteCobrador(a.id)}><Text style={styles.btnText}>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          )}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eef2f5' },
  name: { fontWeight: '800', color: '#0b60d9' },
  meta: { color: '#666', marginTop: 4 },
  actions: { flexDirection: 'row' },
  editBtn: { backgroundColor: '#007bff', padding: 8, borderRadius: 6, marginLeft: 8 },
  delBtn: { backgroundColor: '#ff4444', padding: 8, borderRadius: 6, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default TablaAgenteCobrador;
