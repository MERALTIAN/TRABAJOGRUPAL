import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { db } from '../database/firebaseconfig.js';
import { collection, query, onSnapshot, orderBy, getDocs, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { safeUpdateDoc } from '../utils/firestoreUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import FormularioSolicitudAdmin from '../Components/FormularioSolicitudAdmin';
import solicitudesStyles from '../Styles/solicitudesStyles';

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [clientMap, setClientMap] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'solicitudes_contrato'), orderBy('fechaCreacion', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => {
        const raw = doc.data();
        let fecha = 'Fecha no disponible';
        if (raw.fechaCreacion && typeof raw.fechaCreacion.toDate === 'function') {
          fecha = raw.fechaCreacion.toDate().toLocaleString();
        } else if (raw.fecha && raw.fecha.seconds) {
          try { fecha = new Date(raw.fecha.seconds * 1000).toLocaleString(); } catch(e){}
        } else if (raw.fecha) {
          try { fecha = new Date(raw.fecha).toLocaleString(); } catch(e){}
        }

        return {
          id: doc.id,
          nombre: raw.nombre,
          cedula: raw.cedula,
          telefono: raw.telefono,
          comentario: raw.comentario || null,
          estado: (raw.estado || 'Pendiente').toString(),
          fecha,
          creadoPor: raw.creadoPor || null
        };
      });
      setSolicitudes(data);
      setLoading(false);
      setRefreshing(false);
    }, async (error) => {
      console.error('Error al obtener solicitudes (onSnapshot): ', error);
      // Fallback: intentar obtener una vez con getDocs y ordenar client-side
      try {
        const snap = await getDocs(collection(db, 'solicitudes_contrato'));
        const fallback = snap.docs.map(doc => {
          const raw = doc.data();
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
          return { id: doc.id, nombre: raw.nombre, cedula: raw.cedula, telefono: raw.telefono, comentario: raw.comentario || null, estado: (raw.estado || 'Pendiente').toString(), fecha, creadoPor: raw.creadoPor || null, _ts: ts };
        });
        fallback.sort((a,b) => (b._ts||0) - (a._ts||0));
        setSolicitudes(fallback);
      } catch (e) {
        console.error('Fallback getDocs also failed for solicitudes:', e);
      }
      setLoading(false);
      setRefreshing(false);
    });

    // load user names and client names to show who created the solicitud (prefer client full name)
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'Usuario'));
        const map = {};
        snap.docs.forEach(d => { const r = d.data(); map[d.id] = r.Usuario || r.name || d.id; });
        setUserMap(map);
      } catch (e) { console.error('Error cargando usuarios en Solicitudes', e); }

      try {
        const snapC = await getDocs(collection(db, 'Cliente'));
        const cmap = {};
        snapC.docs.forEach(d => { const r = d.data(); if (r.UsuarioId) cmap[r.UsuarioId] = `${r.Nombre || ''} ${r.Apellido || ''}`.trim(); });
        setUserMap(u => ({ ...u })); // keep userMap as-is
        // store client map in userMapClients via state variable
        setClientMap((prev) => ({ ...prev, ...cmap }));
      } catch (e) { console.error('Error cargando clientes en Solicitudes', e); }
    })();

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // onSnapshot mantiene el live-update; solo se reinicia el indicador
    setTimeout(() => setRefreshing(false), 800);
  };

  const renderItem = ({ item }) => {
    const displayName = (clientMap[item.creadoPor] || userMap[item.creadoPor] || item.nombre || 'Invitado').trim();
    const initials = displayName.split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase();
    const statusLower = (item.estado || '').toString().toLowerCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.leftBlock}>
            <View style={styles.avatarCircleNew}>
              <Text style={styles.avatarText}>{initials || 'U'}</Text>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardTitle}>{displayName}</Text>
              <Text style={styles.cardMeta}>Cédula: {item.cedula || '—'} • {item.telefono || '—'}</Text>
            </View>
          </View>

          <View style={styles.rightBlock}>
            <Text style={[styles.statusPillNew, statusLower === 'pendiente' ? styles.statusPending : statusLower === 'aprobada' ? styles.statusApproved : styles.statusRejected]}>{item.estado}</Text>
            <Text style={styles.cardDate}>{item.fecha}</Text>
          </View>
        </View>

        {item.comentario ? (
          <View style={styles.commentContainer}>
            <Text style={styles.commentTitle}>Comentario</Text>
            <Text style={styles.commentText} numberOfLines={4}>{item.comentario}</Text>
          </View>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleChangeEstado(item, 'Aprobada')}>
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Aprobar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectAction]} onPress={() => handleChangeEstado(item, 'Rechazada')}>
            <MaterialIcons name="close" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const createContractFromSolicitud = async (solicitud) => {
    try {
      // try to find existing Cliente by creadoPor (UsuarioId) or by Cedula
      let clienteId = null;
      if (solicitud.creadoPor) {
        const q = query(collection(db, 'Cliente'), where('UsuarioId', '==', solicitud.creadoPor));
        const snap = await getDocs(q);
        if (!snap.empty) clienteId = snap.docs[0].id;
      }
      if (!clienteId && solicitud.cedula) {
        const q2 = query(collection(db, 'Cliente'), where('Cedula', '==', solicitud.cedula));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) clienteId = snap2.docs[0].id;
      }

      // If no cliente found, create one using solicitud data
      if (!clienteId) {
        const payloadCliente = {
          Nombre: solicitud.nombre || 'Sin nombre',
          Apellido: '',
          Cedula: solicitud.cedula || null,
          Telefono: solicitud.telefono || null,
        };
        const ref = await addDoc(collection(db, 'Cliente'), payloadCliente);
        clienteId = ref.id;
      }

      // create contract linked to clienteId
      const contratoPayload = {
        ClienteId: clienteId,
        Monto: 0,
        Estado: 'Aprobada',
        Fecha_Inicio: new Date().toISOString().slice(0,10),
        Fecha_Fin: null,
        Comentario: solicitud.comentario || null,
        CuotaMonto: 0,
        Cuotas: 0,
        CuotasRestantes: 0,
        creadoDesdeSolicitud: solicitud.id || null,
        fechaCreacion: serverTimestamp(),
      };
  const ref = await addDoc(collection(db, 'Contrato'), contratoPayload);
  // store last created contract id so Contrato view can open it
  try { await AsyncStorage.setItem('@last_created_contract', ref.id); } catch (e) { console.error('No se pudo guardar last_created_contract', e); }
  return true;
    } catch (e) {
      console.error('Error creando contrato desde solicitud:', e);
      return false;
    }
  };

  const handleChangeEstado = (item, nuevoEstado) => {
    Alert.alert(
      `${nuevoEstado} solicitud`,
      `¿Seguro que deseas marcar esta solicitud como "${nuevoEstado}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí',
          onPress: async () => {
            try {
              // Validar que tenemos el id de la solicitud antes de llamar a Firestore
              if (!item || !item.id) {
                console.warn('Solicitudes.handleChangeEstado: item o item.id faltante', item);
                Alert.alert('Error', 'ID de la solicitud no disponible. Operación cancelada.');
                return;
              }

              try {
                await safeUpdateDoc('solicitudes_contrato', item.id, { estado: nuevoEstado });
              } catch (errU) {
                console.error('Error actualizando estado con safeUpdateDoc:', errU);
                Alert.alert('Error', 'No se pudo actualizar el estado.');
                return;
              }
              // if approved, create a contract automatically
              if (nuevoEstado.toString().toLowerCase() === 'aprobada' || nuevoEstado.toString().toLowerCase() === 'aprobado') {
                const ok = await createContractFromSolicitud({ ...item, id: item.id });
                if (ok) Alert.alert('Contrato creado', 'Se creó un contrato a partir de la solicitud.');
                else Alert.alert('Advertencia', 'Solicitud marcada como aprobada pero no se pudo crear el contrato automáticamente.');
              }
            } catch (err) {
              console.error('Error al actualizar estado:', err);
              Alert.alert('Error', 'No se pudo actualizar el estado.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1 }} />;
  }

  return (
    <FlatList
      data={solicitudes}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      style={styles.list}
      contentContainerStyle={{ padding: 10 }}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<Text style={styles.emptyText}>🎉 ¡Todo al día! No hay solicitudes pendientes.</Text>}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]} />
      }
    />
  );
};

const styles = solicitudesStyles;

export default Solicitudes;