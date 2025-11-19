import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity, Image, Alert } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import * as ImagePicker from 'expo-image-picker';

const FormularioServicio = ({ cargarDatos }) => {
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [imagen, setImagen] = useState(null);
  const [comentario, setComentario] = useState("");

  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImagen(result.assets[0].uri);
    }
  };

  const guardarServicio = async () => {
    if (nombre && monto) {
      try {
        await addDoc(collection(db, "Servicio"), {
          Nombre: nombre,
          Monto: parseInt(monto),
          Imagen: imagen,
          Comentario: comentario
        });
        setNombre("");
        setMonto("");
        setImagen(null);
        setComentario("");
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar servicio:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Servicio</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Monto"
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.imageButton} onPress={seleccionarImagen}>
        <Text style={styles.imageButtonText}>📷 Seleccionar Imagen</Text>
      </TouchableOpacity>

      {imagen && (
        <Image source={{ uri: imagen }} style={styles.imagePreview} />
      )}

      <TextInput
        style={styles.input}
        placeholder="Comentario"
        value={comentario}
        onChangeText={setComentario}
        multiline
      />

      <Button  title="Guardar" onPress={guardarServicio} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
  imageButton: { backgroundColor: "#338dedff", padding: 10, borderRadius: 5, marginBottom: 10 },
  imageButtonText: { color: "white", textAlign: "center", fontSize: 16 },
  imagePreview: { width: 200, height: 150, borderRadius: 5, marginBottom: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10 },

});

export default FormularioServicio;
