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
import logging
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID"],  # Explicitly expose the X-Session-ID header
)

model = whisper.load_model("base")
device = "cuda" if torch.cuda.is_available() else "cpu"
genai.configure(api_key=GEMINI_API_KEY)

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
RECORD_SECONDS = 5
OUTPUT_FILENAME = "output.wav"

conversation_history = {}

def record_audio():
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
    try:
        logger.info("Starting audio recording")
        record_audio()
        logger.info("Transcribing audio")
        result = model.transcribe(OUTPUT_FILENAME, fp16=False)
        transcription = result["text"]
        logger.info("Transcription result: %s", transcription)
        return {"transcription": transcription}
    except Exception as e:
        logger.error("Error in transcribe_audio: %s", str(e))
        return {"error": str(e)}

def summarize_text(text, num_sentences=3):
    logger.info("Summarizing text: %s", text)
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = TextRankSummarizer()
    summary = summarizer(parser.document, num_sentences)
    summary_sentences = [str(sentence) for sentence in summary]
    summarized_text = " ".join(summary_sentences[:num_sentences])
    logger.info("Summarized text: %s", summarized_text)
    return summarized_text

async def generate_response_stream(user_input: str, session_id: str):
    try:
        history = conversation_history.get(session_id, [])
        logger.info("Conversation history for session %s: %s", session_id, history)

        # Format the conversation history in a clear, conversational way
        history_text = ""
        if history:
            history_text += "Here’s what we’ve discussed so far:\n"
            for i, message in enumerate(history, 1):
                if message["role"] == "user":
                    history_text += f"- You asked: {message['content']}\n"
                else:
                    history_text += f"- I responded: {message['content']}\n"
            history_text += "\n"
        else:
            history_text = "This is the start of our conversation.\n"

        # Updated prompt to encourage context-aware, conversational responses
        prompt = f"""
        You are an expert interviewer helping a user prepare for a job interview. Your goal is to mimic a real-life conversation with an expert, providing actionable advice while maintaining awareness of the conversation flow. Below is the conversation history so far. Use it to understand the context and reference previous exchanges naturally when relevant, without the user explicitly asking for it. For example, if the user asks for clarification on something discussed earlier, acknowledge the previous discussion and build on it.

        Respond in a conversational tone, as if you're speaking directly to the user. Provide 1-2 key points of actionable advice related to their query, formatted as a numbered list with brief explanations. If the user asks for more details or clarification, dive deeper into the topic while referencing the conversation context. Keep your responses concise but engaging, and avoid repeating advice unless it’s necessary for clarity.

        ### Conversation History:
        {history_text}

        ### User's Current Input:
        {user_input}

        ### Instructions:
        - Use the conversation history to provide context-aware responses.
        - Reference previous exchanges naturally when relevant (e.g., "As we discussed earlier..." or "Building on your earlier question about...").
        - Provide 1-2 key points of actionable advice in a numbered list, unless the user requests more details.
        - Maintain a conversational tone, as if you're an expert speaking directly to the user.
        """

        history.append({"role": "user", "content": user_input})
        
        logger.info("Generating response for input: %s", user_input)
        model = genai.GenerativeModel("gemini-2.0-flash")
        logger.info("Making request to Gemini API")
        response = model.generate_content(prompt)
        full_answer = response.text.strip()
        logger.info("Raw response from Gemini: %s", full_answer)
        
        if len(full_answer.split("\n")) > 6:
            summary = summarize_text(full_answer, num_sentences=4)
            full_answer = summary
        
        history.append({"role": "assistant", "content": full_answer})
        conversation_history[session_id] = history

        for point in full_answer.split("\n"):
            if point.strip():
                logger.info("Streaming point: %s", point.strip())
                yield point.strip() + "\n"
                await asyncio.sleep(0.2)
    except Exception as e:
        logger.error("Error generating response: %s", str(e))
        yield f"Error generating response: {str(e)}\n"

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
    try:
        session_id = request.headers.get("X-Session-ID", str(uuid.uuid4()))
        logger.info("Processing request for session ID: %s", session_id)
        logger.info("X-Session-ID header received: %s", request.headers.get("X-Session-ID", "None"))

        text = await request.body()
        text = text.decode("utf-8").strip()
        logger.info("Received input text: %s", text)

        if not text:
            return StreamingResponse(iter(["No input text provided\n"]), media_type="text/plain")

        if session_id not in conversation_history:
            conversation_history[session_id] = []
            logger.info("Initialized conversation history for session %s", session_id)

        response = "".join([point async for point in generate_response_stream(text, session_id)])
        logger.info("Generated response: %s", response)

        # Log the session_id before sending the response
        logger.info("Sending response with X-Session-ID header: %s", session_id)

        asyncio.create_task(asyncio.to_thread(text_to_speech, response))

        return StreamingResponse(
            iter([response]),
            media_type="text/plain",
            headers={"X-Session-ID": session_id}
        )
    except Exception as e:
        logger.error("Error in /process/: %s", str(e))
        return StreamingResponse(iter([f"Error: {str(e)}\n"]), media_type="text/plain")

@app.post("/clear-session/")
async def clear_session(request: Request):
    try:
        session_id = request.headers.get("X-Session-ID")
        if not session_id:
            return {"error": "No session ID provided"}
        
        if session_id in conversation_history:
            del conversation_history[session_id]
            logger.info("Cleared conversation history for session %s", session_id)
            return {"message": "Session cleared"}
        else:
            return {"error": "Session not found"}
    except Exception as e:
        logger.error("Error in /clear-session/: %s", str(e))
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)