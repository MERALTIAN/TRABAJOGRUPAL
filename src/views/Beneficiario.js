import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs } from "firebase/firestore";
import { safeDeleteDoc } from '../utils/firestoreUtils';
import FormularioBeneficiario from "../Components/FormularioBeneficiario.js";
import ModalEditar from "../Components/ModalEditar.js";
import { cardStyles } from "../Styles/cardStyles.js";
import Feather from '@expo/vector-icons/Feather';

const Beneficiario = () => {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [beneficiarioEditar, setBeneficiarioEditar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

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
      if (!id) { console.warn('Beneficiario.eliminarBeneficiario: id faltante', id); return; }
      await safeDeleteDoc('Beneficiario', id);
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
    // LayoutAnimation enabling on Android is a no-op in the new RN architecture.
    // Skipping UIManager.setLayoutAnimationEnabledExperimental to avoid noisy warnings.
  }, []);
  // Render de cada beneficiario como tarjeta (estilo Ejemplo)
  const renderBeneficiarioCard = (beneficiario) => {
    const isExpanded = expandedId === beneficiario.id;
    return (
      <View key={beneficiario.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{beneficiario.Nombre} {beneficiario.Apellido}</Text>
          <TouchableOpacity
            style={styles.ellipsisButton}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpandedId(isExpanded ? null : beneficiario.id);
            }}
          >
            <Feather name="more-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cédula:</Text>
              <Text style={styles.detailValue}>{beneficiario.Cedula}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>N° Contrato:</Text>
              <Text style={styles.detailValue}>{beneficiario['N° Contrato']}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Teléfono:</Text>
              <Text style={styles.detailValue}>{beneficiario.Telefono}</Text>
            </View>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={[styles.cardButton, styles.deleteButton]}
                onPress={() => { eliminarBeneficiario(beneficiario.id); }}
              >
                <Feather name="trash-2" size={16} color="#fff" />
                <Text style={[styles.cardButtonText, styles.deleteButtonText]}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardButton, styles.editButton, { marginLeft: 8 }]}
                onPress={() => editarBeneficiario(beneficiario)}
              >
                <Feather name="edit-2" size={16} color="#1D4ED8" />
                <Text style={[styles.cardButtonText, styles.editButtonText]}>Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Tarjeta del formulario */}
        <View style={styles.formWrapper}>
          <FormularioBeneficiario cargarDatos={cargarDatos} />
        </View>

        <Text style={[styles.title, { marginBottom:16, marginTop:-10 }]}>Lista de Beneficiarios</Text>

        {beneficiarios.map(renderBeneficiarioCard)}

      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={beneficiarioEditar}
        collection={"Beneficiario"}
        fields={beneficiarioFields}
        onUpdate={cargarDatos}
        title="Editar Beneficiario"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 2,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#444444",
    textAlign: "center",
    marginBottom: 5,
  },
  formWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e3e8ee",
  },
  ...cardStyles,
});

export default Beneficiario;