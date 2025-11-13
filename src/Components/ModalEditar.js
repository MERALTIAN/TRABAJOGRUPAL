import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView,
  Image,
  Alert 
} from "react-native";
import { db } from "../database/firebaseconfig";
import { updateDoc, doc } from "firebase/firestore";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from "expo-file-system";

const ModalEditar = ({ 
  visible, 
  onClose, 
  item, 
  collection, 
  fields, 
  onUpdate,
  title 
}) => {
  const [formData, setFormData] = useState({});
  const [imagen, setImagen] = useState(null);

  useEffect(() => {
    if (item) {
      setFormData(item);
      setImagen(item.Imagen || null);
    }
  }, [item]);

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

      await updateDoc(doc(db, collection, item.id), dataToUpdate);
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
    
    if (type === 'image') {
      return (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
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
        <Text style={styles.label}>{label}</Text>
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
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
    </Modal>
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
