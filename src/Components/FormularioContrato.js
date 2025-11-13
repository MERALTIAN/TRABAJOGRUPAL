import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { db } from '../database/firebaseconfig.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

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
  const [selectedModelo, setSelectedModelo] = useState(null);
  const [selectedServicio, setSelectedServicio] = useState(null);

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
    // cuota por unidad = 15% del total (redondeado)
    let cuotaPorUnidad = Math.round(total * 0.15) || 0;
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
        Monto: total,
        Estado: estado,
        Fecha_Inicio: new Date().toISOString().slice(0, 10),
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
      setClienteId(''); setEstado('Pendiente'); setSelectedModelo(null); setSelectedServicio(null);
      // recargar datos en la vista padre
      try { cargarDatos(); } catch (e){}
    } catch (err) {
      console.error('Error creando contrato', err);
      Alert.alert('Error', 'No se pudo crear el contrato');
    }
  };

  const { total, cuotaPorUnidad, cuotas } = calcularTotales();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Formulario Contrato</Text>
      <Text style={{ marginBottom: 6, fontWeight: '700' }}>Seleccionar Cliente</Text>
      <ScrollView horizontal style={{ marginBottom: 8 }}>
        {clientes.map(cl => (
          <TouchableOpacity key={cl.id} onPress={() => setClienteId(cl.id)} style={[styles.selectItem, clienteId === cl.id && styles.selectItemActive]}>
            <Text style={{ fontWeight: '700' }}>{cl.Nombre ? `${cl.Nombre} ${cl.Apellido || ''}`.trim() : cl.id}</Text>
            <Text style={{ color: '#666' }}>{cl.Cedula || ''}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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

      <Text style={{ marginTop: 8 }}>Precio Modelo: C$ {selectedModelo ? (selectedModelo.Precio || 0) : 0}</Text>
      <Text>Precio Servicio: C$ {selectedServicio ? (selectedServicio.Monto || 0) : 0}</Text>
      <Text style={{ fontWeight: '800', marginTop: 8 }}>Total: C$ {total}</Text>
      <Text>Cuota por unidad (15%): C$ {cuotaPorUnidad} — Cuotas: {cuotas}</Text>

      <Button title="Guardar contrato" onPress={guardarContrato} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff', borderRadius: 8 },
  title: { fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6 },
  selectItem: { padding: 10, backgroundColor: '#f4f6f8', borderRadius: 8, marginRight: 8, alignItems: 'center', minWidth: 120 },
  selectItemActive: { borderWidth: 2, borderColor: '#1e90ff', backgroundColor: '#eaf4ff' },
});

export default FormularioContrato;