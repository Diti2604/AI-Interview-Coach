import React, { useEffect, useRef } from "react";
import "../styles/TranscriptDisplay.css";

function TranscriptDisplay({ transcript, isLoading, conversation, onResponseComplete }) {
  const conversationEndRef = useRef(null);
  const hasFetchedRef = useRef(false); // Track if the API call has been made
  const lastTranscriptRef = useRef(""); // Track the last transcript processed

  // Fetch and stream the response when a new transcript is provided
  useEffect(() => {
    console.log("TranscriptDisplay useEffect triggered with:", { transcript, isLoading, hasFetched: hasFetchedRef.current, lastTranscript: lastTranscriptRef.current });
    if (transcript && !isLoading && !hasFetchedRef.current && transcript !== lastTranscriptRef.current) {
      if (typeof transcript !== "string" || !transcript.trim()) {
        console.error("Invalid transcript value:", transcript);
        onResponseComplete("Error: Invalid transcript value");
        hasFetchedRef.current = false;
        return;
      }
      hasFetchedRef.current = true; // Prevent duplicate API calls
      lastTranscriptRef.current = transcript; // Update the last transcript
      console.log("Fetching response for transcript:", transcript);

      const fetchResponse = async () => {
        try {
          console.log("Making request to /process/ with body:", transcript);
          const response = await fetch("http://127.0.0.1:5000/process/", {
            method: "POST",
            body: transcript,
            headers: { "Content-Type": "text/plain" },
          });

          console.log("Response from /process/:", response);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");

          let fullResponse = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("Streaming complete, final response:", fullResponse);
              onResponseComplete(fullResponse);
              hasFetchedRef.current = false; // Reset for the next transcript
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            console.log("Received chunk:", chunk);
            onResponseComplete(fullResponse);
          }
        } catch (error) {
          console.error("Error fetching response:", error);
          onResponseComplete("Error: Could not fetch response.");
          hasFetchedRef.current = false; // Reset on error
        }
      };

      fetchResponse();
    } else {
      console.log("useEffect conditions not met:", { transcript, isLoading, hasFetched: hasFetchedRef.current, lastTranscript: lastTranscriptRef.current });
    }
  }, [transcript, isLoading, onResponseComplete]);

  // Format the streamed response (handle bold text with ** markers)
  const formatResponse = (text) => {
    if (!text) {
      console.log("No text to format, returning empty");
      return "";
    }

    console.log("Formatting response:", text);
    return text.split("\n").map((paragraph, index) => {
      const cleaned = paragraph.trim();
      if (!cleaned) return null;

      const parts = cleaned.split(/(\*\*.*?\*\*)/);
      const formattedParts = parts.map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          return <strong key={partIndex}>{boldText}</strong>;
        }
        return part;
      });

      return (
        <div key={index} className="response-paragraph">
          {formattedParts}
        </div>
      );
    });
  };

  // Auto-scroll to the bottom
  useEffect(() => {
    console.log("Conversation updated:", conversation);
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  return (
    <div className="transcript-container">
      <div className="transcript-display">
        {conversation.length > 0 ? (
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
        ) : (
          <div className="no-messages">No messages yet. Start speaking to get help!</div>
        )}

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