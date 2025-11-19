import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, doc } from "firebase/firestore";
import { safeDeleteDoc } from '../utils/firestoreUtils';
import FormularioServicio from "../Components/FormularioServicio.js";
import TablaServicio from "../Components/TablaServicio.js";
import ModalEditar from "../Components/ModalEditar.js"

const Servicio = () => {
  // debug log removed
  const [servicios, setServicios] = useState([]);
  const [servicioEditar, setServicioEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Servicio"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setServicios(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  const eliminarServicio = async (id) => {
    try {
      if (!id) { console.warn('Servicio.eliminarServicio: id faltante', id); return; }
      await safeDeleteDoc('Servicio', id);
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const editarServicio = (servicio) => {
    setServicioEditar(servicio);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setServicioEditar(null);
  };

  const servicioFields = [
    { key: 'Nombre', label: 'Nombre', type: 'text' },
    { key: 'Monto', label: 'Monto', type: 'text', keyboardType: 'numeric' },
    { key: 'Imagen', label: 'Imagen', type: 'image' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formWrapper}>
          <FormularioServicio cargarDatos={cargarDatos} />
        </View>

        <Text style={styles.title}>Lista de servicios (practica v1)</Text>

        <View style={styles.tableWrapper}>
          <TablaServicio 
            servicios={servicios} 
            eliminarServicio={eliminarServicio}
            editarServicio={editarServicio}
          />
        </View>
      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={servicioEditar}
        collection={"Servicio"}
        fields={servicioFields}
        onUpdate={cargarDatos}
        title="Editar Servicio"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  scrollContainer: {
    padding: 2,
    paddingBottom: 40,
    paddingTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#444444',
    textAlign: 'center',
    marginBottom: 5,
  },
  formWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e3e8ee',
  },
  tableWrapper: {
    paddingHorizontal: 0,
  },
});

export default Servicio;
