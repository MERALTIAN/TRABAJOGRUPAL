import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Formulario real para crear solicitudes de contrato.
// Guarda en la colección 'solicitudes_contrato'.
export default function FormularioSolicitud({ onSubmitted }) {
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // si ya existe un usuario guardado en AsyncStorage, podemos auto-llenar algunos campos
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('@app_user');
        if (raw) {
          const u = JSON.parse(raw);
          if (u && u.Usuario) setNombre(u.Usuario);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const validar = () => {
    if (!nombre.trim()) return 'Ingrese su nombre completo.';
    if (!cedula.trim()) return 'Ingrese su cédula.';
    if (!telefono.trim()) return 'Ingrese su número de teléfono.';
    return null;
  };

  const enviar = async () => {
    const err = validar();
    if (err) return Alert.alert('Validación', err);
    setSubmitting(true);
    try {
      // intentar detectar usuario o guest
      let user = null;
      try { const raw = await AsyncStorage.getItem('@app_user'); if (raw) user = JSON.parse(raw); } catch(e){}
      const guestId = await AsyncStorage.getItem('@guest_id');

      const payload = {
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        comentario: comentario.trim() || null,
        estado: 'Pendiente',
        // store creator as user id when available
        creadoPor: user ? (user.id || null) : null,
        rolCreadoPor: user ? (user.rol || null) : null,
        guestId: user ? null : (guestId || null),
        fechaCreacion: serverTimestamp(),
      };

      await addDoc(collection(db, 'solicitudes_contrato'), payload);
      Alert.alert('Éxito', 'Solicitud enviada correctamente.');
      // reset
  setNombre(''); setCedula(''); setTelefono(''); setComentario('');
      onSubmitted && onSubmitted();
    } catch (err) {
      console.error('Error creando solicitud:', err);
      Alert.alert('Error', 'No se pudo enviar la solicitud. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear solicitud</Text>

      <TextInput placeholder="Nombre Completo" style={styles.input} value={nombre} onChangeText={setNombre} />
      <TextInput placeholder="Cédula" style={styles.input} value={cedula} onChangeText={setCedula} />
      <TextInput placeholder="Número de Teléfono" style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
  <TextInput placeholder="Comentario (qué necesitas para el contrato, detalles)" style={[styles.input, { height: 100 }]} value={comentario} onChangeText={setComentario} multiline />

      <TouchableOpacity style={[styles.btn, submitting && { opacity: 0.6 }]} onPress={enviar} disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Enviando…' : 'Solicitar Contrato'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginVertical: 8, width: '100%' },
  title: { fontWeight: '700', marginBottom: 6, color: '#0b60d9', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#e6e9ee', padding: 10, borderRadius: 8, marginBottom: 10, backgroundColor: '#fbfdff' },
  btn: { backgroundColor: '#0b60d9', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});
