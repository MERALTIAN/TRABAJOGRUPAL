import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import FormularioAgenteCobrador from "../Components/FormularioAgenteCobrador.js";
import TablaAgenteCobrador from "../Components/TablaAgenteCobrador.js";
import ModalEditar from "../Components/ModalEditar.js";
import UserRoleList from '../Components/UserRoleList.js';
import SafeModal from '../Components/SafeModal.js';
import AccesoContrato from './AccesoContrato_fixed.js';

const AgenteCobrador = () => {
  const [agentes, setAgentes] = useState([]);
  const [agenteEditar, setAgenteEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUserForAgent, setSelectedUserForAgent] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Agente_Cobrador"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAgentes(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  const eliminarAgenteCobrador = async (id) => {
    try {
      await deleteDoc(doc(db, "Agente_Cobrador", id));
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const editarAgenteCobrador = (agente) => {
    setAgenteEditar(agente);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setAgenteEditar(null);
  };

  const assignUserToAgent = async (user, agenteRecordId) => {
    try {
      // if agenteRecordId is provided, update that agent; otherwise ignore
      if (!agenteRecordId) {
        // try to find an agente record if only one is selected? For now require selection from UI
        console.warn('No agente seleccionado para asignar usuario');
        return;
      }
      await updateDoc(doc(db, 'Agente_Cobrador', agenteRecordId), {
        UsuarioId: user.id,
        UsuarioNombre: user.Usuario || user.Nombre || null,
      });
      cargarDatos();
      setSelectedUserForAgent(user);
    } catch (err) {
      console.error('Error asignando usuario a agente:', err);
    }
  };

  const agenteFields = [
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
        <FormularioAgenteCobrador cargarDatos={cargarDatos} />
        <TablaAgenteCobrador 
          agentes={agentes} 
          eliminarAgenteCobrador={eliminarAgenteCobrador}
          editarAgenteCobrador={editarAgenteCobrador}
          onSelectAgente={(a) => { setSelectedAgent(a); setUserModalVisible(true); }}
        />

        {/* Embed contract access UI so agents can list and register payments directly */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Contratos (Acceso Agente)</Text>
          <AccesoContrato />
        </View>
      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={agenteEditar}
        collectionName="Agente_Cobrador"
        fields={agenteFields}
        onUpdate={cargarDatos}
        title="Editar Agente Cobrador"
      />
    <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => setUserModalVisible(false)}>
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Usuarios (rol: Agente)</Text>
        <UserRoleList role="Agente" onSelect={(u) => { 
            if (selectedAgent && selectedAgent.id) {
              assignUserToAgent(u, selectedAgent.id);
              setUserModalVisible(false);
              Alert.alert('Usuario vinculado', `${u.Usuario || u.Nombre || u.id} → ${selectedAgent.Nombre || selectedAgent.id}`);
            } else {
              setSelectedUserForAgent(u);
              setUserModalVisible(false);
            }
          }} />
        <TouchableOpacity onPress={() => setUserModalVisible(false)} style={{ marginTop: 12, alignSelf: 'flex-end' }}><Text>Cerrar</Text></TouchableOpacity>
      </View>
    </SafeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 2.5, padding: 20 },
});

export default AgenteCobrador;