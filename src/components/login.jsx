import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './login.css';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // First try admin authentication if using admin credentials
      if (email === 'admin@youtube-clone.com' || email === 'admin') {
        try {
          const adminRes = await fetch('http://localhost:5000/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              username: email === 'admin@youtube-clone.com' ? 'admin' : email, 
              password 
            }),
          });
          
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            
            // Store admin token
            if (remember) {
              localStorage.setItem('adminToken', adminData.token);
              localStorage.setItem('adminRememberMe', 'true');
            } else {
              sessionStorage.setItem('adminToken', adminData.token);
              localStorage.removeItem('adminRememberMe');
            }
            
            // Redirect to admin dashboard
            navigate('/admin/dashboard');
            return;
          }
        } catch (adminError) {
          // If admin login fails, continue to regular user login
          console.log('Admin login failed, trying user login');
        }
      }

      // Regular user authentication
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.msg || 'Login failed');

      // Store token based on remember me preference
      if (remember) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('token', data.token);
        localStorage.removeItem('rememberMe');
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
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email or Username"
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

        <label>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember Me
        </label>

        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      
  
      
      <p>
        Don't have an account?{' '}
        <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
}
