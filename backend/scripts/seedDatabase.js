const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Video = require('../models/Video');
require('dotenv').config();

// Sample data arrays
const channelNames = [
  'TechGuru', 'CookingMaster', 'FitnessLife', 'GameZone', 'MusicVibes',
  'ArtStudio', 'ScienceHub', 'TravelWorld', 'BookwormCorner', 'MovieReviews',
  'DIYCrafts', 'PetLover', 'GardenLife', 'FashionTrends', 'SportsCentral',
  'HealthyLiving', 'CodeAcademy', 'PhotoPro', 'DanceFever', 'ComedyClub',
  'NatureExplorer', 'BusinessInsights', 'MindfulMoments', 'RetroGaming', 'AstronomyGeek'
];

const videoTitles = [
  'Amazing Life Hacks You Need to Know',
  'Top 10 Programming Tips for Beginners',
  'Delicious 15-Minute Dinner Recipes',
  'Epic Gaming Moments Compilation',
  'Beautiful Sunset Timelapse in 4K',
  'How to Start Your Own Business',
  'Relaxing Music for Study and Work',
  'Incredible Wildlife Documentary',
  'Fashion Trends for This Season',
  'DIY Home Decoration Ideas',
  'Funny Cat Videos Compilation',
  'Best Travel Destinations 2025',
  'Workout Routine for Beginners',
  'Art Techniques Every Artist Should Know',
  'Science Experiments You Can Do at Home',
  'Photography Tips for Stunning Photos',
  'Cooking Challenge: Mystery Ingredients',
  'Gaming Review: Latest AAA Release',
  'Meditation Guide for Better Sleep',
  'Tech News and Product Reviews',
  'Dance Tutorial: Learn in 10 Minutes',
  'Book Recommendations for This Month',
  'Movie Analysis: Hidden Meanings',
  'Gardening Tips for Small Spaces',
  'Fitness Transformation Journey'
];

const descriptions = [
  'Welcome to my channel! Hope you enjoy this content.',
  'Don\'t forget to like and subscribe for more awesome videos!',
  'This video took me weeks to create. Let me know what you think!',
  'Thanks for watching! Your support means everything to me.',
  'New videos every week. Ring the bell for notifications!',
  'I love creating content for you all. Comments make my day!',
  'Share this video with friends who might enjoy it too!',
  'What should I make next? Drop suggestions in the comments!',
  'Follow me on social media for behind-the-scenes content!',
  'This is my passion project. Hope it inspires you!'
];

const categories = [
  'Entertainment', 'Education', 'Gaming', 'Music', 'Technology',
  'Cooking', 'Travel', 'Fashion', 'Sports', 'Comedy',
  'Science', 'Art', 'Health', 'Business', 'Other'
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Japan', 'South Korea', 'Brazil', 'India',
  'Netherlands', 'Sweden', 'Norway', 'Spain', 'Italy'
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomEmail(username) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  return `${username.toLowerCase()}@${getRandomElement(domains)}`;
}

function generateRandomDate(daysAgo = 365) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - (Math.random() * daysAgo * 24 * 60 * 60 * 1000));
  return pastDate;
}

function generateChannelAvatar() {
  // Using Picsum Photos for random channel avatars
  return `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 10000)}`;
}

function generateThumbnailPath() {
  // Using Picsum Photos for random thumbnails
  return `https://picsum.photos/500/300?random=${Math.floor(Math.random() * 10000)}`;
}

