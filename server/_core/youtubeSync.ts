/**
 * YouTube sync using search tool to fetch channel videos
 */

export async function fetchYouTubeChannelVideos(channelId: string) {
  // For now, return mock data structure that matches what the app expects
  // In production, this would use YouTube Data API v3 or RSS feed
  
  const videos: any[] = [];
  
  try {
    // Try to fetch from YouTube RSS feed (no API key required)
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch YouTube RSS feed:', response.statusText);
      return videos;
    }
    
    const xmlText = await response.text();
    
    // Parse XML to extract video information
    // This is a simple regex-based parser for the RSS feed
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const entries = xmlText.match(entryRegex) || [];
    
    for (const entry of entries) {
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1];
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1];
      const mediaGroup = entry.match(/<media:group>([\s\S]*?)<\/media:group>/)?.[1] || '';
      const description = mediaGroup.match(/<media:description>(.*?)<\/media:description>/)?.[1] || '';
      const thumbnailUrl = mediaGroup.match(/<media:thumbnail url="(.*?)"/)?.[1];
      const viewCount = mediaGroup.match(/<media:community>[\s\S]*?<media:statistics views="(.*?)"\/>/)?.[1];
      
      if (videoId && title) {
        // Generate slug from title
        const slug = title
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
        
        // Calculate published time text
        const publishedDate = new Date(published || '');
        const now = new Date();
        const diffMs = now.getTime() - publishedDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        let publishedTimeText = '';
        if (diffDays === 0) {
          publishedTimeText = 'Today';
        } else if (diffDays === 1) {
          publishedTimeText = '1 day ago';
        } else if (diffDays < 7) {
          publishedTimeText = `${diffDays} days ago`;
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7);
          publishedTimeText = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        } else if (diffDays < 365) {
          const months = Math.floor(diffDays / 30);
          publishedTimeText = months === 1 ? '1 month ago' : `${months} months ago`;
        } else {
          const years = Math.floor(diffDays / 365);
          publishedTimeText = years === 1 ? '1 year ago' : `${years} years ago`;
        }
        
        videos.push({
          videoId,
          slug,
          title: decodeHTMLEntities(title),
          description: decodeHTMLEntities(description),
          publishedTimeText,
          lengthSeconds: 0, // Not available in RSS feed
          views: viewCount ? parseInt(viewCount, 10) : 0,
          thumbnailUrl: thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          isLiveNow: 0,
        });
      }
    }
    
    console.log(`Fetched ${videos.length} videos from YouTube RSS feed`);
    return videos;
    
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return videos;
  }
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };
  
  return text.replace(/&[a-z]+;|&#\d+;/gi, (match) => entities[match] || match);
}
