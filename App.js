
import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, ScrollView, LogBox } from 'react-native';
import ErrorBoundary from './src/Components/ErrorBoundary';
import SafeModal from './src/Components/SafeModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Usuario from "./src/views/Usuario";
import Servicio from "./src/views/Servicio";
import Modelo from "./src/views/Modelo";
import Factura from "./src/views/Factura";
import Contrato from "./src/views/Contrato";
import AccesoContrato from "./src/views/AccesoContrato_fixed";
import Beneficiario from "./src/views/Beneficiario";
import Cliente from "./src/views/Cliente";
import AgenteCobrador from "./src/views/AgenteCobrador";
import Catalogo from "./src/views/Catalogo";
import Invitado from "./src/views/Invitado";
import Login from "./src/views/Login";
import SolicitarContrato from "./src/views/SolicitarContrato";
import Solicitudes from "./src/views/Solicitudes";
import EstadisticasAdmin from "./src/views/EstadisticasAdmin";
import BottomNav from "./src/Components/BottomNav";

const allScreens = [
  { key: 'catalogo', name: 'Catálogo', component: Catalogo, roles: ['Cliente','Administrador', 'Invitado'] },
  { key: 'solicitar_contrato', name: 'Solicitar Contrato', component: SolicitarContrato, roles: ['Cliente'] },
  { key: 'acceso_contrato', name: 'Acceso Contrato', component: AccesoContrato, roles: ['Cliente', 'Agente'] },
  { key: 'solicitudes', name: 'Solicitudes', component: Solicitudes, roles: ['Administrador'] }, // <-- Nueva pantalla
  { key: 'estadisticas', name: 'Estadísticas', component: EstadisticasAdmin, roles: ['Administrador'] },
  { key: 'usuario', name: 'Usuario', component: Usuario, roles: ['Administrador'] },
	{ key: 'servicio', name: 'Servicio', component: Servicio, roles: ['Administrador'] },
	{ key: 'modelo', name: 'Modelo', component: Modelo, roles: ['Administrador'] },
	{ key: 'factura', name: 'Factura', component: Factura, roles: ['Administrador'] },
  { key: 'contrato', name: 'Contrato', component: Contrato, roles: ['Administrador'] },
	{ key: 'beneficiario', name: 'Beneficiario', component: Beneficiario, roles: ['Administrador'] },
	{ key: 'cliente', name: 'Cliente', component: Cliente, roles: ['Administrador'] },
	{ key: 'agentecobrador', name: 'Agente Cobrador', component: AgenteCobrador, roles: ['Administrador'] },
  { key: 'info_negocio', name: 'Información', component: Invitado, roles: ['Invitado','Cliente'] },
];

const AUTH_DISABLED = false; // set true to bypass login for testing (creates a default admin user)

// Silence specific React Native warning about LayoutAnimation in the New Architecture.
// This warning is benign; ignoring it keeps the Metro console cleaner.
LogBox.ignoreLogs(['setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture.']);

