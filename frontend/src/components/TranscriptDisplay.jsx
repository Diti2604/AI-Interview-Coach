import React from "react";
import "../styles/TranscriptDisplay.css";

function TranscriptDisplay({ transcript, aiResponse, isLoading, conversation }) {
  return (
    <div className="transcript-display">
      {conversation.length > 0 ? (
        <div className="conversation-history">
          {conversation.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
        </div>
      ) : null}

      {isLoading && !aiResponse && (
        <div className="message assistant loading">
          <div className="loading-indicator">Processing</div>
        </div>
      )}

      {!transcript && !aiResponse && !isLoading && (
        <div className="empty-state">
          <p>Press the microphone button and start speaking to begin.</p>
        </div>
      )}

      {/* Hide the unstyled AI response */}
      {aiResponse && !isLoading && (
        <div className="ai-response">
          <div
            className="ai-response-content"
            dangerouslySetInnerHTML={{ __html: aiResponse }} // Render HTML content
          />
        </div>
      )}

      {/* Optionally, you can hide the raw unstyled version by using a conditional check */}
      {/* <div className="unstyled-ai-response" style={{ display: 'none' }}>
        {aiResponse && !isLoading && <p>{aiResponse}</p>}
      </div> */}
    </div>
  );
}

export default TranscriptDisplay;
