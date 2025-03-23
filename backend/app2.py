from gtts import gTTS
import pygame
import os

def text_to_speech(text, lang="en"):
    # Convert text to speech using gTTS
    tts = gTTS(text=text, lang=lang)
    tts.save("output.mp3")  # Save the audio file

    # Initialize pygame mixer for playing audio
    pygame.mixer.init()
    pygame.mixer.music.load("output.mp3")
    pygame.mixer.music.play()

    # Wait until the audio finishes playing
    while pygame.mixer.music.get_busy():  
        pygame.time.Clock().tick(10)

# Example usage:
text_to_speech("Hello, how can I assist you today?")
