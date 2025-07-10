import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './login.css'; // ✅ Reuse the same styling file

export default function Signup({ setUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.msg || 'Signup failed');

      // Auto-login after successful signup and store token
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('rememberMe', 'true'); // Auto-remember on signup
      }
      
      setUser(data.user);
      navigate('/'); // Navigate to home page
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <img src="/images/youtube-logo.png" alt="YouTube" className="auth-logo" />
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Already have an account?{' '}
        <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
