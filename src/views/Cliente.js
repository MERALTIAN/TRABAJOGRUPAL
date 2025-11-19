import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, doc } from "firebase/firestore";
import { safeDeleteDoc, safeUpdateDoc } from '../utils/firestoreUtils';
import FormularioCliente from "../Components/FormularioCliente.js";
import UserRoleList from '../Components/UserRoleList.js';
import SafeModal from '../Components/SafeModal.js';
import ModalEditar from "../Components/ModalEditar.js";
import { cardStyles } from "../Styles/cardStyles.js";
import Feather from '@expo/vector-icons/Feather';

const Cliente = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUserForCliente, setSelectedUserForCliente] = useState(null);
  const [selectedClientRecord, setSelectedClientRecord] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Cliente"));
      const data = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClientes(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  const eliminarCliente = async (id) => {
    try {
      if (!id) { console.warn('Cliente.eliminarCliente: id faltante', id); return; }
      await safeDeleteDoc('Cliente', id);
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const editarCliente = (cliente) => {
    setClienteEditar(cliente);
    setModalVisible(true);
  };

  const onSelectCliente = (cliente) => {
    // open modal with users when touching a client row
    setSelectedClientRecord(cliente);
    setSelectedUserForCliente(null);
    setUserModalVisible(true);
  };

  const desvincularUsuario = async (cliente) => {
    try {
      if (!cliente || !cliente.id) return;
      Alert.alert(
        'Desvincular usuario',
        `¿Seguro que quieres desvincular el usuario de ${cliente.Nombre || cliente.id}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Desvincular', style: 'destructive', onPress: async () => {
            try {
              await safeUpdateDoc('Cliente', cliente.id, { UsuarioId: null, UsuarioNombre: null });
              await cargarDatos();
              Alert.alert('Desvinculado', 'Usuario desvinculado correctamente.');
            } catch (err) {
              console.error('Error desvinculando usuario del cliente', err);
              Alert.alert('Error', 'No se pudo desvincular el usuario.');
            }
          }}
        ]
      );
    } catch (e) {
      console.error('Error desvinculando usuario del cliente', e);
    }
  };

  const assignUserToClient = async (user) => {
    if (!selectedClientRecord || !selectedClientRecord.id) return;
    try {
      await safeUpdateDoc('Cliente', selectedClientRecord.id, {
        UsuarioId: user.id,
        UsuarioNombre: user.Usuario || user.Nombre || null,
      });
      // feedback and refresh data
      Alert.alert('Usuario vinculado', `${user.Usuario || user.Nombre || user.id} vinculado a ${selectedClientRecord.Nombre || selectedClientRecord.id}`);
      setUserModalVisible(false);
      setSelectedUserForCliente(user);
      setSelectedClientRecord(null);
      // Optimistically update local state so UI reflects change immediately
      setClientes(prev => prev.map(c => c.id === selectedClientRecord.id ? { ...c, UsuarioId: user.id, UsuarioNombre: user.Usuario || user.Nombre || null } : c));
      // still refresh from server to ensure consistency
      await cargarDatos();
    } catch (err) {
      console.error('Error vinculando usuario al cliente:', err);
    }
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setClienteEditar(null);
  };

  const clienteFields = [
    { key: 'Apellido', label: 'Apellido', type: 'text' },
    { key: 'Cedula', label: 'Cédula', type: 'text' },
    { key: 'Direccion', label: 'Dirección', type: 'text' },
    { key: 'Nombre', label: 'Nombre', type: 'text' },
    { key: 'Telefono', label: 'Teléfono', type: 'text', keyboardType: 'phone-pad' },
    { key: 'UsuarioId', label: 'Usuario (vincular / cambiar)', type: 'usuario' },
  ];

  useEffect(() => {
    cargarDatos();
    // LayoutAnimation enabling on Android is a no-op in the new RN architecture.
    // Skipping UIManager.setLayoutAnimationEnabledExperimental to avoid noisy warnings.
  }, []);
  // Render de cada cliente como tarjeta (estilo Ejemplo)
  const renderClienteCard = (cliente) => {
    const isExpanded = expandedId === cliente.id;
    return (
      <View key={cliente.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{cliente.Nombre} {cliente.Apellido}</Text>
          <TouchableOpacity
            style={styles.ellipsisButton}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpandedId(isExpanded ? null : cliente.id);
            }}
          >
            <Feather name="more-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cédula:</Text>
              <Text style={styles.detailValue}>{cliente.Cedula}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dirección:</Text>
              <Text style={styles.detailValue}>{cliente.Direccion}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Teléfono:</Text>
              <Text style={styles.detailValue}>{cliente.Telefono}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Usuario:</Text>
              <Text style={styles.detailValue}>{cliente.UsuarioNombre || 'No vinculado'}</Text>
            </View>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={[styles.cardButton, styles.deleteButton]}
                onPress={() => { eliminarCliente(cliente.id); }}
              >
                <Feather name="trash-2" size={16} color="#fff" />
                <Text style={[styles.cardButtonText, styles.deleteButtonText]}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardButton, styles.editButton]}
                onPress={() => editarCliente(cliente)}
              >
                <Feather name="edit-2" size={18} color="#fff" />
                <Text style={[styles.cardButtonText, styles.editButtonText]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardButton, styles.neutralButton]}
                onPress={() => onSelectCliente(cliente)}
              >
                <Feather name="link" size={18} color="#111827" />
                <Text style={[styles.cardButtonText, styles.neutralButtonText]}>Vincular</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardButton, styles.unlinkButton]}
                onPress={() => desvincularUsuario(cliente)}
              >
                <Feather name="user-x" size={18} color="#ef4444" />
                <Text style={[styles.cardButtonText, styles.unlinkButtonText]}>Desvincular</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Tarjeta del formulario */}
        <View style={styles.formWrapper}>
          <FormularioCliente cargarDatos={cargarDatos} />
        </View>

        <Text style={[styles.title, { marginBottom:16, marginTop:-10 }]}>Lista de Clientes</Text>

        {clientes.map(renderClienteCard)}

        {/* When a client row is tapped, open the modal with users for selection */}
        <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => { setUserModalVisible(false); setSelectedClientRecord(null); setSelectedUserForCliente(null); }}>
          <View style={styles.modalInner}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Usuarios (rol: Cliente)</Text>
            {/* compact list: ordered, small table-like picker */}
<<<<<<< HEAD
            <UserRoleList role="Cliente" searchable={true} compact={true} compactMaxHeight={220} onSelect={(u) => { setSelectedUserForCliente(u); }} />
=======
            <UserRoleList role="Cliente" searchable={true} compact={true} compactMaxHeight={220} onSelect={(u) => { try { console.log('[Cliente] selected user (temp):', u && (u.id || u.Usuario || u.Nombre)); } catch(e){}; setSelectedUserForCliente(u); }} />
>>>>>>> 5fbf38289c9abfae05a373607c2334a9a47b1674

            {/* show the selected user as a small record below the list */}
            {selectedUserForCliente ? (
              <View style={{ marginTop: 12, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e6e9ee', backgroundColor: '#fff' }}>
                <Text style={{ fontWeight: '700', color: '#0b60d9' }}>{selectedUserForCliente.Usuario || selectedUserForCliente.Nombre || selectedUserForCliente.id}</Text>
                <Text style={{ color: '#666', marginTop: 4 }}>{selectedUserForCliente.Email || selectedUserForCliente.Telefono || ''}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <TouchableOpacity onPress={() => { setSelectedUserForCliente(null); }} style={{ marginRight: 12 }}><Text>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={async () => {
                    // perform the assignment
                    await assignUserToClient(selectedUserForCliente);
                  }} style={{ backgroundColor: '#0b60d9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}><Text style={{ color: '#fff' }}>Vincular</Text></TouchableOpacity>
                </View>
              </View>
            ) : null}

            <TouchableOpacity onPress={() => { setUserModalVisible(false); setSelectedClientRecord(null); setSelectedUserForCliente(null); }} style={{ marginTop: 12, alignSelf: 'flex-end' }}><Text>Cerrar</Text></TouchableOpacity>
          </View>
        </SafeModal>
      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={clienteEditar}
        collection={"Cliente"}
        fields={clienteFields}
        onUpdate={cargarDatos}
        title="Editar Cliente"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 2,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#444444",
    textAlign: "center",
    marginBottom: 5,
  },
  formWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e3e8ee",
  },
  ...cardStyles,
  userRow: { padding: 12, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 8, backgroundColor: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalInner: { width: '92%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  closeBtn: { padding: 8 }
});

export default Cliente;