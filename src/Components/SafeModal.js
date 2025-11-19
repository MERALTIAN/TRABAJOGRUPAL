import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';

// Safe wrapper around RN Modal: if Modal is not available for any reason,
// render the children inside a simple overlay View to avoid ReferenceError.
const SafeModal = ({ children, visible, transparent = true, animationType = 'none', onRequestClose }) => {
  try {
    if (typeof Modal === 'undefined' || !Modal) {
      if (!visible) return null;
      return (
        <View style={[styles.overlay, transparent ? styles.transparentBg : styles.opaqueBg]}>
          {children}
        </View>
      );
    }

    return (
      <Modal visible={!!visible} transparent={transparent} animationType={animationType} onRequestClose={onRequestClose}>
        {children}
      </Modal>
    );
  } catch (e) {
    if (!visible) return null;
    return (
      <View style={[styles.overlay, transparent ? styles.transparentBg : styles.opaqueBg]}>
        {children}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  transparentBg: { backgroundColor: 'rgba(0,0,0,0.5)' },
  opaqueBg: { backgroundColor: '#fff' },
});

export default SafeModal;
