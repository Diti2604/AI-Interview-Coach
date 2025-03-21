import whisper
import pyaudio
import wave
import torch
from fastapi import FastAPI
import google.generativeai as genai
from dotenv import load_dotenv
import os
import uvicorn

#This function is used for loading the environmental variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

# Initialize Whisper Model
model = whisper.load_model("base")
device = "cuda" if torch.cuda.is_available() else "cpu"
genai.configure(api_key=GEMINI_API_KEY)

# Audio Recording Configuration
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
RECORD_SECONDS = 5  
OUTPUT_FILENAME = "output.wav"


def record_audio():
    """Records audio from the microphone and saves it as a WAV file."""
    p = pyaudio.PyAudio()
    
    stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

    print("Recording... Speak now!")
    frames = []
    
    for _ in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)

    print("Recording stopped.")

    stream.stop_stream()
    stream.close()
    p.terminate()

    # Save the recorded audio
    wf = wave.open(OUTPUT_FILENAME, "wb")
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

@app.post("/transcribe/")
async def transcribe_audio():
    """Records audio, saves it, transcribes using Whisper, and returns text."""
    try:
        record_audio() 
        result = model.transcribe(OUTPUT_FILENAME, fp16=False)
        transcription = result["text"]
        return {"transcription": transcription}

    except Exception as e:
        return {"error": str(e)}
    

def generate_response(prompt: str):
    "Generating a response based on the input previously given"
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    return response.text.strip()

@app.post("/process/")
async def process_text(text: str):
    """Takes the text that was transcribed and gives a response."""
    response = generate_response(text)
    return {"input": text, "response": response}
    
    


if __name__ == "__main__":
     uvicorn.run(app, host="0.0.0.0", port=5000)