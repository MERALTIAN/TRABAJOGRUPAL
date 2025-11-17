import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import SafeModal from '../Components/SafeModal';
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, doc } from "firebase/firestore";
import { safeDeleteDoc } from '../utils/firestoreUtils';
import FormularioUsuario from "../Components/FormularioUsuario.js";
import TablaUsuario from "../Components/TablaUsuario.js";
import { Card, PrimaryButton, Title } from '../Components/UI';

const Usuario = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filter, setFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const scrollRef = useRef(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const editFormRef = useRef(null);

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

  const roleCounts = usuarios.reduce((acc, u) => {
    const r = (u.rol || u.Rol || 'Sin rol').toString();
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const editarUsuario = (u) => {
    // open modal edit with the user data
    setEditingUser(null);
    setTimeout(() => {
      setEditingUser({ ...u });
      setEditModalVisible(true);
    }, 50);
  };

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ paddingBottom: 40, alignItems: 'center', paddingHorizontal: 20, width: '100%' }} keyboardShouldPersistTaps="handled">
      <View style={[styles.header, styles.contentWidth, styles.headerCentered]}>
        <Title style={styles.title}>Usuarios</Title>
      </View>
      {/* Resumen eliminado por solicitud: se simplifica la vista Usuarios */}
      <Card style={[styles.formArea, styles.contentWidth, { padding: 16 }]}> 
        <FormularioUsuario cargarDatos={cargarDatos} initialData={null} onDone={() => {}} />
      </Card>

      {/* Modal para edición */}
      <SafeModal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => { setEditModalVisible(false); setEditingUser(null); }}>
        <View style={modalStyles.modalWrap}>
          <View style={modalStyles.modalCard}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity onPress={() => { setEditModalVisible(false); setEditingUser(null); }} style={{ padding:8 }}>
                <Text style={{ fontSize:18 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={modalStyles.modalBody}>
              <FormularioUsuario ref={editFormRef} cargarDatos={cargarDatos} initialData={editingUser} onDone={() => { setEditModalVisible(false); setEditingUser(null); }} />
            </View>
            <View style={modalStyles.modalFooter}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => { setEditModalVisible(false); setEditingUser(null); }}>
                <Text style={{ color:'#fff', fontWeight:'700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.updateBtn} onPress={() => { try { editFormRef.current?.submit(); } catch(e) { console.error(e); } }}>
                <Text style={{ color:'#fff', fontWeight:'700' }}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeModal>

      <View style={[styles.listArea, styles.contentWidth]}>
        <TextInput placeholder="Buscar por nombre, usuario o rol..." value={filter} onChangeText={setFilter} style={styles.search} />
        <TablaUsuario useScrollView={true} usuarios={usuarios.filter(u => {
          const q = filter.toLowerCase().trim();
          if (!q) return true;
          const name = ((u.Nombre || '') + ' ' + (u.Apellido || '')).toLowerCase();
          const usuarioField = (u.Usuario || u.email || '').toLowerCase();
          const rol = (u.rol || u.Rol || '').toString().toLowerCase();
          return name.includes(q) || usuarioField.includes(q) || rol.includes(q) || (u.id || '').toLowerCase().includes(q);
        })} eliminarUsuario={eliminarUsuario} editarUsuario={editarUsuario} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 0, paddingTop: 12, backgroundColor: '#f4f7fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerCentered: { justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', color: '#0b1320' },
  refreshBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  formArea: { marginTop: 8, marginBottom: 12, borderRadius: 12, padding: 6 },
  listArea: { marginTop: 12, flex: 1 },
  search: { borderWidth: 1, borderColor: '#e6e9ee', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff', marginBottom: 18, width: '100%', maxWidth: 720, alignSelf: 'center' },
  listTitle: { textAlign: 'center', fontSize: 20, fontWeight: '800', marginVertical: 6, color: '#0b1320' },
  summaryCard: { marginBottom: 12 },
  contentWidth: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  formArea: { marginTop: 8, marginBottom: 12, borderRadius: 12, padding: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryNumber: { fontSize: 28, fontWeight: '900', color: '#0b1320' },
  summaryLabel: { color: '#666' },
  rolesWrap: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  roleChip: { backgroundColor: '#f0f6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, marginLeft: 8 },
  roleChipText: { color: '#0b60d9', fontWeight: '700' },
});

const modalStyles = StyleSheet.create({
  modalWrap: { flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:16 },
  modalCard: { width: '100%', maxWidth: 640, backgroundColor:'#fff', borderRadius:12, overflow:'hidden' },
  modalHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:1, borderBottomColor:'#f2f2f2' },
  modalTitle: { fontSize:18, fontWeight:'800' },
  modalBody: { padding: 12, maxHeight: '70%' },
  modalFooter: { flexDirection:'row', justifyContent:'space-between', padding:12, borderTopWidth:1, borderTopColor:'#f2f2f2' },
  cancelBtn: { backgroundColor:'#6b7280', paddingVertical:12, paddingHorizontal:20, borderRadius:8 },
  updateBtn: { backgroundColor:'#10b981', paddingVertical:12, paddingHorizontal:20, borderRadius:8 }
});

export default Usuario;