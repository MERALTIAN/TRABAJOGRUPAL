import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity } from "react-native";
import SafeModal from './SafeModal';
import { db } from "../database/firebaseconfig";
import { collection, addDoc, getDocs, query } from "firebase/firestore";

const FormularioUsuario = ({ cargarDatos }) => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState("Cliente");
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [clientId, setClientId] = useState("");
  const [agenteNombre, setAgenteNombre] = useState("");
  const [agenteTelefono, setAgenteTelefono] = useState("");
  

  const guardarUsuario = async () => {
    if (usuario && contrasena) {
      try {
        const payload = {
          Usuario: usuario,
          Contrasena: contrasena,
          rol: rol,
          // clientId: use provided or generate one
          clientId: clientId || `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`,
        };
        const ref = await addDoc(collection(db, "Usuario"), payload);
        // If role is Agente, create corresponding Agente_Cobrador document and link to this Usuario
        if (rol === 'Agente') {
          try {
            // telefono validation for agent: max 8 digits
            const phoneDigits = String(agenteTelefono || '').replace(/\D/g, '');
            if (phoneDigits.length > 8) { alert('El teléfono no puede tener más de 8 dígitos'); return; }

            await addDoc(collection(db, 'Agente_Cobrador'), {
              Nombre: agenteNombre || usuario,
              Telefono: agenteTelefono || '',
              UsuarioId: ref.id,
            });
          } catch (e) {
            console.error('Error creando Agente_Cobrador al crear usuario:', e);
          }
        }
        setUsuario("");
        setContrasena("");
        setRol("Cliente");
        setClientId("");
        setAgenteNombre("");
        setAgenteTelefono("");
        
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar usuario:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Usuario</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={usuario}
        onChangeText={setUsuario}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
      />

      <View style={styles.roleRowWrapper}>
        <Text style={{ marginBottom: 6 }}>Rol:</Text>
        <TouchableOpacity style={[styles.roleOption, styles.roleSelector]} onPress={() => setRoleModalVisible(true)}>
          <Text style={{ fontWeight: '700' }}>Rol: {rol}</Text>
        </TouchableOpacity>
      </View>

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

      {rol === 'Agente' && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 6 }}>Datos de Agente</Text>
          <TextInput style={styles.input} placeholder="Nombre del agente (opcional)" value={agenteNombre} onChangeText={setAgenteNombre} />
          <TextInput style={styles.input} placeholder="Teléfono del agente (opcional)" value={agenteTelefono} onChangeText={(t) => setAgenteTelefono(t.replace(/\D/g, '').slice(0,8))} keyboardType="phone-pad" />
        </View>
      )}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ marginBottom: 6 }}>Client ID (opcional). Si se deja en blanco se generará uno:</Text>
        <TextInput style={styles.input} placeholder="client_123abc" value={clientId} onChangeText={setClientId} />
        <TouchableOpacity onPress={() => setClientId(`client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`)} style={{ marginTop: 6 }}>
          <Text style={{ color: '#007bff' }}>Generar clientId</Text>
        </TouchableOpacity>
      </View>

      {/* Note: removed 'Buscar usuario para vincular' UI per request */}

      <Button title="Guardar" onPress={guardarUsuario} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  roleRowWrapper: { marginBottom: 10, alignItems: 'center' },
  roleOption: { paddingVertical: 12, paddingHorizontal: 20, borderWidth: 0, borderColor: 'transparent', borderRadius: 999, marginRight: 8, marginVertical: 6, backgroundColor: '#f1f5f9', minWidth: 100, alignItems: 'center', justifyContent: 'center' },
  roleActive: { backgroundColor: '#0b60d9', borderColor: '#0b60d9', shadowColor: '#0b60d9', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  roleTextActive: { color: '#fff', fontWeight: '700' },
  roleButtonsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  comboBox: { borderWidth: 1, borderColor: '#ddd', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comboList: { marginTop: 6, borderWidth: 1, borderColor: '#eee', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden' },
  comboItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  comboItemText: { color: '#333' },
  comboItemActiveText: { color: '#0b60d9', fontWeight: '700' },
});

export default FormularioUsuario;