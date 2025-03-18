import whisper

model = whisper.load_model('base')
result = model.transcribe(r'C:\Users\Indrit Ferati\OneDrive\Desktop\FastAPI\Idioms.mp3', fp16=False)

print(result['text'])

