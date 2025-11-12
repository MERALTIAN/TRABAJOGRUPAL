import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const BottomNav = ({ screens, index, setIndex }) => {
  // Define un icono para cada screen (puedes personalizar)
  const icons = {
    catalogo: 'home',
    acceso_contrato: 'file-contract',
    usuario: 'user',
    servicio: 'concierge-bell',
    modelo: 'clipboard-list',
    factura: 'file-invoice-dollar',
    contrato: 'file-signature',
    beneficiario: 'user-friends',
    cliente: 'user-tie',
    agentecobrador: 'hand-holding-usd',
  };

  return (
    <View style={styles.container}>
      {screens.map((s, i) => (
        <TouchableOpacity
          key={s.key}
          style={[styles.item, index === i && styles.active]}
          onPress={() => setIndex(i)}
        >
          <FontAwesome5
            name={icons[s.key] || 'question-circle'}
            size={24}
            color={index === i ? '#0080ffff' : '#555'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 85,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: '#e6f0ff', // resalta el icono activo
  },
});

export default BottomNav;
