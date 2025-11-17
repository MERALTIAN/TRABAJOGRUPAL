import React, { useState, useEffect } from "react";
import { validateCedula, formatCedula } from '../utils/cedula';
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const FormularioBeneficiario = ({ cargarDatos }) => {
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contracts, setContracts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const guardarBeneficiario = async () => {
    const telefonoDigits = telefono ? telefono.replace(/[^0-9]/g, '') : '';
    if (!validateCedula(cedula)) return alert('Cédula inválida. Formato esperado: 121-261204-1001F');
    if (!telefonoDigits || telefonoDigits.length < 6) return alert('Teléfono inválido. Ingrese sólo números.');
    if (apellido && cedula && nombre && numeroContrato && telefono) {
      try {
        await addDoc(collection(db, "Beneficiario"), {
          Apellido: apellido,
          Cedula: cedula,
          Nombre: nombre,
          "N° Contrato": parseInt(numeroContrato),
          Telefono: telefonoDigits
        });
        setApellido("");
            setCedula("");
        setNombre("");
        setNumeroContrato("");
        setTelefono("");
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar beneficiario:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  useEffect(() => {
    // load available contratos to suggest
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'Contrato'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setContracts(data);
      } catch (e) { console.error('Error cargando contratos en beneficiario', e); }
    })();
  }, []);

  const onSelectContract = (c) => {
    setNumeroContrato(c.id);
    setShowSuggestions(false);
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
        onChangeText={(text) => {
          let v = text.toUpperCase();
          v = v.replace(/[^0-9A-Z-]/g, '');
          if (v.length > 16) v = v.slice(0, 16);
          setCedula(v);
        }}
        onBlur={() => { const f = formatCedula(cedula); setCedula(f); }}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="N° Contrato"
        value={numeroContrato}
        onFocus={() => setShowSuggestions(true)}
        onChangeText={(t) => { setNumeroContrato(t); setShowSuggestions(true); }}
        keyboardType="default"
      />

      {showSuggestions && (
        <ScrollView style={{ maxHeight: 160, borderWidth: 1, borderColor: '#eee', marginBottom: 8 }}>
          {contracts.filter(c => (c.id || '').toString().toLowerCase().includes(numeroContrato.toString().toLowerCase()) || (c.ClienteId || '').toString().toLowerCase().includes(numeroContrato.toString().toLowerCase())).map(c => (
            <TouchableOpacity key={c.id} onPress={() => onSelectContract(c)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' }}>
              <Text style={{ fontWeight: '700' }}>{c.id}</Text>
              <Text style={{ color: '#666' }}>Monto: C$ {c.Monto || 0}</Text>
            </TouchableOpacity>
          ))}
          {contracts.length === 0 && <Text style={{ padding: 8, color: '#666' }}>No hay contratos</Text>}
        </ScrollView>
      )}

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
});

export default FormularioBeneficiario;
