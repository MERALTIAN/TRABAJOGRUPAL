import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image,
  Alert 
} from "react-native";
import formatField from '../utils/formatField';
import SafeModal from '../Components/SafeModal';
import { db } from "../firebase.js";
import { updateDoc, doc } from "firebase/firestore";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from "expo-file-system";

const ModalEditar = ({ 
  visible, 
  onClose, 
  item, 
  collectionName, 
  fields, 
  onUpdate,
  title 
}) => {
  const [formData, setFormData] = useState({});
  const [imagen, setImagen] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
      setImagen(item.Imagen || null);
    }
  }, [item]);

  // cargar usuarios para campos tipo 'usuario'
  useEffect(() => {
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        // Import firestore helpers at runtime to avoid any import/namespace collisions
        // Destructure the helpers to ensure we're calling the functions directly
        const { getDocs, collection } = await import('firebase/firestore');
        const q = await getDocs(collection(db, 'Usuario'));
        const all = q.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(all);
      } catch (e) {
        console.error('Error cargando usuarios en ModalEditar', e);
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true, // Importante: obtener la imagen en Base64
    });

    if (!result.canceled) {
      // Guardamos la imagen en Base64 directamente
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImagen(base64Image);
      setFormData(prev => ({
        ...prev,
        Imagen: base64Image
      }));
    }
  };

  const handleSave = async () => {
    try {
      const dataToUpdate = { ...formData };
      if (imagen) {
        dataToUpdate.Imagen = imagen;
      }
      // Validation: if editing a Cliente, validate Cedula format
      if (collectionName === 'Cliente' && dataToUpdate && dataToUpdate.Cedula) {
        const cedulaRegex = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
        if (!cedulaRegex.test(String(dataToUpdate.Cedula))) {
          Alert.alert('Cédula inválida', 'La cédula debe tener formato 121-261204-1001F');
          return;
        }
      }

      await updateDoc(doc(db, collectionName, item.id), dataToUpdate);
      onUpdate();
      onClose();
      Alert.alert('Éxito', 'Registro actualizado correctamente');
    } catch (error) {
      console.error("Error al actualizar:", error);
      Alert.alert('Error', 'No se pudo actualizar el registro');
    }
  };

  const renderField = (field) => {
    const { key, label, type, keyboardType } = field;
    
    // Campo especial: selector de Usuario (vincular por rol)
    if (type === 'usuario') {
      // Determinar filtro por rol según la collectionName (Cliente -> Cliente, Agente_Cobrador -> Agente)
      let roleFilter = null;
      if (collectionName && typeof collectionName === 'string') {
        const c = collectionName.toLowerCase();
        if (c.includes('cliente')) roleFilter = 'Cliente';
        else if (c.includes('agente')) roleFilter = 'Agente';
      }

      const filtered = usersLoading ? [] : (roleFilter ? users.filter(u => (u.rol || '').toString().toLowerCase() === roleFilter.toLowerCase()) : users);

      return (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>{formatField(label)}</Text>
          {usersLoading ? (
            <Text>Cargando usuarios…</Text>
          ) : (
            <View>
              {filtered.map(u => (
                <TouchableOpacity key={u.id} style={{ paddingVertical: 8 }} onPress={() => handleInputChange(key, u.id)}>
                  <Text style={{ color: formData[key] === u.id ? '#0b60d9' : '#333', fontWeight: formData[key] === u.id ? '700' : '400' }}>{u.Usuario} {u.rol ? `(${u.rol})` : ''}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => handleInputChange(key, null)} style={{ marginTop: 8 }}>
                <Text style={{ color: '#888' }}>Desvincular usuario</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    if (type === 'image') {
      return (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>{formatField(label)}</Text>
          <TouchableOpacity style={styles.imageButton} onPress={seleccionarImagen}>
            <Text style={styles.imageButtonText}>📷 Seleccionar Imagen</Text>
          </TouchableOpacity>
          {imagen && (
            <Image source={{ uri: imagen }} style={styles.imagePreview} />
          )}
        </View>
      );
    }

    return (
      <View key={key} style={styles.fieldContainer}>
  <Text style={styles.label}>{formatField(label)}</Text>
        <TextInput
          style={styles.input}
          value={formData[key]?.toString() || ''}
          onChangeText={(value) => handleInputChange(key, value)}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={type === 'password'}
        />
      </View>
    );
  };

  return (
    <SafeModal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{formatField(title)}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {fields.map(field => renderField(field))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalContent: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  imageButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontSize: 16,
  },
  imagePreview: {
    width: 150,
    height: 100,
    borderRadius: 5,
    marginTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ModalEditar;