function generateVideoDuration() {
  const minutes = getRandomNumber(1, 60);
  const seconds = getRandomNumber(0, 59);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function createRandomUsers(count = 25) {
  console.log(`Creating ${count} random users...`);
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const channelName = channelNames[i];
    const username = channelName.toLowerCase().replace(/\s+/g, '');
    const handle = username;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const userData = {
      username: username,
      email: generateRandomEmail(username),
      password: hashedPassword,
      firstName: `User${i + 1}`,
      lastName: 'Test',
      dateOfBirth: new Date('1990-01-01'),
      gender: getRandomElement(['male', 'female', 'other']),
      country: getRandomElement(countries),
      profilePicture: generateChannelAvatar(),
      phoneNumber: `+1234567${String(i).padStart(3, '0')}`,
      channel: {
        name: channelName,
        handle: `@${handle}`,
        description: `Welcome to ${channelName}! ${getRandomElement(descriptions)}`,
        avatar: generateChannelAvatar(),
        banner: 'https://picsum.photos/1920/1080?random=' + Math.floor(Math.random() * 10000),
        subscriberCount: getRandomNumber(100, 1000000),
        videoCount: 0, // Will be updated after creating videos
        totalViews: 0, // Will be updated after creating videos
        category: getRandomElement(categories),
        isActive: true
      },
      subscriptions: [],
      subscribers: []
    };
    
    users.push(userData);
  }
  
  try {
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users successfully`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    return [];
  }
}

async function createRandomVideos(users, videosPerUser = 5) {
  console.log(`Creating ${videosPerUser} videos per user...`);
  const videos = [];
  
  for (const user of users) {
    for (let i = 0; i < videosPerUser; i++) {
      const filename = `video-${Date.now()}-${Math.floor(Math.random() * 1000000)}.mp4`;
      const videoData = {
        title: getRandomElement(videoTitles),
        description: getRandomElement(descriptions),
        filename: filename,
        originalName: `${getRandomElement(videoTitles).replace(/[^a-zA-Z0-9]/g, '_')}.mp4`,
        filePath: `/uploads/videos/${filename}`,
        fileSize: getRandomNumber(50000000, 500000000), // 50MB to 500MB
        mimeType: 'video/mp4',
        uploader: user._id,
        thumbnail: generateThumbnailPath(),
        duration: generateVideoDuration(),
        views: getRandomNumber(0, 100000),
        likes: getRandomNumber(0, 10000),
        dislikes: getRandomNumber(0, 1000),
        visibility: getRandomElement(['public', 'public', 'public', 'unlisted']), // Mostly public
        category: getRandomElement(categories),
        tags: [getRandomElement(categories), getRandomElement(['trending', 'new', 'popular'])],
        processingStatus: 'ready',
        createdAt: generateRandomDate(180), // Videos from last 6 months
        likedUsers: [],
        dislikedUsers: []
      };
      
      videos.push(videoData);
    }
  }
  
  try {
    const createdVideos = await Video.insertMany(videos);
    console.log(`✅ Created ${createdVideos.length} videos successfully`);
    
    // Update user video counts and total views
    for (const user of users) {
      const userVideos = createdVideos.filter(video => 
        video.uploader.toString() === user._id.toString()
      );
      
      const totalViews = userVideos.reduce((sum, video) => sum + video.views, 0);
      
      await User.findByIdAndUpdate(user._id, {
        'channel.videoCount': userVideos.length,
        'channel.totalViews': totalViews
      });
    }
    
    console.log('✅ Updated user video counts and total views');
    return createdVideos;
  } catch (error) {
    console.error('❌ Error creating videos:', error);
    return [];
  }
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  try {
    await User.deleteMany({});
    await Video.deleteMany({});
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
}

async function seedDatabase(customUserCount = 25, customVideosPerUser = 8) {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await clearDatabase();
    
    // Create users with channels
    const users = await createRandomUsers(customUserCount);
    
    if (users.length > 0) {
      // Create videos for each user
      await createRandomVideos(users, customVideosPerUser);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users created: ${users.length}`);
    console.log(`   - Videos created: ${users.length * customVideosPerUser}`);
    console.log(`   - Channels created: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
    process.exit(0);
  }
}

// Add command line options
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear-only');
const userCount = parseInt(args.find(arg => arg.startsWith('--users='))?.split('=')[1]) || 25;
const videosPerUser = parseInt(args.find(arg => arg.startsWith('--videos='))?.split('=')[1]) || 8;

if (shouldClear) {
  // Only clear database
  mongoose.connect(process.env.MONGO_URI)
    .then(clearDatabase)
    .then(() => {
      console.log('Database cleared only');
      process.exit(0);
    })
    .catch(console.error);
} else {
  // Run full seeding with custom parameters
  seedDatabase(userCount, videosPerUser);
}

module.exports = { seedDatabase, clearDatabase, createRandomUsers, createRandomVideos };
