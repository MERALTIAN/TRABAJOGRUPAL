import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  componentDidCatch(error, info) {
    // Save to state so we can render a friendly UI and show the stack
    this.setState({ error, info });
    // Also print full details to console for the developer
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Se produjo un error en la aplicación</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 12 }}>
            <Text style={styles.label}>Error:</Text>
            <Text style={styles.value}>{String(this.state.error && this.state.error.toString())}</Text>
            <Text style={styles.label}>Component Stack:</Text>
            <Text style={styles.value}>{this.state.info && this.state.info.componentStack}</Text>
          </ScrollView>
          <View style={styles.actions}>
            <Button title="Recargar" onPress={() => { try { global.location && global.location.reload(); } catch(e) { /* ignore */ } }} />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#b22222' },
  scroll: { maxHeight: '70%', width: '100%' },
  label: { fontWeight: '700', marginTop: 8 },
  value: { color: '#333', marginBottom: 8 },
  actions: { marginTop: 12 }
});

export default ErrorBoundary;
