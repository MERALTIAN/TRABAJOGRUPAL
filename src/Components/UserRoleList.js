import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { db } from '../database/firebaseconfig.js';
import { collection, getDocs } from 'firebase/firestore';

const UserRoleList = ({ role = 'Cliente', onSelect }) => {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

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
    // Inline selection — call callback so parent can react (no modal required)
    if (onSelect) onSelect(u);
  };

  return (
    <View style={styles.container}>
      {users.length === 0 ? (
        <Text style={{ color: '#666' }}>No hay usuarios con rol {role}</Text>
      ) : (
        <View>
          {users.map(u => {
            const displayName = u.Usuario || u.Nombre || `${u.Nombre || ''} ${u.Apellido || ''}`.trim() || u.id;
            const initials = (displayName.split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('') || 'U').toUpperCase();
            return (
              <TouchableOpacity key={u.id} style={styles.card} onPress={() => openUser(u)}>
                <View style={styles.leftBlock}>
                  <View style={styles.avatarCircle}><Text style={styles.avatarText}>{initials}</Text></View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.nameText}>{displayName}</Text>
                    <Text style={styles.metaText}>{u.Email || u.email || u.Telefono || ''}</Text>
                  </View>
                </View>
                <View style={styles.rightBlock}>
                  <Text style={styles.rolePill}>{u.rol || role}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 6 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eef2f5' },
  leftBlock: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0b60d9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  nameText: { fontWeight: '800', fontSize: 16, color: '#0b60d9' },
  metaText: { color: '#666', marginTop: 4 },
  rightBlock: { alignItems: 'flex-end' },
  rolePill: { backgroundColor: '#f0f8ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '700', color: '#0b60d9' },
  closeBtn: { padding: 8 }
});

export default UserRoleList;
