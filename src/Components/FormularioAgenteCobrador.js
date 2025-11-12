import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, ScrollView } from "react-native";
import { db } from "../database/firebaseconfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { TouchableOpacity } from 'react-native';
import SafeModal from './SafeModal';

const FormularioAgenteCobrador = ({ cargarDatos }) => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [usuarios, setUsuarios] = useState([]);

  // load users to allow linking
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'Usuario'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Only agent-role users
        const agents = data.filter(u => (u.rol || '').toString().toLowerCase() === 'agente');
        if (mounted) setUsuarios(agents);
      } catch (e) {
        console.error('Error cargando usuarios en FormularioAgenteCobrador', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const [userModalVisible, setUserModalVisible] = useState(false);
  const [usuarioNombre, setUsuarioNombre] = useState("");

  const guardarAgenteCobrador = async () => {
    // telefono validation: max 8 digits
    const phoneDigits = String(telefono).replace(/\D/g,'');
    if (phoneDigits.length > 8) { alert('El teléfono no puede tener más de 8 dígitos'); return; }
    if (nombre && telefono) {
      try {
        await addDoc(collection(db, "Agente_Cobrador"), {
          Nombre: nombre,
          Telefono: telefono,
          UsuarioId: usuarioId || null
        });
        setNombre("");
        setTelefono("");
        setUsuarioId("");
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar agente cobrador:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Agente Cobrador</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={telefono}
        onChangeText={(t) => setTelefono(t.replace(/\D/g, '').slice(0,8))}
        keyboardType="phone-pad"
      />

      <Text style={{ marginTop: 6, marginBottom: 6 }}>Vincular a usuario (opcional)</Text>
      <TouchableOpacity style={{ paddingVertical: 8 }} onPress={() => setUserModalVisible(true)}>
        <Text style={{ color: usuarioId ? '#0b60d9' : '#333' }}>{usuarioNombre ? usuarioNombre : (usuarioId ? 'Usuario seleccionado' : 'Seleccionar usuario...')}</Text>
      </TouchableOpacity>

      <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => setUserModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: '92%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Usuarios</Text>
            <ScrollView>
              {usuarios.map(u => (
                <TouchableOpacity key={u.id} style={{ paddingVertical: 8 }} onPress={() => { setUsuarioId(u.id); setUsuarioNombre(u.Usuario || ''); setUserModalVisible(false); }}>
                  <Text style={{ color: usuarioId === u.id ? '#0b60d9' : '#333', fontWeight: usuarioId === u.id ? '700' : '400' }}>{u.Usuario} {u.rol ? `(${u.rol})` : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={() => setUserModalVisible(false)} style={{ padding: 8 }}>
                <Text>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeModal>

      <Button title="Guardar" onPress={guardarAgenteCobrador} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
});

export default FormularioAgenteCobrador;
