"use client"

import { useState } from "react"
import Login from "./components/FirstLogin"
import Dashboard from "./components/Dashboard"
import "./styles/App.css"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
  }

  return (
    <main className="app-container">{!isLoggedIn ? <Login onLogin={handleLogin} /> : <Dashboard user={user} />}</main>
  )
}

export default App

