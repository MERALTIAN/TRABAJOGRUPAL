import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import formatField from '../utils/formatField';

const TablaContrato = ({ contratos = [], eliminarContrato = () => {}, editarContrato = () => {}, verClientes = () => {} }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Contratos ({contratos.length})</Text>
    <ScrollView>
      <View style={styles.grid}>
        {contratos.map(c => {
          const clienteDisplay = (() => {
            if (!c) return '-';
            if (typeof c.Cliente === 'string' || typeof c.Cliente === 'number') return String(c.Cliente);
            if (c.Cliente && typeof c.Cliente === 'object') {
              return formatField(c.Cliente);
            }
            return formatField(c.ClienteId || c.ClienteNombre || '-');
          })();

          const montoDisplay = (() => {
            const m = c.Monto ?? c.monto ?? null;
            if (m === null || m === undefined || m === '') return '-';
            try { return `C$ ${Number(m).toLocaleString('en-US', {minimumFractionDigits: 2})}`; } catch(e) { return String(m); }
          })();

          return (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{clienteDisplay}</Text>
                <Text style={styles.cardAmount}>{montoDisplay}</Text>
              </View>
              <Text style={styles.cardDetail}>Estado: {String(c.Estado || c.estado || '—')}</Text>
              <Text style={styles.cardDetail}>Cuotas: {String(c.Cuotas || c.cuotas || '—')}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => editarContrato && editarContrato(c)}><Text>Editar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.delete]} onPress={() => eliminarContrato && eliminarContrato(c.id)}><Text>Eliminar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => verClientes && verClientes(c)}><Text>Clientes</Text></TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 10 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  grid: { flexDirection: 'column', gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#eef2f5', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardAmount: { fontSize: 14, fontWeight: '700', color: '#0b60d9' },
  cardDetail: { color: '#444', marginBottom: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f1f1f1', borderRadius: 6 },
  delete: { backgroundColor: '#ffdddd' }
});

export default TablaContrato;
