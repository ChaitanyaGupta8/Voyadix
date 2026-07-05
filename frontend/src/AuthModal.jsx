import React, { useState } from 'react';
import './Plan.css'; // Reusing your existing styles

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function AuthModal({ initialMode, onClose, onLoginSuccess }) {
  // Use initialMode to determine if e.g. initialMode === 'login'
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      let response;
      if (isLogin) {
        // OAuth2 expects form data for login
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });
      } else {
        // Registration expects JSON
        response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isLogin) {
        // Save the JWT token to local storage so the user stays logged in
        localStorage.setItem('voyadix_token', data.access_token);
        onLoginSuccess(); // Tell App.jsx the user is logged in
      } else {
        // If they just registered, automatically switch to login screen
        setIsLogin(true);
        setError('Account created! Please log in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>✕</button>
        <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>
          {isLogin ? 'Welcome back.' : 'Join Voyadix.'}
        </h2>
        
        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" className="search-submit-btn" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '13px', color: '#666', textAlign: 'center' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            style={{ color: '#0D9488', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}

// Inline styles for the modal overlay
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalStyle = {
  backgroundColor: '#fff', padding: '40px', borderRadius: '20px',
  width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
};
const closeButtonStyle = {
  position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888'
};
const inputStyle = {
  padding: '12px 15px', borderRadius: '10px', border: '1px solid #EAEAEA', fontSize: '15px', outline: 'none'
};
const errorStyle = {
  backgroundColor: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', textAlign: 'center'
};