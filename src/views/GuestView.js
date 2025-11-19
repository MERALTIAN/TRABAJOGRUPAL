import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Catalogo from './Catalogo';

const GuestView = ({ user, setMenuVisible }) => {
  const hora = new Date().getHours();
  const saludo = useMemo(() => {
    if (hora < 4) return '¡Buenos días';
    if (hora < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  }, [hora]);

  const displayName = (user && (user.Usuario || user.Nombre)) || 'invitado';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcomeWrapper}>
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeIcon}>👋</Text>
          <Text style={styles.welcomeTitle}>{saludo}, {displayName}!</Text>
          <Text style={styles.welcomeSub}>Accede a todas las funciones del panel de administrador desde el menú.</Text>

          <TouchableOpacity style={styles.menuButton} onPress={() => { try { if (setMenuVisible) setMenuVisible(true); } catch(e){} }}>
            <Text style={styles.menuButtonText}>Abrir menú de opciones</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Catalogo user={user} />
      </View>

      <View style={styles.separator} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingVertical: 20, alignItems: 'center' },
  welcomeWrapper: { width: '100%', alignItems: 'center', marginBottom: 18 },
  welcomeBox: {
    width: '92%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  welcomeIcon: { fontSize: 56, marginBottom: 8 },
  welcomeTitle: { fontSize: 28, color: '#1e90ff', fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  welcomeSub: { fontSize: 15, color: '#666', textAlign: 'center', paddingHorizontal: 12 },
  menuButton: { marginTop: 18, backgroundColor: '#1e90ff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, elevation: 4 },
  menuButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  section: { width: '100%', paddingHorizontal: 12, paddingTop: 8 },
  separator: { height: 10, backgroundColor: '#e9ecef', width: '100%', marginTop: 12 },
});

export default GuestView;
