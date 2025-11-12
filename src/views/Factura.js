import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import FormularioFactura from "../Components/FormularioFactura.js";
import TablaFactura from "../Components/TablaFactura.js";

const Factura = () => {
  const [facturas, setFacturas] = useState([]);

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
      await deleteDoc(doc(db, "Factura", id));
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* 🔹 Tarjeta del formulario */}
        <View style={styles.formWrapper}>
          <FormularioFactura cargarDatos={cargarDatos} />
        </View>

        {/* 🔹 Tarjeta de la tabla */}
        <View style={styles.tableWrapper}>
          <TablaFactura
            facturas={facturas}
            eliminarFactura={eliminarFactura}
          />
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
  scrollContainer: {
    padding: 1, // 🔸 Espacio libre en los lados
    paddingBottom: 40,     // Espacio inferior
  },
  formWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  tableWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
});

export default Factura;
