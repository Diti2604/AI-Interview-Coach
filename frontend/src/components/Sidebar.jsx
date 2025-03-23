"use client";

import { useState, useEffect } from "react";
import Button from "./ui/Button";
import "../styles/Sidebar.css";

// Sample conversation history data with timestamps
const sampleConversations = [
  {
    id: 1,
    title: "Software Developer Interview",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  }, // 2 hours ago
  {
    id: 2,
    title: "Product Manager Role",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  }, // 1 day ago
  {
    id: 3,
    title: "Data Scientist Position",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }, // 3 days ago
];

// Utility function to format time difference
const formatTimeDifference = (timestamp) => {
  const now = new Date();
  const diffMs = now - new Date(timestamp);
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
  // Add more conditions for months, years, etc., if needed
  return timestamp.toLocaleDateString(); // Fallback to full date for older times
};

function Sidebar({
  user,
  currentConversationId,
  isOpen,
  onClose,
  onLogout, // Add onLogout prop here
}) {
  const [conversations, setConversations] = useState(sampleConversations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInterviewTitle, setNewInterviewTitle] = useState("");

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
      const newInterview = {
        id: conversations.length + 1,
        title: newInterviewTitle,
        timestamp: new Date(), // Store the exact creation time
      };
      setConversations([newInterview, ...conversations]);
      setIsModalOpen(false);
      setNewInterviewTitle("");
    }
  };

  const handleLogoutClick = () => {
    onLogout(); // Call the onLogout function passed from the parent
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
              <span className="user-name">{user?.name || "User"}</span>
              <span className="user-email">
                {user?.email || "user@example.com"}
              </span>
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

      {/* Modal for creating new interview (unchanged from previous black-themed version) */}
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
