import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

const TablaFactura = ({ facturas, eliminarFactura }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>GESTIÓN DE FACTURAS</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* 🔹 Encabezado */}
          <View style={styles.header}>
            <Text style={[styles.headerText, { flex: 1.2 }]}>Agente</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Contrato</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Monto</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Cuotas</Text>
            <Text style={[styles.headerText, { flex: 0.8 }]}>Acciones</Text>
          </View>

          {/* 🔹 Filas de datos */}
          {facturas.map((factura, index) => (
            <View
              key={factura.id}
              style={[
                styles.row,
                index % 2 === 0 ? styles.rowEven : styles.rowOdd,
              ]}
            >
              <Text style={[styles.cell, { flex: 1.2 }]}>{factura.Agente}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{factura.Contrato}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>C$ {factura.Monto_Decimal}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{factura.cuotas}</Text>

              <View style={[styles.cell, { flex: 0.8 }]}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => eliminarFactura(factura.id)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="delete" size={20} color="#ffffffff" />
                  <Text style={styles.deleteText}></Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: "#fefefe",
  },
  titulo: {
    fontSize: 28,
    fontWeight: "400",
    marginBottom: 25,
    color: "#12323b",
    textAlign: "center",
    width: screenWidth - 40,
    marginTop: -2,
  },

  table: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    width: 500,
    borderWidth: 1,
    borderColor: "#e3e8ee",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#eff5feff",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerText: {
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
    color: "#12323b",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f2f5",
  },
  rowEven: { backgroundColor: "#fafcff" },
  rowOdd: { backgroundColor: "#ffffff" },
  cell: {
    fontSize: 15,
    textAlign: "center",
    color: "#2c3e50",
    fontWeight: "500",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    backgroundColor: "#ff0000ff",
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteText: {
    color: "#ff4444",
    fontWeight: "700",
    fontSize: 14,
  },
});

export default TablaFactura;
