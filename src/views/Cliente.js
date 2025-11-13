import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, doc } from "firebase/firestore";
import { safeDeleteDoc, safeUpdateDoc } from '../utils/firestoreUtils';
import FormularioCliente from "../Components/FormularioCliente.js";
import TablaCliente from "../Components/TablaCliente.js";
import UserRoleList from '../Components/UserRoleList.js';
import SafeModal from '../Components/SafeModal.js';
// UserRoleList not required here; selection handled inside forms
import ModalEditar from "../Components/ModalEditar.js";

const Cliente = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUserForCliente, setSelectedUserForCliente] = useState(null);
  const [selectedClientRecord, setSelectedClientRecord] = useState(null);

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Cliente"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClientes(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
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
    setUserModalVisible(true);
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
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
        <FormularioCliente cargarDatos={cargarDatos} />
        <TablaCliente 
          clientes={clientes} 
          eliminarCliente={eliminarCliente}
          editarCliente={editarCliente}
          onSelectCliente={onSelectCliente}
          desvincularUsuario={desvincularUsuario}
        />

        {/* When a client row is tapped, open the modal with users for selection */}
        <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => { setUserModalVisible(false); setSelectedClientRecord(null); }}>
          <View style={{ padding: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Usuarios (rol: Cliente)</Text>
            <UserRoleList role="Cliente" searchable={true} onSelect={(u) => { assignUserToClient(u); }} />
            <TouchableOpacity onPress={() => { setUserModalVisible(false); setSelectedClientRecord(null); }} style={{ marginTop: 12, alignSelf: 'flex-end' }}><Text>Cerrar</Text></TouchableOpacity>
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
  container: { flex: 2.5, padding: 20 },
  userRow: { padding: 12, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 8, backgroundColor: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalInner: { width: '92%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  closeBtn: { padding: 8 }
});

export default Cliente;