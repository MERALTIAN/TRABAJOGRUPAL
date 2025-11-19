import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, doc } from "firebase/firestore";
import { safeDeleteDoc, safeUpdateDoc } from '../utils/firestoreUtils';
import FormularioAgenteCobrador from "../Components/FormularioAgenteCobrador.js";
import TablaAgenteCobrador from "../Components/TablaAgenteCobrador.js";
import ModalEditar from "../Components/ModalEditar.js";
import UserRoleList from '../Components/UserRoleList.js';
import SafeModal from '../Components/SafeModal.js';
import { cardStyles } from '../Styles/cardStyles.js';
import Feather from '@expo/vector-icons/Feather';

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
      // Optimistically update local state so UI reflects change immediately
      setAgentes(prev => prev.map(a => a.id === agenteRecordId ? { ...a, UsuarioId: user.id, UsuarioNombre: user.Usuario || user.Nombre || null } : a));
      setSelectedUserForAgent(user);
      try {
        await safeUpdateDoc('Agente_Cobrador', agenteRecordId, {
          UsuarioId: user.id,
          UsuarioNombre: user.Usuario || user.Nombre || null,
        });
      } catch (err) {
        console.error('Error asignando usuario en firestore para agente:', err);
      }
      // refresh from server to ensure consistency
      cargarDatos();
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
    // LayoutAnimation enabling on Android is a no-op in the new RN architecture.
    // Skipping UIManager.setLayoutAnimationEnabledExperimental to avoid noisy warnings.
  }, []);

  const [expandedId, setExpandedId] = useState(null);

  const renderAgenteCard = (agente) => {
    const isExpanded = expandedId === agente.id;
    return (
      <View key={agente.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{agente.Nombre}</Text>
          {agente.UsuarioNombre ? <Text style={styles.cardSubtitle}>{agente.UsuarioNombre}</Text> : null}
          <TouchableOpacity
            style={styles.ellipsisButton}
            onPress={() => {
              try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch(e) {}
              setExpandedId(isExpanded ? null : agente.id);
            }}
          >
            <Feather name="more-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Teléfono:</Text>
              <Text style={styles.detailValue}>{agente.Telefono}</Text>
            </View>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={[styles.cardButton, styles.deleteButton]}
                onPress={() => eliminarAgenteCobrador(agente.id)}
              >
                <Feather name="trash-2" size={16} color="#ffffffff" />
                <Text style={[styles.cardButtonText, styles.deleteButtonText]}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardButton, styles.editButton, { marginLeft: 8 }]}
                onPress={() => editarAgenteCobrador(agente)}
              >
                <Feather name="edit-2" size={16} color="#1D4ED8" />
                <Text style={[styles.cardButtonText, styles.editButtonText]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardButton, styles.neutralButton, { marginLeft: 8 }]}
                onPress={() => { setSelectedAgent(agente); setSelectedUserForAgent(null); setUserModalVisible(true); }}
              >
                <Feather name="link" size={18} color="#111827" />
                <Text style={[styles.cardButtonText, styles.neutralButtonText]}>Vincular</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardButton, styles.unlinkButton, { marginLeft: 8 }]}
                onPress={() => {
                  // desvincular
                  Alert.alert('Desvincular usuario', `¿Desvincular usuario de ${agente.Nombre || agente.id}?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Desvincular', style: 'destructive', onPress: async () => {
                      try {
                        await safeUpdateDoc('Agente_Cobrador', agente.id, { UsuarioId: null, UsuarioNombre: null });
                        cargarDatos();
                        Alert.alert('Desvinculado', 'Usuario desvinculado correctamente.');
                      } catch (err) {
                        console.error('Error desvinculando usuario del agente', err);
                        Alert.alert('Error', 'No se pudo desvincular el usuario.');
                      }
                    }}
                  ]);
                }}
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
        <View style={styles.formWrapper}>
          <FormularioAgenteCobrador cargarDatos={cargarDatos} />
        </View>

        <Text style={[styles.title, { marginBottom: 16, marginTop: -10 }]}>Agentes Cobradores</Text>

        {agentes.map(renderAgenteCard)}
      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={agenteEditar}
        collection={"Agente_Cobrador"}
        fields={agenteFields}
        onUpdate={cargarDatos}
        title="Editar Agente Cobrador"
      />

      <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => { setUserModalVisible(false); setSelectedAgent(null); setSelectedUserForAgent(null); }}>
        <View style={styles.modalInner}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Usuarios (rol: Agente)</Text>
<<<<<<< HEAD
          <UserRoleList role="Agente" searchable={true} compact={true} compactMaxHeight={220} onSelect={(u) => { setSelectedUserForAgent(u); }} />
=======
          <UserRoleList role="Agente" searchable={true} compact={true} compactMaxHeight={220} onSelect={(u) => {
              try { console.log('[Agente] selected user (temp):', u && (u.id || u.Usuario || u.Nombre)); } catch(e){}
              setSelectedUserForAgent(u);
            }} />
>>>>>>> 5fbf38289c9abfae05a373607c2334a9a47b1674

          {selectedUserForAgent ? (
            <View style={{ marginTop: 12, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e6e9ee', backgroundColor: '#fff' }}>
              <Text style={{ fontWeight: '700', color: '#0b60d9' }}>{selectedUserForAgent.Usuario || selectedUserForAgent.Nombre || selectedUserForAgent.id}</Text>
              <Text style={{ color: '#666', marginTop: 4 }}>{selectedUserForAgent.Email || selectedUserForAgent.Telefono || ''}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                <TouchableOpacity onPress={() => { setSelectedUserForAgent(null); }} style={{ marginRight: 12 }}><Text>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  if (!selectedAgent || !selectedAgent.id) {
                    Alert.alert('Error', 'No hay agente seleccionado para vincular.');
                    return;
                  }
                  await assignUserToAgent(selectedUserForAgent, selectedAgent.id);
                  setUserModalVisible(false);
                  Alert.alert('Usuario vinculado', `${selectedUserForAgent.Usuario || selectedUserForAgent.Nombre || selectedUserForAgent.id} → ${selectedAgent.Nombre || selectedAgent.id}`);
                  setSelectedAgent(null);
                  setSelectedUserForAgent(null);
                }} style={{ backgroundColor: '#0b60d9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}><Text style={{ color: '#fff' }}>Vincular</Text></TouchableOpacity>
              </View>
            </View>
          ) : null}

          <TouchableOpacity onPress={() => { setUserModalVisible(false); setSelectedAgent(null); setSelectedUserForAgent(null); }} style={{ marginTop: 12, alignSelf: 'flex-end' }}><Text>Cerrar</Text></TouchableOpacity>
        </View>
      </SafeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 2,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#444444',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '600'
  },
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
  modalInner: { width: '92%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  ...cardStyles,
});

export default AgenteCobrador;