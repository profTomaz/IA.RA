from fastapi import FastAPI, UploadFile, File
import speech_recognition as sr
from pydub import AudioSegment
import io

app = FastAPI()

@app.post("/processar_voz")
async def processar_voz(file: UploadFile = File(...)):
    # Converte áudio comprimido do celular para .wav
    audio_bytes = await file.read()
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
    buffer = io.BytesIO()
    audio.export(buffer, format="wav")
    buffer.seek(0)

    recognizer = sr.Recognizer()
    with sr.AudioFile(buffer) as source:
        audio_data = recognizer.record(source)

    try:
        texto = recognizer.recognize_google(audio_data, language="pt-BR").lower()
        return {"texto": texto}
    except:
        return {"texto": "erro_na_transcricao"}

# Justificativa: Celulares gravam em formatos como .m4a.
# A 'pydub' é necessária para converter o arquivo para o formato que a biblioteca de IA entende.