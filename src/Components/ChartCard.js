import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ChartCard = ({ title, children, onRefresh = () => {}, onDetail = () => {}, onExport = () => {} }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  function openMenu() { setMenuVisible(true); }
  function closeMenu() { setMenuVisible(false); }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={openMenu} style={styles.menuBtn}>
          <MaterialIcons name="more-vert" size={22} color="#444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>{children}</View>

      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={closeMenu}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.menuCard} onPress={() => { onDetail(); closeMenu(); }}>
              <Text style={styles.menuText}>Ver detalle</Text>
            </Pressable>
            <Pressable style={styles.menuCard} onPress={() => { onRefresh(); closeMenu(); }}>
              <Text style={styles.menuText}>Actualizar</Text>
            </Pressable>
            <Pressable style={styles.menuCard} onPress={() => { onExport(); closeMenu(); }}>
              <Text style={styles.menuText}>Exportar (CSV)</Text>
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1320',
    marginBottom: 8,
  },
  menuBtn: { padding: 8 },
  content: {
    alignItems: 'center',
    width: '100%'
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  menuCard: { backgroundColor: '#fff', padding: 14, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  menuText: { fontSize: 16, color: '#0b1320' }
});

export default ChartCard;
