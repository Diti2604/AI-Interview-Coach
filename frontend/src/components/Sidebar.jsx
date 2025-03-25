// src/components/Sidebar.jsx
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import "../styles/Sidebar.css";
import { db } from "../../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

// Debug: Log the db instance
console.log("Imported db in Sidebar.jsx:", db);

// Utility function to format time difference
const formatTimeDifference = (timestamp) => {
  if (!timestamp) return "Just now"; // Handle cases where timestamp might be undefined/null

  // If timestamp is a Firestore Timestamp, convert to JavaScript Date
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString(); // Fallback to full date for older times
};

function Sidebar({
  user,
  onNewConversation,
  currentConversationId,
  isOpen,
  onClose,
  onLogout,
}) {
  const [conversations, setConversations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInterviewTitle, setNewInterviewTitle] = useState("");
  const navigate = useNavigate();

  // Fetch conversations from Firestore
  useEffect(() => {
    console.log("Sidebar useEffect triggered, user:", user);
    if (!user) {
      console.log("No user, skipping Firestore query");
      setConversations([]);
      return;
    }

    console.log("Fetching conversations for user.uid:", user.uid);
    const q = query(
      collection(db, "conversations"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Firestore snapshot received:", snapshot);
        console.log("Snapshot docs:", snapshot.docs);
        const fetchedConversations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Mapped conversations:", fetchedConversations);
        setConversations(fetchedConversations);
        console.log("Updated conversations:", fetchedConversations);
      },
      (error) => {
        console.error("Error fetching conversations:", error);
      }
    );

    return () => {
      console.log("Cleaning up Firestore listener");
      unsubscribe();
    };
  }, [user]);

  // Update the time display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setConversations((prev) => [...prev]); // Trigger re-render by creating a new array
    }, 60000); // Update every minute
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleNewInterviewClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewInterviewTitle("");
  };

  const handleCreateInterview = () => {
    if (newInterviewTitle.trim()) {
      // Instead of adding to state, call onNewConversation to start a new conversation
      onNewConversation(newInterviewTitle);
      setIsModalOpen(false);
      setNewInterviewTitle("");
    }
  };

  const handleConversationClick = (conversationId) => {
    navigate(`/conversation/${conversationId}`);
    onClose();
  };

  const handleLogoutClick = () => {
    onLogout();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Button
            onClick={handleNewInterviewClick}
            className="new-interview-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            New Interview
          </Button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-group">
            <h3 className="sidebar-group-label">Recent Interviews</h3>
            <div className="sidebar-group-content">
              <ul className="sidebar-menu">
                {conversations.map((conversation) => (
                  <li key={conversation.id} className="sidebar-menu-item">
                    <button
                      onClick={() => handleConversationClick(conversation.id)}
                      className={`sidebar-menu-button ${
                        currentConversationId === conversation.id
                          ? "active"
                          : ""
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="icon"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <div className="conversation-info">
                        <span className="conversation-title">
                          {conversation.title}
                        </span>
                        <span className="conversation-date">
                          {formatTimeDifference(conversation.timestamp)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
                {conversations.length === 0 && (
                  <div className="empty-state">No previous interviews</div>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name">{user?.displayName || "User"}</span>
              <span className="user-email">{user?.email || "user@example.com"}</span>
            </div>
            <button className="sign-out-btn" onClick={handleLogoutClick}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Modal for creating new interview */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Interview</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={newInterviewTitle}
                onChange={(e) => setNewInterviewTitle(e.target.value)}
                placeholder="Enter interview title"
                className="modal-input"
              />
            </div>
            <div className="modal-actions">
              <Button
                onClick={handleCreateInterview}
                className="modal-create-btn"
              >
                Create Interview
              </Button>
              <Button onClick={handleCloseModal} className="modal-cancel-btn">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;