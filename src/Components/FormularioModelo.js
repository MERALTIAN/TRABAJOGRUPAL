import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity, Image, Alert } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

const FormularioModelo = ({ cargarDatos }) => {
  const [color, setColor] = useState("");
  const [medida, setMedida] = useState("");
  const [modelo, setModelo] = useState("");
  const [nombre, setNombre] = useState("");
  const [imagen, setImagen] = useState(null); // URI
  const [imagenBase64, setImagenBase64] = useState(null); // Base64
  const [precio, setPrecio] = useState("");

  // Seleccionar imagen desde galería y convertir a Base64
  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos necesarios", "Se necesitan permisos para acceder a la galería");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true, // importante para obtener el base64
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64 = result.assets[0].base64;
      setImagen(uri);
      setImagenBase64(`data:image/jpeg;base64,${base64}`);
    }
  };

  // Guardar datos en Firebase con la imagen en Base64
  const guardarModelo = async () => {
    if (!color || !medida || !modelo || !nombre) {
      Alert.alert("Campos vacíos", "Por favor complete todos los campos.");
      return;
    }

    try {
      await addDoc(collection(db, "Modelo"), {
        Color: color,
        Medida: medida,
        Modelo: modelo,
        Nombre: nombre,
        Precio: precio ? parseFloat(precio) : 0,
        Imagen: imagenBase64 || "", // Guardamos el Base64 directamente
        fechaCreacion: new Date(),
      });

      Alert.alert("Éxito", "Modelo registrado correctamente 🎉");
      setColor("");
      setMedida("");
      setModelo("");
      setNombre("");
      setImagen(null);
      setImagenBase64(null);
      setPrecio("");
      cargarDatos && cargarDatos();
    } catch (error) {
      console.error("Error al registrar modelo:", error);
      Alert.alert("Error", "No se pudo registrar el modelo.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Modelo</Text>

      <TextInput
        style={styles.input}
        placeholder="Color"
        value={color}
        onChangeText={setColor}
      />

      <TextInput
        style={styles.input}
        placeholder="Medida"
        value={medida}
        onChangeText={setMedida}
      />

      <TextInput
        style={styles.input}
        placeholder="Modelo"
        value={modelo}
        onChangeText={setModelo}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Precio (Córdoba)"
        value={precio}
        onChangeText={(t) => setPrecio(t.replace(/[^0-9.]/g, ''))}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.imageButton} onPress={seleccionarImagen}>
        <Text style={styles.imageButtonText}>📷 Seleccionar Imagen</Text>
      </TouchableOpacity>

      {imagen && <Image source={{ uri: imagen }} style={styles.imagePreview} />}

      <Button title="Guardar" onPress={guardarModelo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
  imageButton: {
    backgroundColor: "#1e90ff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  imageButtonText: { color: "white", textAlign: "center", fontSize: 16 },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 5,
    marginBottom: 10,
    alignSelf: "center",
  },
});

export default FormularioModelo;
