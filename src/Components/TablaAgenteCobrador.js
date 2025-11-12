import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import SafeText from './SafeText';
import { db } from "../firebase.js";
import { collection, getDocs } from 'firebase/firestore';

const TablaAgenteCobrador = ({ agentes = [], eliminarAgenteCobrador, editarAgenteCobrador }) => {
  const [userMap, setUserMap] = useState({});
  const [adminList, setAdminList] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'Usuario'));
        const map = {};
        snap.docs.forEach(d => { const r = d.data(); map[d.id] = r.Usuario || d.id; });
        const admins = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => (u.rol || '').toString().toLowerCase() === 'administrador');
        if (mounted) setUserMap(map);
        if (mounted) setAdminList(admins);
      } catch (e) {
        console.error('Error cargando usuarios en TablaAgenteCobrador', e);
      }
    };
    loadUsers();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lista de Agentes Cobradores</Text>
      <ScrollView horizontal>
        <View>
          <View style={styles.header}>
            <Text style={styles.headerText}>Nombre</Text>
            <Text style={styles.headerText}>Teléfono</Text>
            <Text style={styles.headerText}>Usuario</Text>
            <Text style={styles.headerText}>Acciones</Text>
          </View>

          {agentes.map((agente) => (
            <View key={agente.id} style={styles.row}>
              <SafeText style={styles.cell}>{agente.Nombre}</SafeText>
              <SafeText style={styles.cell}>{agente.Telefono}</SafeText>
              <SafeText style={styles.cell}>{userMap[agente.UsuarioId] || '—'}</SafeText>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editButton} onPress={() => editarAgenteCobrador && editarAgenteCobrador(agente)}>
                  <Text style={styles.buttonText}>🖋️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarAgenteCobrador && eliminarAgenteCobrador(agente.id)}>
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
  titulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  header: { flexDirection: 'row', backgroundColor: '#f0f0f0', padding: 10 },
  headerText: { width: 140, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', alignItems: 'center' },
  cell: { width: 140, textAlign: 'center' },
  actionButtons: { flexDirection: 'row', width: 140, justifyContent: 'space-around' },
  editButton: { backgroundColor: '#007bff', padding: 8, borderRadius: 5, width: 35, alignItems: 'center' },
  deleteButton: { backgroundColor: '#ff4444', padding: 8, borderRadius: 5, width: 35, alignItems: 'center' },
  buttonText: { fontSize: 16 },
});

export default TablaAgenteCobrador;
