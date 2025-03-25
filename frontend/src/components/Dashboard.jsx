// src/components/Dashboard.jsx
"use client";

import { useState, useRef, useEffect, Component } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import MicrophoneButton from "./MicrophoneButton";
import TranscriptDisplay from "./TranscriptDisplay";
import ConversationHeader from "./ConversationHeader";
import "../styles/Dashboard.css";
import { db } from "../../firebase";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// Debug: Log the db instance
console.log("Imported db in Dashboard.jsx:", db);

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with the Sidebar. Please try again.</div>;
    }
    return this.props.children;
  }
}

function Dashboard({ user, onLogout, isReadOnly = false }) {
  console.log("Dashboard.jsx loaded, user:", user);

  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState("new-conversation");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    const savedSessionId = localStorage.getItem("sessionId");
    console.log("Initial sessionId from localStorage:", savedSessionId);
    return savedSessionId || null;
  });
  const [title, setTitle] = useState("New Conversation");
  const lastTranscriptRef = useRef("");

  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId && conversationId !== "new-conversation") {
        try {
          console.log("Loading conversation with ID:", conversationId);
          const docRef = doc(db, "conversations", conversationId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Loaded conversation from Firestore:", data);
            setConversation(data.conversation || []);
            setTitle(data.title || "Untitled Conversation");
            setCurrentConversationId(conversationId);
          } else {
            console.log("No such conversation found in Firestore");
            navigate("/");
          }
        } catch (error) {
          console.error("Error loading conversation from Firestore:", error);
          navigate("/");
        }
      }
    };

    loadConversation();
  }, [conversationId, navigate]);

  useEffect(() => {
    console.log(
      "State updated - transcript:",
      transcript,
      "isLoading:",
      isLoading,
      "conversation:",
      conversation,
      "sessionId:",
      sessionId
    );
  }, [transcript, isLoading, conversation, sessionId]);

  useEffect(() => {
    console.log("sessionId updated to:", sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("sessionId", sessionId);
      console.log("Saved sessionId to localStorage:", sessionId);
    } else {
      localStorage.removeItem("sessionId");
      console.log("Removed sessionId from localStorage");
    }
  }, [sessionId]);

  const toggleListening = async () => {
    if (!isListening) {
      setIsListening(true);
      setIsLoading(true);
      setTranscript("");
      console.log("Starting transcription, isLoading:", true, "current sessionId:", sessionId);

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
        if (userText !== lastTranscriptRef.current) {
          lastTranscriptRef.current = userText;
          setConversation((prev) => {
            console.log("Adding user message to conversation:", userText);
            return [...prev, { role: "user", content: userText }];
          });
          setTranscript(userText);
          setIsLoading(false);
          console.log(
            "Set transcript to:",
            userText,
            "and isLoading to:",
            false,
            "current sessionId:",
            sessionId
          );
        } else {
          console.log("Duplicate transcript detected, skipping:", userText);
          setIsLoading(false);
          console.log("Set isLoading to:", false, "current sessionId:", sessionId);
        }
      } catch (error) {
        console.error("Error in toggleListening:", error);
        setTranscript("Error: Could not transcribe audio. Please try again.");
        setIsLoading(false);
        console.log("Set isLoading to:", false, "after error", "current sessionId:", sessionId);
      } finally {
        setIsListening(false);
        console.log("Finished transcription, isListening:", false, "current sessionId:", sessionId);
      }
    }
  };

  const handleResponseComplete = async (response, newSessionId) => {
    try {
      console.log(
        "handleResponseComplete called with response:",
        response,
        "newSessionId:",
        newSessionId,
        "current sessionId:",
        sessionId
      );
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
        console.log("Updated sessionId to:", newSessionId);
      } else {
        console.log("No new sessionId or same as current, keeping sessionId:", sessionId);
      }

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
      console.log("Reset transcript, current sessionId after update:", sessionId);
    } catch (error) {
      console.error("Error processing response:", error);
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Could not process the response." },
      ]);
    }
  };

  // src/components/Dashboard.jsx (relevant snippet)
const startNewConversation = async (newTitle) => {
  if (sessionId) {
    try {
      console.log("Clearing session for sessionId:", sessionId);
      const response = await fetch("http://127.0.0.1:5000/clear-session/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
        },
      });
      const data = await response.json();
      console.log("Clear session response:", data);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  }

  setTitle(newTitle || "New Conversation"); // Use the title from the modal
  setCurrentConversationId("new-conversation");
  setTranscript("");
  setConversation([]);
  setSessionId(null);
  lastTranscriptRef.current = "";
  console.log("Started new conversation, sessionId reset to:", null);
  navigate("/");
};
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const handleSaveConversation = async () => {
    if (!user) {
      alert("You must be logged in to save a conversation.");
      return;
    }

    if (conversation.length === 0) {
      alert("No conversation to save.");
      return;
    }

    try {
      const conversationData = {
        userId: user.uid,
        title: title,
        conversation: conversation,
        timestamp: serverTimestamp(),
      };
      console.log("Saving conversation to Firestore:", conversationData);

      const docRef = await addDoc(collection(db, "conversations"), conversationData);
      console.log("Conversation saved to Firestore with ID:", docRef.id);
      setCurrentConversationId(docRef.id);
      navigate(`/conversation/${docRef.id}`);
      alert("Conversation saved successfully!");
    } catch (error) {
      console.error("Error saving conversation to Firestore:", error);
      alert("Failed to save conversation. Please try again.");
    }
  };

  const handleShareConversation = async () => {
    if (!user) {
      alert("You must be logged in to share a conversation.");
      return;
    }

    if (currentConversationId === "new-conversation") {
      alert("Please save the conversation before sharing.");
      return;
    }

    try {
      const conversationRef = doc(db, "conversations", currentConversationId);
      await updateDoc(conversationRef, {
        shared: true,
      });
      console.log("Conversation marked as shared in Firestore");

      const shareableLink = `${window.location.origin}/conversation/${currentConversationId}`;
      await navigator.clipboard.writeText(shareableLink);
      alert(`Shareable link copied to clipboard: ${shareableLink}`);
    } catch (error) {
      console.error("Error sharing conversation:", error);
      alert("Failed to share conversation. Please try again.");
    }
  };

  console.log("Rendering Dashboard, passing sessionId to TranscriptDisplay:", sessionId);

  return (
    <div className="dashboard">
      <ErrorBoundary>
        <Sidebar
          user={user}
          onNewConversation={startNewConversation}
          currentConversationId={currentConversationId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </ErrorBoundary>

      <div className={`main-content ${isSidebarOpen ? "expanded" : ""}`}>
        <ConversationHeader
          onMenuClick={toggleSidebar}
          onSave={handleSaveConversation}
          onShare={handleShareConversation}
          isReadOnly={isReadOnly}
        />

        <main className="transcript-container">
          <h2>{title}</h2>
          <Routes>
            <Route
              path="/"
              element={
                <TranscriptDisplay
                  transcript={transcript}
                  isLoading={isLoading}
                  conversation={conversation}
                  sessionId={sessionId}
                  onResponseComplete={handleResponseComplete}
                />
              }
            />
            <Route
              path="/conversation/:conversationId"
              element={
                <TranscriptDisplay
                  transcript={transcript}
                  isLoading={isLoading}
                  conversation={conversation}
                  sessionId={sessionId}
                  onResponseComplete={handleResponseComplete}
                />
              }
            />
          </Routes>
        </main>

        {!isReadOnly && (
          <div className="microphone-container">
            <MicrophoneButton isListening={isListening} onClick={toggleListening} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;