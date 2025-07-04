import React, { useState } from 'react';

export default function Login({ onLoginSuccess, onSwitchToSignup }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      setMessage('❌ Something went wrong.');
    }
  };

  return (
    <div style={styles.container}>
      <img src="/images/youtube-logo.png" alt="YouTube" style={styles.logo} />
      <h2 style={styles.title}>Sign in to YouTube</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} required />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={handleChange} required />
        <button type="submit">Log In</button>
      </form>
      <p style={styles.message}>{message}</p>
      <p>
        Don't have an account?{' '}
        <button onClick={onSwitchToSignup} style={styles.linkButton}>Sign Up</button>
      </p>
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    maxWidth: '400px',
    margin: '60px auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontFamily: 'Roboto, sans-serif',
    textAlign: 'center'
  },
  logo: {
    height: '40px',
    marginBottom: '20px'
  },
  title: {
    fontWeight: '500',
    marginBottom: '20px',
    fontSize: '18px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  message: {
    color: '#444',
    minHeight: '24px'
  },
  linkButton: {
    border: 'none',
    background: 'none',
    color: '#065fd4',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px'
  }
};
    