import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import SafeModal from './SafeModal';
import { db } from "../database/firebaseconfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const FormularioBeneficiario = ({ cargarDatos }) => {
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contratos, setContratos] = useState([]);
  const [selectedContratoId, setSelectedContratoId] = useState(null);
  const [contractModalVisible, setContractModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadContratos = async () => {
      try {
        const snap = await getDocs(collection(db, 'Contrato'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setContratos(data);
      } catch (e) {
        console.error('Error cargando contratos en FormularioBeneficiario', e);
      }
    };
    loadContratos();
    return () => { mounted = false; };
  }, []);

  const guardarBeneficiario = async () => {
    // We'll store both a human friendly "N° Contrato" (CodigoAcceso if exists) and a ContractId link
  const contratoSeleccionado = contratos.find(c => c.id === selectedContratoId) || null;
  const numeroContratoGuardado = contratoSeleccionado ? contratoSeleccionado.id : numeroContrato;

    if (apellido && cedula && nombre && (selectedContratoId || numeroContratoGuardado) && telefono) {
      try {
        await addDoc(collection(db, "Beneficiario"), {
          Apellido: apellido,
          Cedula: cedula,
          Nombre: nombre,
          "N° Contrato": numeroContratoGuardado,
          ContratoId: contratoSeleccionado ? contratoSeleccionado.id : null,
          Telefono: telefono
        });
        setApellido("");
        setCedula("");
        setNombre("");
        setNumeroContrato("");
        setTelefono("");
        setSelectedContratoId(null);
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar beneficiario:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Beneficiario</Text>

      <TextInput
        style={styles.input}
        placeholder="Apellido"
        value={apellido}
        onChangeText={setApellido}
      />

      <TextInput
        style={styles.input}
        placeholder="Cédula"
        value={cedula}
        onChangeText={setCedula}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 6 }}>Seleccionar Contrato (opcional)</Text>
          <TouchableOpacity style={styles.selectorRow} onPress={() => setContractModalVisible(true)}>
            <Text style={{ color: selectedContratoId ? '#000' : '#666' }}>{selectedContratoId ? `Contrato seleccionado: ${selectedContratoId}` : 'Seleccionar contrato...'}</Text>
          </TouchableOpacity>
          <SafeModal visible={contractModalVisible} transparent animationType="slide" onRequestClose={() => setContractModalVisible(false)}>
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' }}>
              <View style={{ width:'92%', maxHeight:'80%', backgroundColor:'#fff', borderRadius:8, padding:12 }}>
                <Text style={{ fontSize:18, fontWeight:'700', marginBottom:8 }}>Contratos disponibles</Text>
                <ScrollView>
                  {contratos.map(c => (
                    <TouchableOpacity key={c.id} onPress={() => { setSelectedContratoId(c.id); setNumeroContrato(c.id); setContractModalVisible(false); }} style={[styles.contratoItem, selectedContratoId === c.id ? styles.selectedItem : null]}>
                      <Text style={{ fontWeight: '700' }}>{c.ClienteNombre || c.Cliente || c.ClienteId || 'Contrato'}</Text>
                      <Text style={{ color: '#555' }}>{`ID: ${c.id}`}</Text>
                      <Text style={{ color: '#222' }}>{c.Monto ? `Monto: C$ ${c.Monto}` : ''}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop:8 }}>
                  <TouchableOpacity onPress={() => setContractModalVisible(false)} style={{ padding:8 }}><Text>Cerrar</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeModal>
      </View>

      <TextInput
        style={styles.input}
        placeholder="N° Contrato (si no seleccionó uno)"
        value={numeroContrato}
        onChangeText={setNumeroContrato}
      />

      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />

      <Button title="Guardar" onPress={guardarBeneficiario} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
  contratoItem: { padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8, backgroundColor: '#fff' },
  selectedItem: { borderColor: '#0b60d9', backgroundColor: '#eaf3ff' }
});

export default FormularioBeneficiario;
