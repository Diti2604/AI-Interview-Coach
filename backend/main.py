import whisper
import pyaudio
import wave
from fastapi import FastAPI

app = FastAPI()

# Initialize Whisper Model
model = whisper.load_model("base")

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

@app.post("/transcribe-audio/")
async def transcribe_audio():
    """Records audio, saves it, transcribes using Whisper, and returns text."""
    try:
        # Record the audio first
        record_audio()

        # Transcribe using Whisper
        result = model.transcribe(OUTPUT_FILENAME, fp16=False)

        return {"transcription": result["text"]}

    except Exception as e:
        return {"error": str(e)}

