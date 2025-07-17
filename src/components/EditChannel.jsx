import React, { useState, useEffect } from 'react';

export default function EditChannel({ user, onUpdate }) {
  const [channel, setChannel] = useState({
    name: '',
    handle: '',
    avatarFile: null,
    description: '',
  });

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.channel) {
      setChannel((prev) => ({
        ...prev,
        name: user.channel.name || '',
        handle: user.channel.handle || '',
        description: user.channel.description || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setChannel((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setChannel((prev) => ({ ...prev, avatarFile: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('❌ No token found.');
      return;
    }

    const formData = new FormData();
    formData.append('name', channel.name);
    formData.append('handle', channel.handle);
    formData.append('description', channel.description);
    if (channel.avatarFile) {
      formData.append('avatar', channel.avatarFile);
    }

    try {
      const res = await fetch('http://localhost:5000/api/user/channel', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Channel updated');
        onUpdate(data.user); // ✅ update app state
      } else {
        setMessage(`❌ Failed to update: ${data?.msg || res.status}`);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setMessage('❌ Network error.');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h2>Edit Your Channel</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          name="name"
          placeholder="Channel Name"
          value={channel.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="handle"
          placeholder="Channel Handle (e.g., @myhandle)"
          value={channel.handle}
          onChange={handleChange}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <textarea
          name="description"
          placeholder="Channel Description"
          value={channel.description}
          onChange={handleChange}
          rows={4}
        />
        <button type="submit">Save Changes</button>
      </form>

      {channel.avatarFile && (
        <div style={{ marginTop: '20px' }}>
          <h4>Avatar Preview:</h4>
          <img
            src={URL.createObjectURL(channel.avatarFile)}
            alt="Preview"
            style={{ width: '100px', borderRadius: '8px' }}
          />
        </div>
      )}

      {message && <p style={{ marginTop: '20px' }}>{message}</p>}
    </div>
  );
}
