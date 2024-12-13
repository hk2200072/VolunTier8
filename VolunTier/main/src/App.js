import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import UserDashboard from './components/UserDashboard/UserDashboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    if (token) {
      setIsAuthenticated(true);
      setIsAdmin(adminStatus);
    }
  }, []);

  const handleLogin = (adminStatus) => {
    setIsAuthenticated(true);
    setIsAdmin(adminStatus);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <Router>
      <div className="app">
        {isAuthenticated && (
          <nav className="navbar">
            <h1>VolunTier</h1>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </nav>
        )}
        
        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                isAdmin ? <AdminDashboard /> : <UserDashboard />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
