import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useWindowDimensions } from 'react-native';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
import SafeModal from './SafeModal';
import { db } from "../database/firebaseconfig.js";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";

const FormularioUsuario = forwardRef(({ cargarDatos, initialData = null, onDone = () => {} }, ref) => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState("Cliente");
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [clientId, setClientId] = useState("");
  const [agenteNombre, setAgenteNombre] = useState("");
  const [agenteTelefono, setAgenteTelefono] = useState("");
  const { width } = useWindowDimensions();

  useEffect(() => {
    // debug: see when initialData changes
    // console.log('FormularioUsuario initialData changed', initialData && initialData.id);
    if (initialData) {
      setUsuario(initialData.Usuario || initialData.usuario || initialData.email || '');
      setContrasena(initialData.Contrasena || initialData.contrasena || '');
      setRol(initialData.rol || initialData.Rol || 'Cliente');
      setClientId(initialData.clientId || '');
      setAgenteNombre((initialData.agente && initialData.agente.nombre) || '');
      setAgenteTelefono((initialData.agente && initialData.agente.telefono) || '');
    } else {
      // if no initialData, reset fields for create mode
      setUsuario(''); setContrasena(''); setRol('Cliente'); setClientId(''); setAgenteNombre(''); setAgenteTelefono('');
    }
  }, [initialData]);

  const guardarUsuario = async () => {
    if (!usuario || !contrasena) {
      Alert.alert('Validación', 'Por favor complete usuario y contraseña');
      return;
    }

    const data = {
      Usuario: usuario,
      contrasena: contrasena,
      rol,
      clientId: clientId || `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`,
      agente: rol === 'Agente' ? { nombre: agenteNombre, telefono: agenteTelefono } : null,
      actualizadoEn: new Date()
    };

    try {
      if (initialData && initialData.id) {
        // actualizar documento existente
        const ref = doc(db, 'Usuario', initialData.id);
        await updateDoc(ref, data);
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        await addDoc(collection(db, 'Usuario'), data);
        Alert.alert('Éxito', 'Usuario guardado correctamente');
      }

      if (cargarDatos) cargarDatos();
      // reset form
      setUsuario(''); setContrasena(''); setClientId(''); setAgenteNombre(''); setAgenteTelefono(''); setRol('Cliente');
      onDone();
    } catch (e) {
      console.error('Error guardando usuario', e);
      Alert.alert('Error', 'No se pudo guardar el usuario');
    }
  };

  // expose submit method to parent modal
  useImperativeHandle(ref, () => ({
    submit: () => guardarUsuario()
  }));

  const dynamicMax = Math.min(560, Math.max(360, width - 32));

  return (
    <View style={[styles.container, { maxWidth: dynamicMax }]}> 
      <Text style={styles.titulo}>Registro de Usuario</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={usuario}
        onChangeText={setUsuario}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        placeholderTextColor="#999"
      />

      <View style={styles.roleRowWrapper}>
        <Text style={styles.roleLabel}>Asignar rol de:</Text>
        <TouchableOpacity style={[styles.roleOption, rol === 'Cliente' && styles.roleActive]} onPress={() => setRoleModalVisible(true)}>
          <Text style={[styles.roleOptionText, rol === 'Cliente' && styles.roleTextActive]}>{rol}</Text>
        </TouchableOpacity>
      </View>

      {rol === 'Agente' && (
        <View style={{ marginBottom: 12, width: '100%' }}>
          <Text style={styles.smallLabel}>Datos de Agente</Text>
          <TextInput style={styles.input} placeholder="Nombre del agente (opcional)" value={agenteNombre} onChangeText={setAgenteNombre} placeholderTextColor="#999" />
          <TextInput style={styles.input} placeholder="Teléfono del agente (opcional)" value={agenteTelefono} onChangeText={(t) => setAgenteTelefono(t.replace(/\D/g, '').slice(0,8))} keyboardType="phone-pad" placeholderTextColor="#999" />
        </View>
      )}

      <View style={{ marginBottom: 10, width: '100%' }}>
        <Text style={styles.smallLabel}>Client ID (opcional). Si se deja en blanco se generará uno:</Text>
        <TextInput style={styles.input} placeholder="client_123abc" value={clientId} onChangeText={setClientId} placeholderTextColor="#999" />
        <TouchableOpacity onPress={() => setClientId(`client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`)} style={{ marginTop: 6 }}>
          <Text style={{ color: '#007bff' }}>Generar clientId</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={guardarUsuario} activeOpacity={0.85}>
        <Text style={styles.saveBtnText}>GUARDAR</Text>
      </TouchableOpacity>

      <SafeModal visible={roleModalVisible} transparent animationType="slide" onRequestClose={() => setRoleModalVisible(false)}>
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <View style={{ width:'90%', backgroundColor:'#fff', borderRadius:8, padding:12 }}>
            <Text style={{ fontSize:18, fontWeight:'700', marginBottom:8 }}>Seleccionar rol</Text>
            <TouchableOpacity style={[styles.comboItem, rol === 'Administrador' && styles.roleActive]} onPress={() => { setRol('Administrador'); setRoleModalVisible(false); }}>
              <Text style={styles.comboItemText}>Administrador</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.comboItem, rol === 'Cliente' && styles.roleActive]} onPress={() => { setRol('Cliente'); setRoleModalVisible(false); }}>
              <Text style={styles.comboItemText}>Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.comboItem, rol === 'Agente' && styles.roleActive]} onPress={() => { setRol('Agente'); setRoleModalVisible(false); }}>
              <Text style={styles.comboItemText}>Agente</Text>
            </TouchableOpacity>
            <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop:8 }}>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)} style={{ padding:8 }}><Text>Cerrar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeModal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, width: '100%', alignSelf: 'center' },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'left' },
  input: { borderWidth: 1, borderColor: '#e6e9ef', marginBottom: 10, padding: 12, borderRadius: 10, backgroundColor: '#fafbfc' },
  roleRowWrapper: { marginBottom: 10, alignItems: 'flex-start' },
  roleLabel: { marginBottom: 6, color: '#333', fontWeight: '600' },
  roleOption: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, marginRight: 8, marginVertical: 6, backgroundColor: '#f1f5f9', minWidth: 110, alignItems: 'center', justifyContent: 'center' },
  roleActive: { backgroundColor: '#0b60d9' },
  roleOptionText: { color: '#333', fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  smallLabel: { marginBottom: 6, color: '#555' },
  saveBtn: { backgroundColor: '#0b60d9', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  comboItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  comboItemText: { color: '#333' }
});

export default FormularioUsuario;