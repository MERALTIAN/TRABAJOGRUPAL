import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList } from 'react-native';
import { db } from '../database/firebaseconfig.js';
import { collection, getDocs } from 'firebase/firestore';

const UserRoleList = (props) => {
  const { role = 'Cliente', onSelect, searchable = false, compact = false, compactMaxHeight = 260 } = props || {};
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'Usuario'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = data.filter(u => (u.rol || '').toString().toLowerCase() === (role || '').toString().toLowerCase());
        // sort alphabetically by display name
        filtered.sort((a, b) => {
          const da = (a.Usuario || a.Nombre || `${a.Nombre || ''} ${a.Apellido || ''}`).toString().toLowerCase();
          const db_ = (b.Usuario || b.Nombre || `${b.Nombre || ''} ${b.Apellido || ''}`).toString().toLowerCase();
          return da.localeCompare(db_);
        });
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
    if (onSelect) {
      try { console.log('[UserRoleList] selected user:', u && (u.id || u.Usuario || u.Nombre)); } catch(e){}
      onSelect(u);
    }
  };

  return (
    <View style={styles.container}>
      {searchable && (
        <TextInput
          placeholder="Buscar usuario..."
          value={filter}
          onChangeText={setFilter}
          style={styles.searchInput}
        />
      )}
      {compact ? (
        // compact table-mode: use a FlatList (works well inside a Modal)
        (() => {
          const filtered = users.filter(u => {
            if (!filter || filter.trim() === '') return true;
            const t = filter.toString().toLowerCase();
            const display = (u.Usuario || u.Nombre || `${u.Nombre || ''} ${u.Apellido || ''}`.trim() || '').toString().toLowerCase();
            const phone = (u.Telefono || u.phone || u.Email || u.email || '').toString().toLowerCase();
            return display.includes(t) || phone.includes(t) || (u.id || '').toLowerCase().includes(t);
          });

          if (!filtered.length) return <Text style={{ color: '#666', padding: 8 }}>No hay usuarios con rol {role}</Text>;

          const renderItem = ({ item }) => {
            const displayName = item.Usuario || item.Nombre || `${item.Nombre || ''} ${item.Apellido || ''}`.trim() || item.id;
            const isSel = selected && selected.id === item.id;
            return (
              <TouchableOpacity onPress={() => openUser(item)} style={[styles.compactRow, isSel ? styles.selectedRow : null]}>
                <Text style={styles.compactName}>{displayName}</Text>
                <Text style={styles.compactMeta}>{item.Telefono || item.Email || ''}</Text>
              </TouchableOpacity>
            );
          };

          return (
            <FlatList
              data={filtered}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              style={[styles.compactContainer, { maxHeight: compactMaxHeight || 260 }]}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eef2f7' }} />}
            />
          );
        })()
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled">
          {users.filter(u => {
            if (!filter || filter.trim() === '') return true;
            const t = filter.toString().toLowerCase();
            const display = (u.Usuario || u.Nombre || `${u.Nombre || ''} ${u.Apellido || ''}`.trim() || '').toString().toLowerCase();
            const phone = (u.Telefono || u.phone || u.Email || u.email || '').toString().toLowerCase();
            return display.includes(t) || phone.includes(t) || (u.id || '').toLowerCase().includes(t);
          }).length === 0 ? (
            <Text style={{ color: '#666', padding: 8 }}>No hay usuarios con rol {role}</Text>
          ) : (
            users.filter(u => {
              if (!filter || filter.trim() === '') return true;
              const t = filter.toString().toLowerCase();
              const display = (u.Usuario || u.Nombre || `${u.Nombre || ''} ${u.Apellido || ''}`.trim() || '').toString().toLowerCase();
              const phone = (u.Telefono || u.phone || u.Email || u.email || '').toString().toLowerCase();
              return display.includes(t) || phone.includes(t) || (u.id || '').toLowerCase().includes(t);
            }).map(u => {
              const displayName = u.Usuario || u.Nombre || `${u.Nombre || ''} ${u.Apellido || ''}`.trim() || u.id;
              return (
                <TouchableOpacity key={u.id} style={styles.listRow} onPress={() => openUser(u)}>
                  <View>
                    <Text style={styles.listTitle}>{displayName}</Text>
                    <Text style={styles.listMeta}>{u.Email || u.email || u.Telefono || ''}</Text>
                  </View>
                  <Text style={styles.rolePill}>{u.rol || role}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 6 },
  searchInput: { borderWidth: 1, borderColor: '#e6e9ee', padding: 8, borderRadius: 8, marginBottom: 10 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f2f4f7' },
  listTitle: { fontWeight: '700', color: '#0b60d9' },
  listMeta: { color: '#666', marginTop: 4 },
  rolePill: { backgroundColor: '#f0f8ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '700', color: '#0b60d9' },
  closeBtn: { padding: 8 }
  ,
  compactContainer: { borderWidth: 1, borderColor: '#eef2f7', borderRadius: 8, backgroundColor: '#fff' },
  compactRow: { paddingVertical: 10, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compactName: { fontWeight: '700', color: '#0b60d9' },
  compactMeta: { color: '#666' },
  selectedRow: { backgroundColor: '#eef6ff' }
});

export default UserRoleList;
