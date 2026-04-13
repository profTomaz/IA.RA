import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

// 1. SUBSTITUA PELO SEU LINK DO RAILWAY
const API_URL = "https://SEU-PROJETO-LOTUS.up.railway.app/processar_voz";

export default function App() {
  const [view, setView] = useState('weather');
  const [passInput, setPassInput] = useState('');
  const [recording, setRecording] = useState(null);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [timerRef, setTimerRef] = useState(null);

  // FUNÇÃO DE VIBRAÇÃO EM LOOP (CORRIGIDA)
  const dispararVibracao = () => {
    // O padrão [espera, vibra, espera, vibra]
    const PATTERN = [500, 1000, 500, 1000]; 
    Vibration.vibrate(PATTERN, true); // O 'true' faz o loop infinito
  };

  const iniciarProtocolo = () => {
    if (isAlertActive) return;
    setIsAlertActive(true);
    
    dispararVibracao(); // Aciona o vibracall real

    const t = setTimeout(() => {
      Vibration.cancel();
      setIsAlertActive(false);
      Alert.alert("🚨 IA.RA", "PROTOCOLO EXECUTADO: Ajuda a Caminho e Localização Enviada.");
    }, 7000); // 7 segundos de pânico/cancelamento
    
    setTimerRef(t);
  };

  const cancelarProtocolo = () => {
    if (timerRef) clearTimeout(timerRef);
    Vibration.cancel();
    setIsAlertActive(false);
    Alert.alert("IA.RA", "Protocolo Interrompido.");
  };

  // LÓGICA DE VOZ (GRAVA E ENVIA)
  async function monitorarVoz() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);

      // Grava por 3 segundos e para automaticamente para analisar
      setTimeout(async () => {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        enviarParaServidor(uri);
      }, 3000);

    } catch (err) {
      Alert.alert("Erro", "Não conseguimos acessar o microfone.");
    }
  }

  async function enviarParaServidor(audioUri) {
    const formData = new FormData();
    formData.append('file', { uri: audioUri, name: 'audio.m4a', type: 'audio/m4a' });

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = await response.json();

      // Se o Python detectar a frase, ele ativa o protocolo aqui no celular
      if (data.texto.includes("protocolo lotus")) {
        iniciarProtocolo();
      } else if (data.texto.includes("cancelar protocolo")) {
        cancelarProtocolo();
      }
    } catch (e) {
      console.log("Erro na conexão com servidor");
    }
  }

  // RENDERIZAÇÃO DAS TELAS (IDENTIDADE VISUAL INICIATIVA LOTUS)
  if (view === 'weather') {
    return (
      <View style={styles.cWeather}>
        <TouchableOpacity onPress={() => setView('password')}>
          <Text style={{fontSize: 100}}>☂️</Text>
        </TouchableOpacity>
        <Text style={styles.tWeather}>Vai Chover Hj?</Text>
      </View>
    );
  }

  return (
    <View style={styles.cIara}>
      {view === 'password' ? (
        <>
          <Text style={styles.label}>CÓDIGO DE ACESSO</Text>
          <TextInput secureTextEntry style={styles.input} onChangeText={setPassInput} placeholder="..." />
          <TouchableOpacity style={styles.btn} onPress={() => passInput === 'lotus' ? setView('settings') : Alert.alert("Erro", "Acesso Negado")}>
            <Text style={styles.btnT}>DESBLOQUEAR</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>MENU IA.RA</Text>
          <TouchableOpacity style={styles.btn} onPress={monitorarVoz}>
            <Text style={styles.btnT}>🎤 TESTAR MODO VOZ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={iniciarProtocolo}>
            <Text style={styles.btnT}>⚠️ TESTAR BOTÃO EMERGÊNCIA</Text>
          </TouchableOpacity>
          {isAlertActive && (
             <TouchableOpacity style={[styles.btn, {backgroundColor: 'red'}]} onPress={cancelarProtocolo}>
                <Text style={styles.btnT}>PARAR PROTOCOLO (7s)</Text>
             </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setView('weather')}><Text style={styles.link}>SAIR</Text></TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cWeather: { flex: 1, backgroundColor: '#E6E6FA', justifyContent: 'center', alignItems: 'center' },
  tWeather: { fontSize: 24, fontWeight: 'bold', color: '#4B0082' },
  cIara: { flex: 1, backgroundColor: '#4B0082', justifyContent: 'center', padding: 40 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, textAlign: 'center' },
  btn: { backgroundColor: '#E6E6FA', padding: 20, borderRadius: 15, marginVertical: 10 },
  btnT: { color: '#4B0082', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  label: { color: '#E6E6FA', marginBottom: 15, textAlign: 'center', letterSpacing: 2 },
  link: { color: '#fff', textAlign: 'center', marginTop: 30, textDecorationLine: 'underline' }
});
