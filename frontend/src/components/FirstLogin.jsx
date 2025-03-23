import { useState, useEffect } from "react";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";
import Tabs from "./ui/Tabs";
import "../styles/Login.css";

const firebaseConfig = {
  apiKey: "AIzaSyBWerBaKWPSFPex7tVscg2Ijy38XKza2cI",
  authDomain: "ai-interview-coach-4f0cb.firebaseapp.com",
  projectId: "ai-interview-coach-4f0cb",
  storageBucket: "ai-interview-coach-4f0cb.firebasestorage.app",
  messagingSenderId: "754323174961",
  appId: "1:754323174961:web:7daf3d719329eac30d0710",
  measurementId: "G-E52FB8JN4N",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  // Handle Google Login
  const handleGoogleLogin = () => {
    setIsLoading(true);
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log("Google login successful:", user);

        // Save user data to localStorage
        localStorage.setItem("user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }));

        // Call the onLogin function passed as a prop to update the parent component's state
        onLogin({ email: user.email, name: user.displayName });

        // Redirect to the initial path after login
        window.location.href = '/dashboard';
      })
      .catch((error) => {
        console.error("Error during Google login:", error.message);
        setError("Login failed: " + error.message);
        setIsLoading(false);
      });
  };

  // Handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Sign in with email and password using Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save user data to localStorage
      localStorage.setItem("user", JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split("@")[0],
      }));
      
      // Call the onLogin function passed as a prop
      onLogin({ 
        email: user.email, 
        name: user.displayName || email.split("@")[0] 
      });
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Login failed. Please check your credentials.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email/password signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
  
    // Validate password and confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }
  
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Signup successful:", user);
  
      // Save user data to localStorage
      localStorage.setItem("user", JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split("@")[0],
      }));
  
      // Call the onLogin function passed as a prop
      onLogin({ 
        email: user.email, 
        name: user.displayName || email.split("@")[0] 
      });
  
      // Reset fields after successful sign-up
      setEmail("");
      setPassword("");
      setConfirmPassword("");
  
      // Redirect to the dashboard after successful signup
      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Signup error:", err);
      let errorMessage = "Signup failed. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use at least 6 characters.";
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/password accounts are not enabled in Firebase.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for changes in authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user);
        localStorage.setItem("user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
        }));
      }
    });

    return () => unsubscribe();
  }, []);

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
            <form onSubmit={handleLogin}>
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
              <Button type="submit" className="login-button" disabled={isLoading}>
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
            <form onSubmit={handleSignup}>
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
                  placeholder="At least 6 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="Re-enter your password"
                  required 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <Button type="submit" className="login-button" disabled={isLoading}>
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

        <div className="divider">
          <span>OR</span>
        </div>

        {/* Google Login Button - Now at the bottom */}
        <Button onClick={handleGoogleLogin} disabled={isLoading} className="google-login-button">
          <div className="google-button-content">
            <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Continue with Google</span>
          </div>
        </Button>
      </Card>
    </div>
  );
}

export default Login;