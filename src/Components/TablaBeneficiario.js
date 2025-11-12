import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

const TablaBeneficiario = ({ beneficiarios, eliminarBeneficiario, editarBeneficiario }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lista de Beneficiarios</Text>
      
      <ScrollView horizontal>
        <View>
          <View style={styles.header}>
            <Text style={styles.headerText}>Apellido</Text>
            <Text style={styles.headerText}>Cédula</Text>
            <Text style={styles.headerText}>Nombre</Text>
            <Text style={styles.headerText}>N° Contrato</Text>
            <Text style={styles.headerText}>Teléfono</Text>
            <Text style={styles.headerText}>Acciones</Text>
          </View>

          {beneficiarios.map((beneficiario) => (
            <View key={beneficiario.id} style={styles.row}>
              <Text style={styles.cell}>{beneficiario.Apellido}</Text>
              <Text style={styles.cell}>{beneficiario.Cedula}</Text>
              <Text style={styles.cell}>{beneficiario.Nombre}</Text>
              <Text style={styles.cell}>{String(beneficiario["N° Contrato"] || '')}</Text>
              <Text style={styles.cell}>{beneficiario.Telefono}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editarBeneficiario(beneficiario)}
                >
                  <Text style={styles.buttonText}>🖋️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => eliminarBeneficiario(beneficiario.id)}
                >
                  <Text style={styles.buttonText}>🗑️</Text>
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
  container: { padding: 10 },
  titulo: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  header: { flexDirection: "row", backgroundColor: "#f0f0f0", padding: 10 },
  headerText: { width: 100, fontWeight: "bold", textAlign: "center" },
  row: { flexDirection: "row", padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc", alignItems: "center" },
  cell: { width: 100, textAlign: "center" },
  actionButtons: { flexDirection: "row", width: 100, justifyContent: "space-around" },
  editButton: { backgroundColor: "#007bff", padding: 8, borderRadius: 5, width: 35, alignItems: "center" },
  deleteButton: { backgroundColor: "#ff4444", padding: 8, borderRadius: 5, width: 35, alignItems: "center" },
  buttonText: { fontSize: 16 },
});

export default TablaBeneficiario;
