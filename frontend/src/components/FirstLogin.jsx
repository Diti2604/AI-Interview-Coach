"use client"

import { useState } from "react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import Card from "./ui/Card"
import Tabs from "./ui/Tabs"
import "../styles/Login.css"

function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("login")

  // eslint-disable-next-line no-unused-vars
  const handleSubmit = async (e, isSignUp = false) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simulate Firebase authentication
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock successful login
      onLogin({ email, name: email.split("@")[0] })
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="logo-icon"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
              <div className="logo-pulse"></div>
            </div>
          </div>
          <h1 className="login-title">AI Interview Coach</h1>
          <p className="login-description">Practice interviews with AI-powered feedback</p>
        </div>

        <Tabs
          tabs={[
            { id: "login", label: "Login" },
            { id: "signup", label: "Sign Up" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="tab-content">
          {activeTab === "login" && (
            <form onSubmit={(e) => handleSubmit(e, false)}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <div className="password-header">
                  <label htmlFor="password">Password</label>
                  <button type="button" className="forgot-password">
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <Button className="login-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="loader"></span>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          )}

          {activeTab === "signup" && (
            <form onSubmit={(e) => handleSubmit(e, true)}>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <Input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <Input id="confirm-password" type="password" required />
              </div>
              {error && <p className="error-message">{error}</p>}
              <Button className="login-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="loader"></span>
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  )
}

export default Login

