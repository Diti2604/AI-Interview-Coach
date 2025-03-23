"use client"

import "../../styles/ui/Tabs.css"

function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div className={`tabs ${className}`}>
      <div className="tabs-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Tabs

