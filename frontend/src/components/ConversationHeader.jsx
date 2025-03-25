// src/components/ConversationHeader.jsx
import React from "react";
import "../styles/ConversationHeader.css";

function ConversationHeader({ onMenuClick, onSave, onShare, isReadOnly }) {
  return (
    <header className="conversation-header">
      <button onClick={onMenuClick} className="menu-button">
        ☰
      </button>
      <h1>Interview Practice</h1>
      {!isReadOnly && (
        <div className="header-buttons">
          <button onClick={onSave} className="save-button">
            Save
          </button>
          <button onClick={onShare} className="share-button">
            Share
          </button>
        </div>
      )}
    </header>
  );
}

export default ConversationHeader;