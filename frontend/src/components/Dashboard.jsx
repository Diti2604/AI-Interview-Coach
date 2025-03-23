"use client"

import { useState } from "react"
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

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Start listening (simulated)
  const startListening = () => {
    setIsListening(true)
    setTranscript("")

    // Simulate speech recognition with gradual text appearance
    const fullText =
      "Hi, I'm preparing for a job interview next week for a software developer position. Can you help me practice some common interview questions?"
    let currentIndex = 0

    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTranscript(fullText.substring(0, currentIndex))
        currentIndex += 3
      } else {
        clearInterval(interval)
        setIsListening(false)
        simulateAiResponse()
      }
    }, 50)
  }

  // Stop listening
  const stopListening = () => {
    setIsListening(false)
  }

  // Simulate AI response
  const simulateAiResponse = () => {
    setIsLoading(true)

    setTimeout(() => {
      const response =
        "Of course! I'd be happy to help you prepare for your software developer interview. Let's start with some common questions. First, could you tell me about your experience with programming languages and frameworks? Which ones are you most comfortable with?"

      let currentIndex = 0
      setAiResponse("")

      const interval = setInterval(() => {
        if (currentIndex <= response.length) {
          setAiResponse(response.substring(0, currentIndex))
          currentIndex += 3
        } else {
          clearInterval(interval)

          // Add to conversation history
          setConversation((prev) => [
            ...prev,
            {
              id: Date.now(),
              user: transcript,
              ai: response,
            },
          ])
        }
      }, 30)

      setIsLoading(false)
    }, 1000)
  }

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
                  conversation={conversation}
                />
              }
            />
            {/* You can add more routes here for different dashboard sections */}
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

