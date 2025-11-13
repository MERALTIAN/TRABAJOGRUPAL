import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";

const FormularioCliente = ({ cargarDatos }) => {
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const guardarCliente = async () => {
    if (apellido && cedula && direccion && nombre && telefono) {
      try {
        await addDoc(collection(db, "Cliente"), {
          Apellido: apellido,
          Cedula: cedula,
          Direccion: direccion,
          Nombre: nombre,
          Telefono: telefono
        });
        setApellido("");
        setCedula("");
        setDireccion("");
        setNombre("");
        setTelefono("");
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
