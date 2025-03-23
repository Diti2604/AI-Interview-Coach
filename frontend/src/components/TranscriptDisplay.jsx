import React, { useEffect, useState, useRef } from "react";
import "../styles/TranscriptDisplay.css";

function TranscriptDisplay({ transcript, isLoading, conversation }) {
  const [displayedResponse, setDisplayedResponse] = useState("");
  const conversationEndRef = useRef(null);

  // Fetch and stream the response when a new transcript is provided
  useEffect(() => {
    if (transcript && !isLoading) {
      setDisplayedResponse(""); // Reset response
      const fetchResponse = async () => {
        const response = await fetch("http://localhost:5000/process/", {
          method: "POST",
          body: transcript,
          headers: { "Content-Type": "text/plain" },
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setDisplayedResponse((prev) => prev + chunk);
        }
      };

      fetchResponse();
    }
  }, [transcript, isLoading]);

  // Format the streamed response (handle <p> tags)
  const formatResponse = (text) => {
    if (!text) return "";
    // Split by </p> to separate paragraphs, filter out empty chunks
    return text.split("</p>").map((paragraph, index) => {
      const cleaned = paragraph.replace("<p>", "").trim();
      if (cleaned) {
        return (
          <div key={index} className="response-paragraph">
            {cleaned}
          </div>
        );
      }
      return null;
    });
  };

  // Auto-scroll to the bottom
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedResponse, conversation]);

  return (
    <div className="transcript-container">
      <div className="transcript-display">
        {/* Display conversation history */}
        {conversation.length > 0 && (
          <div className="conversation-history">
            {conversation.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.role === "assistant"
                    ? formatResponse(message.content)
                    : message.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show user's latest input */}
        {transcript && !isLoading && (
          <div className="message user">
            <div className="message-content">{transcript}</div>
          </div>
        )}

        {/* Show streamed AI response */}
        {displayedResponse && !isLoading && (
          <div className="message assistant typing-message">
            <div className="message-content">{formatResponse(displayedResponse)}</div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="message assistant loading">
            <div className="loading-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        <div ref={conversationEndRef} />
      </div>
    </div>
  );
}

export default TranscriptDisplay;