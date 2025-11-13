import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const TablaServicio = ({ servicios, eliminarServicio, editarServicio }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>GESTIÓN DE SERVICIOS</Text>
      {servicios.map((servicio) => (
        <View key={servicio.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.imageWrap}>
              {servicio.Imagen ? (
                <Image source={{ uri: servicio.Imagen }} style={styles.image} />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.noImageText}>Sin imagen</Text>
                </View>
              )}
            </View>
            <View style={styles.infoWrap}>
              <Text style={styles.cardTitle}>{servicio.Nombre}</Text>
              <Text style={styles.cardPrice}>C$ {servicio.Monto}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => editarServicio(servicio)}
            >
              <MaterialIcons name="edit" size={22} color="#ffffffff" />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              activeOpacity={0.7}
              onPress={() => eliminarServicio(servicio.id)}
            >
              <MaterialIcons name="delete" size={22} color="#ffffffff" />
              <Text style={[styles.actionText, { color: '#ffffffff' }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    backgroundColor: '#f5f7fa', flex: 1,
    alignItems: 'center',
    backgroundColor: '#fefefeff',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "400",
    marginBottom: 25,
    textAlign: "center",
    width: screenWidth - 40,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 16,
    width: screenWidth - 44, // casi todo el ancho
    borderWidth: 1,
    borderColor: '#e3e8ee',
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 15,
    elevation: 5,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, 
    backgroundColor: '#ffffffff' },
  imageWrap: {
    width: 110,
    height: 110,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 20,
    backgroundColor: "#f1f1f1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 110,
     height: 110, 
     borderRadius: 20 
    },

  placeholder: {
     width: 110,
      height: 110,
       alignItems: "center",
        justifyContent: "center",
   },
  noImageText: { fontSize: 14, color: "#999" },
  infoWrap: { flex: 1 },
  cardTitle: { fontSize: 24, fontWeight: "800", color: "#12323b", marginBottom: 8 },
  cardPrice: { fontWeight: "800", color: "#1e90ff", fontSize: 20 },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", gap: 14 },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingStart: 18,
    paddingEnd: 24,
    borderRadius: 16,
    backgroundColor: "#0066ffff",
    marginLeft: 0,
  },
  deleteButton: {
     backgroundColor: "#ff0000ff",
     paddingRight: 18,
     paddingStart: 18,
     paddingEnd: 20,
    },
  actionText: { marginLeft: 6, fontWeight: "500", color: "#ffffffff", fontSize: 16 },
});

export default TablaServicio;
