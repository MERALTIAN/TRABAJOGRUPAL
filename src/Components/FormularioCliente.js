import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import SafeModal from '../Components/SafeModal';
import { db } from "../database/firebaseconfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const FormularioCliente = ({ cargarDatos, initialUsuarioId = null, onUsuarioSelect = null }) => {
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState(initialUsuarioId || "");
  const [userModalVisible, setUserModalVisible] = useState(false);

  useEffect(() => {
    if (initialUsuarioId) setUsuarioId(initialUsuarioId);
  }, [initialUsuarioId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'Usuario'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Only clients
        const clients = data.filter(u => (u.rol || '').toString().toLowerCase() === 'cliente');
        if (mounted) setUsuarios(clients);
      } catch (e) {
        console.error('Error cargando usuarios en FormularioCliente', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const guardarCliente = async () => {
    // cedula validacion formato 121-261204-1001F -> XXX-XXXXXX-XXXXA
    const cedulaRegex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
    if (!cedulaRegex.test(cedula)) {
      alert('Cédula inválida. Formato requerido: 121-261204-1001F');
      return;
    }

  // telefono validation: max 8 digits
  const phoneDigits = String(telefono).replace(/\D/g,'');
  if (phoneDigits.length > 8) { alert('El teléfono no puede tener más de 8 dígitos'); return; }

  if (apellido && cedula && direccion && nombre && telefono) {
      try {
        await addDoc(collection(db, "Cliente"), {
          Apellido: apellido,
          Cedula: cedula,
          Direccion: direccion,
          Nombre: nombre,
          Telefono: telefono,
          UsuarioId: usuarioId || null,
        });
        setApellido("");
        setCedula("");
        setDireccion("");
        setNombre("");
        setTelefono("");
        setUsuarioId("");
        cargarDatos();
      } catch (error) {
        console.error("Error al registrar cliente:", error);
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Cliente</Text>

      <TextInput
        style={styles.input}
        placeholder="Apellido"
        value={apellido}
        onChangeText={setApellido}
      />

      <TextInput
        style={styles.input}
        placeholder="Cédula"
        value={cedula}
        onChangeText={setCedula}
      />

      <View style={{ marginBottom: 10 }}>
        <Text style={{ marginBottom: 6 }}>Vincular a usuario (Obligatorio)</Text>
        <TouchableOpacity style={styles.selectorRow} onPress={() => setUserModalVisible(true)}>
          <Text style={{ color: usuarioId ? '#000' : '#666' }}>{usuarioId ? (usuarios.find(u => u.id === usuarioId)?.Usuario || usuarioId) : 'Seleccionar usuario...'}</Text>
        </TouchableOpacity>
        <SafeModal visible={userModalVisible} transparent animationType="slide" onRequestClose={() => setUserModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalInner}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Usuarios (rol: Cliente)</Text>
              <ScrollView>
                {usuarios.map(u => (
                  <TouchableOpacity key={u.id} onPress={() => { setUsuarioId(u.id); if (onUsuarioSelect) onUsuarioSelect(u); setUserModalVisible(false); }} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: usuarioId === u.id ? '#0b60d9' : '#333' }}>{u.Usuario} {u.rol ? `(${u.rol})` : ''}</Text>
                    <Text style={{ color: '#666' }}>{u.id}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                <TouchableOpacity onPress={() => setUserModalVisible(false)} style={styles.closeBtn}><Text>Cerrar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeModal>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Dirección"
        value={direccion}
        onChangeText={setDireccion}
      />

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

      <Button title="Guardar" onPress={guardarCliente} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10 },
  selectorRow: { padding: 12, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 8, backgroundColor: '#fff', marginBottom: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalInner: { width: '92%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  closeBtn: { padding: 8 }
});

export default FormularioCliente;
