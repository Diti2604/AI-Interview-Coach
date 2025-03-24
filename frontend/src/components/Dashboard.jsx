"use client"

import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import MicrophoneButton from "./MicrophoneButton";
import TranscriptDisplay from "./TranscriptDisplay";
import ConversationHeader from "./ConversationHeader";
import "../styles/Dashboard.css";

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState("new-conversation");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const lastTranscriptRef = useRef(""); // Track the last transcript to prevent duplicates

  // Log state updates
  useEffect(() => {
    console.log("State updated - transcript:", transcript, "isLoading:", isLoading, "conversation:", conversation);
  }, [transcript, isLoading, conversation]);

  const toggleListening = async () => {
    if (!isListening) {
      setIsListening(true);
      setIsLoading(true);
      setTranscript(""); // Reset transcript
      console.log("Starting transcription, isLoading:", true);

      try {
        console.log("Making request to /transcribe/");
        const transcribeResponse = await fetch("http://127.0.0.1:5000/transcribe/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        console.log("Response from /transcribe/:", transcribeResponse);
        if (!transcribeResponse.ok) {
          throw new Error("Error transcribing audio");
        }

        const transcribeData = await transcribeResponse.json();
        console.log("Transcription data:", transcribeData);
        const userText = transcribeData.transcription;
        if (!userText) {
          throw new Error("No speech detected");
        }

        console.log("Transcription received:", userText);
        // Only add the user message if it's different from the last one
        if (userText !== lastTranscriptRef.current) {
          lastTranscriptRef.current = userText;
          setConversation((prev) => {
            console.log("Adding user message to conversation:", userText);
            return [...prev, { role: "user", content: userText }];
          });
          setTranscript(userText);
          setIsLoading(false);
          console.log("Set transcript to:", userText, "and isLoading to:", false);
        } else {
          console.log("Duplicate transcript detected, skipping:", userText);
          setIsLoading(false);
          console.log("Set isLoading to:", false);
        }
      } catch (error) {
        console.error("Error in toggleListening:", error);
        setConversation((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, there was an error processing your request." },
        ]);
        setIsLoading(false);
        console.log("Set isLoading to:", false, "after error");
      } finally {
        setIsListening(false);
        console.log("Finished transcription, isListening:", false);
      }
    }
  };

  // Callback to handle the AI response
  const handleResponseComplete = async (response) => {
    try {
      console.log("Updating conversation with response:", response);
      setConversation((prev) => {
        const updatedConversation = [...prev];
        const lastMessage = updatedConversation[updatedConversation.length - 1];
        if (lastMessage?.role === "user") {
          console.log("Adding new assistant message:", response);
          return [...prev, { role: "assistant", content: response }];
        }
        updatedConversation[updatedConversation.length - 1] = {
          role: "assistant",
          content: response,
        };
        console.log("Updating existing assistant message:", response);
        return updatedConversation;
      });
      setTranscript("");
      console.log("Reset transcript");
    } catch (error) {
      console.error("Error processing response:", error);
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Could not process the response." },
      ]);
    }
  };

  // Create a new conversation
  const startNewConversation = () => {
    setCurrentConversationId("new-conversation");
    setTranscript("");
    setConversation([]);
    lastTranscriptRef.current = ""; // Reset the last transcript
    console.log("Started new conversation");
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle logout
  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

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
                  isLoading={isLoading}
                  conversation={conversation}
                  onResponseComplete={handleResponseComplete}
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
  );
}

export default Dashboard;