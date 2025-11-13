import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";
import UserRoleList from './UserRoleList';
import SafeModal from './SafeModal';

const FormularioAgenteCobrador = ({ cargarDatos }) => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [userModalVisible, setUserModalVisible] = useState(false);

  const guardarAgenteCobrador = async () => {
    const telefonoDigits = telefono ? telefono.replace(/[^0-9]/g, '') : '';
    if (!telefonoDigits || telefonoDigits.length < 6) return alert('Teléfono inválido. Ingrese sólo números.');
    if (nombre && telefono) {
      try {
          const payload = { Nombre: nombre, Telefono: telefonoDigits };
          if (selectedUser && selectedUser.id) {
            payload.UsuarioId = selectedUser.id;
            payload.UsuarioNombre = selectedUser.Usuario || selectedUser.Nombre || null;
          }
          await addDoc(collection(db, "Agente_Cobrador"), payload);
        setNombre("");
        setTelefono("");
          setSelectedUser(null);
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar agente cobrador:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Agente Cobrador</Text>

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
          <Text style={{ color: selectedUser ? '#000' : '#888' }}>{selectedUser ? (selectedUser.Usuario || selectedUser.Nombre) : 'Buscar usuario para vincular (opcional)'} </Text>
        </TouchableOpacity>

        <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => setUserModalVisible(false)}>
          <View style={{ padding: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Seleccionar Usuario (Agente)</Text>
            <UserRoleList role="Agente" searchable={true} onSelect={(u) => { setSelectedUser(u); setUserModalVisible(false); }} />
            <TouchableOpacity onPress={() => setUserModalVisible(false)} style={{ marginTop: 12, alignSelf: 'flex-end' }}><Text>Cerrar</Text></TouchableOpacity>
          </View>
        </SafeModal>

      <Button title="Guardar" onPress={guardarAgenteCobrador} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
});

export default FormularioAgenteCobrador;
