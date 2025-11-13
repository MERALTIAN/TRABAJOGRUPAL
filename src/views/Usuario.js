import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import FormularioUsuario from "../Components/FormularioUsuario.js";
import TablaUsuario from "../Components/TablaUsuario.js";

const Usuario = () => {
  const [usuarios, setUsuarios] = useState([]);

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Usuario"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      await deleteDoc(doc(db, "Usuario", id));
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
        <FormularioUsuario cargarDatos={cargarDatos} />
        <TablaUsuario usuarios={usuarios} eliminarUsuario={eliminarUsuario} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 2.5, padding: 20 },
});

export default Usuario;