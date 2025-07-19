// Mock trending videos for demonstration
// This shows what the trending page will display once database is connected

const mockTrendingVideos = [
  {
    _id: "mock1",
    title: "Top 10 JavaScript Tips That Will Blow Your Mind",
    description: "Learn these amazing JavaScript tips and tricks that every developer should know!",
    thumbnail: "/images/thumbnail.jpg",
    views: 125000,
    duration: "12:45",
    createdAt: "2025-07-18T10:00:00Z",
    uploader: {
      username: "techguru",
      channel: {
        name: "Tech Guru",
        avatar: "/images/user.jpg"
      }
    }
  },
  {
    _id: "mock2", 
    title: "React vs Vue vs Angular - Complete Comparison 2025",
    description: "Comprehensive comparison of the top frontend frameworks in 2025",
    thumbnail: "/images/thumbnail.jpg",
    views: 98000,
    duration: "18:32",
    createdAt: "2025-07-17T14:30:00Z",
    uploader: {
      username: "codereview",
      channel: {
        name: "Code Review",
        avatar: "/images/user.jpg"
      }
    }
  },
  {
    _id: "mock3",
    title: "Building a Full Stack App in 2025 - Complete Guide",
    description: "Learn how to build modern full stack applications with the latest technologies",
    thumbnail: "/images/thumbnail.jpg", 
    views: 87500,
    duration: "25:15",
    createdAt: "2025-07-16T09:15:00Z",
    uploader: {
      username: "fullstackdev",
      channel: {
        name: "Full Stack Developer",
        avatar: "/images/user.jpg"
      }
    }
  }
];

console.log('📈 Mock trending videos data:');
console.log('This is what the trending page will show once MongoDB is connected:');
mockTrendingVideos.forEach((video, index) => {
  console.log(`${index + 1}. ${video.title}`);
  console.log(`   Views: ${video.views.toLocaleString()}`);
  console.log(`   Channel: ${video.uploader.channel.name}`);
  console.log(`   Duration: ${video.duration}`);
  console.log('');
});

console.log('🔧 To enable real trending videos:');
console.log('1. Install MongoDB');
console.log('2. Start MongoDB service');  
console.log('3. Upload some videos');
console.log('4. The trending page will automatically show videos sorted by view count');
