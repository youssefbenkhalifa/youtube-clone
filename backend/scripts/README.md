# Database Seeding Script

This script populates your YouTube clone database with random users, channels, and videos for testing purposes.

## Features

- Creates random users with unique usernames and emails
- Generates channel data for each user (name, handle, description, avatar, etc.)
- Creates multiple videos per user with realistic metadata
- Populates views, likes, subscriber counts with random but realistic numbers
- Supports different seeding sizes (small, default, large)

## Usage

Make sure you're in the backend directory and have your MongoDB connection set up in `.env`.

### Run Default Seeding
Creates 25 users with 8 videos each (200 total videos):
```bash
npm run seed
```

### Run Small Seeding
Creates 10 users with 5 videos each (50 total videos):
```bash
npm run seed:small
```

### Run Large Seeding
Creates 50 users with 15 videos each (750 total videos):
```bash
npm run seed:large
```

### Clear Database Only
Removes all existing users and videos:
```bash
npm run seed:clear
```

### Custom Parameters
You can also run with custom parameters:
```bash
node scripts/seedDatabase.js --users=30 --videos=10
```

## Generated Data

### Users/Channels
- 25 different channel names (TechGuru, CookingMaster, FitnessLife, etc.)
- Realistic channel descriptions
- Random subscriber counts (100 - 1,000,000)
- Random countries and profile data
- Channel handles (@channelname format)

### Videos
- 25 different video titles covering various topics
- Random view counts (0 - 100,000)
- Random likes/dislikes
- Realistic upload dates (last 6 months)
- Various categories (Entertainment, Education, Gaming, etc.)
- Mostly public visibility with some unlisted videos

### Categories
Entertainment, Education, Gaming, Music, Technology, Cooking, Travel, Fashion, Sports, Comedy, Science, Art, Health, Business, Other

## Database Collections

The script populates:
- **users** collection: User accounts with embedded channel data
- **videos** collection: Video metadata linked to user accounts

## Notes

- All users have the password `password123` for testing
- Videos use placeholder file paths and thumbnails
- Real video files are not created - only metadata
- The script clears existing data before seeding
- All data is randomized but realistic for testing purposes

## Example Output

```
🌱 Starting database seeding...
✅ Connected to MongoDB
🧹 Clearing existing data...
✅ Database cleared successfully
Creating 25 random users...
✅ Created 25 users successfully
Creating 8 videos per user...
✅ Created 200 videos successfully
✅ Updated user video counts and total views
🎉 Database seeding completed successfully!
📊 Summary:
   - Users created: 25
   - Videos created: 200
   - Channels created: 25
📴 Database connection closed
```
