import React, { useEffect, useRef, useState } from "react"; // Add useState
import "../styles/TranscriptDisplay.css";

function TranscriptDisplay({ transcript, isLoading, conversation, sessionId, onResponseComplete }) {
  console.log("TranscriptDisplay.jsx loaded");

  const conversationEndRef = useRef(null);
  const hasFetchedRef = useRef(false);
  const lastTranscriptRef = useRef("");
  const [partialResponse, setPartialResponse] = useState(""); // Add state for streaming response

  console.log("TranscriptDisplay rendered with props:", { transcript, isLoading, conversation, sessionId });

  useEffect(() => {
    console.log("TranscriptDisplay useEffect triggered with:", { transcript, isLoading, hasFetched: hasFetchedRef.current, lastTranscript: lastTranscriptRef.current, sessionId });
    if (transcript && !isLoading && !hasFetchedRef.current && transcript !== lastTranscriptRef.current) {
      if (typeof transcript !== "string" || !transcript.trim()) {
        console.error("Invalid transcript value:", transcript);
        onResponseComplete("Error: Invalid transcript value", sessionId);
        hasFetchedRef.current = false;
        return;
      }
      hasFetchedRef.current = true;
      lastTranscriptRef.current = transcript;
      console.log("Fetching response for transcript:", transcript, "with sessionId:", sessionId);

      const fetchResponse = async () => {
        try {
          const headers = { "Content-Type": "text/plain" };
          if (sessionId) {
            headers["X-Session-ID"] = sessionId;
            console.log("Sending sessionId in headers:", sessionId);
          } else {
            console.warn("No sessionId provided, sending request without sessionId");
          }
          console.log("Making request to /process/ with body:", transcript, "headers:", headers);
          const response = await fetch("http://127.0.0.1:5000/process/", {
            method: "POST",
            body: transcript,
            headers: headers,
          });

          console.log("Response from /process/:", response);
          console.log("Response headers:", [...response.headers.entries()]);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const newSessionId = response.headers.get("X-Session-ID");
          console.log("Received session ID from response:", newSessionId);

          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");

          let fullResponse = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("Streaming complete, final response:", fullResponse);
              setPartialResponse(""); // Clear partial response
              onResponseComplete(fullResponse, newSessionId);
              hasFetchedRef.current = false;
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            setPartialResponse(fullResponse); // Update partial response for display
            console.log("Received chunk:", chunk);
          }
        } catch (error) {
          console.error("Error fetching response:", error);
          setPartialResponse(""); // Clear partial response on error
          onResponseComplete("Error: Could not fetch response.", sessionId);
          hasFetchedRef.current = false;
        }
      };

      fetchResponse();
    } else {
      console.log("useEffect conditions not met:", { transcript, isLoading, hasFetched: hasFetchedRef.current, lastTranscript: lastTranscriptRef.current, sessionId });
    }
  }, [transcript, isLoading, sessionId, onResponseComplete]);

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

        {partialResponse && (
          <div className="message assistant streaming">
            <div className="message-content">{formatResponse(partialResponse)}</div>
          </div>
        )}

        {isLoading && !partialResponse && (
          <div className="message assistant loading">
            <div className="loading-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        )}

        <div ref={conversationEndRef} />
      </div>
    </div>
  );
}

export default TranscriptDisplay;