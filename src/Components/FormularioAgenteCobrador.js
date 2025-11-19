import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";
import UserAutocomplete from './UserAutocomplete';

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
        <UserAutocomplete role="Agente" selectedUser={selectedUser} onSelect={(u) => setSelectedUser(u)} />
        {selectedUser ? (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedLabel}>Usuario seleccionado</Text>
            <Text style={styles.selectedName}>{selectedUser.Usuario || selectedUser.Nombre || selectedUser.id}</Text>
          </View>
        ) : null}

      <Button title="Guardar" onPress={guardarAgenteCobrador} />
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

export default FormularioAgenteCobrador;
