"use client"

import { useEffect, useRef } from "react"
import "../styles/TranscriptDisplay.css"

function TranscriptDisplay({ transcript, aiResponse, isLoading, conversation }) {
  const containerRef = useRef(null)

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [transcript, aiResponse, conversation])

  return (
    <div ref={containerRef} className="transcript-display">
      {/* Previous conversation messages */}
      {conversation.map((item, index) => (
        <div key={item.id || index} className="conversation-item">
          <div className="user-message">
            <p>{item.user}</p>
          </div>
          <div className="ai-message">
            <p>{item.ai}</p>
          </div>
        </div>
      ))}

      {/* Current user transcript */}
      {transcript && (
        <div className="user-message">
          <p>{transcript}</p>
        </div>
      )}

      {/* AI response with loading state */}
      {(isLoading || aiResponse) && (
        <div className="ai-message">
          {isLoading ? (
            <div className="skeleton-loader">
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
            </div>
          ) : (
            <p>{aiResponse}</p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!transcript && !aiResponse && conversation.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" x2="12" y1="19" y2="22"></line>
            </svg>
          </div>
          <h3>Start Your Interview Practice</h3>
          <p>
            Click the microphone button below to begin. Speak clearly and I'll provide feedback to help you improve your
            interview skills.
          </p>
        </div>
      )}
    </div>
  )
}

export default TranscriptDisplay

