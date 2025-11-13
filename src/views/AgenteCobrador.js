import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, doc } from "firebase/firestore";
import { safeDeleteDoc, safeUpdateDoc } from '../utils/firestoreUtils';
import FormularioAgenteCobrador from "../Components/FormularioAgenteCobrador.js";
import TablaAgenteCobrador from "../Components/TablaAgenteCobrador.js";
import ModalEditar from "../Components/ModalEditar.js";
import UserRoleList from '../Components/UserRoleList.js';
import SafeModal from '../Components/SafeModal.js';

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
      if (!id) {
        console.warn('AgenteCobrador.eliminarAgenteCobrador: id faltante', id);
        return;
      }
      await safeDeleteDoc('Agente_Cobrador', id);
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
      await safeUpdateDoc('Agente_Cobrador', agenteRecordId, {
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
      <View>
        <FormularioAgenteCobrador cargarDatos={cargarDatos} />
        <TablaAgenteCobrador 
          agentes={agentes} 
          eliminarAgenteCobrador={eliminarAgenteCobrador}
          editarAgenteCobrador={editarAgenteCobrador}
          onSelectAgente={(a) => { setSelectedAgent(a); setUserModalVisible(true); }}
          desvincularUsuario={async (a) => {
            try {
              if (!a || !a.id) {
                console.warn('AgenteCobrador.desvincularUsuario: agente inválido', a);
                return;
              }
              Alert.alert(
                'Desvincular usuario',
                `¿Seguro que quieres desvincular el usuario de ${a.Nombre || a.id}?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Desvincular', style: 'destructive', onPress: async () => {
                    try {
                      await safeUpdateDoc('Agente_Cobrador', a.id, { UsuarioId: null, UsuarioNombre: null });
                      cargarDatos();
                      Alert.alert('Desvinculado', `Agente ${a.Nombre || a.id} desvinculado de usuario`);
                    } catch (err) {
                      console.error('Error desvinculando usuario del agente:', err);
                      Alert.alert('Error', 'No se pudo desvincular el usuario del agente.');
                    }
                  }}
                ]
              );
            } catch (err) {
              console.error('Error desvinculando usuario del agente:', err);
            }
          }}
        />

        {/* AccesoContrato removed as requested (agent access removed from this view) */}
      </View>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={agenteEditar}
        collection={"Agente_Cobrador"}
        fields={agenteFields}
        onUpdate={cargarDatos}
        title="Editar Agente Cobrador"
      />
    <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => setUserModalVisible(false)}>
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Usuarios (rol: Agente)</Text>
        <UserRoleList role="Agente" searchable={true} onSelect={(u) => { 
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