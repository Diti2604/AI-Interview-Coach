import whisper
import pyaudio
import wave
import torch
from fastapi import FastAPI, Request
import google.generativeai as genai
from dotenv import load_dotenv
import os
import uvicorn
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.text_rank import TextRankSummarizer
from gtts import gTTS
import pygame
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import tempfile
import logging  # Add logging for debugging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

async def generate_response_stream(user_input: str):
    """Generate a structured interview response with only 3-4 key points and stream the output."""
    try:
        prompt = f"""
        You are an expert interviewer. The user is preparing for: {user_input}.
        Provide ONLY the 1-2 most important points that would help them succeed.
        Format your response as a numbered list with brief explanations for each point.
        Keep it short but concise and focus on actionable advice.

        User's Question: "{user_input}"
        """
        
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        full_answer = response.text.strip()
        
        if len(full_answer.split("\n")) > 6:
            summary = summarize_text(full_answer, num_sentences=4)
            full_answer = summary
        
        for point in full_answer.split("\n"):
            if point.strip():
                yield point.strip() + "\n"
                await asyncio.sleep(0.2)
    except Exception as e:
        yield f"Error generating response: {str(e)}"

def text_to_speech(text, lang="en"):
    logger.info("Starting text_to_speech with text: %s", text)
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_filename = temp_file.name

        tts = gTTS(text=text, lang=lang)
        tts.save(temp_filename)

        pygame.mixer.init()
        pygame.mixer.music.load(temp_filename)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
    except Exception as e:
        logger.error("Error in text_to_speech: %s", str(e))
        raise
    finally:
        pygame.mixer.music.stop()
        pygame.mixer.quit()
        if 'temp_filename' in locals():
            try:
                os.remove(temp_filename)
            except Exception as e:
                logger.error("Error deleting temporary file: %s", str(e))

@app.post("/process/")
async def process_text(request: Request):
    """Receives transcribed text, streams the AI response, and plays audio concurrently."""
    try:
        text = await request.body()
        text = text.decode("utf-8").strip()
        logger.info("Received input text: %s", text)

        if not text:
            return StreamingResponse(iter(["No input text provided\n"]), media_type="text/plain")

        # Collect the full response from the generator
        response = "".join([point async for point in generate_response_stream(text)])
        logger.info("Generated response: %s", response)

        # Start text-to-speech in a background task with the AI response
        asyncio.create_task(asyncio.to_thread(text_to_speech, response))

        # Stream the response to the frontend immediately
        return StreamingResponse(iter([response]), media_type="text/plain")
    except Exception as e:
        logger.error("Error in /process/: %s", str(e))
        return StreamingResponse(iter([f"Error: {str(e)}\n"]), media_type="text/plain")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)