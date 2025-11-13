import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";
import UserRoleList from './UserRoleList';
import SafeModal from './SafeModal';

const FormularioCliente = ({ cargarDatos }) => {
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const guardarCliente = async () => {
    const cedulaRegex = /^\d{3}-\d{6}-\d{4}[A-Za-z]$/;
    const telefonoDigits = telefono ? telefono.replace(/[^0-9]/g, '') : '';
    if (!cedulaRegex.test(cedula)) return alert('Cédula inválida. Formato esperado: 121-261204-1001F');
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
        onChangeText={setCedula}
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

      <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setUserModalVisible(true)}>
        <Text style={{ color: selectedUser ? '#000' : '#888' }}>{selectedUser ? (selectedUser.Usuario || selectedUser.Nombre) : 'Buscar usuario para vincular (opcional)'}</Text>
      </TouchableOpacity>

      <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => setUserModalVisible(false)}>
        <View style={{ padding: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Seleccionar Usuario (Cliente)</Text>
          <UserRoleList role="Cliente" searchable={true} onSelect={(u) => { setSelectedUser(u); setUserModalVisible(false); }} />
          <TouchableOpacity onPress={() => setUserModalVisible(false)} style={{ marginTop: 12, alignSelf: 'flex-end' }}><Text>Cerrar</Text></TouchableOpacity>
        </View>
      </SafeModal>

      <Button title="Guardar" onPress={guardarCliente} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
});

export default FormularioCliente;
