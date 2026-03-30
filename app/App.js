import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert, TextInput, Modal } from 'react-native';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

const API_URL = "https://SEU_LINK_CODESPACE.github.dev/processar_voz";

export default function App() {
  const [view, setView] = useState('weather'); // 'weather', 'password', 'settings'
  const [passInput, setPassInput] = useState('');
  const [recording, setRecording] = useState(null);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [timerRef, setTimerRef] = useState(null);
  const [clickCount, setClickCount] = useState(0);

  // 1. Trigger de Emergência (4 Cliques no Ícone de Clima)
  const handleSecretTrigger = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 4) {
      iniciarProtocolo();
      setClickCount(0);
    }
    setTimeout(() => setClickCount(0), 2000);
  };

  // 2. Gravação e Envio de Áudio
  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setTimeout(() => stopAndSend(recording), 3000); // Grava 3 segundos
    } catch (err) {
      Alert.alert("Erro no Microfone", err.message);
    }
  }

  async function stopAndSend(rec) {
    setRecording(undefined);
    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();
    const formData = new FormData();
    formData.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = await res.json();
      if (data.texto.includes("protocolo lotus")) iniciarProtocolo();
      if (data.texto.includes("cancelar protocolo")) cancelarProtocolo();
    } catch (e) {
      console.log("Erro API:", e);
    }
  }

  // 3. Lógica do Timer e Vibração
  const iniciarProtocolo = () => {
    if (isAlertActive) return;
    setIsAlertActive(true);
    Vibration.vibrate([500, 1000, 500], true);
    const t = setTimeout(() => {
      Vibration.cancel();
      setIsAlertActive(false);
      Alert.alert("IA.RA", "Ajuda a Caminho");
    }, 7000);
    setTimerRef(t);
  };

  const cancelarProtocolo = () => {
    clearTimeout(timerRef);
    Vibration.cancel();
    setIsAlertActive(false);
    Alert.alert("IA.RA", "Protocolo Cancelado");
  };

  // TELAS
  if (view === 'weather')
    return (
      <View style={styles.cWeather}>
        <TouchableOpacity onPress={handleSecretTrigger}>
          <Text style={{ fontSize: 80 }}></Text>
        </TouchableOpacity>
        <Text style={styles.tWeather}>Vai Chover Hj?</Text>
        <TouchableOpacity onPress={() => setView('password')}>
          <Text style={{ marginTop: 50, color: '#ccc' }}>Configurações</Text>
        </TouchableOpacity>
      </View>
    );

  if (view === 'password')
    return (
      <View style={styles.cIara}>
        <Text style={styles.label}>Acesso Restrito</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          onChangeText={setPassInput}
          placeholder="Senha"
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() =>
            passInput === 'lotus' ? setView('settings') : Alert.alert("Erro", "Senha Incorreta")
          }
        >
          <Text style={styles.btnT}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.cIara}>
      <Text style={styles.title}>IA.RA Settings</Text>
      <TouchableOpacity style={styles.btn} onPress={startRecording}>
        <Text style={styles.btnT}>Ativar Modo Voz</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => Alert.alert("IA.RA", "Em Desenvolvimento")}
      >
        <Text style={styles.btnT}>Ativar Gesto</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => Alert.alert("IA.RA", "Botão Emergência Habilitado")}
      >
        <Text style={styles.btnT}>Botão de Emergência</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setView('weather')}>
        <Text style={styles.link}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cWeather: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tWeather: {
    fontSize: 22,
    color: '#333',
    fontWeight: 'bold'
  },
  cIara: {
    flex: 1,
    backgroundColor: '#4B0082',
    justifyContent: 'center',
    padding: 40
  },
  title: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
  },
  btn: {
    backgroundColor: '#E6E6FA',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10
  },
  btnT: {
    color: '#4B0082',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  label: {
    color: '#fff',
    marginBottom: 10
  },
  link: {
    color: '#E6E6FA',
    textAlign: 'center',
    textDecorationLine: 'underline'
  }
});

// Justificativa Técnica:
// 1. FormData é obrigatório para enviar arquivos via HTTP POST.
// 2. setTimeout no recording simula o monitoramento em intervalos.
// 3. TouchableOpacity no ícone de Clima habilita o trigger secreto sem alertar observadores. 
