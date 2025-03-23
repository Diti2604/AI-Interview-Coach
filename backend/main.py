import whisper
import pyaudio
import wave
import torch
from fastapi import FastAPI
import google.generativeai as genai
from dotenv import load_dotenv
import os
import uvicorn
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.text_rank import TextRankSummarizer
from gtts import gTTS
import pygame

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
    
def summarize_text(text, num_sentences=3):
    """Summarizes text using TextRank algorithm to extract key sentences."""
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = TextRankSummarizer()
    summary = summarizer(parser.document, num_sentences)

    summary_sentences = [str(sentence) for sentence in summary]
    
    return " ".join(summary_sentences[:num_sentences])


def generate_response(prompt: str):
    """Generate a concise and meaningful response using Gemini AI and summarize it with TextRank."""
    try:
        # Generate response from Gemini
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        full_answer = response.text.strip()

        # Summarize using TextRank
        summarized_answer = summarize_text(full_answer, num_sentences=2)

        return f"{summarized_answer} Would you like more details on this topic?"
    
    except Exception as e:
        return f"Error generating response: {str(e)}"




def text_to_speech(text, lang="en"):
    # Convert text to speech using gTTS, the google text to speech API
    tts = gTTS(text=text, lang=lang)
    tts.save("output.mp3")  # Save the audio file

    # Initialize pygame mixer for playing audio
    pygame.mixer.init()
    pygame.mixer.music.load("output.mp3")
    pygame.mixer.music.play()

    # Wait until the audio finishes playing
    while pygame.mixer.music.get_busy():  
        pygame.time.Clock().tick(10)

@app.post("/process/")
async def process_text(text: str):
    """Takes the text that was transcribed and gives a response."""
    response = generate_response(text)
    text_to_speech(response)
    
    return {"input": text, "response": response}
    


if __name__ == "__main__":
     uvicorn.run(app, host="0.0.0.0", port=5000)