export default function App() {
	const [index, setIndex] = useState(0);
	const [user, setUser] = useState(AUTH_DISABLED ? { id: 'dev-admin', Usuario: 'admin', rol: 'Administrador' } : null);
	const [loadingUser, setLoadingUser] = useState(true);
	const [menuVisible, setMenuVisible] = useState(false);

	useEffect(() => {
		if (AUTH_DISABLED) {
			setLoadingUser(false);
			return;
		}
		const load = async () => {
			try {
				const raw = await AsyncStorage.getItem('@app_user');
				if (raw) {
					setUser(JSON.parse(raw));
				}
			} catch (e) {
				console.error('Error reading saved user', e);
			} finally {
				setLoadingUser(false);
			}
		};
		load();
	}, []);

  // When logged in, show screens according to role (case-insensitive match).
  // When NOT logged in (guest), show only screens intended for the 'Invitado' role.
  const userRole = user ? (user.rol || '').toString().toLowerCase() : null;
  const screens = user
    ? allScreens.filter(s => s.roles && s.roles.map(r => r.toString().toLowerCase()).includes(userRole))
    : allScreens.filter(s => s.roles && s.roles.map(r => r.toString().toLowerCase()).includes('invitado'));
  // make sure index is within bounds
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, screens.length - 1));
  const Current = user ? screens[safeIndex].component : Login;
	const goNext = () => setIndex((i) => Math.min(i + 1, screens.length - 1));
	const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

	if (loadingUser) {
	  return (
		<View style={styles.app}><Text style={{padding:20}}>Cargando…</Text></View>
	  );
	}

	// Pantalla de bienvenida solo para administrador, con diseño moderno y visual
	if (user && index === 0 && user.rol === 'Administrador') {
		return (
			<View style={[styles.app, { backgroundColor: '#f0f4fa' }]}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.hamburger} onPress={() => setMenuVisible(true)}>
						<Text style={{ fontSize: 32, fontWeight: 'bold', color: '#0077cc' }}>☰</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Bienvenido</Text>
				</View>
				<View style={styles.content}>
					<View style={styles.welcomeBoxModerno}>
						<Text style={styles.welcomeIcon}>👋</Text>
						<Text style={styles.welcomeTextGrande}>¡Hola, {user.Usuario}!</Text>
						<Text style={styles.welcomeSub}>Accede a todas las funciones del panel de administrador desde el menú.</Text>
						
						<TouchableOpacity 
						style={styles.menuButtonGrande} 
						onPress={() => setMenuVisible(true)}
						>
							<Text style={styles.menuButtonText}>Abrir menú de opciones</Text>
						</TouchableOpacity>

					</View>
				</View>
				
				<BottomNav screens={screens} index={index} setIndex={setIndex} />
			</View>
		);
	}

  return (
    <ErrorBoundary>
    <View style={styles.app}>
			<View style={styles.header}>
				{user && (user.rol === 'Administrador' || user.rol === 'Invitado') ? (
					<TouchableOpacity style={styles.hamburger} onPress={() => setMenuVisible(true)}>
						<Text style={{fontSize:28, fontWeight:'bold'}}>☰</Text>
					</TouchableOpacity>
				) : <View style={{width:36}} /> }
				<Text style={styles.title}>{user ? screens[index].name : 'Login'}</Text>
				{user && (user.rol === 'Cliente' || user.rol === 'Invitado') && (
					<Button title="Salir de la cuenta" color="#ff4444" onPress={async () => {
						await AsyncStorage.removeItem('@app_user');
						setUser(null);
						setIndex(0);
					}} />
				)}
			</View>

			{/* Menu modal para administradores */}
            <SafeModal
  visible={menuVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setMenuVisible(false)}
>
  {/* Capa que cierra al tocar fuera */}
  <TouchableOpacity
    style={styles.menuOverlay}
    activeOpacity={1}
    onPress={() => setMenuVisible(false)}
  >
    {/* Menú en sí */}
    <View style={styles.menuContainerLeft}>
      <Text style={styles.menuTitle}>Menú - Opciones</Text>
      <ScrollView>
        {screens.map((s, i) => (
          <TouchableOpacity
            key={s.key}
            style={styles.menuItem}
            onPress={() => {
              setIndex(i);
              setMenuVisible(false);
            }}
          >
            <Text style={styles.menuItemText}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Button
          title="Salir de la cuenta"
          color="#ff4444"
          onPress={async () => {
            await AsyncStorage.removeItem('@app_user');
            setUser(null);
            setIndex(0);
            setMenuVisible(false);
          }}
        />
      </View>
    </View>
  </TouchableOpacity>
</SafeModal>




			<View style={styles.content}>
        {user ? (
          <Current user={user} onLogout={async () => { await AsyncStorage.removeItem('@app_user'); setUser(null); setIndex(0); }} />
        ) : (
      <Login 
        onLogin={async (u) => { 
          setUser(u);
          try {
            await AsyncStorage.setItem('@app_user', JSON.stringify(u));
          } catch(e){}
          // If the logged-in user is an agent, navigate to the 'Acceso Contrato' screen
          try {
            const role = (u.rol || '').toString().toLowerCase();
            if (role === 'agente') {
              const idx = screens.findIndex(s => s.key === 'acceso_contrato');
              if (idx >= 0) setIndex(idx);
            }
          } catch (e) {}
        }} 
        onGuestLogin={() => {
          // set guest user and switch directly to the business info screen for guests
          const guestScreens = allScreens.filter(s => s.roles && s.roles.map(r => r.toString().toLowerCase()).includes('invitado'));
          const infoIndex = Math.max(0, guestScreens.findIndex(s => s.key === 'info_negocio'));
          setUser({ rol: 'Invitado', Usuario: 'Invitado' });
          setIndex(infoIndex);
        }}
      />
				)}
			</View>

			{user && (
				<>
				  
				  <BottomNav screens={screens} index={index} setIndex={setIndex} />
				</>
			)}
    </View>
    </ErrorBoundary>
	);
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#f2f4f8', // Fondo general más suave
  },
  header: {
    height: 60,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  welcomeBoxModerno: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    marginTop: 32,
    marginHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  welcomeTextGrande: {
    fontSize: 28,
    color: '#1e90ff',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  menuButtonGrande: {
    marginTop: 20,
    backgroundColor: '#1e90ff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },

 
  footer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  hamburger: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)', // Oscurece el fondo
    justifyContent: 'flex-start',
    alignItems: 'flex-start', // Posiciona el menú a la izquierda
  },
  menuContainerLeft: {
    backgroundColor: '#fff', // Fondo sólido para el menú
    width: '70%', // Ancho del menú
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#555',
  },


});
