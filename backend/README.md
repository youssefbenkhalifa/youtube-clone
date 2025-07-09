# MongoDB Atlas Connection Fix

## The Problem
You're getting this error because your current IP address is not whitelisted in MongoDB Atlas:
```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster
```

## How to Fix This

### Option 1: Whitelist Your Current IP (Recommended)

1. **Go to MongoDB Atlas**: Visit [https://cloud.mongodb.com](https://cloud.mongodb.com)

2. **Login** to your MongoDB Atlas account

3. **Select your project** and cluster

4. **Navigate to Network Access**:
   - Click on "Network Access" in the left sidebar menu
   - This is where you manage IP addresses that can connect to your cluster

5. **Add Your Current IP**:
   - Click the "ADD IP ADDRESS" button
   - Click "ADD CURRENT IP ADDRESS" (this automatically detects and adds your current IP)
   - Click "Confirm"

6. **Wait for the change to take effect** (usually takes 1-2 minutes)

### Option 2: Allow Access from Anywhere (Only for Development)

⚠️ **Warning**: This is less secure but easier for development

1. In "Network Access", click "ADD IP ADDRESS"
2. Click "ALLOW ACCESS FROM ANYWHERE" 
3. This adds `0.0.0.0/0` which allows all IP addresses
4. Click "Confirm"

### Option 3: Check Your Connection String

Make sure your connection string in `.env` is correct:
```
MONGO_URI=mongodb+srv://youtube:youtube123@cluster0.te9keot.mongodb.net/youtube-clone?retryWrites=true&w=majority&appName=Cluster0
```

Verify:
- Username: `youtube`
- Password: `youtube123` 
- Cluster: `cluster0.te9keot.mongodb.net`
- Database: `youtube-clone`

## Test the Fix

After whitelisting your IP, restart your server:
```bash
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

## Common Issues

1. **Still getting connection errors?**
   - Wait 2-3 minutes after adding IP address
   - Check if your internet IP changed (if using dynamic IP)
   - Verify username/password in connection string

2. **IP keeps changing?**
   - If you have a dynamic IP, you may need to re-add it periodically
   - Consider using "Allow access from anywhere" for development

3. **Cluster paused?**
   - Free tier clusters auto-pause after inactivity
   - Go to your cluster and click "Resume" if it's paused

## Next Steps

Once connected, your server will be able to:
- Store and retrieve user data
- Save video information
- Handle authentication
- Manage playlists and comments
