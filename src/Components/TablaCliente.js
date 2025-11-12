import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import SafeText from './SafeText';
import { db } from "../firebase.js";
import { collection, getDocs } from "firebase/firestore";

const TablaCliente = ({ clientes, eliminarCliente, editarCliente }) => {
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'Usuario'));
        const map = {};
        snap.docs.forEach(d => {
          const r = d.data();
          map[d.id] = r.Usuario || r.UsuarioId || r.name || d.id;
        });
        if (mounted) setUserMap(map);
      } catch (e) {
        console.error('Error cargando usuarios en TablaCliente', e);
      }
    };
    loadUsers();
    return () => { mounted = false; };
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lista de Clientes</Text>
      
      <ScrollView horizontal>
        <View>
          <View style={styles.header}>
            <Text style={styles.headerText}>Nombre y Apellido</Text>
            <Text style={styles.headerText}>Cédula</Text>
            <Text style={styles.headerText}>Dirección</Text>
            <Text style={styles.headerText}>Teléfono</Text>
            <Text style={styles.headerText}>Usuario</Text>
            <Text style={styles.headerText}>Acciones</Text>
          </View>

          {clientes.map((cliente) => (
            <View key={cliente.id} style={styles.row}>
              <SafeText style={styles.cell}>{`${cliente.Nombre || ''} ${cliente.Apellido || ''}`.trim()}</SafeText>
              <SafeText style={styles.cell}>{cliente.Cedula}</SafeText>
              <SafeText style={styles.cell}>{cliente.Direccion}</SafeText>
              <SafeText style={styles.cell}>{cliente.Telefono}</SafeText>
              <SafeText style={styles.cell}>{userMap[cliente.UsuarioId] || '—'}</SafeText>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  header: { flexDirection: "row", backgroundColor: "#f0f0f0", padding: 10 },
  headerText: { width: 100, fontWeight: "bold", textAlign: "center" },
  row: { flexDirection: "row", padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc", alignItems: "center" },
  cell: { width: 100, textAlign: "center" },
  actionButtons: { flexDirection: "row", width: 100, justifyContent: "space-around" },
  editButton: { backgroundColor: "#007bff", padding: 8, borderRadius: 5, width: 35, alignItems: "center" },
  deleteButton: { backgroundColor: "#ff4444", padding: 8, borderRadius: 5, width: 35, alignItems: "center" },
  buttonText: { fontSize: 16 },
});

export default TablaCliente;
