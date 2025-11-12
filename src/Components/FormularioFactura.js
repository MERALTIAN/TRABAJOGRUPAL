import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";

const FormularioFactura = ({ cargarDatos }) => {
  const [agente, setAgente] = useState("");
  const [contrato, setContrato] = useState("");
  const [montoDecimal, setMontoDecimal] = useState("");
  const [cuotas, setCuotas] = useState("");

  const guardarFactura = async () => {
    if (agente && contrato && montoDecimal && cuotas) {
      try {
        await addDoc(collection(db, "Factura"), {
          Agente: parseInt(agente),
          Contrato: parseInt(contrato),
          Monto_Decimal: parseFloat(montoDecimal),
          cuotas: parseInt(cuotas)
        });
        setAgente("");
        setContrato("");
        setMontoDecimal("");
        setCuotas("");
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar factura:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Factura</Text>

      <TextInput
        style={styles.input}
        placeholder="Agente"
        value={agente}
        onChangeText={setAgente}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Contrato"
        value={contrato}
        onChangeText={setContrato}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Monto Decimal"
        value={montoDecimal}
        onChangeText={setMontoDecimal}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Cuotas"
        value={cuotas}
        onChangeText={setCuotas}
        keyboardType="numeric"
      />

      <Button title="Guardar" onPress={guardarFactura} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
});

export default FormularioFactura;
