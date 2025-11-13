import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { db } from '../database/firebaseconfig.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
let DateTimePicker = null;
try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch(e) { DateTimePicker = null; }

// FormularioContrato mejorado:
// - permite seleccionar un Modelo y un Servicio disponibles
// - suma sus precios, calcula CuotaMonto = round(total * 0.15), Cuotas = ceil(total / CuotaMonto
// - guarda contrato con campos: ModeloId, ServicioId, Monto, CuotaMonto, Cuotas, CuotasRestantes
// - borra los docs de Modelo/Servicio seleccionados para evitar duplicados
const FormularioContrato = ({ cargarDatos = () => {} }) => {
  const [clienteId, setClienteId] = useState('');
  const [estado, setEstado] = useState('Pendiente');

  const [modelos, setModelos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clientFilter, setClientFilter] = useState('');
  const [selectedModelo, setSelectedModelo] = useState(null);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0,10));
  const [fechaFin, setFechaFin] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [montoManual, setMontoManual] = useState(null);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    // cargar modelos y servicios disponibles
    const load = async () => {
      try {
        const ms = await getDocs(collection(db, 'Modelo'));
        setModelos(ms.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('Error cargando Modelos', e); }
      try {
        const ss = await getDocs(collection(db, 'Servicio'));
        setServicios(ss.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('Error cargando Servicios', e); }
      // cargar clientes disponibles para seleccionar
      try {
        const cs = await getDocs(collection(db, 'Cliente'));
        setClientes(cs.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('Error cargando Clientes', e); }
    };
    load();
  }, []);

  const calcularTotales = () => {
  const precioModelo = Number((selectedModelo && (selectedModelo.Precio !== undefined ? selectedModelo.Precio : selectedModelo.Precio)) || 0) || 0;
    const montoServicio = Number(selectedServicio?.Monto ?? 0) || 0;
    const total = precioModelo + montoServicio;
  // cuota por unidad = 5% del total (redondeado)
  let cuotaPorUnidad = Math.round(total * 0.05) || 0;
    if (cuotaPorUnidad <= 0) cuotaPorUnidad = total; // evita división por cero
    const cuotas = Math.max(1, Math.ceil(total / cuotaPorUnidad));
    return { total, cuotaPorUnidad, cuotas };
  };

  const guardarContrato = async () => {
    if (!clienteId) return Alert.alert('Falta dato', 'Selecciona un cliente antes de guardar');
    if (!selectedModelo && !selectedServicio) return Alert.alert('Seleccione', 'Seleccione al menos un modelo o servicio');

    const { total, cuotaPorUnidad, cuotas } = calcularTotales();

    try {
      const dataToSave = {
        ClienteId: clienteId,
        Monto: (montoManual !== null ? Number(montoManual) : total),
        Estado: estado,
        Fecha_Inicio: fechaInicio || new Date().toISOString().slice(0, 10),
        Fecha_Fin: fechaFin || null,
        Comentario: comentario || null,
        CuotaMonto: cuotaPorUnidad,
        Cuotas: cuotas,
        CuotasRestantes: cuotas,
      };
      if (selectedModelo) dataToSave.ModeloId = selectedModelo.id;
      if (selectedServicio) dataToSave.ServicioId = selectedServicio.id;

      const ref = await addDoc(collection(db, 'Contrato'), dataToSave);

      // eliminar modelo y servicio usados para evitar duplicados (si el usuario prefiere otra política, lo cambiamos)
      try {
        if (selectedModelo && selectedModelo.id) await deleteDoc(doc(db, 'Modelo', selectedModelo.id));
      } catch (e) { console.error('No se pudo eliminar Modelo usado:', e); }
      try {
        if (selectedServicio && selectedServicio.id) await deleteDoc(doc(db, 'Servicio', selectedServicio.id));
      } catch (e) { console.error('No se pudo eliminar Servicio usado:', e); }

      Alert.alert('Éxito', 'Contrato guardado correctamente');
      // limpiar
      setClienteId(''); setEstado('Pendiente'); setSelectedModelo(null); setSelectedServicio(null); setComentario(''); setMontoManual(null); setFechaFin('');
      // recargar datos en la vista padre
      try { cargarDatos(); } catch (e){}
    } catch (err) {
      console.error('Error creando contrato', err);
      Alert.alert('Error', 'No se pudo crear el contrato');
    }
  };

  const { total, cuotaPorUnidad, cuotas } = calcularTotales();

  return (
    <View style={[styles.container, styles.cardLike]}>
      <Text style={styles.title}>Registro de Contrato</Text>
      <Text style={{ marginBottom: 6, fontWeight: '700' }}>Seleccionar Cliente</Text>
      <TextInput placeholder="Buscar cliente por nombre o cédula..." value={clientFilter} onChangeText={setClientFilter} style={styles.input} />
      {clientFilter !== '' && (
        <ScrollView style={{ maxHeight: 160, marginBottom: 8 }}>
          {clientes.filter(c => {
            const q = clientFilter.toString().toLowerCase();
            const name = ((c.Nombre || '') + ' ' + (c.Apellido || '')).toLowerCase();
            const ced = (c.Cedula || '').toLowerCase();
            return name.includes(q) || ced.includes(q) || (c.id || '').toLowerCase().includes(q);
          }).map(c => (
            <TouchableOpacity key={c.id} onPress={() => { setClienteId(c.id); setClientFilter(''); }} style={[styles.selectItem, clienteId === c.id && styles.selectItemActive]}>
              <Text style={{ fontWeight: '700' }}>{c.Nombre ? `${c.Nombre} ${c.Apellido || ''}`.trim() : c.id}</Text>
              <Text style={{ color: '#666' }}>{c.Cedula || ''}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <Text style={{ color: '#666', marginBottom: 8 }}>Cliente seleccionado: {clientes.find(x => x.id === clienteId)?.Nombre ?? ''} {clientes.find(x => x.id === clienteId)?.Apellido ?? ''}</Text>

      <Text style={{ fontWeight: '700', marginTop: 6 }}>Seleccionar Modelo</Text>
      <ScrollView horizontal style={{ marginVertical: 8 }}>
        {modelos.map(m => (
          <TouchableOpacity key={m.id} onPress={() => setSelectedModelo(m)} style={[styles.selectItem, selectedModelo?.id === m.id && styles.selectItemActive]}>
            <Text style={{ fontWeight: '700' }}>{m.Nombre || m.Modelo || 'Modelo'}</Text>
            <Text style={{ color: '#666' }}>{typeof m.Precio !== 'undefined' ? `C$ ${m.Precio}` : '-'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ fontWeight: '700', marginTop: 6 }}>Seleccionar Servicio</Text>
      <ScrollView horizontal style={{ marginVertical: 8 }}>
        {servicios.map(s => (
          <TouchableOpacity key={s.id} onPress={() => setSelectedServicio(s)} style={[styles.selectItem, selectedServicio?.id === s.id && styles.selectItemActive]}>
            <Text style={{ fontWeight: '700' }}>{s.Nombre}</Text>
            <Text style={{ color: '#666' }}>{typeof s.Monto !== 'undefined' ? `C$ ${s.Monto}` : '-'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ marginTop: 8 }}>
        <Text>Precio Modelo: C$ {selectedModelo ? (selectedModelo.Precio || 0) : 0}</Text>
        <Text>Precio Servicio: C$ {selectedServicio ? (selectedServicio.Monto || 0) : 0}</Text>
        <Text style={{ fontWeight: '800', marginTop: 8 }}>Total estimado: C$ {total}</Text>
      </View>

      <Text style={{ marginTop: 10, fontWeight: '700' }}>Monto (editable)</Text>
      <TextInput style={styles.input} value={montoManual !== null ? String(montoManual) : String(total)} onChangeText={(t) => setMontoManual(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />

      <Text style={{ marginTop: 8, fontWeight: '700' }}>Fecha Inicio</Text>
      <TextInput style={styles.input} value={fechaInicio} editable={false} />

      <Text style={{ marginTop: 8, fontWeight: '700' }}>Fecha Fin</Text>
      {DateTimePicker ? (
        <View>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
            <Text>{fechaFin || 'Seleccionar fecha'}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={fechaFin ? new Date(fechaFin) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={(ev, d) => { setShowDatePicker(false); if (d) setFechaFin(d.toISOString().slice(0,10)); }}
            />
          )}
        </View>
      ) : (
        <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={fechaFin} onChangeText={setFechaFin} />
      )}

      <Text style={{ marginTop: 8, fontWeight: '700' }}>Estado</Text>
      <TextInput style={styles.input} value={estado} onChangeText={setEstado} />

      <Text style={{ marginTop: 8, fontWeight: '700' }}>Comentario</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={comentario} onChangeText={setComentario} multiline />

  <Text style={{ marginTop: 8 }}>Cuota por unidad (5%): C$ {cuotaPorUnidad} — Cuotas: {cuotas}</Text>

      <TouchableOpacity style={styles.saveButton} onPress={guardarContrato} activeOpacity={0.9}>
        <Text style={styles.saveButtonText}>GUARDAR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12 },
  cardLike: { backgroundColor: '#fff', borderRadius: 10, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 4 },
  title: { fontWeight: '700', marginBottom: 8, fontSize: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6 },
  selectItem: { padding: 10, backgroundColor: '#f4f6f8', borderRadius: 8, marginRight: 8, alignItems: 'center', minWidth: 120 },
  selectItemActive: { borderWidth: 2, borderColor: '#1e90ff', backgroundColor: '#eaf4ff' },
  saveButton: { backgroundColor: '#1e90ff', paddingVertical: 14, borderRadius: 6, marginTop: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800' },
});

export default FormularioContrato;