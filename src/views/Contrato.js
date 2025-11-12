import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from "react-native";
import SafeModal from '../Components/SafeModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from "../firebase.js";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import FormularioContrato from "../Components/FormularioContrato.js";
import TablaContrato from "../Components/TablaContrato.js";
import ModalEditar from "../Components/ModalEditar.js";

const Contrato = () => {
  const [contratos, setContratos] = useState([]);
  const [clientsModalVisible, setClientsModalVisible] = useState(false);
  const [clientsList, setClientsList] = useState([]);
  const [contratoEditar, setContratoEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const cargarDatos = async () => {
    try {
      // If logged in as Cliente, filter by their clientId
      let user = null;
      try { const raw = await AsyncStorage.getItem('@app_user'); if (raw) user = JSON.parse(raw); } catch(e){}

      let docsSnap = { docs: [] };

      // Si el usuario es Cliente buscamos su clientId; puede venir en user.clientId o estar vinculado por UsuarioId en la colección Cliente
      if (user && (user.rol === 'Cliente' || user.rol === 'cliente')) {
        let clientId = user.clientId || null;
        try {
          if (!clientId) {
            // Buscar Cliente cuyo UsuarioId coincida con el id del usuario actual
            const qCliente = query(collection(db, 'Cliente'), where('UsuarioId', '==', user.id));
            const snapCliente = await getDocs(qCliente);
            if (!snapCliente.empty) {
              clientId = snapCliente.docs[0].id;
            }
          }
        } catch (e) {
          console.error('Error buscando cliente vinculado al usuario:', e);
        }

        if (clientId) {
          const q = query(collection(db, 'Contrato'), where('ClienteId', '==', clientId));
          docsSnap = await getDocs(q);
        } else {
          // No se encontró cliente vinculado: dejar lista vacía
          docsSnap = { docs: [] };
        }
      } else {
        docsSnap = await getDocs(collection(db, 'Contrato'));
      }

      const data = docsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setContratos(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem('@app_user');
        if (raw) setCurrentUser(JSON.parse(raw));
      } catch (err) {
        console.error('Error cargando usuario desde AsyncStorage', err);
      }
    };
    loadUser();
  }, []);

  // If current user is a Cliente, show a simplified view with contract status
  const isCliente = currentUser && (currentUser.rol || '').toString().toLowerCase() === 'cliente';

  // Helper to safely format values before passing them to <Text>
  const formatField = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') {
      try {
        return v.Nombre || v.nombre || v.Usuario || v.id || JSON.stringify(v);
      } catch (e) {
        return String(v);
      }
    }
    return String(v);
  };

  const eliminarContrato = async (id) => {
    try {
      await deleteDoc(doc(db, "Contrato", id));
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const editarContrato = (contrato) => {
    setContratoEditar(contrato);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setContratoEditar(null);
  };

  const contratoFields = [
    { key: "Cantida_de_Beneficiario", label: "Cantidad de Beneficiarios", type: "text", keyboardType: "numeric" },
    { key: "Cliente", label: "Cliente", type: "text" },
    { key: "Cuotas", label: "Cuotas", type: "text", keyboardType: "numeric" },
    { key: "Estado", label: "Estado", type: "text" },
    { key: "Fecha_Fin", label: "Fecha Fin (YYYY-MM-DD)", type: "text" },
    { key: "Fecha_Inicio", label: "Fecha Inicio (YYYY-MM-DD)", type: "text" },
    { key: "Monto", label: "Monto", type: "text", keyboardType: "numeric" },
  { key: "Comentario", label: "Comentario", type: "text" },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const verClientes = async (contrato) => {
    try {
      const snap = await getDocs(collection(db, 'Cliente'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientsList(data);
      setClientsModalVisible(true);
    } catch (e) {
      console.error('Error cargando clientes para modal:', e);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* If not Cliente, show full form + table. If Cliente, show a simplified status view. */}
        {!isCliente ? (
          <>
            <View style={styles.formContainer}>
              <FormularioContrato cargarDatos={cargarDatos} />
            </View>

            <TablaContrato 
              contratos={contratos} 
              eliminarContrato={eliminarContrato}
              editarContrato={editarContrato}
              currentUser={currentUser}
              verClientes={verClientes}
            />
          </>
        ) : (
          <View style={styles.clientContainer}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Tus contratos</Text>
            {contratos.length === 0 ? (
              <Text>No se encontraron contratos vinculados a tu cuenta.</Text>
            ) : (
              contratos.map(c => (
                <View key={c.id} style={styles.statusCard}>
              <Text style={{ fontWeight: '700' }}>{formatField(c.Cliente ?? c.ClienteNombre ?? c.ClienteId ?? 'Contrato')}</Text>
              <Text>Estado: <Text style={{ fontWeight: '700' }}>{formatField(c.Estado ?? c.estado ?? 'Desconocido')}</Text></Text>
              <Text>Inicio: {formatField(c.Fecha_Inicio ?? c.FechaInicio ?? '')} - Fin: {formatField(c.Fecha_Fin ?? c.FechaFin ?? '')}</Text>
              <Text>Monto: {formatField(c.Monto ?? c.monto ?? c.Total ?? '-')}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={contratoEditar}
        collectionName="Contrato"
        fields={contratoFields}
        onUpdate={cargarDatos}
        title="Editar Contrato"
      />
          {/* Modal para ver clientes (desde TablaContrato) */}
          <SafeModal visible={clientsModalVisible} animationType="slide" transparent onRequestClose={() => setClientsModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Clientes disponibles</Text>
                <ScrollView>
                  {clientsList.map(c => (
                    <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ fontWeight: '700' }}>{formatField(c.Nombre ?? c.Apellido ?? c.id)}</Text>
                      <Text>{formatField(c.Cedula)}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <TouchableOpacity style={[styles.detailBtn, { marginRight: 8 }]} onPress={() => setClientsModalVisible(false)}><Text>Cerrar</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    flexGrow: 1,
    flex: 2.5,
    backgroundColor: "#f6f8fa",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#12323b",
    textAlign: "center",
    marginBottom: 25,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e3e8ee",
  },
  clientContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eef2f5'
  },
});

export default Contrato;
