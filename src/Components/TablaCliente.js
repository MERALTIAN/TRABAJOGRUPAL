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
          clientsWrapper(clientes, eliminarCliente, editarCliente, onSelectCliente)
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
  header: { flexDirection: "row", backgroundColor: "#f0f0f0", padding: 10 },
  headerText: { width: 100, fontWeight: "bold", textAlign: "center" },
  row: { flexDirection: "row", padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc", alignItems: "center" },
  cell: { width: 100, textAlign: "center" },
  linkCell: { width: 100, textAlign: "center" },
  actionButtons: { flexDirection: "row", width: 100, justifyContent: "space-around" },
  editButton: { backgroundColor: "#007bff", padding: 8, borderRadius: 5, width: 35, alignItems: "center" },
  deleteButton: { backgroundColor: "#ff4444", padding: 8, borderRadius: 5, width: 35, alignItems: "center" },
  buttonText: { fontSize: 16 },
});

export default TablaCliente;
