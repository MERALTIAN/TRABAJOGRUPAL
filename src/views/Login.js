import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from "../database/firebaseconfig.js";
import { collection, getDocs, query } from "firebase/firestore";
import loginStyles from '../Styles/loginStyles';

const Login = ({ onLogin, onGuestLogin }) => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <View style={{ position: 'relative' }}>
          <TextInput style={styles.input} placeholder="Contraseña" value={contrasena} onChangeText={setContrasena} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.showPwdBtn}>
            <Text style={{ color: '#0b60d9', fontWeight: '700' }}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
          </TouchableOpacity>
        </View>

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


const styles = loginStyles;

// role selector UI is implemented as pill buttons above

export default Login;
