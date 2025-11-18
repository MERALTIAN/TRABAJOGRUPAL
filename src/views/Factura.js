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
import FormularioFactura from "../Components/FormularioFactura.js";
import { cardStyles } from "../Styles/cardStyles.js";
import Feather from '@expo/vector-icons/Feather';

const Factura = () => {
  const [facturas, setFacturas] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const cargarDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Factura"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFacturas(data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  };

  const eliminarFactura = async (id) => {
    try {
      if (!id) { console.warn('Factura.eliminarFactura: id faltante', id); return; }
      await safeDeleteDoc('Factura', id);
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  useEffect(() => {
    cargarDatos();
    // LayoutAnimation enabling on Android is a no-op in the new RN architecture.
    // Skipping UIManager.setLayoutAnimationEnabledExperimental to avoid noisy warnings.
  }, []);
  // Render de cada factura como tarjeta (estilo Ejemplo)
  const renderFacturaCard = (factura) => {
    const isExpanded = expandedId === factura.id;
    const title = factura.Contrato ? `Contrato: ${factura.Contrato}` : `Factura ID: ${factura.id?.substring(0,6) || ''}...`;

    return (
      <View key={factura.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.ellipsisButton}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpandedId(isExpanded ? null : factura.id);
            }}
          >
            <Feather name="more-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Agente:</Text>
              <Text style={styles.detailValue}>{factura.Agente}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monto:</Text>
              <Text style={styles.detailValue}>C$ {factura.Monto_Decimal}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cuotas:</Text>
              <Text style={styles.detailValue}>{factura.cuotas}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Documento:</Text>
              <Text style={styles.detailValue}>{factura.id}</Text>
            </View>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={[styles.cardButton, styles.deleteButton]}
                onPress={() => { eliminarFactura(factura.id); }}
              >
                <Feather name="trash-2" size={16} color="#fff" />
                <Text style={[styles.cardButtonText, styles.deleteButtonText]}>Eliminar</Text>
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

        {/* 🔹 Tarjeta del formulario */}
        <View style={styles.formWrapper}>
          <FormularioFactura cargarDatos={cargarDatos} />
        </View>

        <Text style={[styles.title, { marginBottom: 16, marginTop: -10 }]}>Lista de facturas</Text>

        {facturas.map(renderFacturaCard)}

      </ScrollView>
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

export default Factura;
