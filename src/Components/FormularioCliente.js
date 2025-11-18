import React, { useState } from "react";
import { validateCedula, formatCedula } from '../utils/cedula';
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";
import UserAutocomplete from './UserAutocomplete';

const FormularioCliente = ({ cargarDatos }) => {
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const guardarCliente = async () => {
    const telefonoDigits = telefono ? telefono.replace(/[^0-9]/g, '') : '';
    if (!validateCedula(cedula)) return alert('Cédula inválida. Formato esperado: 121-261204-1001F');
    if (!telefonoDigits || telefonoDigits.length < 6) return alert('Teléfono inválido. Ingrese sólo números.');
    if (apellido && cedula && direccion && nombre && telefono) {
      try {
        const payload = {
          Apellido: apellido,
          Cedula: cedula,
          Direccion: direccion,
          Nombre: nombre,
          Telefono: telefonoDigits
        };
        if (selectedUser && selectedUser.id) {
          payload.UsuarioId = selectedUser.id;
          payload.UsuarioNombre = selectedUser.Usuario || selectedUser.Nombre || null;
        }
        await addDoc(collection(db, "Cliente"), payload);
        setApellido("");
          setCedula("");
        setDireccion("");
        setNombre("");
        setTelefono("");
        setSelectedUser(null);
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar cliente:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Cliente</Text>

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
          // auto-insert dashes as user types to follow 3-6-4+letter format
          let s = String(text || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
          if (!s) { setCedula(''); return; }
          // limit to 14 chars (3+6+4+1)
          if (s.length > 14) s = s.slice(0, 14);
          const a = s.slice(0, 3);
          const b = s.slice(3, 9);
          const c = s.slice(9, 13);
          const d = s.slice(13, 14);
          let out = a;
          if (b) out += '-' + b;
          if (c) out += '-' + c + d;
          setCedula(out);
        }}
        onBlur={() => { const f = formatCedula(cedula); setCedula(f); }}
      />

      <TextInput
        style={styles.input}
        placeholder="Dirección"
        value={direccion}
        onChangeText={setDireccion}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />

      <UserAutocomplete role="Cliente" selectedUser={selectedUser} onSelect={(u) => setSelectedUser(u)} />
      {selectedUser ? (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>Usuario seleccionado</Text>
          <Text style={styles.selectedName}>{selectedUser.Usuario || selectedUser.Nombre || selectedUser.id}</Text>
        </View>
      ) : null}

      <Button title="Guardar" onPress={guardarCliente} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
  selectedRow: { marginBottom: 10, padding: 8, backgroundColor: '#f0f8ff', borderRadius: 8 },
  selectedLabel: { fontSize: 12, color: '#0b60d9', fontWeight: '700' },
  selectedName: { fontSize: 15, color: '#023047', fontWeight: '800', marginTop: 4 },
});

export default FormularioCliente;
