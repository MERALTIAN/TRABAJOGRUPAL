import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import SafeModal from '../Components/SafeModal';
import { db } from "../database/firebaseconfig";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const FormularioContrato = ({ cargarDatos }) => {
  const [cantidadBeneficiario, setCantidadBeneficiario] = useState("");
  const [cliente, setCliente] = useState("");
  const [cuotas, setCuotas] = useState("");
  const [estado, setEstado] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [clientes, setClientes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [selectedModeloId, setSelectedModeloId] = useState("");
  const [selectedServicioId, setSelectedServicioId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isDatePickerAvailable, setIsDatePickerAvailable] = useState(false);
  const [datePickerModule, setDatePickerModule] = useState(null);
  const [clientModalVisible, setClientModalVisible] = useState(false);

  useEffect(() => {
    // default fechaInicio a hoy
    const hoy = new Date();
    setFechaInicio(hoy.toISOString().slice(0,10));

    let mounted = true;
    const loadClientes = async () => {
      try {
        const snap = await getDocs(collection(db, 'Cliente'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setClientes(data);
      } catch (e) {
        console.error('Error cargando clientes en FormularioContrato', e);
      }
    };
    const loadExtras = async () => {
      try {
        const snapM = await getDocs(collection(db, 'Modelo'));
        const models = snapM.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setModelos(models);
      } catch (e) { console.error('Error cargando modelos', e); }
      try {
        const snapS = await getDocs(collection(db, 'Servicio'));
        const servs = snapS.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setServicios(servs);
      } catch (e) { console.error('Error cargando servicios', e); }
    };

    loadClientes();
    loadExtras();
    return () => { mounted = false; };
  }, []);

  const showDatePicker = async () => {
    // try dynamic import of modal datepicker and native picker
    try {
      const modal = await import('react-native-modal-datetime-picker');
      const native = await import('@react-native-community/datetimepicker');
      setDatePickerModule({ modal: modal.default || modal, native: native.default || native });
      setIsDatePickerAvailable(true);
      setPickerVisible(true);
    } catch (e) {
      // not installed — fallback to alert and let user type date manually
      alert('El selector de fecha no está instalado. Para habilitar el calendario, instala @react-native-community/datetimepicker y react-native-modal-datetime-picker');
    }
  };

  const hideDatePicker = () => setPickerVisible(false);

  const handleConfirm = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    setFechaFin(d.toISOString().slice(0,10));
    hideDatePicker();
  };
  const [monto, setMonto] = useState("");
  const [comentario, setComentario] = useState("");

  // compute total from selected modelo and servicio, and auto-calc cuotas
  useEffect(() => {
    const calc = () => {
      const modelo = modelos.find(m => m.id === selectedModeloId);
      const servicio = servicios.find(s => s.id === selectedServicioId);
      const precioModelo = modelo ? (Number(modelo.Precio || 0) ) : 0;
      const precioServicio = servicio ? (Number(servicio.Monto || servicio.Precio || 0)) : 0;
      const total = precioModelo + precioServicio;
      if (total > 0) {
        // cuota por unidad = 5% del total (cambiado según requerimiento)
        const cuotaValor = Math.round(total * 0.05);
        const cuotasCalc = Math.ceil(total / (cuotaValor || 1));
        setMonto(String(total));
        setCuotas(String(cuotasCalc));
      } else {
        setMonto("");
        setCuotas("");
      }
    };
    calc();
  }, [selectedModeloId, selectedServicioId, modelos, servicios]);


  const guardarContrato = async () => {
    if (!clienteId) {
      alert('Seleccione un cliente para el contrato');
      return;
    }
    if (cantidadBeneficiario && cuotas && estado && fechaFin && fechaInicio && monto) {
      try {
        const total = parseFloat(monto) || 0;
  const cuotaValor = Math.round(total * 0.05) || 0;
        const contratoRef = await addDoc(collection(db, "Contrato"), {
          Cantida_de_Beneficiario: parseInt(cantidadBeneficiario),
          ClienteId: clienteId,
          Cuotas: parseInt(cuotas),
          CuotasRestantes: parseInt(cuotas),
          Estado: estado,
          Fecha_Fin: fechaFin,
          Fecha_Inicio: fechaInicio,
          Monto: total,
          Comentario: comentario,
          CuotaMonto: cuotaValor,
          commissionPercent: 5,
          ModeloId: selectedModeloId || null,
          ServicioId: selectedServicioId || null,
        });

        // If a modelo or servicio was selected, remove them from DB to avoid duplicates (user requested auto-delete)
        try {
          if (selectedModeloId) await deleteDoc(doc(db, 'Modelo', selectedModeloId));
        } catch (e) { console.error('No se pudo eliminar modelo seleccionado:', e); }
        try {
          if (selectedServicioId) await deleteDoc(doc(db, 'Servicio', selectedServicioId));
        } catch (e) { console.error('No se pudo eliminar servicio seleccionado:', e); }
  alert(`Contrato creado correctamente.`);
        setCantidadBeneficiario("");
    setCliente("");
    setClienteId("");
        setCuotas("");
        setEstado("");
        setFechaFin("");
        setFechaInicio("");
        setMonto("");
        setSelectedModeloId("");
        setSelectedServicioId("");
        setComentario("");
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar contrato:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Contrato</Text>

      <TextInput
        style={styles.input}
        placeholder="Cantidad de Beneficiario"
        value={cantidadBeneficiario}
        onChangeText={setCantidadBeneficiario}
        keyboardType="numeric"
      />

      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 6 }}>Seleccionar Cliente</Text>
        <TouchableOpacity style={styles.selectorRow} onPress={() => setClientModalVisible(true)}>
          <Text style={{ color: clienteId ? '#000' : '#666' }}>{cliente ? cliente : 'Seleccionar cliente...'}</Text>
        </TouchableOpacity>
        <SafeModal visible={clientModalVisible} transparent animationType="slide" onRequestClose={() => setClientModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalInner}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Clientes</Text>
              <ScrollView>
                {clientes.map(cl => (
                  <TouchableOpacity key={cl.id} onPress={() => { setClienteId(cl.id); setCliente(`${cl.Nombre} ${cl.Apellido || ''}`); setClientModalVisible(false); }} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: clienteId === cl.id ? '#0b60d9' : '#333' }}>{cl.Nombre} {cl.Apellido ? cl.Apellido : ''}</Text>
                    <Text style={{ color: '#666' }}>{cl.Cedula || ''}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                <TouchableOpacity onPress={() => setClientModalVisible(false)} style={styles.closeBtn}><Text>Cerrar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeModal>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 6 }}>Seleccionar Modelo (opcional)</Text>
        {modelos.length === 0 ? (
          <Text style={{ color: '#666' }}>No hay modelos</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 6 }}>
            {modelos.map(m => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setSelectedModeloId(m.id)}
                style={[styles.card, selectedModeloId === m.id ? styles.cardSelected : null]}
              >
                <Text style={styles.cardTitle}>{m.Nombre || m.Modelo}</Text>
                <Text style={styles.cardPrice}>{m.Precio ? `C$ ${Number(m.Precio).toLocaleString()}` : 'Sin precio'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 6 }}>Seleccionar Servicio (opcional)</Text>
        {servicios.length === 0 ? (
          <Text style={{ color: '#666' }}>No hay servicios</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 6 }}>
            {servicios.map(s => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedServicioId(s.id)}
                style={[styles.card, selectedServicioId === s.id ? styles.cardSelected : null]}
              >
                <Text style={styles.cardTitle}>{s.Nombre}</Text>
                <Text style={styles.cardPrice}>{s.Monto ? `C$ ${Number(s.Monto).toLocaleString()}` : 'Sin precio'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Subtotal calculado:</Text>
        <Text style={styles.summaryValue}>{monto ? `C$ ${Number(monto).toLocaleString()}` : '-'}</Text>
        <Text style={styles.summaryLabel}>Cuotas calculadas (15%/cuota):</Text>
        <Text style={styles.summaryValue}>{cuotas || '-'}</Text>
        <Text style={styles.summaryLabel}>Valor por cuota:</Text>
        <Text style={styles.summaryValue}>{monto ? `C$ ${Math.round((parseFloat(monto) || 0) * 0.15)}` : '-'}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Cuotas"
        value={cuotas}
        onChangeText={setCuotas}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Estado"
        value={estado}
        onChangeText={setEstado}
      />

      <TouchableOpacity onPress={showDatePicker} style={[styles.input, { justifyContent: 'center' }] }>
        <Text>{fechaFin || 'Fecha Fin (YYYY-MM-DD)'}</Text>
      </TouchableOpacity>
      {/* If picker is available, render dynamic modal picker */}
      {isDatePickerAvailable && datePickerModule && (
        <datePickerModule.modal
          isVisible={pickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Fecha Inicio (YYYY-MM-DD)"
        value={fechaInicio}
        onChangeText={setFechaInicio}
      />

      <TextInput
        style={styles.input}
        placeholder="Monto"
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Comentario"
        value={comentario}
        onChangeText={setComentario}
        multiline
      />

      {/* Código de acceso removido: ahora se usa el id del contrato */}

      <Button title="Guardar" onPress={guardarContrato} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
  card: { width: 160, padding: 10, marginRight: 10, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', alignItems: 'flex-start' },
  cardSelected: { borderColor: '#0b60d9', backgroundColor: '#eaf3ff' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardPrice: { fontSize: 14, color: '#333' },
  summary: { padding: 10, backgroundColor: '#fafafa', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  summaryLabel: { color: '#666', fontSize: 13 },
  summaryValue: { fontSize: 16, fontWeight: '700', marginBottom: 6 }
  ,selectorRow: { padding: 12, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 8, backgroundColor: '#fff', marginBottom: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalInner: { width: '92%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  closeBtn: { padding: 8 }
});

export default FormularioContrato;
