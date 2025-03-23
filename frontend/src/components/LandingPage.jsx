import { Link } from "react-router-dom"
import Button from "./ui/Button"
import "../styles/LandingPage.css"

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
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
          <h1>AI Interview Coach</h1>
        </div>
        <nav className="landing-nav">
          <Link to="/login" className="nav-link">
            Login
          </Link>
        </nav>
      </header>

      <main className="landing-content">
        <div className="hero-section">
          <h2>Master Your Interview Skills with AI</h2>
          <p>Practice interviews, get real-time feedback, and improve your chances of landing your dream job.</p>
          <div className="cta-buttons">
            <Link to="/login">
              <Button className="cta-button">Get Started</Button>
            </Link>
          </div>
        </div>

        <div className="features-section">
          <div className="feature">
            <div className="feature-icon">
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
            <h3>Voice Recognition</h3>
            <p>Practice speaking your answers naturally with our advanced voice recognition technology.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3>AI Feedback</h3>
            <p>Get personalized feedback on your responses from our advanced AI assistant.</p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <h3>Interview History</h3>
            <p>Review your past interviews and track your improvement over time.</p>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2023 AI Interview Coach. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LandingPage

