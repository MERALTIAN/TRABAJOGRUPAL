import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const TablaContrato = ({ contratos = [], eliminarContrato = () => {}, editarContrato = () => {}, verClientes = () => {}, currentUser = null }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Contratos</Text>
      {contratos.length === 0 ? (
        <Text style={styles.empty}>No hay contratos registrados.</Text>
      ) : (
        <FlatList
          data={contratos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item: c }) => {
            const displayClient = c.Cliente || c.ClienteNombre || c.ClienteId || '-';
            const status = (c.Estado || c.estado || 'Pendiente').toString();
            const date = c.Fecha_Inicio || c.FechaInicio || c.createdAt || '';
            return (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.leftBlock}>
                  <View style={styles.avatarCircle}><Text style={styles.avatarText}>{(String(displayClient).split(' ').filter(Boolean).map(s=>s[0]).slice(0,2).join('')||'U').toUpperCase()}</Text></View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.heading}>{displayClient}</Text>
                    <Text style={styles.subText}>Contrato: {c.id}</Text>
                  </View>
                </View>
                <View style={styles.rightBlock}>
                  <Text style={[styles.statusPill, status.toLowerCase()==='aprobada'?styles.statusApproved:status.toLowerCase()==='rechazada'?styles.statusRejected:styles.statusPending]}>{status}</Text>
                  {date ? <Text style={styles.cardDate}>{String(date).slice(0,10)}</Text> : null}
                </View>
              </View>

              {c.Comentario ? (
                <View style={styles.commentContainer}><Text style={styles.commentTitle}>Comentario del contrato:</Text><Text style={styles.commentText}>{c.Comentario}</Text></View>
              ) : null}

              <View style={styles.cardFooter}>
                <Text>Cuotas: {c.Cuotas ?? c.cuotas ?? '-'}</Text>
                <Text>Monto: C$ {c.Monto ?? c.Monto_Decimal ?? '-'}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.detail]} onPress={() => editarContrato(c)}>
                  <Text style={styles.btnText}>Detalles</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.delete]} onPress={() => eliminarContrato(c.id)}>
                  <Text style={styles.btnText}>Eliminar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => verClientes(c)}>
                  <Text style={styles.btnText}>Ver Clientes</Text>
                </TouchableOpacity>
              </View>
            </View>
            );
          }}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  empty: { color: '#666' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#eef2f5' },
  heading: { fontWeight: '800', marginBottom: 6, color: '#12323b', fontSize: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftBlock: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0b60d9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  subText: { color: '#666', marginTop: 2 },
  rightBlock: { alignItems: 'flex-end' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '700' },
  statusPending: { backgroundColor: '#fff3cd', color: '#856404' },
  statusApproved: { backgroundColor: '#d4edda', color: '#155724' },
  statusRejected: { backgroundColor: '#f8d7da', color: '#721c24' },
  cardDate: { color: '#666', marginTop: 6 },
  commentContainer: { marginTop: 8, padding: 10, backgroundColor: '#f0f8ff', borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#007bff' },
  commentTitle: { color: '#007bff', fontWeight: '700', marginBottom: 4 },
  commentText: { color: '#333', fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  actions: { flexDirection: 'row', marginTop: 8 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  detail: { backgroundColor: '#1e90ff' },
  delete: { backgroundColor: '#ff4444' },
  secondary: { backgroundColor: '#6c757d' },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default TablaContrato;
