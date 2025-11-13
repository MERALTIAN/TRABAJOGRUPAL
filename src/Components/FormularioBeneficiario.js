import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";

const FormularioBeneficiario = ({ cargarDatos }) => {
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [telefono, setTelefono] = useState("");

  const guardarBeneficiario = async () => {
    if (apellido && cedula && nombre && numeroContrato && telefono) {
      try {
        await addDoc(collection(db, "Beneficiario"), {
          Apellido: apellido,
          Cedula: cedula,
          Nombre: nombre,
          "N° Contrato": parseInt(numeroContrato),
          Telefono: telefono
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

      <TextInput
        style={styles.input}
        placeholder="N° Contrato"
        value={numeroContrato}
        onChangeText={setNumeroContrato}
        keyboardType="numeric"
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
});

export default FormularioBeneficiario;
