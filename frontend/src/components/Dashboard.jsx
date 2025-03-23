"use client"
import { useState, useEffect } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import Sidebar from "./Sidebar"
import MicrophoneButton from "./MicrophoneButton"
import TranscriptDisplay from "./TranscriptDisplay"
import ConversationHeader from "./ConversationHeader"
import "../styles/Dashboard.css"

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState("new-conversation")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const toggleListening = async () => {
    if (!isListening) {
      setIsListening(true);
      await fetchAiResponse();
      setIsListening(false);
    }
  };
    
  const fetchAiResponse = async () => {
    setIsLoading(true);
    setTranscript("");
    setAiResponse("");
    
    try {
      // Step 1: Transcribe Speech using Whisper
      const transcribeResponse = await fetch("http://127.0.0.1:5000/transcribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
          
      if (!transcribeResponse.ok) {
        throw new Error("Error transcribing audio");
      }
          
      const transcribeData = await transcribeResponse.json();
      const userText = transcribeData.transcription;
      setTranscript(userText);
          
      if (!userText) {
        throw new Error("No speech detected");
      }
      
      // Step 2: Start streaming the response to show typing effect
      setIsStreaming(true);
      
      // Start streaming for visual effect
      const streamResponse = await fetch(`http://127.0.0.1:5000/stream-response/?user_input=${encodeURIComponent(userText)}`);
      
      if (!streamResponse.ok) {
        throw new Error("Error streaming response");
      }
      
      // Read the stream chunk by chunk
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        const text = decoder.decode(value);
        fullResponse += text;
        setAiResponse(fullResponse);
      }
      
      // Step 3: After streaming is done, process text for speech
      setIsStreaming(false);
      setIsSpeaking(true);
      
      const processResponse = await fetch("http://127.0.0.1:5000/process/", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: userText,
      });
      
      if (!processResponse.ok) {
        throw new Error("Error processing text");
      }
      
      const processData = await processResponse.json();
      
      // After speech is done, update conversation history
      setTimeout(() => {
        setIsSpeaking(false);
      }, 10000); // Approximate time for speech to complete
      
      setConversation(prev => [
        ...prev,
        { role: "user", content: userText },
        { role: "assistant", content: fullResponse }
      ]);
      
    } catch (error) {
      console.error("Error:", error);
      setAiResponse("Sorry, there was an error processing your request.");
    } finally {
      setIsLoading(false);
    }
  };
      
  // Create a new conversation
  const startNewConversation = () => {
    setCurrentConversationId("new-conversation")
    setTranscript("")
    setAiResponse("")
    setConversation([])
  }

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Handle logout
  const handleLogout = () => {
    onLogout()
    navigate("/login")
  }

  return (
    <div className="dashboard">
      <Sidebar
        user={user}
        onNewConversation={startNewConversation}
        currentConversationId={currentConversationId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />
      
      <div className="main-content">
        <ConversationHeader onMenuClick={toggleSidebar} />
        
        <main className="transcript-container">
          <Routes>
            <Route
              path="/"
              element={
                <TranscriptDisplay
                  transcript={transcript}
                  aiResponse={aiResponse}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  isSpeaking={isSpeaking}
                  conversation={conversation}
                />
              }
            />
          </Routes>
        </main>
        
        <div className="microphone-container">
          <MicrophoneButton isListening={isListening} onClick={toggleListening} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard