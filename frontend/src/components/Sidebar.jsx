"use client"

import { useState } from "react"
import Button from "./ui/Button"
import "../styles/Sidebar.css"

// Sample conversation history data
const sampleConversations = [
  { id: 1, title: "Software Developer Interview", date: "2 hours ago" },
  { id: 2, title: "Product Manager Role", date: "Yesterday" },
  { id: 3, title: "Data Scientist Position", date: "3 days ago" },
]

function Sidebar({ user, onNewConversation, currentConversationId, isOpen, onClose }) {
  // eslint-disable-next-line no-unused-vars
  const [conversations, setConversations] = useState(sampleConversations)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Button onClick={onNewConversation} className="new-interview-button">
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
                      className={`sidebar-menu-button ${currentConversationId === conversation.id ? "active" : ""}`}
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
                        <span className="conversation-title">{conversation.title}</span>
                        <span className="conversation-date">{conversation.date}</span>
                      </div>
                    </button>
                  </li>
                ))}

                {conversations.length === 0 && <div className="empty-state">No previous interviews</div>}
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
              <span className="user-email">{user?.email || "user@example.com"}</span>
            </div>
            <button className="logout-button">
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
    </>
  )
}

export default Sidebar

