import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import SafeModal from './SafeModal';
import { db } from '../firebase.js';
import { collection, getDocs } from 'firebase/firestore';

const UserRoleList = ({ role = 'Cliente', onSelect }) => {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'Usuario'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = data.filter(u => (u.rol || '').toString().toLowerCase() === (role || '').toString().toLowerCase());
        if (mounted) setUsers(filtered);
      } catch (e) {
        console.error('Error cargando usuarios por rol', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [role]);

  const openUser = (u) => {
    setSelected(u);
    setModalVisible(true);
    if (onSelect) onSelect(u);
  };

  return (
    <View style={styles.container}>
      {users.length === 0 ? (
        <Text style={{ color: '#666' }}>No hay usuarios con rol {role}</Text>
      ) : (
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, { flex: 1 }]}>Usuario</Text>
            <Text style={[styles.headerCell, { width: 100, textAlign: 'center' }]}>Rol</Text>
          </View>
          {users.map(u => (
            <TouchableOpacity key={u.id} style={styles.row} onPress={() => openUser(u)}>
              <Text style={[styles.cell, { flex: 1 }]}>{u.Usuario}</Text>
              <Text style={[styles.cell, { width: 100, textAlign: 'center' }]}>{u.rol}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <SafeModal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Detalles de Usuario</Text>
            {selected && (
              <ScrollView>
                <Text style={{ fontWeight: '700' }}>{selected.Usuario}</Text>
                <Text>Rol: {selected.rol}</Text>
                <Text>ID: {selected.id}</Text>
                {/* mostrar otros campos si existen */}
                {Object.keys(selected).map(k => (
                  (['Usuario','rol','id'].includes(k)) ? null : (
                    <Text key={k}>{k}: {String(selected[k])}</Text>
                  )
                ))}
              </ScrollView>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}><Text>Cerrar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
  </SafeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 6 },
  headerRow: { flexDirection: 'row', backgroundColor: '#f6f6f6', paddingVertical: 8, paddingHorizontal: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  headerCell: { fontWeight: '700' },
  row: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#fafafa', alignItems: 'center' },
  cell: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '92%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  closeBtn: { padding: 8 }
});

export default UserRoleList;
