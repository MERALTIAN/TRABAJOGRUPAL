import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, doc } from "firebase/firestore";
import { safeDeleteDoc } from '../utils/firestoreUtils';
import FormularioUsuario from "../Components/FormularioUsuario.js";
import TablaUsuario from "../Components/TablaUsuario.js";

const Usuario = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filter, setFilter] = useState('');

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Usuario"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      if (!id) { console.warn('Usuario.eliminarUsuario: id faltante', id); return; }
      await safeDeleteDoc('Usuario', id);
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={cargarDatos} style={styles.refreshBtn}><Text style={{ color: '#1e90ff', fontWeight: '700' }}>Actualizar</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.formArea}>
        <FormularioUsuario cargarDatos={cargarDatos} />
      </View>

      <View style={styles.listArea}>
        <TextInput placeholder="Buscar por nombre, usuario o rol..." value={filter} onChangeText={setFilter} style={styles.search} />
        <TablaUsuario useScrollView={true} usuarios={usuarios.filter(u => {
          const q = filter.toLowerCase().trim();
          if (!q) return true;
          const name = ((u.Nombre || '') + ' ' + (u.Apellido || '')).toLowerCase();
          const usuarioField = (u.Usuario || u.email || '').toLowerCase();
          const rol = (u.rol || u.Rol || '').toString().toLowerCase();
          return name.includes(q) || usuarioField.includes(q) || rol.includes(q) || (u.id || '').toLowerCase().includes(q);
        })} eliminarUsuario={eliminarUsuario} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 12, backgroundColor: '#f4f7fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'left' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  refreshBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  formArea: { marginTop: 8, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  listArea: { marginTop: 12, flex: 1 },
  search: { borderWidth: 1, borderColor: '#e6e9ee', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', marginBottom: 12 },
});

export default Usuario;