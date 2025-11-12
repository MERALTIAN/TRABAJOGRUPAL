import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { db } from "../firebase.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import FormularioModelo from "../Components/FormularioModelo.js";
import TablaModelo from "../Components/TablaModelo.js";
import ModalEditar from "../Components/ModalEditar.js";

const Modelo = () => {
  const [modelos, setModelos] = useState([]);
  const [modeloEditar, setModeloEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Modelo"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setModelos(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  const eliminarModelo = async (id) => {
    try {
      await deleteDoc(doc(db, "Modelo", id));
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const editarModelo = (modelo) => {
    setModeloEditar(modelo);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setModeloEditar(null);
  };

  const modeloFields = [
    { key: 'Color', label: 'Color', type: 'text' },
    { key: 'Medida', label: 'Medida', type: 'text' },
    { key: 'Modelo', label: 'Modelo', type: 'text' },
    { key: 'Nombre', label: 'Nombre', type: 'text' },
    { key: 'Precio', label: 'Precio', type: 'text', keyboardType: 'numeric' },
    { key: 'Imagen', label: 'Imagen', type: 'image' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Gestión de Modelos</Text>

        {/* Contenedor visual elegante solo para el formulario */}
        <View style={styles.formWrapper}>
          <FormularioModelo cargarDatos={cargarDatos} />
        </View>

        {/* Tabla fuera del contenedor */}
        <TablaModelo 
          modelos={modelos} 
          eliminarModelo={eliminarModelo}
          editarModelo={editarModelo}
        />
      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={modeloEditar}
        collectionName="Modelo"
        fields={modeloFields}
        onUpdate={cargarDatos}
        title="Editar Modelo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
  scrollContainer: {
    padding: 0,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#12323b",
    textAlign: "center",
    marginBottom: 25,
  },
  formWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e3e8ee",
  },
});

export default Modelo;
