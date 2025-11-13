import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

const TablaCliente = ({ clientes, eliminarCliente, editarCliente, onSelectCliente }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lista de Clientes</Text>

      <ScrollView>
        {clientes.length === 0 ? (
          <Text style={{ color: '#666', padding: 8 }}>No hay clientes registrados.</Text>
        ) : (
          <View style={{ paddingBottom: 20 }}>
            {clientes.map((cliente) => (
              <View key={cliente.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.name}>{(cliente.Nombre || '') + ' ' + (cliente.Apellido || '')}</Text>
                    <Text style={styles.meta}>Cédula: {cliente.Cedula || '-'}</Text>
                    <Text style={styles.meta}>Dirección: {cliente.Direccion || '-'}</Text>
                    <Text style={styles.meta}>Teléfono: {cliente.Telefono || '-'}</Text>
                    <Text style={styles.meta}>Usuario: {cliente.UsuarioNombre || cliente.Usuario || (cliente.UsuarioId ? cliente.UsuarioId : 'No vinculado')}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.editButton} onPress={() => editarCliente(cliente)}><Text style={styles.buttonText}>🖋️</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarCliente(cliente.id)}><Text style={styles.buttonText}>🗑️</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => onSelectCliente && onSelectCliente(cliente)}><Text style={{ color: '#0b60d9', fontWeight: '700' }}>{cliente.UsuarioId ? 'Vinculado' : 'Vincular'}</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const clientsWrapper = (clientes, eliminarCliente, editarCliente, onSelectCliente) => (
  <View>
    <View style={styles.header}>
      <Text style={styles.headerText}>Apellido</Text>
      <Text style={styles.headerText}>Cédula</Text>
      <Text style={styles.headerText}>Dirección</Text>
      <Text style={styles.headerText}>Nombre</Text>
      <Text style={styles.headerText}>Teléfono</Text>
      <Text style={styles.headerText}>Usuario</Text>
      <Text style={styles.headerText}>Acciones</Text>
    </View>

    {clientes.map((cliente) => (
      <View key={cliente.id} style={styles.row}>
        <Text style={styles.cell}>{cliente.Apellido}</Text>
        <Text style={styles.cell}>{cliente.Cedula}</Text>
        <Text style={styles.cell}>{cliente.Direccion}</Text>
        <Text style={styles.cell}>{cliente.Nombre}</Text>
        <Text style={styles.cell}>{cliente.Telefono}</Text>
        <TouchableOpacity style={[styles.cell, styles.linkCell]} onPress={() => onSelectCliente && onSelectCliente(cliente)}>
          <Text style={{ color: cliente.UsuarioId ? '#0b60d9' : '#666', fontWeight: cliente.UsuarioId ? '700' : '600' }}>{cliente.UsuarioId ? (cliente.UsuarioNombre || cliente.Usuario || cliente.UsuarioId) : 'Vincular'}</Text>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => editarCliente(cliente)}
          >
            <Text style={styles.buttonText}>🖋️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => eliminarCliente(cliente.id)}
          >
            <Text style={styles.buttonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  name: { fontSize: 16, fontWeight: '800', marginBottom: 6, color: '#0b60d9' },
  meta: { color: '#555', marginBottom: 4 },
  actionButtons: { alignItems: 'flex-end' },
  editButton: { backgroundColor: '#007bff', padding: 8, borderRadius: 6, width: 40, alignItems: 'center', marginBottom: 6 },
  deleteButton: { backgroundColor: '#ff4444', padding: 8, borderRadius: 6, width: 40, alignItems: 'center', marginBottom: 6 },
  linkButton: { paddingVertical: 6, paddingHorizontal: 8 },
  buttonText: { fontSize: 16 },
});

export default TablaCliente;
