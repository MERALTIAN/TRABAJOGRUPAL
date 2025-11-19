import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, ActivityIndicator, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import ChartCard from '../Components/ChartCard';
import { exportToCSV, exportToDoc } from '../utils/exportUtils';
import {
  getEvolucionContratos,
  getUsuariosPorRol,
  getIngresosMensualesFromContratos,
  getEstadoContratosCounts,
  getClientesActivosInactivos
} from '../services/estadisticasService';

// We'll compute chart width dynamically using window width minus padding so charts fill the card nicely
const basePadding = 24; // we'll use this as horizontal padding for the screen

const EstadisticasAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState([]);
  const [usuariosRol, setUsuariosRol] = useState([]);
  const [ingresosMensuales, setIngresosMensuales] = useState([]);
  const [estadoContratos, setEstadoContratos] = useState({ activos:0, vencidos:0, pendientes:0 });
  const [clientesActivos, setClientesActivos] = useState({ activos:0, inactivos:0 });

  useEffect(() => {
    let mounted = true;
    async function load() { await refreshAll(); }
    load();
    return () => { mounted = false; };
  }, []);

  async function refreshAll() {
    setLoading(true);
    try {
      const [c, u, ingresos, estadoC, clientesAI] = await Promise.all([
        getEvolucionContratos(new Date().getFullYear()),
        getUsuariosPorRol(),
        getIngresosMensualesFromContratos(new Date().getFullYear()),
        getEstadoContratosCounts(),
        getClientesActivosInactivos()
      ]);
      setContratos(c || []);
      setUsuariosRol(u || []);
      setIngresosMensuales(ingresos || []);
      setEstadoContratos(estadoC || { activos:0, vencidos:0, pendientes:0 });
      setClientesActivos(clientesAI || { activos:0, inactivos:0 });
    } catch (e) {
      console.error('Error cargando estadísticas', e);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  }

  // Handlers para menús de cada gráfico
  async function refreshContratos() { const c = await getEvolucionContratos(new Date().getFullYear()); setContratos(c || []); }
  function detailContratos() {
    const total = contratos.reduce((s, it) => s + (it.value || 0), 0);
    Alert.alert('Detalle - Contratos', `Total contratos en el año: ${total}`);
  }
  async function exportContratos() {
    const headers = ['month','value'];
    const rows = contratos.map(r => [r.month || '', String(r.value || 0)]);
    const res = await exportToCSV('contratos_por_mes.csv', headers, rows);
    if (res.ok) Alert.alert('Exportado', 'CSV generado: ' + (res.path || 'compartido'));
    else Alert.alert('Error', 'No se pudo generar CSV');
  }

  async function refreshUsuarios() { const u = await getUsuariosPorRol(); setUsuariosRol(u || []); }
  function detailUsuarios() { Alert.alert('Usuarios por rol', usuariosRol.map(u=>`${u.name}: ${u.count}`).join('\n') || 'Sin datos'); }
  async function exportUsuarios() {
    const headers = ['role','count'];
    const rows = usuariosRol.map(r => [r.name || '', String(r.count || 0)]);
    const res = await exportToCSV('usuarios_por_rol.csv', headers, rows);
    if (res.ok) Alert.alert('Exportado', 'CSV generado: ' + (res.path || 'compartido'));
    else Alert.alert('Error', 'No se pudo generar CSV');
  }

  // removed servicios, facturas, cobros por agente per user request

  async function refreshEstadoContratos() { const e = await getEstadoContratosCounts(); setEstadoContratos(e || { activos:0, vencidos:0, pendientes:0 }); }
  function detailEstadoContratos() { const e = estadoContratos || {}; Alert.alert('Estado contratos', `Activos: ${e.activos}\nVencidos: ${e.vencidos}\nPendientes: ${e.pendientes}`); }
  async function exportEstadoContratos() {
    const e = estadoContratos || {};
    const headers = ['estado','count'];
    const rows = [['activos', String(e.activos || 0)], ['vencidos', String(e.vencidos || 0)], ['pendientes', String(e.pendientes || 0)]];
    const res = await exportToCSV('estado_contratos.csv', headers, rows);
    if (res.ok) Alert.alert('Exportado', 'CSV generado: ' + (res.path || 'compartido'));
    else Alert.alert('Error', 'No se pudo generar CSV');
  }

  async function refreshClientesActivos() { const c = await getClientesActivosInactivos(); setClientesActivos(c || { activos:0, inactivos:0 }); }
  function detailClientesActivos() { const c = clientesActivos || {}; Alert.alert('Clientes', `Activos: ${c.activos}\nInactivos: ${c.inactivos}`); }
  async function exportClientesActivos() {
    const c = clientesActivos || {};
    const headers = ['state','count'];
    const rows = [['activos', String(c.activos || 0)], ['inactivos', String(c.inactivos || 0)]];
    const res = await exportToCSV('clientes_activos.csv', headers, rows);
    if (res.ok) Alert.alert('Exportado', 'CSV generado: ' + (res.path || 'compartido'));
    else Alert.alert('Error', 'No se pudo generar CSV');
  }

  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(300, windowWidth - basePadding);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#0b60d9"/></View>
  );

  // Datos para contratos por mes (barras)
  const labelsContratos = contratos.map(c => c.month);
  const dataContratos = contratos.map(c => c.value || 0);

  // Usuarios por rol (pie)
  const pieUsuarios = usuariosRol.map((u, i) => ({ name: u.name, population: u.count, color: palette[i % palette.length], legendFontColor: '#333', legendFontSize: 12 }));

  // Contratos por estado (pie)
  const estadoArr = [
    { name: 'Activos', population: estadoContratos.activos || 0, color: palette[1], legendFontColor: '#333', legendFontSize: 12 },
    { name: 'Vencidos', population: estadoContratos.vencidos || 0, color: palette[3], legendFontColor: '#333', legendFontSize: 12 },
    { name: 'Pendientes', population: estadoContratos.pendientes || 0, color: palette[2], legendFontColor: '#333', legendFontSize: 12 }
  ];

  // Ingresos mensuales (line)
  const labelsIngresos = ingresosMensuales.map(m => m.month);
  const dataIngresos = ingresosMensuales.map(m => Number(m.amount || 0));


  // Clientes activos vs inactivos (pie)
  const clientesPie = [
    { name: 'Activos', population: clientesActivos.activos || 0, color: palette[1], legendFontColor: '#333', legendFontSize: 12 },
    { name: 'Inactivos', population: clientesActivos.inactivos || 0, color: palette[4], legendFontColor: '#333', legendFontSize: 12 }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Estadísticas - Administrador</Text>

        <ChartCard title="Evolución de contratos (mes)" onRefresh={refreshContratos} onDetail={detailContratos} onExport={exportContratos}>
          <BarChart
            data={{ labels: labelsContratos, datasets: [{ data: dataContratos }] }}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            style={{ borderRadius: 12 }}
            fromZero
          />
        </ChartCard>

        <ChartCard title="Contratos por estado" onRefresh={refreshEstadoContratos} onDetail={detailEstadoContratos} onExport={exportEstadoContratos}>
          {estadoArr.reduce((s,it)=>s+it.population,0) === 0 ? <Text style={styles.empty}>No hay datos</Text> : (
            <PieChart
              data={estadoArr}
              width={chartWidth}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          )}
        </ChartCard>

        <ChartCard title="Usuarios por rol" onRefresh={refreshUsuarios} onDetail={detailUsuarios} onExport={exportUsuarios}>
          {pieUsuarios.length === 0 ? <Text style={styles.empty}>No hay datos</Text> : (
            <PieChart
              data={pieUsuarios}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          )}
        </ChartCard>

        {/* Removed: Servicios más registrados, Facturas por estado, Cobros por agente (por contrato) */}

        <ChartCard title="Ingresos mensuales" onRefresh={refreshAll} onDetail={() => Alert.alert('Ingresos', 'Detalle de ingresos mensuales')} onExport={async () => {
          const headers = ['month','amount'];
          const rows = ingresosMensuales.map(i => [i.month || '', String(i.amount || 0)]);
          const res = await exportToCSV('ingresos_mensuales.csv', headers, rows);
          if (res.ok) Alert.alert('Exportado', 'CSV generado: ' + (res.path || 'compartido'));
          else Alert.alert('Error', 'No se pudo generar CSV');
        }}>
          <LineChart
            data={{ labels: labelsIngresos, datasets: [{ data: dataIngresos }] }}
            width={chartWidth}
            height={220}
            yAxisLabel="$"
            chartConfig={chartConfig}
            style={{ borderRadius: 12 }}
            bezier
          />
        </ChartCard>

        <View style={{height:30}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const palette = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(11,19,32, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(80,80,80, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f7fb' },
  container: { paddingHorizontal: 12, paddingBottom: 40, backgroundColor: '#f6f7fb', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: '800', color: '#0b1320', marginVertical: 8, alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  empty: { color: '#666' }
});

export default EstadisticasAdmin;
