# Ageless Warrior Lab - Deployment Notes

## Deployment Information

**Live URL:** https://3000-inzvn6u8lz9nnv9vumdkv-0152ea27.manusvm.computer

**Deployment Date:** October 30, 2025

## Changes Made

### YouTube Sync Fix

The YouTube sync functionality has been completely rewritten to work in production environments without requiring API keys.

#### Previous Implementation
- Used Manus Data API (`BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`)
- Only worked in development environments
- Failed in production deployments

#### New Implementation
- Uses YouTube RSS feed (`https://www.youtube.com/feeds/videos.xml?channel_id={channelId}`)
- No API keys required
- Works in all environments
- Fetches up to 15 most recent videos from the channel

#### Files Modified
1. **`server/_core/youtubeSync.ts`** (NEW)
   - Created new YouTube sync module using RSS feed
   - Parses XML to extract video metadata
   - Generates slugs and formatted timestamps
   - Handles HTML entity decoding

2. **`server/_core/dataApi.ts`** (MODIFIED)
   - Updated to use Manus runtime API endpoint
   - Removed dependency on Forge API credentials
   - Note: This file is no longer used for YouTube sync but kept for potential future use

3. **`server/routers.ts`** (MODIFIED)
   - Updated `syncFromYouTube` mutation to use new RSS-based sync
   - Simplified implementation (removed pagination logic)
   - Improved error handling

### Database Configuration

- **Database:** MySQL (local)
- **Database Name:** ageless_warrior_lab
- **Connection:** localhost:3306
- **Tables:** episodes, users, sessions

### Current Status

✅ **Working Features:**
- Homepage with hero image and navigation
- Episodes page with grid layout
- YouTube sync functionality (RSS-based)
- Individual episode pages with embedded YouTube player
- About page with Dave Meyer's biography
- Contact page with contact form
- Responsive design
- All navigation links functional

📊 **Current Data:**
- 15 episodes synced from YouTube
- All episodes include: title, description, thumbnail, views, publish date
- Videos link directly to YouTube for playback

## Technical Stack

- **Frontend:** React, Vite, Tailwind CSS, Wouter (routing)
- **Backend:** Express, tRPC
- **Database:** MySQL with Drizzle ORM
- **Build:** pnpm
- **Runtime:** Node.js 22.13.0

## Environment Variables

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://awl_user:awl_password@localhost:3306/ageless_warrior_lab
```

## Running the Server

```bash
cd /home/ubuntu/ageless-warrior-lab
NODE_ENV=production PORT=3000 DATABASE_URL=mysql://awl_user:awl_password@localhost:3306/ageless_warrior_lab node dist/index.js
```

## Future Improvements

1. **YouTube API Integration:** Consider adding YouTube Data API v3 for more detailed video metadata
2. **Automatic Sync:** Set up scheduled task to sync episodes periodically
3. **Video Duration:** RSS feed doesn't provide video duration - could be added via API
4. **Pagination:** Add pagination for episodes list when count grows
5. **Search/Filter:** Add search and filtering capabilities for episodes
6. **Analytics:** Add view tracking and analytics
7. **Comments:** Add comment system for episodes
8. **Newsletter:** Add newsletter signup functionality

## Known Limitations

- RSS feed only provides the 15 most recent videos
- Video duration not available from RSS feed (shows 0:00)
- OAuth functionality not configured (OAUTH_SERVER_URL not set)
- Some environment variables in HTML template not configured (%VITE_APP_TITLE%, etc.)

## Support

For issues or questions, refer to the GitHub repository: https://github.com/digitaldarkmatterltd/ageless-warrior-lab
