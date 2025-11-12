import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from "react-native";
import { db } from "../firebase.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import FormularioCliente from "../Components/FormularioCliente.js";
import TablaCliente from "../Components/TablaCliente.js";
// UserRoleList not required here; selection handled inside forms
import ModalEditar from "../Components/ModalEditar.js";

const Cliente = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const eliminarCliente = async (id) => {
    try {
      await deleteDoc(doc(db, "Cliente", id));
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const editarCliente = (cliente) => {
    setClienteEditar(cliente);
    setModalVisible(true);
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
        />

        {/* User selector removed from Cliente view per UX request; selection is performed inside forms when needed. */}
      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={clienteEditar}
        collectionName="Cliente"
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