import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { db } from '../database/firebaseconfig.js';
import { collection, getDocs, query, where, limit as limitQ, orderBy, startAfter } from 'firebase/firestore';

const UserAutocomplete = ({ role = 'Cliente', selectedUser, onSelect }) => {
  const [filter, setFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [showList, setShowList] = useState(false);
  const inputRef = useRef(null);
  const [serverResults, setServerResults] = useState([]);
  const [lastUsuarioDoc, setLastUsuarioDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Load an initial small set of users for this role
        const q = query(collection(db, 'Usuario'), where('rol', '==', role), limitQ(20));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setUsers(data);
      } catch (e) { console.error('UserAutocomplete: error loading users', e); }
    };
    load();
    return () => { mounted = false; };
  }, [role]);

  // server-side search when filter length >= 2 (debounced)
  useEffect(() => {
    const controller = { cancelled: false };
    let handle = null;
    const doSearch = async () => {
      const q = (filter || '').trim();
      if (!q || q.length < 2) {
        if (!controller.cancelled) setServerResults([]);
        return;
      }
      try {
        // primary search by Usuario prefix (server-side, paginated)
        const qUsuario = query(
          collection(db, 'Usuario'),
          where('rol', '==', role),
          orderBy('Usuario'),
          where('Usuario', '>=', q),
          where('Usuario', '<=', q + '\\uf8ff'),
          limitQ(PAGE_SIZE)
        );
        const snap1 = await getDocs(qUsuario);
        const r1 = snap1.docs.map(d => ({ id: d.id, ...d.data() }));
        const last = snap1.docs.length ? snap1.docs[snap1.docs.length - 1] : null;
        if (!controller.cancelled) {
          setServerResults(r1.slice(0, PAGE_SIZE));
          setLastUsuarioDoc(last);
        }

        // also attempt a secondary search by Nombre to increase recall (non-paginated)
        try {
          const qNombre = query(collection(db, 'Usuario'), where('rol', '==', role), where('Nombre', '>=', q), where('Nombre', '<=', q + '\\uf8ff'), limitQ(PAGE_SIZE));
          const snap2 = await getDocs(qNombre);
          const r2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
          // merge without duplicates
          const map = {};
          [...r1, ...r2].forEach(u => { if (u && u.id) map[u.id] = u; });
          const combined = Object.values(map).slice(0, PAGE_SIZE);
          if (!controller.cancelled) setServerResults(combined);
        } catch (eName) {
          // ignore secondary search errors, primary already set
          console.warn('UserAutocomplete: secondary Nombre search failed', eName);
        }
      } catch (e) {
        // If Firestore requires a composite index for these range+equality queries,
        // fallback to a simpler query by role and perform client-side filtering.
        console.error('UserAutocomplete: server search error', e);
        try {
          const snap = await getDocs(query(collection(db, 'Usuario'), where('rol', '==', role), limitQ(50)));
          const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const qLower = q.toLowerCase();
          const filteredLocal = all.filter(u => {
            const display = (u.Usuario || u.Nombre || `${u.Nombre || ''} ${u.Apellido || ''}`.trim() || '').toString().toLowerCase();
            return display.startsWith(qLower) || (u.Telefono || '').toString().toLowerCase().includes(qLower);
          }).slice(0, 20);
          if (!controller.cancelled) setServerResults(filteredLocal);
        } catch (e2) {
          console.error('UserAutocomplete: fallback server search failed', e2);
          if (!controller.cancelled) setServerResults([]);
        }
      }
    };

    // debounce 300ms
    handle = setTimeout(doSearch, 300);
    return () => { controller.cancelled = true; if (handle) clearTimeout(handle); };
  }, [filter, role]);

  // load more results for Usuario prefix when user scrolls to end
  const loadMore = async () => {
    if (loadingMore) return;
    if (!lastUsuarioDoc) return; // nothing to load
    const q = (filter || '').trim();
    if (!q || q.length < 2) return;
    setLoadingMore(true);
    try {
      const qMore = query(
        collection(db, 'Usuario'),
        where('rol', '==', role),
        orderBy('Usuario'),
        where('Usuario', '>=', q),
        where('Usuario', '<=', q + '\\uf8ff'),
        startAfter(lastUsuarioDoc),
        limitQ(PAGE_SIZE)
      );
      const snap = await getDocs(qMore);
      const more = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const last = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
      setServerResults(prev => {
        const map = {};
        [...prev, ...more].forEach(u => { if (u && u.id) map[u.id] = u; });
        return Object.values(map).slice(0, 200);
      });
      setLastUsuarioDoc(last);
    } catch (e) {
      console.error('UserAutocomplete: loadMore error', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = users.filter(u => {
    if (!filter || filter.trim() === '') return true;
    const t = filter.toString().toLowerCase();
    const display = (u.Usuario || u.Nombre || `${u.Nombre || ''} ${u.Apellido || ''}`.trim() || '').toString().toLowerCase();
    const phone = (u.Telefono || u.phone || u.Email || u.email || '').toString().toLowerCase();
    return display.includes(t) || phone.includes(t) || (u.id || '').toLowerCase().includes(t);
  }).slice(0, 8);

  const displayName = (u) => (u.Usuario || u.Nombre || `${u.Nombre || ''} ${u.Apellido || ''}`.trim() || u.id || 'Usuario');

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        placeholder={selectedUser ? displayName(selectedUser) : `Buscar usuario (${role})...`}
        value={filter}
        onChangeText={(t) => { setFilter(t); setShowList(true); }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 120)}
        style={styles.input}
      />

      {showList && (
        <View style={styles.listContainer}>
          {((serverResults && serverResults.length) || filtered.length) === 0 ? (
            <Text style={styles.noResult}>No se encontraron usuarios</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {(serverResults && serverResults.length ? serverResults : filtered).map((item) => (
                <TouchableOpacity key={item.id} style={styles.row} onPress={() => { onSelect && onSelect(item); setFilter(''); setShowList(false); }}>
                  <View style={styles.rowLeft}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{(displayName(item).split(' ').map(s=>s[0]).join('').slice(0,2) || 'U').toUpperCase()}</Text></View>
                    <View>
                      <Text style={styles.name}>{displayName(item)}</Text>
                      <Text style={styles.meta}>{item.Telefono || item.Email || ''}</Text>
                    </View>
                  </View>
                  <View style={styles.rolePill}><Text style={styles.roleText}>{item.rol || role}</Text></View>
                </TouchableOpacity>
              ))}
              {lastUsuarioDoc ? (
                <TouchableOpacity style={{ padding: 12, alignItems: 'center' }} onPress={() => { loadMore(); }}>
                  <Text style={{ color: '#0b60d9', fontWeight: '700' }}>Cargar más</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e6e9ee', padding: 10, borderRadius: 8 },
  listContainer: { position: 'absolute', top: 52, left: 0, right: 0, maxHeight: 240, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eef2f7', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 6, zIndex: 9999 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f2f4f7' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0b60d9', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: '800' },
  name: { fontWeight: '700', color: '#0b60d9' },
  meta: { color: '#666', marginTop: 2 },
  rolePill: { backgroundColor: '#f0f8ff', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999 },
  roleText: { color: '#0b60d9', fontWeight: '700' },
  noResult: { padding: 12, color: '#666' }
});

export default UserAutocomplete;
