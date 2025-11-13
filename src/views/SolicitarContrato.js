import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import SafeModal from '../Components/SafeModal';
import FormularioSolicitud from '../Components/FormularioSolicitud.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../database/firebaseconfig.js';
import { collection, query, orderBy, onSnapshot, where, serverTimestamp, getDocs } from 'firebase/firestore';
import { safeUpdateDoc, safeDeleteDoc } from '../utils/firestoreUtils';

const SolicitarContrato = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let unsub = () => {};
    const setupListener = async () => {
      // detect current app user (if any)
      let user = null;
      try {
        const raw = await AsyncStorage.getItem('@app_user');
        if (raw) user = JSON.parse(raw);
      } catch (e) { /* ignore */ }
      setCurrentUser(user);

      // If user is logged, only show solicitudes created by that user. Guests see solicitudes tied to guestId.
      let q;
      if (user && (user.rol === 'Cliente' || user.rol === 'cliente')) {
        // only solicitudes created by this user's id
        // Removed orderBy to avoid requiring a composite index; we'll sort client-side by fechaCreacion
        q = query(collection(db, 'solicitudes_contrato'), where('creadoPor', '==', user.id));
      } else {
        const guestId = await AsyncStorage.getItem('@guest_id');
        if (!guestId) {
          setSolicitudes([]);
          setRefreshing(false);
          return;
        }
        // same as above: fetch guest's solicitudes and sort client-side
        q = query(collection(db, 'solicitudes_contrato'), where('guestId', '==', guestId));
      }
  unsub = onSnapshot(q, (snapshot) => {
  const data = snapshot.docs.map((d) => {
        const raw = d.data();
        // Normalizar fecha: soportar serverTimestamp y campos antiguos
        let fecha = 'Fecha no disponible';
        if (raw.fechaCreacion && typeof raw.fechaCreacion.toDate === 'function') {
          fecha = raw.fechaCreacion.toDate().toLocaleString();
        } else if (raw.fecha && raw.fecha.seconds) {
          // if stored as timestamp-like object
          try { fecha = new Date(raw.fecha.seconds * 1000).toLocaleString(); } catch(e){}
        } else if (raw.fecha) {
          try { fecha = new Date(raw.fecha).toLocaleString(); } catch(e){}
        }

        // try to extract a numeric timestamp to allow robust sorting client-side
        let ts = 0;
        if (raw.fechaCreacion && typeof raw.fechaCreacion.toDate === 'function') {
          try { ts = raw.fechaCreacion.toDate().getTime(); } catch (e) { ts = 0; }
        } else if (raw.fecha && raw.fecha.seconds) {
          try { ts = (raw.fecha.seconds * 1000); } catch (e) { ts = 0; }
        } else if (raw.fecha) {
          try { ts = new Date(raw.fecha).getTime(); } catch (e) { ts = 0; }
        }

        return {
          id: d.id,
          nombre: raw.nombre,
          cedula: raw.cedula,
          telefono: raw.telefono,
          comentario: raw.comentario || null,
          estado: raw.estado || 'Pendiente',
          fecha,
          _ts: ts
        };
      });
        // sort by timestamp desc (most recent first)
        data.sort((a, b) => (b._ts || 0) - (a._ts || 0));
        setSolicitudes(data);
      }, async (error) => {
        console.error('Error en onSnapshot solicitudes (SolicitarContrato):', error);
        // fallback a una petición puntual
        try {
          const snap = await getDocs(q);
          const data = snap.docs.map((d) => {
            const raw = d.data();
            let fecha = 'Fecha no disponible';
            if (raw.fechaCreacion && typeof raw.fechaCreacion.toDate === 'function') {
              fecha = raw.fechaCreacion.toDate().toLocaleString();
            } else if (raw.fecha && raw.fecha.seconds) {
              try { fecha = new Date(raw.fecha.seconds * 1000).toLocaleString(); } catch(e){}
            } else if (raw.fecha) {
              try { fecha = new Date(raw.fecha).toLocaleString(); } catch(e){}
            }
            let ts = 0;
            if (raw.fechaCreacion && typeof raw.fechaCreacion.toDate === 'function') {
              try { ts = raw.fechaCreacion.toDate().getTime(); } catch(e){}
            }
            return { id: d.id, nombre: raw.nombre, cedula: raw.cedula, telefono: raw.telefono, comentario: raw.comentario || null, estado: raw.estado || 'Pendiente', fecha, _ts: ts };
          });
          data.sort((a,b) => (b._ts||0) - (a._ts||0));
          setSolicitudes(data);
        } catch (e) {
          console.error('Fallback getDocs failed (SolicitarContrato):', e);
        }
      });
    };

    setupListener();

    return () => { try { unsub(); } catch(e){} };
  }, []);

  const onSubmitted = () => {
    // opcional: hacer algo cuando se cree una solicitud (por ejemplo hacer refresh manual)
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
    // si queremos scrollear la lista hacia arriba para mostrar la nueva solicitud:
    try { listRef.current && listRef.current.scrollToOffset({ offset: 0, animated: true }); } catch (e) {}
  };

  // Edit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editComentario, setEditComentario] = useState('');
  const [editTelefono, setEditTelefono] = useState('');

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  // Preview modal for contract
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const openPreview = (item) => { setPreviewItem(item); setPreviewVisible(true); };
  const closePreview = () => { setPreviewItem(null); setPreviewVisible(false); };

  const openEdit = (item) => {
    setEditingItem(item);
    setEditComentario(item.comentario || '');
    setEditTelefono(item.telefono || '');
  };

  const closeEdit = () => {
    setEditingItem(null);
    setEditComentario('');
    setEditTelefono('');
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    // Allow edits without email confirmation (email removed from this view)

    try {
      if (!editingItem || !editingItem.id) {
        Alert.alert('Error', 'ID de la solicitud no disponible.');
        return;
      }
      await safeUpdateDoc('solicitudes_contrato', editingItem.id, {
        comentario: editComentario || null,
        telefono: editTelefono || null,
        updatedAt: serverTimestamp()
      });
      closeEdit();
      Alert.alert('Éxito', 'Solicitud actualizada.');
    } catch (err) {
      console.error('Error actualizando solicitud:', err);
      Alert.alert('Error', 'No se pudo actualizar la solicitud.');
    }
  };

  const cancelSolicitud = (item) => {
    // open a simple confirm modal (no email required)
    setConfirmItem(item);
    setConfirmModalVisible(true);
  };

  const confirmCancel = async () => {
    if (!confirmItem) return;
    try {
      if (!confirmItem || !confirmItem.id) {
        Alert.alert('Error', 'ID de la solicitud no disponible.');
        return;
      }
      await safeDeleteDoc('solicitudes_contrato', confirmItem.id);
      setConfirmModalVisible(false);
      setConfirmItem(null);
      Alert.alert('Hecho', 'Solicitud eliminada');
    } catch (err) {
      console.error('Error eliminando solicitud:', err);
      Alert.alert('Error', 'No se pudo eliminar la solicitud.');
    }
  };

  return (
    <>
    <FlatList
      ref={listRef}
      data={solicitudes}
      keyExtractor={(item) => item.id}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>✍️ Formulario de Solicitud de Contrato</Text>
            <Text style={styles.subtitle}>Ingresa tus datos para solicitar un contrato de servicio.</Text>

            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>¿Qué necesitamos para tu contrato?</Text>
              <Text style={styles.requirementItem}>• Cédula de Identidad (o RUC) vigente.</Text>
              <Text style={styles.requirementItem}>• Comprobante de domicilio actualizado.</Text>
              <Text style={styles.requirementItem}>• Información de contacto (teléfono).</Text>
              <Text style={styles.requirementItem}>• Comentario con detalles sobre el servicio deseado.</Text>
            </View>

            <FormularioSolicitud onSubmitted={onSubmitted} />

            <Text style={styles.titleList}>Solicitudes enviadas</Text>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <Text style={styles.cardDate}>{item.fecha}</Text>
          </View>

          {/* Información principal del solicitante */}
          <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Cédula</Text>
              <Text style={styles.infoValue}>{item.cedula}</Text>

              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{item.telefono}</Text>
            </View>

            <View style={styles.contractPreview}>
              <Text style={styles.contractTitle}>Vista previa del contrato</Text>
              <Text style={styles.contractLine}>• Servicio: por definir</Text>
              <Text style={styles.contractLine}>• Duración: 1 mes (ejemplo)</Text>
              <Text style={styles.contractLine}>• Condiciones: se confirmarán al contacto telefónico</Text>
              <TouchableOpacity style={styles.previewBtn} onPress={() => openPreview(item)}>
                <Text style={styles.previewBtnText}>Ver contrato completo</Text>
              </TouchableOpacity>
            </View>
          </View>

            <View style={styles.requirementsSummary}>
            <Text style={styles.reqTitle}>Requisitos para crear un contrato</Text>
            <Text style={styles.reqItem}>• Cédula de identidad (o RUC) vigente</Text>
            <Text style={styles.reqItem}>• Comprobante de domicilio actualizado</Text>
            <Text style={styles.reqItem}>• Información de contacto (teléfono)</Text>
            <Text style={styles.reqItem}>• Comentario con detalles del servicio</Text>
          </View>

          {item.comentario ? (
            <View style={styles.commentBox}>
              <Text style={styles.commentLabel}>Comentario enviado</Text>
              <Text style={styles.commentText}>{item.comentario}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.status, item.estado.toLowerCase() === 'pendiente' ? { backgroundColor: '#fff3cd', color: '#856404' } : { backgroundColor: '#d4edda', color: '#155724' }]}>{item.estado}</Text>

            {/* Edit / Cancel buttons only when pending */}
            {item.estado && item.estado.toLowerCase() === 'pendiente' ? (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={styles.smallBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.smallBtnText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#ff6b6b' }]} onPress={() => cancelSolicitud(item)}>
                  <Text style={[styles.smallBtnText, { color: '#fff' }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No hay solicitudes aún.</Text>}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshing={refreshing}
      onRefresh={() => { /* you can wire refresh logic here */ }}
  />

  {/* Edit modal */}
      <SafeModal visible={!!editingItem} animationType="slide" transparent onRequestClose={closeEdit}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Editar solicitud</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={editComentario} onChangeText={setEditComentario} placeholder="Comentario" multiline />
            <TextInput style={styles.input} value={editTelefono} onChangeText={setEditTelefono} placeholder="Teléfono" keyboardType="phone-pad" />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={[styles.smallBtn, { marginRight: 8 }]} onPress={closeEdit}><Text>Cerrar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#1e90ff' }]} onPress={saveEdit}><Text style={{ color: '#fff' }}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
  </SafeModal>

  {/* Confirmación para eliminar solicitud */}
      <SafeModal visible={confirmModalVisible} animationType="fade" transparent onRequestClose={() => setConfirmModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ width: '88%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Confirmar eliminación</Text>
              <Text style={{ marginBottom: 10 }}>¿Estás seguro que deseas eliminar esta solicitud?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={[styles.smallBtn, { marginRight: 8 }]} onPress={() => { setConfirmModalVisible(false); setConfirmItem(null); }}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#ff6b6b' }]} onPress={confirmCancel}><Text style={{ color: '#fff' }}>Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeModal>
      {/* Modal: vista previa completa del contrato */}
      <SafeModal visible={previewVisible} animationType="slide" transparent onRequestClose={closePreview}>
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <View style={{ width:'92%', maxHeight:'86%', backgroundColor:'#fff', borderRadius:12, padding:16 }}>
            <Text style={{ fontSize:20, fontWeight:'800', color:'#0b60d9', marginBottom:8 }}>Contrato - Vista previa</Text>
            <Text style={{ fontSize:14, color:'#333', marginBottom:6 }}><Text style={{ fontWeight:'700' }}>Solicitante:</Text> {previewItem ? previewItem.nombre : ''}</Text>
            <Text style={{ fontSize:14, color:'#333', marginBottom:6 }}><Text style={{ fontWeight:'700' }}>Cédula:</Text> {previewItem ? previewItem.cedula : ''}</Text>
            <Text style={{ fontSize:14, color:'#333', marginBottom:6 }}><Text style={{ fontWeight:'700' }}>Teléfono:</Text> {previewItem ? previewItem.telefono : ''}</Text>
            <View style={{ height:12 }} />
            <View style={{ backgroundColor:'#f6f9ff', padding:12, borderRadius:8 }}>
              <Text style={{ fontWeight:'800', color:'#1e90ff', marginBottom:6 }}>Servicios y condiciones</Text>
              <Text style={{ color:'#333', marginBottom:4 }}>• Servicio: por definir</Text>
              <Text style={{ color:'#333', marginBottom:4 }}>• Duración: 1 mes</Text>
              <Text style={{ color:'#333' }}>• Condiciones: Las condiciones finales se acordarán vía contacto telefónico.</Text>
            </View>

            {previewItem && previewItem.comentario ? (
              <View style={{ marginTop:12, padding:10, backgroundColor:'#fffaf0', borderRadius:8, borderLeftWidth:4, borderLeftColor:'#ffd966' }}>
                <Text style={{ fontWeight:'700', color:'#b36b00', marginBottom:6 }}>Comentario del solicitante</Text>
                <Text style={{ fontStyle:'italic', color:'#5b5b5b' }}>{previewItem.comentario}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop:12 }}>
              <TouchableOpacity style={[styles.smallBtn, { marginRight:8 }]} onPress={closePreview}><Text>Cerrar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
  </SafeModal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8f8f8', // Fondo más suave
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#007bff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  requirementsBox: {
    backgroundColor: '#e6f7ff', // Color de fondo claro para destacar
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 5, // Borde izquierdo para énfasis
    borderLeftColor: '#007bff',
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
  requirementItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  }
  ,
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#12323b' },
  cardDate: { fontSize: 12, color: '#777' },
  cardText: { fontSize: 14, color: '#444', marginBottom: 8 },
  /* Nuevo: estilos para la fila de información y vista previa del contrato */
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  infoColumn: { flex: 1, paddingRight: 12 },
  infoLabel: { fontSize: 12, color: '#666', fontWeight: '700', marginTop: 6 },
  infoValue: { fontSize: 15, color: '#222', marginTop: 2, marginBottom: 4 },
  contractPreview: { flex: 1, backgroundColor: '#f4f8ff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e1ecff' },
  contractTitle: { fontSize: 13, fontWeight: '800', color: '#0b60d9', marginBottom: 6 },
  contractLine: { fontSize: 13, color: '#333', marginBottom: 4 },
  previewBtn: { marginTop: 8, backgroundColor: '#0b60d9', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' },
  previewBtnText: { color: '#fff', fontWeight: '700' },
  requirementsSummary: { backgroundColor: '#f6f9ff', padding: 10, borderRadius: 8, marginBottom: 8 },
  reqTitle: { fontWeight: '700', marginBottom: 6, color: '#1e90ff' },
  reqItem: { fontSize: 13, color: '#333' },
  commentBox: { backgroundColor: '#fffaf0', padding: 10, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ffd966', marginBottom: 8 },
  commentLabel: { fontWeight: '700', marginBottom: 6, color: '#b36b00' },
  commentText: { fontStyle: 'italic', color: '#5b5b5b' },
  status: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start', fontWeight: '700', marginTop: 6 }
  ,
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 8 }
  ,
  smallBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e6f0ff', marginLeft: 8 },
  smallBtnText: { fontWeight: '700', color: '#1e90ff' }
});

export default SolicitarContrato;