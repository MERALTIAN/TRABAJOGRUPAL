import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from "react-native";
import formatField from '../utils/formatField';
import { MaterialIcons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

const TablaModelo = ({ modelos, eliminarModelo, editarModelo }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Modelos</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Encabezado */}
          <View style={styles.header}>
            <Text style={[styles.headerText, { flex: 1 }]}>Imagen</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Color</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Medida</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Modelo</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Nombre</Text>
            <Text style={[styles.headerText, { flex: 0.8 }]}>Precio</Text>
            <Text style={[styles.headerText, { flex: 0.8 }]}>Acciones</Text>
          </View>

          {/* Filas */}
          {modelos.map((modelo, index) => (
            <View
              key={modelo.id}
              style={[
                styles.row,
                index % 2 === 0 ? styles.rowEven : styles.rowOdd,
              ]}
            >
              <View style={[styles.cell, { flex: 1 }]}> 
                {modelo.Imagen ? (
                  <Image source={{ uri: modelo.Imagen }} style={styles.cellImage} />
                ) : (
                  <Text style={styles.noImageText}>Sin imagen</Text>
                )}
              </View>
              <Text style={[styles.cell, { flex: 1 }]}>{formatField(modelo.Color)}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{formatField(modelo.Medida)}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{formatField(modelo.Modelo)}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{formatField(modelo.Nombre)}</Text>
              <Text style={[styles.cell, { flex: 0.8 }]}>{modelo.Precio !== undefined ? `C$ ${Number(modelo.Precio).toLocaleString('en-US', {minimumFractionDigits: 2})}` : '-'}</Text>

              <View style={[styles.cell, { flex: 0.8, flexDirection: "row", justifyContent: "space-around" }]}> 
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editarModelo(modelo)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="edit" size={20} color="#ffffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => eliminarModelo(modelo.id)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="delete" size={20} color="#ffffffff" />
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
  },
  table: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    width: 800,
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
    backgroundColor: "#eff5fe",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerText: {
    fontWeight: "800",
    fontSize: 18,
    textAlign: "center",
    color: "#12323b",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f2f5",
  },
  rowEven: { backgroundColor: "#fafcff" },
  rowOdd: { backgroundColor: "#ffffff" },
  cell: {
    fontSize: 17,
    textAlign: "center",
    color: "#2c3e50",
    fontWeight: "500",
    justifyContent: "center",
    alignItems: "center",
  },
  cellImage: { width: 90, height: 75, borderRadius: 5 },
  noImageText: { fontSize: 12, color: "#666", textAlign: "center" },
  editButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#ff0000ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
});

export default TablaModelo;
