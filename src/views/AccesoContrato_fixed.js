import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, FlatList } from 'react-native';
import SafeModal from '../Components/SafeModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../database/firebaseconfig.js';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';

// Simple safe formatter for fields (timestamps, objects, primitives)
const formatField = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    try {
      if (typeof v.toDate === 'function') return v.toDate().toLocaleString();
      if (v.seconds && typeof v.seconds === 'number') return new Date(v.seconds * 1000).toLocaleString();
      if (v.Nombre || v.nombre) return v.Nombre || v.nombre;
      if (v.ClienteId || v.ClienteID) return v.ClienteId || v.ClienteID;
      if (v.id) return v.id;
      // Fallback: compact JSON
      return JSON.stringify(v);
    } catch (e) {
      return '';
    }
  }
  return String(v);
};

const AccesoContrato = ({ user: propUser, onLogout }) => {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAgentView, setIsAgentView] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payCuota, setPayCuota] = useState('');
  // agent will input number of cuotas only; monto will be computed automatically
  const [paymentsLog, setPaymentsLog] = useState({}); // contractId -> [payments]

  useEffect(() => {
    let mounted = true;

    const cargarContratosVinculados = async () => {
      setLoading(true);
      try {
        // prefer propUser if provided (App passes current user)
        let user = propUser;
        if (!user) {
          const raw = await AsyncStorage.getItem('@app_user');
          if (!raw) {
            if (mounted) setResultados([]);
            return;
          }
          user = JSON.parse(raw);
        }

        // set agent view based on role
        if (mounted && user && (user.rol === 'Agente' || user.rol === 'agente')) {
          setIsAgentView(true);
        } else {
          setIsAgentView(false);
        }

        // AGENT: show all contracts (only visible to logged-in agents)
        if (user && (user.rol === 'Agente' || user.rol === 'agente')) {
          const snap = await getDocs(collection(db, 'Contrato'));
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (mounted) setResultados(data);
        } else if (user && (user.rol === 'Cliente' || user.rol === 'cliente')) {
          // CLIENT: only show linked contracts
          let clientId = user.clientId || null;
          try {
            if (!clientId) {
              const qCliente = query(collection(db, 'Cliente'), where('UsuarioId', '==', user.id));
              const snapCliente = await getDocs(qCliente);
              if (!snapCliente.empty) clientId = snapCliente.docs[0].id;
            }
          } catch (e) {
            console.error('Error buscando cliente vinculado:', e);
          }

          if (clientId) {
            const q = query(collection(db, 'Contrato'), where('ClienteId', '==', clientId));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (mounted) setResultados(data);
          } else {
            if (mounted) setResultados([]);
          }
        } else {
          if (mounted) setResultados([]);
        }
      } catch (err) {
        console.error('Error cargando contratos vinculados:', err);
        if (mounted) setResultados([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarContratosVinculados();
    return () => { mounted = false; };
  }, [propUser]);

  const openPayModal = (contract) => {
    setSelectedContract(contract);
    setPayCuota('');
    setPayModalVisible(true);
  };

  const closePayModal = () => {
    setSelectedContract(null);
    setPayModalVisible(false);
  };

  const applyPayment = async () => {
    if (!selectedContract) return;
    // parse numeric
    const cuotaNum = parseInt(payCuota || '0', 10) || 0;
    if (cuotaNum <= 0) { alert('Ingrese la cantidad de cuotas a registrar (>=1).'); return; }

    // Determine per-cuota amount: prefer stored CuotaMonto, fallback to 15% of original total if available
    const cuotaPorUnidad = parseFloat(selectedContract.CuotaMonto || selectedContract.CuotaMonto) || 0;
    // If not stored, try to estimate from original Monto and commission percent
    const montoNum = cuotaPorUnidad > 0 ? (cuotaNum * cuotaPorUnidad) : (cuotaNum * Math.round((selectedContract.Monto || 0) * 0.15));

    // Update local state and Firestore: subtract from contract's Monto and Cuotas
    try {
      // For safety, update contract and persist a payment document in 'Pagos'.
      // Get current user (agent) info
      let user = propUser;
      if (!user) {
        const raw = await AsyncStorage.getItem('@app_user');
        if (raw) user = JSON.parse(raw);
      }

  const updated = { ...selectedContract };
  const origMonto = parseFloat(selectedContract.Monto || selectedContract.monto || 0) || 0;
  // Prefer a dedicated remaining field if present, otherwise fall back to Cuotas
  const origCuotasRest = parseInt(((selectedContract.CuotasRestantes ?? selectedContract.Cuotas) || '0'), 10) || 0;

  // Commission logic: use stored commissionPercent if available, otherwise default 15%
  const commissionPercent = (selectedContract && (selectedContract.commissionPercent || selectedContract.comision || selectedContract.commission)) ? Number(selectedContract.commissionPercent || selectedContract.comision || selectedContract.commission) : 15;
  const agentCommission = Math.round(montoNum * (commissionPercent / 100));
  const netToContract = Math.max(0, montoNum - agentCommission);

  // Subtract only the net amount from the contract's Monto
  updated.Monto = Math.max(0, origMonto - netToContract);
  // Decrement the remaining cuotas (CuotasRestantes) if present, otherwise decrement Cuotas
  const newCuotasRest = Math.max(0, origCuotasRest - cuotaNum);
  updated.CuotasRestantes = newCuotasRest;

  // Prepare update object for Firestore. Update both CuotasRestantes and Cuotas if Cuotas exists to keep consistency.
  const updateObj = { Monto: updated.Monto, CuotasRestantes: newCuotasRest };
  if (selectedContract.Cuotas !== undefined) updateObj.Cuotas = Math.max(0, (parseInt(selectedContract.Cuotas || '0', 10) || 0) - cuotaNum);

  // Write update to Firestore (simple update). Consider transaction for production.
  const ref = doc(db, 'Contrato', selectedContract.id);
  await updateDoc(ref, updateObj);

      // Persist payment record
      try {
        // Prefer the agent's Nombre from Agente_Cobrador if linked to this Usuario
        let agenteNombre = user ? (user.Usuario || user.nombre || '') : 'Agente desconocido';
        try {
          if (user && user.id) {
            const qAg = query(collection(db, 'Agente_Cobrador'), where('UsuarioId', '==', user.id));
            const snapAg = await getDocs(qAg);
            if (!snapAg.empty) {
              const agDoc = snapAg.docs[0].data();
              if (agDoc && (agDoc.Nombre || agDoc.Usuario)) {
                agenteNombre = agDoc.Nombre || agDoc.Usuario || agenteNombre;
              }
            }
          }
        } catch (e) {
          console.error('Error buscando agente por UsuarioId:', e);
        }

        await addDoc(collection(db, 'Pagos'), {
          ContratoId: selectedContract.id,
          agenteId: user ? (user.id || user.Usuario || null) : null,
          agenteNombre: agenteNombre,
          cuota: cuotaNum,
          monto_pagado: montoNum,
          commission_percent: commissionPercent,
          commission_amount: agentCommission,
          neto_recibido_por_contrato: netToContract,
          fecha: serverTimestamp(),
        });
      } catch (e) {
        console.error('No se pudo guardar pago en Pagos:', e);
      }

      // refresh payments for this contract
      await loadPaymentsFor(selectedContract.id);

      // reflect change in UI
      setResultados(curr => curr.map(r => r.id === selectedContract.id ? { ...r, Monto: updated.Monto, CuotasRestantes: updated.CuotasRestantes, Cuotas: updateObj.Cuotas !== undefined ? updateObj.Cuotas : r.Cuotas } : r));
      closePayModal();
      alert('Cuota registrada correctamente. Se aplicó comisión de ' + commissionPercent + '% (C$ ' + agentCommission + ').');
    } catch (err) {
      console.error('Error applying payment:', err);
      alert('No se pudo aplicar el pago.');
    }
  };

  // Load payments from Firestore for a specific contract
  const loadPaymentsFor = async (contractId) => {
    try {
      // Remove server-side ordering to avoid requiring a composite index.
      // We'll sort client-side by fecha (desc) after fetching.
      const q = query(collection(db, 'Pagos'), where('ContratoId', '==', contractId));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort by fecha desc if available (handle Firestore Timestamp shape)
      data.sort((a, b) => {
        const ta = a.fecha && typeof a.fecha.toDate === 'function' ? a.fecha.toDate().getTime() : (a.fecha && a.fecha.seconds ? a.fecha.seconds * 1000 : 0);
        const tb = b.fecha && typeof b.fecha.toDate === 'function' ? b.fecha.toDate().getTime() : (b.fecha && b.fecha.seconds ? b.fecha.seconds * 1000 : 0);
        return tb - ta;
      });

      setPaymentsLog(prev => ({ ...prev, [contractId]: data }));
    } catch (e) {
      console.error('Error cargando pagos:', e);
    }
  };

  const renderContractCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Contrato: {formatField(item.id)}</Text>
      <Text style={styles.rowText}>Cliente: {formatField(item.Cliente || item.ClienteId || item.ClienteID)}</Text>
      <Text style={styles.rowText}>Cuotas: {formatField(item.Cuotas)}</Text>
      <Text style={styles.rowText}>Monto: {formatField(item.Monto)}</Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity style={styles.detailBtn} onPress={() => { setSelectedContract(item); loadPaymentsFor(item.id); }}>
          <Text style={styles.detailBtnText}>Detalles</Text>
        </TouchableOpacity>
        {isAgentView && (
          <TouchableOpacity style={[styles.detailBtn, { backgroundColor: '#2fb26b', marginLeft: 8 }]} onPress={() => openPayModal(item)}>
            <Text style={[styles.detailBtnText, { color: '#fff' }]}>Registrar cuota</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso a Contratos</Text>

      {loading ? (
        <ActivityIndicator size="small" color="#0b5ed7" style={{ marginTop: 12 }} />
      ) : (
        <View style={{ flex: 1, width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>Contratos disponibles</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#666', marginRight: 10 }}>{isAgentView ? 'Viendo como: Agente' : 'Viendo como: Cliente'}</Text>
                  <TouchableOpacity style={[styles.logoutBtn, { marginLeft: 0 }]} onPress={async () => {
                    if (typeof onLogout === 'function') return onLogout();
                    try {
                      await AsyncStorage.removeItem('@app_user');
                    } catch (e){}
                  }}>
                    <Text style={{ color: '#b22222', fontWeight: '700' }}>Cerrar sesión</Text>
                  </TouchableOpacity>
                </View>
              </View>

          {(!resultados || resultados.length === 0) ? (
            <Text style={styles.noResults}>No se encontraron contratos vinculados o no hay sesión activa.</Text>
          ) : (
            <FlatList data={resultados} keyExtractor={i => i.id} renderItem={renderContractCard} contentContainerStyle={{ paddingBottom: 40 }} />
          )}

          {/* Detalles modal */}
          <SafeModal visible={!!selectedContract} animationType="slide" transparent onRequestClose={() => setSelectedContract(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>Detalles del contrato</Text>
                {selectedContract ? (
                  <ScrollView>
                    <Text style={styles.rowText}>ID: {formatField(selectedContract.id)}</Text>
                    <Text style={styles.rowText}>Cliente: {formatField(selectedContract.Cliente || selectedContract.ClienteId || selectedContract.ClienteID)}</Text>
                    <Text style={styles.rowText}>Monto actual: {formatField(selectedContract.Monto)}</Text>
                    <Text style={styles.rowText}>Cuotas restantes: {formatField(selectedContract.Cuotas)}</Text>
                    {paymentsLog[selectedContract.id] && paymentsLog[selectedContract.id].length > 0 ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Pagos registrados</Text>
                        <View style={styles.paymentsHeader}>
                          <Text style={[styles.paymentsCell, { flex: 2, fontWeight: '700' }]}>Fecha</Text>
                          <Text style={[styles.paymentsCell, { flex: 2, fontWeight: '700' }]}>Agente</Text>
                          <Text style={[styles.paymentsCell, { flex: 1, fontWeight: '700', textAlign: 'center' }]}>Cuota</Text>
                          <Text style={[styles.paymentsCell, { flex: 1, fontWeight: '700', textAlign: 'right' }]}>Monto</Text>
                        </View>
                        {paymentsLog[selectedContract.id].map((p, idx) => (
                          <View key={p.id || idx} style={styles.paymentRow}>
                            <Text style={[styles.paymentsCell, { flex: 2 }]}>{formatField(p.fecha)}</Text>
                            <Text style={[styles.paymentsCell, { flex: 2 }]}>{formatField(p.agenteNombre || p.agente)}</Text>
                            <Text style={[styles.paymentsCell, { flex: 1, textAlign: 'center' }]}>{formatField(p.cuota)}</Text>
                            <Text style={[styles.paymentsCell, { flex: 1, textAlign: 'right' }]}>{formatField(p.monto || p.monto_pagado || p.Monto || p.monto_pagado)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : <Text style={{ marginTop: 8, color: '#666' }}>No hay pagos registrados aún.</Text>}
                  </ScrollView>
                ) : null}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <TouchableOpacity style={[styles.detailBtn, { marginRight: 8 }]} onPress={() => setSelectedContract(null)}><Text>Cerrar</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeModal>

          {/* Pagar modal (agente) */}
          <SafeModal visible={payModalVisible} animationType="slide" transparent onRequestClose={closePayModal}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>Registrar cuota</Text>
                  <Text style={{ marginBottom: 6 }}>Contrato: {selectedContract ? selectedContract.id : ''}</Text>
                  <TextInput style={styles.input} placeholder="Cuotas a registrar" keyboardType="number-pad" value={payCuota} onChangeText={setPayCuota} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <TouchableOpacity style={[styles.detailBtn, { marginRight: 8 }]} onPress={closePayModal}><Text>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.detailBtn, { backgroundColor: '#2fb26b' }]} onPress={applyPayment}><Text style={{ color: '#fff' }}>Aplicar</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeModal>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 14, color: '#0b5ed7' },
  results: { marginTop: 8 },
  noResults: { color: '#666' },
  card: { padding: 14, borderWidth: 0, borderRadius: 10, marginBottom: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontWeight: '800', marginBottom: 6, color: '#12323b' },
  rowText: { color: '#333', marginBottom: 6 },
  headerSubtitle: { color: '#666', marginBottom: 8 },
  roleToggle: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f4f6f8' },
  roleToggleActive: { backgroundColor: '#2b8ef8', borderColor: '#2b8ef8' },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'transparent' },
  detailBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  detailBtnText: { color: '#333', fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '92%', maxHeight: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 8, backgroundColor: '#fff' },
  paymentsHeader: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 6 },
  paymentsCell: { color: '#333', paddingHorizontal: 6 },
  paymentRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fafafa', alignItems: 'center' },
});

export default AccesoContrato;
