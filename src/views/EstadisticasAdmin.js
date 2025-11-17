import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, ActivityIndicator, StyleSheet, Alert, SafeAreaView, useWindowDimensions } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import ChartCard from '../Components/ChartCard';
import {
  getEvolucionContratos,
  getUsuariosPorRol,
  getDistribucionServicios,
  getFacturasPorEstado,
  getIngresosMensuales,
  getCobrosPorAgente,
  getIngresosMensualesFromContratos,
  getCobrosPorAgenteFromContratos,
  getEstadoContratosCounts,
  getClientesActivosInactivos
} from '../services/estadisticasService';

// We'll compute chart width dynamically using window width minus padding so charts fill the card nicely
const basePadding = 24; // we'll use this as horizontal padding for the screen

const EstadisticasAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState([]);
  const [usuariosRol, setUsuariosRol] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [facturasEstado, setFacturasEstado] = useState({});
  const [ingresosMensuales, setIngresosMensuales] = useState([]);
  const [cobrosPorAgente, setCobrosPorAgente] = useState([]);
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
      const [c, u, s, f, ingresos, cobros, estadoC, clientesAI] = await Promise.all([
        getEvolucionContratos(new Date().getFullYear()),
        getUsuariosPorRol(),
        getDistribucionServicios(),
        getFacturasPorEstado(),
        getIngresosMensualesFromContratos(new Date().getFullYear()),
        getCobrosPorAgenteFromContratos(new Date().getFullYear()),
        getEstadoContratosCounts(), getClientesActivosInactivos()
      ]);
      setContratos(c || []);
      setUsuariosRol(u || []);
      setServicios(s || []);
      setFacturasEstado(f || {});
      setIngresosMensuales(ingresos || []);
      setCobrosPorAgente(cobros || []);
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
  function exportContratos() {
    const csv = `month,value\n` + contratos.map(r => `${r.month},${r.value || 0}`).join('\n');
    console.log('CSV contratos:\n', csv);
    Alert.alert('Exportar CSV', 'CSV generado en la consola. Copia desde el log si lo necesitas.');
  }

  async function refreshUsuarios() { const u = await getUsuariosPorRol(); setUsuariosRol(u || []); }
  function detailUsuarios() { Alert.alert('Usuarios por rol', usuariosRol.map(u=>`${u.name}: ${u.count}`).join('\n') || 'Sin datos'); }
  function exportUsuarios() { const csv = `role,count\n` + usuariosRol.map(r => `${r.name},${r.count}`).join('\n'); console.log('CSV usuarios:\n', csv); Alert.alert('Exportar CSV', 'CSV generado en la consola.'); }

  async function refreshServicios() { const s = await getDistribucionServicios(); setServicios(s || []); }
  function detailServicios() { Alert.alert('Servicios', servicios.map(s=>`${s.name}: ${s.count}`).join('\n') || 'Sin datos'); }
  function exportServicios() { const csv = `service,count\n` + servicios.map(r => `${r.name},${r.count}`).join('\n'); console.log('CSV servicios:\n', csv); Alert.alert('Exportar CSV', 'CSV generado en la consola.'); }

  async function refreshFacturas() { const f = await getFacturasPorEstado(); setFacturasEstado(f || {}); }
  function detailFacturas() { Alert.alert('Facturas por estado', Object.keys(facturasEstado).map(k=>`${k}: ${facturasEstado[k]}`).join('\n') || 'Sin datos'); }
  function exportFacturas() { const csv = `state,count\n` + Object.keys(facturasEstado).map(k => `${k},${facturasEstado[k] || 0}`).join('\n'); console.log('CSV facturas:\n', csv); Alert.alert('Exportar CSV', 'CSV generado en la consola.'); }

  async function refreshCobros() { const a = await getCobrosPorAgente(new Date().getFullYear()); setCobrosPorAgente(a || []); }
  function detailCobros() { Alert.alert('Cobros por agente', cobrosPorAgente.map(r=>`${r.agent}: ${r.total}`).join('\n') || 'Sin datos'); }
  function exportCobros() { const csv = `agent,total\n` + cobrosPorAgente.map(r => `${r.agent},${r.total}`).join('\n'); console.log('CSV cobros:\n', csv); Alert.alert('Exportar CSV', 'CSV generado en la consola.'); }
  
  // contract-based refresh
  async function refreshCobrosFromContratos() { const a = await getCobrosPorAgenteFromContratos(new Date().getFullYear()); setCobrosPorAgente(a || []); }

  async function refreshEstadoContratos() { const e = await getEstadoContratosCounts(); setEstadoContratos(e || { activos:0, vencidos:0, pendientes:0 }); }
  function detailEstadoContratos() { const e = estadoContratos || {}; Alert.alert('Estado contratos', `Activos: ${e.activos}\nVencidos: ${e.vencidos}\nPendientes: ${e.pendientes}`); }
  function exportEstadoContratos() { const e = estadoContratos || {}; const csv = `estado,count\nactivos,${e.activos || 0}\nvencidos,${e.vencidos || 0}\npendientes,${e.pendientes || 0}`; console.log('CSV estado contratos:\n', csv); Alert.alert('Exportar CSV', 'CSV generado en la consola.'); }

  async function refreshClientesActivos() { const c = await getClientesActivosInactivos(); setClientesActivos(c || { activos:0, inactivos:0 }); }
  function detailClientesActivos() { const c = clientesActivos || {}; Alert.alert('Clientes', `Activos: ${c.activos}\nInactivos: ${c.inactivos}`); }
  function exportClientesActivos() { const c = clientesActivos || {}; const csv = `state,count\nactivos,${c.activos || 0}\ninactivos,${c.inactivos || 0}`; console.log('CSV clientes:\n', csv); Alert.alert('Exportar CSV', 'CSV generado en la consola.'); }

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

  // Servicios top 6
  const serviciosSorted = [...servicios].sort((a,b) => b.count - a.count).slice(0,6);
  const labelsServicios = serviciosSorted.map(s => s.name);
  const dataServicios = serviciosSorted.map(s => s.count);

  // Facturas por estado -> convertir a pie
  const facturasPie = Object.keys(facturasEstado).map((k,i) => ({ name: k, population: facturasEstado[k] || 0, color: palette[(i+2) % palette.length], legendFontColor: '#333', legendFontSize: 12 }));

  // Ingresos mensuales (line)
  const labelsIngresos = ingresosMensuales.map(m => m.month);
  const dataIngresos = ingresosMensuales.map(m => Number(m.amount || 0));

  // Cobros por agente (bar)
  const agentesLabels = cobrosPorAgente.map(a => a.agent || 'Sin agente');
  const agentesData = cobrosPorAgente.map(a => Number(a.total || 0));
  // Truncar etiquetas largas para que se vean debajo de las barras y permitan rotación
  const agentesLabelsShort = agentesLabels.map(l => l && l.length > 12 ? l.slice(0, 12) + '...' : l);

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

        <ChartCard title="Servicios más registrados" onRefresh={refreshServicios} onDetail={detailServicios} onExport={exportServicios}>
          {dataServicios.length === 0 ? <Text style={styles.empty}>No hay datos</Text> : (
            <BarChart
              data={{ labels: labelsServicios, datasets: [{ data: dataServicios }] }}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              style={{ borderRadius: 12 }}
              fromZero
              horizontalLabelRotation={-20}
            />
          )}
        </ChartCard>

        <ChartCard title="Facturas por estado" onRefresh={refreshFacturas} onDetail={detailFacturas} onExport={exportFacturas}>
          {facturasPie.length === 0 ? <Text style={styles.empty}>No hay datos</Text> : (
            <PieChart
              data={facturasPie}
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

        <ChartCard title="Cobros por agente (por contrato)" onRefresh={refreshCobrosFromContratos} onDetail={detailCobros} onExport={exportCobros}>
          {agentesData.length === 0 ? <Text style={styles.empty}>No hay datos</Text> : (
            <BarChart
              data={{ labels: agentesLabelsShort, datasets: [{ data: agentesData }] }}
              width={chartWidth}
              height={280}
              chartConfig={chartConfig}
              style={{ borderRadius: 12 }}
              fromZero
              horizontalLabelRotation={-45}
            />
          )}
        </ChartCard>

        <ChartCard title="Ingresos mensuales" onRefresh={refreshAll} onDetail={() => Alert.alert('Ingresos', 'Detalle de ingresos mensuales')} onExport={() => { const csv = `month,amount\n` + ingresosMensuales.map(i=>`${i.month},${i.amount||0}`).join('\n'); console.log('CSV ingresos:\n', csv); Alert.alert('Exportar CSV', 'CSV generado en la consola.'); }}>
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
