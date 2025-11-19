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
  Image,
} from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs } from "firebase/firestore";
import { safeDeleteDoc } from '../utils/firestoreUtils';
import FormularioModelo from "../Components/FormularioModelo.js";
import ModalEditar from "../Components/ModalEditar.js";
import { cardStyles } from "../Styles/cardStyles.js";
import Feather from '@expo/vector-icons/Feather';

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
      if (!id) { console.warn('Modelo.eliminarModelo: id faltante', id); return; }
      await safeDeleteDoc('Modelo', id);
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
    // LayoutAnimation enabling on Android is a no-op in the new RN architecture.
    // Skipping UIManager.setLayoutAnimationEnabledExperimental to avoid noisy warnings.
  }, []);
  // Función para renderizar cada tarjeta de modelo (diseño como en Ejemplo)
  const [expandedId, setExpandedId] = useState(null);

  const renderModeloCard = (modelo) => {
    const isExpanded = expandedId === modelo.id;
    const imageSource = modelo.Imagen ? { uri: modelo.Imagen } : null;

    return (
      <View key={modelo.id} style={styles.card}>
        {imageSource ? (
          <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Feather name="package" size={48} color="#9CA3AF" />
          </View>
        )}

        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{modelo.Nombre || modelo.Modelo}</Text>
          <TouchableOpacity
            style={styles.ellipsisButton}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpandedId(isExpanded ? null : modelo.id);
            }}
          >
            <Feather name="more-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Modelo:</Text>
              <Text style={styles.detailValue}>{modelo.Modelo}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Color:</Text>
              <Text style={styles.detailValue}>{modelo.Color}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medida:</Text>
              <Text style={styles.detailValue}>{modelo.Medida}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Precio:</Text>
              <Text style={styles.detailValue}>{modelo.Precio || ''}</Text>
            </View>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={[styles.cardButton, styles.deleteButton]}
                onPress={() => eliminarModelo(modelo.id)}
              >
                <Feather name="trash-2" size={16} color="#fff" />
                <Text style={[styles.cardButtonText, styles.deleteButtonText]}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardButton, styles.editButton]}
                onPress={() => editarModelo(modelo)}
              >
                <Feather name="edit-2" size={16} color="#fff" />
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
        {/* Contenedor visual elegante solo para el formulario */}
        <View style={styles.formWrapper}>
          <FormularioModelo cargarDatos={cargarDatos} />
        </View>

        <Text style={[styles.title, { marginBottom: 16, marginTop: -10 }]}>Lista de modelos</Text>

        {/* Mapeo de modelos a tarjetas */}
        {modelos.map(renderModeloCard)}

      </ScrollView>

      <ModalEditar
        visible={modalVisible}
        onClose={cerrarModal}
        item={modeloEditar}
        collection={"Modelo"}
        fields={modeloFields}
        onUpdate={cargarDatos}
        title="Editar Modelo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 2,
    paddingBottom: 40,
    paddingTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
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

export default Modelo;
