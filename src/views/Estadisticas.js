import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import { getIngresosMensuales, getPagosPorCliente } from '../services/estadisticasService';
import { exportToCSV, exportToDoc } from '../utils/exportUtils';

const Estadisticas = () => {
  const [loading, setLoading] = useState(true);
  const [ingresos, setIngresos] = useState([]);
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(300, windowWidth - 32);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const year = new Date().getFullYear();
        const data = await getIngresosMensuales(year);
        if (!mounted) return;
        setIngresos(data || []);
      } catch (e) {
        console.error('Error cargando ingresos', e);
        Alert.alert('Error', 'No se pudieron cargar los ingresos.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleExportPagosCSV() {
    try {
      const { entries } = await getPagosPorCliente();
      const headers = ['client', 'date', 'amount', 'method', 'status'];
      const rows = entries.map(e => [e.client || '', e.date || '', String(e.amount || 0), e.method || '', e.status || '']);
      const res = await exportToCSV('pagos_por_cliente.csv', headers, rows);
      if (res.ok) Alert.alert('Exportado', 'CSV exportado: ' + (res.path || 'compartido'));
      else Alert.alert('Error', 'No se pudo exportar CSV');
    } catch (e) {
      console.error('Export CSV error', e);
      Alert.alert('Error', 'Error exportando CSV');
    }
  }

  async function handleExportPagosDoc() {
    try {
      const { entries } = await getPagosPorCliente();
      // construir una tabla HTML sencilla
      const rowsHtml = entries.map(e => `<tr><td>${(e.client||'')}</td><td>${(e.date||'')}</td><td>${(e.amount||0)}</td><td>${(e.method||'')}</td><td>${(e.status||'')}</td></tr>`).join('');
      const html = `<table border="1" style="border-collapse:collapse"><thead><tr><th>Cliente</th><th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
      const sections = [{ title: 'Pagos por cliente', html }];
      const res = await exportToDoc('pagos_por_cliente.doc', 'Pagos por cliente', sections);
      if (res.ok) Alert.alert('Exportado', 'Documento exportado: ' + (res.path || 'compartido'));
      else Alert.alert('Error', 'No se pudo exportar documento');
    } catch (e) {
      console.error('Export DOC error', e);
      Alert.alert('Error', 'Error exportando documento');
    }
  }

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#0b60d9"/></View>
  );

  const labels = ingresos.map(m => m.month);
  const data = ingresos.map(m => Number(m.amount || 0));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingresos mensuales</Text>
        {data.length === 0 ? (
          <Text style={styles.empty}>No hay datos disponibles</Text>
        ) : (
          <LineChart
            data={{ labels, datasets: [{ data }] }}
            width={chartWidth}
            height={220}
            yAxisLabel="$"
            chartConfig={chartConfig}
            style={{ borderRadius: 12 }}
            bezier
          />
        )}

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={handleExportPagosCSV}><Text style={styles.buttonText}>Exportar pagos (CSV)</Text></TouchableOpacity>
          <TouchableOpacity style={styles.buttonAlt} onPress={handleExportPagosDoc}><Text style={styles.buttonTextAlt}>Exportar pagos (DOC)</Text></TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
};

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(11,19,32, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(80,80,80, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f6f8fa', alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#12323b', marginVertical: 12 },
  card: { width: '100%', backgroundColor: '#fff', padding: 14, borderRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  empty: { color: '#666', padding: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  row: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  button: { flex: 1, backgroundColor: '#0b60d9', padding: 10, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  buttonAlt: { flex: 1, backgroundColor: '#e6eefb', padding: 10, borderRadius: 8, alignItems: 'center', marginLeft: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  buttonTextAlt: { color: '#0b60d9', fontWeight: '700' }
});

export default Estadisticas;
