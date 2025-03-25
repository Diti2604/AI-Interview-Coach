// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/FirstLogin";
import Dashboard from "./components/Dashboard";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("onAuthStateChanged triggered, currentUser:", currentUser);
      setUser(currentUser);
      if (currentUser) {
        console.log("User UID:", currentUser.uid);
      } else {
        console.log("No user authenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      console.log("User signed out in App.jsx");
      setUser(null);
    });
  };

  // eslint-disable-next-line no-unused-vars
  const checkIfShared = async (conversationId) => {
    console.log("Checking if conversation is shared, conversationId:", conversationId);
    const docRef = doc(db, "conversations", conversationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().shared) {
      console.log("Conversation is shared:", docSnap.data());
      return docSnap.data();
    }
    console.log("Conversation not shared or does not exist");
    return null;
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="*"
          element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/conversation/:conversationId"
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Dashboard
                user={null}
                onLogout={() => {}}
                isReadOnly={true}
              />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;