import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const colors = {
  primary: '#1e90ff',
  accent: '#06b6d4',
  danger: '#ef4444',
  bg: '#f6f7fb',
  card: '#ffffff',
  text: '#0b1320'
};

export const Card = ({ style, children }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const PrimaryButton = ({ title, onPress, style }) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

export const Title = ({ children, style }) => (
  <Text style={[styles.title, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text }
});

export default null;
