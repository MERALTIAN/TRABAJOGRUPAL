import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";

const FormularioAgenteCobrador = ({ cargarDatos }) => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const guardarAgenteCobrador = async () => {
    if (nombre && telefono) {
      try {
        await addDoc(collection(db, "Agente_Cobrador"), {
          Nombre: nombre,
          Telefono: telefono
        });
        setNombre("");
        setTelefono("");
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
