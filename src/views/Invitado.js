import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const Invitado = () => {
  const handlePhone = () => {
    // Intentar abrir la app de WhatsApp directamente; si no está disponible usar wa.me; si falla, llamar por teléfono
    (async () => {
      const phone = '50588348160'; // formato: codigo_pais + numero sin +
      const waAppUrl = `whatsapp://send?phone=${phone}`;
      const waWebUrl = `https://wa.me/${phone}`;
      try {
        const canOpen = await Linking.canOpenURL(waAppUrl);
        if (canOpen) {
          await Linking.openURL(waAppUrl);
        } else {
          await Linking.openURL(waWebUrl);
        }
      } catch (e) {
        // ultimo recurso: tel
        Linking.openURL('tel:+50588348160').catch(() => {});
      }
    })();
  };

  const handleEmail = () => {
    Linking.openURL('mailto:funerariaheraldica@gmail.com').catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Funeraria Heráldica</Text>

      <View style={styles.card}>
        <Text style={styles.lead}>
          Somos Funeraria Heráldica, una empresa dedicada a brindar servicios fúnebres integrales con respeto, empatía y compromiso humano. Nuestro objetivo es acompañar a las familias en los momentos más difíciles, ofreciendo atención personalizada y soluciones accesibles.
        </Text>

        <View style={styles.row}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.rowText}>
            Dirección: De Americable ½ cuadra al norte, Juigalpa, Chontales, Nicaragua.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.icon}>📞</Text>
          <TouchableOpacity onPress={handlePhone}>
            <Text style={[styles.rowText, styles.link]}>+505 88348160</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.icon}>📧</Text>
          <TouchableOpacity onPress={handleEmail}>
            <Text style={[styles.rowText, styles.link]}>funerariaheraldica@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.icon}>🕒</Text>
          <Text style={styles.rowText}>Horario de atención: Lunes a Domingo — 24 horas</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subTitle}>Nuestra misión</Text>
          <Text style={styles.paragraph}>
            Brindar un servicio digno y humano, apoyado en la tecnología y la confianza, garantizando acompañamiento continuo antes, durante y después del proceso fúnebre.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subTitle}>Nuestra visión</Text>
          <Text style={styles.paragraph}>
            Ser una funeraria líder en la región central del país, reconocida por su atención cálida, profesionalismo y transformación digital a través de la aplicación móvil TechnoWell.
          </Text>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  lead: { fontSize: 15, color: '#333', marginBottom: 12, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  icon: { fontSize: 18, width: 30 },
  rowText: { flex: 1, fontSize: 14, color: '#333' },
  link: { color: '#0b60d9', textDecorationLine: 'underline' },
  section: { marginTop: 10 },
  subTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  paragraph: { fontSize: 14, color: '#444', lineHeight: 20 },
});

export default Invitado;
