// API Configuration using Environment Variables
export const config = {
  // Weather API
  weather: {
    apiKey: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '',
    city: process.env.NEXT_PUBLIC_WEATHER_CITY || 'San Francisco',
    units: process.env.NEXT_PUBLIC_WEATHER_UNITS || 'imperial',
    endpoint: 'https://api.openweathermap.org/data/2.5/weather'
  },

  // Apple Health
  appleHealth: {
    clientId: process.env.NEXT_PUBLIC_APPLE_HEALTH_CLIENT_ID || '',
    redirectUri: process.env.NEXT_PUBLIC_APPLE_HEALTH_REDIRECT_URI || '',
    clientSecret: process.env.APPLE_HEALTH_CLIENT_SECRET || ''
  },

  // News API
  news: {
    apiKey: process.env.NEXT_PUBLIC_NEWS_API_KEY || '',
    country: process.env.NEXT_PUBLIC_NEWS_COUNTRY || 'us',
    categories: process.env.NEXT_PUBLIC_NEWS_CATEGORY?.split(',') || ['technology', 'business'],
    endpoint: 'https://newsapi.org/v2/top-headlines'
  },

  // iMessage Bridge
  imessage: {
    host: process.env.IMESSAGE_BRIDGE_HOST || '192.168.1.100',
    port: process.env.IMESSAGE_BRIDGE_PORT || '8745',
    token: process.env.IMESSAGE_BRIDGE_TOKEN || ''
  },

  // LinkedIn
  linkedin: {
    clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI || ''
  },

  // Instagram
  instagram: {
    appId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '',
    appSecret: process.env.INSTAGRAM_APP_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || ''
  },

  // Gmail
  gmail: {
    clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_GMAIL_REDIRECT_URI || ''
  },

  // Spotify
  spotify: {
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    scopes: 'user-read-currently-playing user-read-playback-state'
  },

  // Google Calendar
  calendar: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY || '',
    calendarId: process.env.NEXT_PUBLIC_CALENDAR_ID || 'primary'
  },

  // Quotes API
  quotes: {
    apiUrl: process.env.NEXT_PUBLIC_QUOTES_API_URL || 'https://api.quotable.io',
    apiKey: process.env.NEXT_PUBLIC_QUOTES_API_KEY || ''
  },

  // Todoist
  todoist: {
    apiToken: process.env.NEXT_PUBLIC_TODOIST_API_TOKEN || ''
  },

  // Oura Ring (Sleep Tracking)
  oura: {
    clientId: process.env.NEXT_PUBLIC_OURA_CLIENT_ID || '',
    clientSecret: process.env.OURA_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_OURA_REDIRECT_URI || ''
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  },

  // Analytics
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '',
    mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || ''
  },

  // Feature Flags
  features: {
    voiceCommands: process.env.NEXT_PUBLIC_ENABLE_VOICE_COMMANDS === 'true',
    aiSuggestions: process.env.NEXT_PUBLIC_ENABLE_AI_SUGGESTIONS === 'true',
    exportFeature: process.env.NEXT_PUBLIC_ENABLE_EXPORT_FEATURE === 'true',
    focusMode: process.env.NEXT_PUBLIC_ENABLE_FOCUS_MODE === 'true'
  },

  // Rate Limits
  rateLimits: {
    weatherApiCallsPerMinute: parseInt(process.env.WEATHER_API_CALLS_PER_MINUTE || '60'),
    newsApiCallsPerDay: parseInt(process.env.NEWS_API_CALLS_PER_DAY || '1000')
  },

  // General Settings
  settings: {
    timezone: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'America/Los_Angeles',
    debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'error'
  }
};

// Example API call functions that would use these environment variables
export const apiCalls = {
  // Fetch weather data
  async getWeather() {
    const url = `${config.weather.endpoint}?q=${config.weather.city}&appid=${config.weather.apiKey}&units=${config.weather.units}`;
    console.log('Weather API URL (with fake key):', url);
    // In production, this would make a real API call
    return { temp: 72, condition: 'Partly Cloudy' };
  },

  // Fetch news headlines
  async getNews() {
    const url = `${config.news.endpoint}?country=${config.news.country}&apiKey=${config.news.apiKey}&category=${config.news.categories.join(',')}`;
    console.log('News API URL (with fake key):', url);
    // In production, this would make a real API call
    return ['Breaking News 1', 'Breaking News 2'];
  },

  // Connect to iMessage Bridge
  async getMessages() {
    const bridgeUrl = `http://${config.imessage.host}:${config.imessage.port}/messages`;
    console.log('iMessage Bridge URL:', bridgeUrl);
    console.log('Using token:', config.imessage.token.substring(0, 10) + '...');
    // In production, this would connect to a local Mac bridge
    return [];
  },

  // Get LinkedIn notifications
  async getLinkedInUpdates() {
    console.log('LinkedIn Client ID:', config.linkedin.clientId);
    // Would use OAuth flow in production
    return [];
  },

  // Get sleep data from Oura
  async getSleepData() {
    console.log('Oura Client ID:', config.oura.clientId);
    // Would fetch from Oura API in production
    return { hours: 7.5, quality: 85 };
  }
};

// Export function to show all configured APIs
export function showConfiguredAPIs() {
  console.log('=== Configured API Integrations ===');
  console.log('Weather API:', config.weather.apiKey ? '✓ Configured' : '✗ Not configured');
  console.log('Apple Health:', config.appleHealth.clientId ? '✓ Configured' : '✗ Not configured');
  console.log('News API:', config.news.apiKey ? '✓ Configured' : '✗ Not configured');
  console.log('iMessage Bridge:', config.imessage.token ? '✓ Configured' : '✗ Not configured');
  console.log('LinkedIn:', config.linkedin.clientId ? '✓ Configured' : '✗ Not configured');
  console.log('Instagram:', config.instagram.appId ? '✓ Configured' : '✗ Not configured');
  console.log('Gmail:', config.gmail.clientId ? '✓ Configured' : '✗ Not configured');
  console.log('Spotify:', config.spotify.clientId ? '✓ Configured' : '✗ Not configured');
  console.log('Google Calendar:', config.calendar.apiKey ? '✓ Configured' : '✗ Not configured');
  console.log('Todoist:', config.todoist.apiToken ? '✓ Configured' : '✗ Not configured');
  console.log('Oura Ring:', config.oura.clientId ? '✓ Configured' : '✗ Not configured');
  console.log('Database:', config.database.url ? '✓ Configured' : '✗ Not configured');
  console.log('===================================');
}
