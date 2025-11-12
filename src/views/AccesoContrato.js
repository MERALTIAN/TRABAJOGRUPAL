import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AccesoContrato = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Vista temporal: Acceso de contrato no disponible aquí.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#666' },
});

export default AccesoContrato;
