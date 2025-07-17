# 🎬 YouTube Clone

A full stack YouTube-inspired web application built with **React**, **Node.js**, and **MongoDB**. Users can upload, watch, and manage videos while interacting through likes, comments, and subscriptions.

## 🚀 Features

### 🔐 Authentication
- User sign up and sign in
- Remember me functionality

### 📹 Video Management
- Upload videos via drag and drop or file browser
- Show upload progress bar
- Edit video details: title, author, description, status
- List all uploaded videos
- Video analytics: total views, monthly views, top videos

### ▶️ Video Playback
- View video info: title, author, views, date, description
- Playback controls
- Like and dislike functionality
- Add to playlists or Watch Later
- Share via WhatsApp
- Commenting system with likes, dislikes, replies
- Report inappropriate content

### 📺 Channel Management
- Create and manage personal channels
- List channel videos and playlists
- Feature selected videos

### 📂 Menu Navigation
- Home, Subscriptions, History, Playlists, Your Videos, Watch Later
- Quick access to user profile

### ⚙️ Admin Backend
- Suspend user accounts
- View all users
- Remove reported videos

## 🛠️ Tech Stack

- **Frontend:** React, HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/youssefbenkhalifa/youtube-clone
cd youtube-clone
```

2. Install server dependencies:

```bash
cd backend
npm install
```


3. Create environment variables:

Set up a `.env` file in the server directory with the following:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Run the app:

```bash
# In server/
npm start

# In client/
npm start
```

## 📄 License

This project is made as part of CMPS278 – Web Design & Programming at the American University of Beirut.
