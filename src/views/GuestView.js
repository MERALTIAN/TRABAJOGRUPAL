import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Catalogo from './Catalogo';

const GuestView = ({ user }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Catalogo user={user} />
      </View>
      <View style={styles.separator} />
      {/* SolicitarContrato removido para invitados: ahora solo disponible para clientes autenticados */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  section: {
    paddingVertical: 20,
  },
  separator: {
    height: 10,
    backgroundColor: '#e9ecef',
  },
});

export default GuestView;
