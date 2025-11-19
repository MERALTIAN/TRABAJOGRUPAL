import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs } from "firebase/firestore";
import { safeDeleteDoc } from '../utils/firestoreUtils';
import FormularioUsuario from "../Components/FormularioUsuario.js";
import { cardStyles } from "../Styles/cardStyles.js";
import { MaterialIcons } from '@expo/vector-icons';
import SafeModal from '../Components/SafeModal';

const Usuario = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await cargarDatos();
    } catch (e) {
      console.error('Error refreshing users', e);
    } finally {
      setRefreshing(false);
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
    // LayoutAnimation enabling on Android is a no-op in the new RN architecture.
    // Skipping UIManager.setLayoutAnimationEnabledExperimental to avoid noisy warnings.
  }, []);
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.formWrapper}>
          <FormularioUsuario cargarDatos={cargarDatos} />
        </View>
        {/* Header with manual refresh button */}
        <View style={{ width: '100%', alignItems: 'flex-end', paddingHorizontal: 18, marginTop: -12 }}>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} accessibilityLabel="Actualizar lista">
            {refreshing ? (
              <ActivityIndicator size="small" color="#0b60d9" />
            ) : (
              <MaterialIcons name="refresh" size={20} color="#0b60d9" />
            )}
          </TouchableOpacity>
        </View>
        {usuarios.map((usuario) => {
          const isExpanded = expandedId === usuario.id;
          return (
            <View key={usuario.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{usuario.Usuario || usuario.Nombre}</Text>
                  <Text style={styles.cardSubtitle}>{usuario.rol}</Text>
                </View>
                <TouchableOpacity
                  style={styles.ellipsisButton}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setExpandedId(isExpanded ? null : usuario.id);
                  }}
                >
                  <MaterialIcons name="more-vert" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {isExpanded && (
                <View style={styles.expandedDetailsContainer}>
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={[styles.cardButton, styles.editButton]}
                      onPress={() => {
                        setEditingUser(usuario);
                        setEditModalVisible(true);
                      }}
                    >
                      <MaterialIcons name="edit" size={16} color="#ffffffff" />
                      <Text style={[styles.cardButtonText, styles.editButtonText]}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cardButton, styles.deleteButton]}
                      onPress={() => eliminarUsuario(usuario.id)}
                    >
                      <MaterialIcons name="delete" size={16} color="#ffffffff" />
                      <Text style={[styles.cardButtonText, styles.deleteButtonText]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Edit modal */}
        <SafeModal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => { setEditModalVisible(false); setEditingUser(null); }}>
          <View style={{ flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:16 }}>
            <View style={{ width:'100%', maxWidth:640, backgroundColor:'#fff', borderRadius:12, overflow:'hidden' }}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:1, borderBottomColor:'#f2f2f2' }}>
                <Text style={{ fontSize:18, fontWeight:'800' }}>Editar Usuario</Text>
                <TouchableOpacity onPress={() => { setEditModalVisible(false); setEditingUser(null); }} style={{ padding:8 }}>
                  <Text style={{ fontSize:18 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={{ padding:12 }}>
                <FormularioUsuario ref={editFormRef} cargarDatos={cargarDatos} initialData={editingUser} onDone={() => { setEditModalVisible(false); setEditingUser(null); }} />
              </View>
              <View style={{ flexDirection:'row', justifyContent:'space-between', padding:12, borderTopWidth:1, borderTopColor:'#f2f2f2' }}>
                <TouchableOpacity style={{ backgroundColor:'#6b7280', paddingVertical:12, paddingHorizontal:20, borderRadius:8 }} onPress={() => { setEditModalVisible(false); setEditingUser(null); }}>
                  <Text style={{ color:'#fff', fontWeight:'700' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor:'#0b60d9', paddingVertical:12, paddingHorizontal:20, borderRadius:8 }} onPress={() => { try { editFormRef.current?.submit(); } catch(e) { console.error(e); } }}>
                  <Text style={{ color:'#fff', fontWeight:'700' }}>Actualizar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeModal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 0, paddingTop: 12, backgroundColor: '#f4f7fb' },
  scrollContainer: { padding: 2, paddingBottom: 40 },
  formWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e3e8ee',
  },
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
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  ...cardStyles,
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