import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, getDocs } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import FormularioSolicitudAdmin from '../Components/FormularioSolicitudAdmin';

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
    }, (error) => {
      console.error('Error al obtener solicitudes: ', error);
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
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleChangeEstado(item.id, 'Aprobada')}>
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Aprobar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectAction]} onPress={() => handleChangeEstado(item.id, 'Rechazada')}>
            <MaterialIcons name="close" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleChangeEstado = (id, nuevoEstado) => {
    Alert.alert(
      `${nuevoEstado} solicitud`,
      `¿Seguro que deseas marcar esta solicitud como "${nuevoEstado}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'solicitudes_contrato', id), { estado: nuevoEstado });
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
      ListEmptyComponent={<Text style={styles.emptyText}>🎉 ¡Todo al día! No hay solicitudes pendientes.</Text>}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]} />
      }
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f0f2f5',
  },
  /* new card styles */
  card: { backgroundColor: '#fff', padding: 14, marginVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftBlock: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rightBlock: { alignItems: 'flex-end', marginLeft: 8 },
  avatarCircleNew: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0b60d9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#12323b' },
  cardMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  itemTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
    color: '#0056b3',
  },
  detailsGroup: {
    paddingLeft: 5,
    marginBottom: 10,
  },
  itemDetail: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  commentContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  commentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
  },
  cardActions: { flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2fb26b', marginLeft: 8 },
  rejectAction: { backgroundColor: '#e05252' },
  actionBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  statusPillNew: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#666', marginTop: 6 },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  approveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2fb26b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, minWidth: 120, shadowColor: '#2fb26b', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e05252', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minWidth: 120, shadowColor: '#e05252', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
  actionText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#007bff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusPending: { backgroundColor: '#fff3cd' },
  statusApproved: { backgroundColor: '#d4edda' },
  statusRejected: { backgroundColor: '#f8d7da' },
  statusText: { fontWeight: '700', color: '#333' },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
    paddingHorizontal: 20,
  },
});

export default Solicitudes;