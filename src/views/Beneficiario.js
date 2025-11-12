import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { db } from "../firebase.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import FormularioBeneficiario from "../Components/FormularioBeneficiario.js";
import TablaBeneficiario from "../Components/TablaBeneficiario.js";
import ModalEditar from "../Components/ModalEditar.js";

const Beneficiario = () => {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [beneficiarioEditar, setBeneficiarioEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Beneficiario"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBeneficiarios(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  const eliminarBeneficiario = async (id) => {
    try {
      await deleteDoc(doc(db, "Beneficiario", id));
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const editarBeneficiario = (beneficiario) => {
    setBeneficiarioEditar(beneficiario);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setBeneficiarioEditar(null);
  };

  const beneficiarioFields = [
    { key: 'Apellido', label: 'Apellido', type: 'text' },
    { key: 'Cedula', label: 'Cédula', type: 'text' },
    { key: 'Nombre', label: 'Nombre', type: 'text' },
    { key: 'N° Contrato', label: 'N° Contrato', type: 'text', keyboardType: 'numeric' },
    { key: 'Telefono', label: 'Teléfono', type: 'text', keyboardType: 'phone-pad' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
        <FormularioBeneficiario cargarDatos={cargarDatos} />
        <TablaBeneficiario 
          beneficiarios={beneficiarios} 
          eliminarBeneficiario={eliminarBeneficiario}
          editarBeneficiario={editarBeneficiario}
        />
      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={beneficiarioEditar}
        collectionName="Beneficiario"
        fields={beneficiarioFields}
        onUpdate={cargarDatos}
        title="Editar Beneficiario"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 2.5, padding: 20 },
});

export default Beneficiario;