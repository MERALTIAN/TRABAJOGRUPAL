import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";

const Home = ({ user, index, menuVisible, setMenuVisible }) => {
  // Solo mostramos esta vista si el usuario es administrador y está en el índice 0
  if (!user || user.rol !== "Administrador" || index !== 0) {
    return null;
  }

  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Mensaje según la hora del día
  const hora = new Date().getHours();
  let saludo = "";
  if (hora < 4) saludo = "¡Buenos días";
  else if (hora < 18) saludo = "¡Buenas tardes";
  else saludo = "¡Buenas noches";

  return (
    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      {/* Contenido de bienvenida */}
      <View style={styles.welcomeBoxModerno}>
        <Text style={styles.welcomeIcon}>👋</Text>
        <Text style={styles.welcomeTextGrande}>
          {saludo}, {user.Usuario}!
        </Text>
        <Text style={styles.welcomeSub}>
          Bienvenido al panel de administración. Accede a todas las funciones desde el menú lateral.
        </Text>

        <TouchableOpacity style={styles.menuButtonGrande} onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuButtonText}>Abrir menú de opciones</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  welcomeBoxModerno: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 36,
    marginHorizontal: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  welcomeIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  welcomeTextGrande: {
    fontSize: 28,
    color: "#1e90ff",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSub: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  menuButtonGrande: {
    marginTop: 20,
    backgroundColor: "#1e90ff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  menuButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Home;
