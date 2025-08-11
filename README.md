# Gideon.AI - Intelligent Morning Dashboard

A voice-controlled, AI-powered personal dashboard that aggregates your daily information and adapts to different modes throughout your day.

## Features

### 🎯 Multiple Dashboard Modes
- **Morning Mode**: Weather, emails, calendar, tasks, health stats
- **Focus Mode**: Minimal interface with tasks and calendar only
- **Relax Mode**: Breathing exercises, quotes, music controls
- **Exercise Mode**: Workout plans, health tracking, motivation
- **Crypto Mode**: Market data, portfolio tracking, alerts
- **Night Mode**: Tomorrow's schedule, sleep tracking, reflection

### 🗣️ Voice Control
- **Always Listening**: Hands-free mode switching with wake words
- **Voice Commands**: Add tasks, refresh data, switch modes
- **Speech-to-Text**: Voice input for tasks and notes using Groq API

### 📱 Smart Integrations
- **Gmail**: Recent emails with real-time updates
- **Google Calendar**: Today's schedule and appointments
- **Weather**: Current conditions and alerts (OpenWeatherMap)
- **Health Tracking**: Sleep, steps, heart rate (Apple Health, Oura)
- **Social Media**: LinkedIn, Instagram notifications
- **Productivity**: Todoist integration, note-taking
- **Entertainment**: Spotify controls, news headlines
- **Crypto**: Market data and portfolio tracking

### 🎨 Adaptive UI
- **Sketch-style Design**: Hand-drawn aesthetic with hover effects
- **Dark/Light Mode**: Automatic switching based on mode
- **Responsive Layout**: Works on desktop and mobile
- **Animated Interactions**: Smooth transitions and micro-animations

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gideon.ai.git
   cd gideon.ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   Edit `.env.local` with your API keys and configuration.

4. **Run the development server**
```bash
npm run dev
# or
bun dev
```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Setup

### Required API Keys

1. **OpenWeatherMap** - Weather data
   - Get API key from [OpenWeatherMap](https://openweathermap.org/api)
   - Add to `NEXT_PUBLIC_OPENWEATHER_API_KEY`

2. **Groq** - Speech-to-text for voice features
   - Get API key from [Groq Console](https://console.groq.com)
   - Add to `NEXT_PUBLIC_GROQ_API_KEY`

3. **Google APIs** - Gmail and Calendar
   - Set up OAuth2 credentials in [Google Console](https://console.google.com)
   - Configure redirect URIs for your domain
   - Add client ID and secrets to respective environment variables

### Optional Integrations

- **News API** - Headlines and news updates
- **Spotify** - Music control and now playing
- **Todoist** - Task management integration
- **Apple Health / Oura** - Health and fitness tracking
- **Social Media APIs** - LinkedIn, Instagram integration

## Voice Commands

### Mode Switching
- "Good morning" or "morning mode" → Morning Dashboard
- "Focus mode" or "deep work" → Focus Mode
- "Relax mode" or "break time" → Relax Mode
- "Exercise mode" or "gym time" → Exercise Mode
- "Crypto mode" or "market check" → Crypto Dashboard
- "Good night" or "night mode" → Night Mode

### Actions
- "Refresh" or "update all" → Refresh all data
- "Add task [task description]" → Add new task

### Wake Words (Always Listening)
Simply say: `morning`, `focus`, `relax`, `workout`, `coin`, `night`, or `refresh`

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom sketch-style components
- **TypeScript**: Full type safety
- **Voice Processing**: Groq API for speech-to-text
- **State Management**: React hooks and local storage
- **APIs**: RESTful integrations with various services

### File Structure
```
src/
├── app/
│   ├── api/session/         # Session management
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx            # Main dashboard
├── components/
│   ├── AlwaysListening.tsx  # Voice wake word detection
│   ├── InputSpeechToText.tsx # Speech input component
│   └── VoiceCommands.tsx    # Voice command processing
└── lib/
    ├── api-services.ts      # External API integrations
    ├── config.ts           # Environment configuration
    └── utils.ts            # Utility functions
```

## Customization

### Adding New Modes
1. Update the `DashboardMode` type in `page.tsx`
2. Add mode configuration to `modeConfigs`
3. Create widgets for your mode
4. Add voice commands for mode switching

### Creating Custom Widgets
1. Add widget type to mode configuration
2. Implement widget component in the main grid
3. Use the sketch-style CSS classes for consistent styling

### API Integration
1. Add configuration to `src/lib/config.ts`
2. Implement service functions in `src/lib/api-services.ts`
3. Add environment variables to `env.example`

## Development

### Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Biome
```

### Code Style
- Uses Biome for formatting and linting
- Sketch-style CSS for hand-drawn aesthetic
- TypeScript for type safety
- Responsive design patterns

## Deployment

### Netlify (Recommended)
The project includes `netlify.toml` for easy deployment:

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Other Platforms
Compatible with:
- Vercel
- Railway
- Digital Ocean App Platform
- Any platform supporting Next.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

- Open an issue for bugs or feature requests
- Check the documentation for configuration help
- Review environment variables in `env.example`

---

**Gideon.AI** - Your intelligent daily companion, powered by voice and AI.