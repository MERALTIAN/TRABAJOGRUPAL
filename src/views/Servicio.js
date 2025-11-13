import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import FormularioServicio from "../Components/FormularioServicio.js";
import TablaServicio from "../Components/TablaServicio.js";
import ModalEditar from "../Components/ModalEditar.js"

const Servicio = () => {
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
      await deleteDoc(doc(db, "Servicio", id));
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
        collectionName="Servicio"
        fields={servicioFields}
        onUpdate={cargarDatos}
        title="Editar Servicio"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  scrollContainer: {
    padding: 1,
    paddingBottom: 40, // espacio para que no quede pegado al bottom nav
  },
  formWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  tableWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
});

export default Servicio;
