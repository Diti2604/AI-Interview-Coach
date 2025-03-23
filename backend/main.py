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
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

#This function is used for loading the environmental variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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



def generate_response_stream(user_input: str):
    """Generate a structured interview response with only 3-4 key points and stream the output."""
    try:
        # Create a structured prompt for better AI responses that requests limited points
        prompt = f"""
        You are an expert interviewer. The user is preparing for: {user_input}.
        Provide ONLY the 3-4 most important points that would help them succeed.
        Format your response as a numbered list with brief explanations for each point.
        Be concise and focus on actionable advice.

        User's Question: "{user_input}"
        """
        
        # Generate response from Gemini
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        full_answer = response.text.strip()
        
        # Enforce summarization by splitting into a number of points and keeping the most important ones
        if len(full_answer.split("\n")) > 4:  # Limit to no more than 4 points
            full_answer = summarize_text(full_answer, num_sentences=4)
        
        # Stream each point (paragraph) rather than each sentence
        for point in full_answer.split("\n"):
            if point.strip():  # Skip empty lines
                yield f"<p>{point.strip()}</p>"  # Wrapping each point in <p> for styling
                import time
                time.sleep(0.5)  # Adding a slight delay for streaming effect
                
    except Exception as e:
        yield f"<p>Error generating response: {str(e)}</p>"


@app.get("/stream-response/")
async def stream_response(user_input: str):
    """Stream the AI response sentence by sentence."""
    return StreamingResponse(generate_response_stream(user_input), media_type="text/plain")

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
async def process_text(request: Request):
    """Receives transcribed text, generates an AI response, and converts it to speech."""
    try:
        # Read raw text data from request body
        text = await request.body()
        text = text.decode("utf-8").strip()

        if not text:
            return {"error": "No input text provided"}

        response = generate_response_stream(text)
        text_to_speech(response)

        return {"input": text, "response": response}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
     uvicorn.run(app, host="0.0.0.0", port=5000)