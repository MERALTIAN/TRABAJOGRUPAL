import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, query } from "firebase/firestore";

const Login = ({ onLogin, onGuestLogin }) => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState("Cliente");
  const [roleDropdownVisible, setRoleDropdownVisible] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleLogin = async () => {
    try {
      const q = query(collection(db, "Usuario"));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const found = users.find(u => u.Usuario === usuario && u.Contrasena === contrasena);
      if (!found) return alert('Usuario o contraseña incorrectos');
      if (found.rol && found.rol !== rol) {
        return alert('El rol seleccionado no coincide con el rol del usuario');
      }
      const userObj = { ...found, rol: found.rol || rol };
      if (remember) {
        try {
          await AsyncStorage.setItem('@app_user', JSON.stringify(userObj));
        } catch (e) {
          console.error('Error saving user', e);
        }
      }
      onLogin(userObj);
    } catch (err) {
      console.error(err);
      alert('Error al iniciar sesión');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../Imagenes/logo-removebg-preview.png')} style={styles.logo} />
        <Text style={styles.appName}>TechnoWell</Text>
      </View>

      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Usuario" value={usuario} onChangeText={setUsuario} />
        <TextInput style={styles.input} placeholder="Contraseña" value={contrasena} onChangeText={setContrasena} secureTextEntry />

        <View style={{ marginBottom: 18 }}>
          <Text style={styles.roleLabel}>Tipo de Usuario</Text>
          <View style={styles.roleButtonsRow}>
            <TouchableOpacity style={[styles.roleOption, rol === 'Administrador' && styles.roleOptionActive]} onPress={() => setRol('Administrador')}>
                <Text style={[styles.roleText, rol === 'Administrador' && styles.roleTextActive]}>Administrador</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleOption, rol === 'Cliente' && styles.roleOptionActive]} onPress={() => setRol('Cliente')}>
                <Text style={[styles.roleText, rol === 'Cliente' && styles.roleTextActive]}>Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleOption, rol === 'Agente' && styles.roleOptionActive]} onPress={() => setRol('Agente')}>
              <Text style={[styles.roleText, rol === 'Agente' && styles.roleTextActive]}>Agente</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rememberRow}>
          <Switch value={remember} onValueChange={setRemember} />
          <Text style={styles.rememberText}>Recordarme</Text>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.loginButton, styles.guestButton]} onPress={onGuestLogin}>
          <Text style={styles.loginButtonText}>Entrar como Invitado</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // White background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },

  header: {
    alignItems: 'center',
    marginBottom: 40
  },

  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 10,
  },

  appName: {
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#333333' // Dark text color for white background
  },

  formCard: {
   width: '100%',
   maxWidth: 400,
   backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 20, 
    padding: 25, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },

  input: {
   borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 15, 
    marginBottom: 15, 
    borderRadius: 10, 
    backgroundColor: '#fff',
    fontSize: 16
  },

  roleRow: {
    marginBottom: 20,
    alignItems: 'center'
  },

  roleLabel: {
   fontSize: 16, 
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
    textAlign: 'center'
  },

  roleOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 999,
    marginHorizontal: 8,
    marginVertical: 6,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },

  roleOptionActive: {
    backgroundColor: '#0b60d9',
    borderColor: '#0b60d9',
    shadowColor: '#0b60d9',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3
  },

  roleText: {
    fontSize: 14, 
    color: '#333'
  },

  roleTextActive: {
    color: '#fff',
    fontWeight: '600'
  },

  /* combobox / dropdown styles */
  comboBox: { borderWidth: 1, borderColor: '#ddd', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comboList: { marginTop: 6, borderWidth: 1, borderColor: '#eee', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden' },
  comboItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  comboItemText: { color: '#333' },
  comboItemActiveText: { color: '#0b60d9', fontWeight: '700' },

  rememberRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },

  roleButtonsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },

   rememberText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#555'
  },

  loginButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3
  },

  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },

  guestButton: {
    backgroundColor: '#6c757d',
    marginTop: 15,
  },
});

// role selector UI is implemented as pill buttons above

export default Login;
