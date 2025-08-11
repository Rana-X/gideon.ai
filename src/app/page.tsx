"use client";

import { useState, useEffect } from "react";
import MicrophoneButton, { useSpeechToText } from "@/components/InputSpeechToText";
import { useVoiceCommands, VoiceCommandButton, CommandFeedback, VoiceCommand } from "@/components/VoiceCommands";
import AlwaysListening from "@/components/AlwaysListening";
import {
  fetchEmails,
  fetchTodayEvents,
  formatEmailForDisplay,
  formatEventForDisplay,
  checkApiHealth,
  Email,
  CalendarEvent
} from "@/lib/api-services";

// Dashboard modes
type DashboardMode = 'morning' | 'focus' | 'relax' | 'exercise' | 'crypto' | 'night';

// Mode configurations - which widgets to show in each mode
const modeConfigs: Record<DashboardMode, {
  title: string;
  greeting: string;
  widgets: string[];
  theme: string;
}> = {
  morning: {
    title: "Morning Dashboard",
    greeting: "Rise and shine!",
    widgets: ['time', 'health', 'weather', 'tasks', 'calendar', 'emails', 'news', 'note'],
    theme: "warm"
  },
  focus: {
    title: "Focus Mode",
    greeting: "Deep work time",
    widgets: ['time', 'tasks', 'calendar', 'note'],
    theme: "minimal"
  },
  relax: {
    title: "Relax Mode",
    greeting: "Time to unwind",
    widgets: ['time', 'weather', 'music', 'breathing', 'quote', 'note'],
    theme: "calm"
  },
  exercise: {
    title: "Workout Mode",
    greeting: "Let's get moving!",
    widgets: ['time', 'health', 'workout', 'music', 'water', 'motivation'],
    theme: "energetic"
  },
  crypto: {
    title: "Coin Dashboard",
    greeting: "Market check",
    widgets: ['time', 'crypto', 'news', 'portfolio', 'alerts'],
    theme: "tech"
  },
  night: {
    title: "Night Mode",
    greeting: "Sweet dreams",
    widgets: ['time', 'health', 'tomorrow', 'reflection', 'meditation'],
    theme: "dark"
  }
};

export default function MorningDashboard() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentMode, setCurrentMode] = useState<DashboardMode>('morning');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [tasks, setTasks] = useState([
    { id: 1, text: "Morning coffee ritual", priority: "low", done: true },
    { id: 2, text: "Review Q3 presentation", priority: "high", done: false },
    { id: 3, text: "Respond to urgent emails", priority: "high", done: false },
    { id: 4, text: "Team standup meeting", priority: "medium", done: false },
    { id: 5, text: "Grocery shopping", priority: "low", done: false },
  ]);
  const [newTask, setNewTask] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [dailyNoteText, setDailyNoteText] = useState("You've got this! Remember to take breaks and stay hydrated.");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<number[]>([]);
  const [showCommandFeedback, setShowCommandFeedback] = useState(false);
  const [lastCommandExecuted, setLastCommandExecuted] = useState("");
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
  const [alwaysListening, setAlwaysListening] = useState(false); // Start disabled until user enables
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [animatingTaskId, setAnimatingTaskId] = useState<number | null>(null);

  // API Data States
  const [emails, setEmails] = useState<ReturnType<typeof formatEmailForDisplay>[]>([]);
  const [appointments, setAppointments] = useState<ReturnType<typeof formatEventForDisplay>[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Crypto data (mock)
  const [cryptoData] = useState([
    { symbol: "BTC", price: "$67,432", change: "+2.4%" },
    { symbol: "ETH", price: "$3,245", change: "+1.8%" },
    { symbol: "SOL", price: "$142", change: "-0.5%" }
  ]);

  // Fetch real emails from Gmail API
  const loadEmails = async () => {
    console.log('📧 Loading emails...');
    setLoadingEmails(true);
    try {
      const emailData = await fetchEmails(5);
      console.log('📧 Email data received:', emailData.length, 'emails');

      if (emailData.length > 0) {
        const formattedEmails = emailData.map(formatEmailForDisplay);
        console.log('📧 Formatted emails:', formattedEmails);
        setEmails(formattedEmails);
      } else {
        console.log('📧 No emails received, using fallback');
        setEmails([
          {
            id: "sample1",
            platform: "Gmail",
            from: "Team Meeting",
            preview: "Reminder: Standup at 10am",
            fullMessage: "Don't forget about our daily standup meeting at 10am in the main conference room.",
            unread: true,
            timeAgo: "2h ago",
            date: new Date(Date.now() - 2 * 60 * 60 * 1000)
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      setEmails([
        {
          id: "offline",
          platform: "Gmail",
          from: "System",
          preview: "Check console for API logs",
          fullMessage: "Unable to connect to Gmail API. Check browser console for details.",
          unread: true,
          timeAgo: "now",
          date: new Date()
        }
      ]);
    } finally {
      console.log('📧 Finally block - setting loading to false');
      setLoadingEmails(false);
    }
  };

  // Fetch real calendar events from Google Calendar API
  const loadCalendarEvents = async () => {
    console.log('📅 Loading calendar events...');
    setLoadingCalendar(true);
    try {
      const events = await fetchTodayEvents();
      console.log('📅 Calendar events received:', events.length, 'events');

      const formattedEvents = events.map(formatEventForDisplay);
      console.log('📅 Formatted events:', formattedEvents);
      setAppointments(formattedEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setAppointments([
        {
          time: "10:00 AM",
          endTime: "10:30 AM",
          title: "Check Calendar API",
          description: "Calendar data unavailable",
          location: "",
          important: true,
          isAllDay: false
        }
      ]);
    } finally {
      console.log('📅 Finally block - setting loading to false');
      setLoadingCalendar(false);
    }
  };

  // Check API health and load data
  const checkApiConnection = async () => {
    console.log('🔄 Checking API connection...');
    const isHealthy = await checkApiHealth();
    setApiConnected(isHealthy);
    console.log('🔄 Loading data (healthy:', isHealthy, ')');
    await Promise.all([loadEmails(), loadCalendarEvents()]);
  };

  // Master refresh function
  const refreshAllData = async () => {
    setLastRefresh(new Date());
    await checkApiConnection();
    setLastCommandExecuted("All data refreshed");
    showCommandFeedbackToast();
  };

  // Switch dashboard mode
  const switchMode = (mode: DashboardMode) => {
    setCurrentMode(mode);
    // Auto-refresh data when switching modes
    refreshAllData();
    setLastCommandExecuted(`Switched to ${mode} mode`);
    showCommandFeedbackToast();

    // Apply dark mode for night mode
    if (mode === 'night') {
      setIsDarkMode(true);
    } else if (mode === 'morning') {
      setIsDarkMode(false);
    }
  };

  // Handle wake words from always listening
  const handleWakeWord = (word: string) => {
    console.log('Wake word detected:', word);

    switch(word) {
      case 'morning':
        switchMode('morning');
        break;
      case 'focus':
        switchMode('focus');
        break;
      case 'relax':
        switchMode('relax');
        break;
      case 'workout':
        switchMode('exercise');
        break;
      case 'coin':
        switchMode('crypto');
        break;
      case 'night':
        switchMode('night');
        break;
      case 'refresh':
        refreshAllData();
        break;
      default:
        console.log('Unknown wake word:', word);
    }
  };

  // Define voice commands with mode switching
  const voiceCommands: VoiceCommand[] = [
    {
      patterns: ["good morning", "morning mode", "start my day"],
      action: () => switchMode('morning'),
      description: "Switch to morning dashboard"
    },
    {
      patterns: ["focus mode", "work mode", "deep work"],
      action: () => switchMode('focus'),
      description: "Enter focus mode"
    },
    {
      patterns: ["relax mode", "chill mode", "break time"],
      action: () => switchMode('relax'),
      description: "Switch to relax mode"
    },
    {
      patterns: ["exercise mode", "workout mode", "gym time"],
      action: () => switchMode('exercise'),
      description: "Enter exercise mode"
    },
    {
      patterns: ["crypto mode", "market check", "bitcoin"],
      action: () => switchMode('crypto'),
      description: "Check crypto dashboard"
    },
    {
      patterns: ["good night", "night mode", "bed time"],
      action: () => switchMode('night'),
      description: "Switch to night mode"
    },
    {
      patterns: ["refresh", "update all", "reload"],
      action: () => refreshAllData(),
      description: "Refresh all data"
    },
    {
      patterns: ["add task", "new task", "create task"],
      action: (params) => {
        if (params) {
          const newTaskItem = {
            id: Date.now(),
            text: params,
            priority: "medium" as const,
            done: false
          };
          setTasks([...tasks, newTaskItem]);
          setLastCommandExecuted(`Task added: ${params}`);
          showCommandFeedbackToast();
        }
      },
      description: "Add a new task"
    },
  ];

  const voiceCommandHandler = useVoiceCommands({
    commands: voiceCommands,
    onCommandDetected: (command) => console.log("Command detected:", command),
    isActive: voiceCommandsEnabled
  });

  const showCommandFeedbackToast = () => {
    setShowCommandFeedback(true);
    setTimeout(() => setShowCommandFeedback(false), 3000);
  };

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Voice transcription handlers
  const handleTaskTranscription = (transcribedText: string) => {
    if (transcribedText.trim() === "") return;
    let newTextValue: string;
    if (newTask.trim() === "") {
      newTextValue = transcribedText.trim();
    } else {
      newTextValue = `${newTask.trimEnd()} ${transcribedText.trimStart()}`.trim();
    }
    setNewTask(newTextValue);
  };

  const taskSpeechToText = useSpeechToText({
    onTranscriptionUpdate: handleTaskTranscription,
  });

  const handleNoteTranscription = (transcribedText: string) => {
    if (transcribedText.trim() === "") return;
    let newTextValue: string;
    if (dailyNoteText.trim() === "") {
      newTextValue = transcribedText.trim();
    } else {
      newTextValue = `${dailyNoteText.trimEnd()} ${transcribedText.trimStart()}`.trim();
    }
    setDailyNoteText(newTextValue);
  };

  const noteSpeechToText = useSpeechToText({
    onTranscriptionUpdate: handleNoteTranscription,
  });

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCurrentTime(now);

    // Auto-select mode based on time
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) {
      setCurrentMode('morning');
    } else if (hour >= 12 && hour < 17) {
      setCurrentMode('focus');
    } else if (hour >= 17 && hour < 20) {
      setCurrentMode('relax');
    } else {
      setCurrentMode('night');
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data on mount
  useEffect(() => {
    console.log('🚀 Dashboard mounted, starting data load...');
    const timeout = setTimeout(() => {
      console.log('🚀 Calling checkApiConnection...');
      checkApiConnection();
    }, 100);

    const interval = setInterval(() => {
      checkApiConnection();
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Loading...";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toggleTask = (id: number) => {
    setAnimatingTaskId(id);
    setTimeout(() => {
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, done: !task.done } : task
      ));
      setAnimatingTaskId(null);
    }, 300);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      const newTaskItem = {
        id: Date.now(),
        text: newTask,
        priority: "medium" as const,
        done: false
      };
      setTasks([...tasks, newTaskItem]);
      setNewTask("");
    }
  };

  const toggleMessageExpansion = (idx: number) => {
    if (expandedMessages.includes(idx)) {
      setExpandedMessages(expandedMessages.filter(i => i !== idx));
    } else {
      setExpandedMessages([...expandedMessages, idx]);
    }
  };

  // Mock data
  const weatherData = {
    temp: "72°F",
    condition: "Partly Cloudy",
    high: "78°F",
    low: "65°F",
    alerts: ["UV Index High", "Rain after 6 PM"],
  };

  const newsHeadlines = [
    "Tech Giants Report Strong Q3 Earnings",
    "Climate Summit Reaches Historic Agreement",
    "Local Coffee Shop Wins National Award",
  ];

  const healthData = {
    steps: "8,432",
    heartRate: "72 bpm",
    sleep: "7h 23m",
    calories: "420 kcal",
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  // Request microphone permission and enable always listening
  const enableAlwaysListening = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionGranted(true);
      setAlwaysListening(true);
      localStorage.setItem('voiceEnabled', 'true');
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermissionGranted(false);
    }
  };

  // Check if voice was previously enabled
  useEffect(() => {
    const voiceEnabled = localStorage.getItem('voiceEnabled');
    if (voiceEnabled === 'true') {
      enableAlwaysListening();
    }
  }, []);

  if (!mounted) return null;

  const config = modeConfigs[currentMode];
  const shouldShowWidget = (widget: string) => config.widgets.includes(widget);

  return (
    <div className={`min-h-screen p-4 md:p-6 relative dashboard-${config.theme} ${isDarkMode ? 'dark' : ''}`}>
      {/* First time setup modal */}
      {!alwaysListening && !micPermissionGranted && mounted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="sketch-border bg-white dark:bg-gray-800 p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 sketch-underline">Voice Control</h2>
            <p className="mb-6">
              Enable voice control to switch modes hands-free!
              <br />
              <span className="text-sm opacity-70 mt-2 block">
                Say: "morning", "focus", "relax", "workout", "coin", or "night"
              </span>
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={enableAlwaysListening}
                className="px-6 py-3 sketch-border bg-black text-white hover:bg-gray-800 transition-all"
              >
                Enable Voice
              </button>
              <button
                onClick={() => {
                  setMicPermissionGranted(true);
                  localStorage.setItem('voiceEnabled', 'false');
                }}
                className="px-6 py-3 sketch-border-light hover:bg-gray-100 transition-all"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Enhanced background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black"></div>
      </div>

      {/* Always Listening Component */}
      <AlwaysListening
        onWakeWord={handleWakeWord}
        isActive={alwaysListening}
      />

      {/* Toggle Always Listening Button */}
      <button
        onClick={() => setAlwaysListening(!alwaysListening)}
        className={`fixed top-4 right-4 z-50 p-2 sketch-border transition-all ${
          alwaysListening
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-gray-100 dark:bg-gray-800'
        }`}
        title={alwaysListening ? "Always listening (click to disable)" : "Click to enable voice"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {alwaysListening ? (
            <>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <circle cx="12" cy="12" r="1" className="fill-current animate-pulse" />
            </>
          ) : (
            <>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="4" y1="4" x2="20" y2="20" className="text-red-500" />
            </>
          )}
        </svg>
      </button>

      {/* Command Feedback Toast */}
      <CommandFeedback
        command={lastCommandExecuted}
        show={showCommandFeedback}
      />

      {/* Mode Switcher - Subtle since voice is primary */}
      <div className="fixed top-16 left-4 z-40 flex flex-col gap-1">
        <div className="text-xs font-bold opacity-50 mb-1">Modes:</div>
        {Object.entries(modeConfigs).map(([mode, conf]) => (
          <button
            key={mode}
            onClick={() => switchMode(mode as DashboardMode)}
            className={`px-2 py-1 text-xs transition-all text-left ${
              currentMode === mode
                ? 'font-bold opacity-100 translate-x-1'
                : 'opacity-50 hover:opacity-100'
            }`}
            title={`Say "${mode === 'exercise' ? 'workout' : mode === 'crypto' ? 'coin' : mode}" to activate`}
          >
            {currentMode === mode ? '▸ ' : '  '}{conf.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Master Refresh Button */}
      <button
        onClick={refreshAllData}
        className="fixed top-16 right-4 z-40 p-2 sketch-border-light bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:rotate-180 duration-500 opacity-50 hover:opacity-100"
        title="Refresh all data (or say 'refresh')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>

      {/* Main Header - Enhanced with gradient shadow */}
      <header className="mb-6 mt-16">
        <div className="sketch-border p-6 md:p-8 bg-white dark:bg-gray-800 crosshatch relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold mb-2 sketch-underline relative">
              {formatTime(currentTime)}
              <span className="absolute -top-2 -right-2 text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rotate-3">
                {config.title}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
              {formatDate(currentTime)}
            </p>
            <p className="text-lg mt-2 font-bold opacity-70 float">
              {config.greeting}
            </p>
          </div>
        </div>
      </header>

      {/* Dynamic Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Time Widget - Always visible but styled differently */}
        {shouldShowWidget('time') && currentMode === 'focus' && (
          <div className="md:col-span-2 lg:col-span-4 mb-4">
            <div className="sketch-border p-8 bg-white dark:bg-gray-800 text-center">
              <h2 className="text-6xl font-bold">{formatTime(currentTime)}</h2>
              <p className="text-xl mt-2">Stay focused!</p>
            </div>
          </div>
        )}

        {/* Health Widget */}
        {shouldShowWidget('health') && (
          <div className="sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift">
            <h2 className="text-xl font-bold mb-3 sketch-underline">Health Stats</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold">Sleep Quality</p>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map((i) => (
                    <button
                      key={i}
                      onClick={() => setSleepQuality(i)}
                      className={`text-2xl transition-all hover:scale-125 ${i <= sleepQuality ? '' : 'opacity-30'}`}
                    >
                      {i <= sleepQuality ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(healthData).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                    <span className="capitalize">{key}:</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weather Widget */}
        {shouldShowWidget('weather') && (
          <div className="sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift">
            <h2 className="text-xl font-bold mb-3 sketch-underline">Weather</h2>
            <div className="space-y-2">
              <div className="text-4xl font-bold">{weatherData.temp}</div>
              <div className="text-sm">{weatherData.condition}</div>
              <div className="flex gap-3 text-sm">
                <span>H: {weatherData.high}</span>
                <span>L: {weatherData.low}</span>
              </div>
              <div className="pt-2 border-t-2 border-black dark:border-white border-dashed">
                {weatherData.alerts.map((alert, idx) => (
                  <p key={idx} className="text-xs p-1 mb-1 border-l-2 border-black dark:border-white hover:border-l-4 transition-all">
                    {alert}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Widget */}
        {shouldShowWidget('tasks') && (
          <div className={`sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift ${currentMode === 'focus' ? 'md:col-span-2' : ''}`}>
            <h2 className="text-xl font-bold mb-3 sketch-underline">Priority Tasks</h2>
            <form onSubmit={addTask} className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add task..."
                  className="flex-1 p-2 text-sm border-2 border-black dark:border-white rounded-none bg-transparent focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                  style={{ borderRadius: "2% 6% 5% 4% / 1% 1% 2% 4%" }}
                />
                <MicrophoneButton
                  isRecording={taskSpeechToText.isRecording}
                  isStreaming={taskSpeechToText.isStreaming}
                  error={taskSpeechToText.error}
                  onClick={taskSpeechToText.toggleRecording}
                  size="small"
                />
              </div>
            </form>
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {sortedTasks.slice(0, currentMode === 'focus' ? 10 : 6).map((task, idx) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm transition-all ${
                    animatingTaskId === task.id ? 'task-check' : ''
                  } ${task.priority === 'high' && !task.done ? 'pulse-sketch' : ''}`}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className={`w-4 h-4 border-2 border-black dark:border-white flex items-center justify-center flex-shrink-0 transition-all ${
                    task.done ? 'bg-black dark:bg-white' : ''
                  }`}
                       style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}>
                    {task.done && (
                      <svg className="w-3 h-3 text-white dark:text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M 3,9 L 8,14 L 17,5" stroke="currentColor" strokeWidth="3" fill="none"
                              strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`flex-1 ${task.done ? "line-through opacity-60" : ""}`}>
                    {task.priority === "high" && !task.done && <span className="font-bold text-red-600 dark:text-red-400">! </span>}
                    {task.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Calendar Widget */}
        {shouldShowWidget('calendar') && (
          <div className="sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift">
            <h2 className="text-xl font-bold mb-3 sketch-underline">
              Calendar
              {loadingCalendar && <span className="text-xs ml-2 opacity-50">Loading...</span>}
            </h2>
            <div className="space-y-2">
              {loadingCalendar ? (
                <div className="skeleton h-20"></div>
              ) : appointments.length > 0 ? (
                appointments.map((apt, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 p-2 text-sm ${apt.important ? 'border-l-4' : 'border-l-2'} border-black dark:border-white hover:crosshatch transition-all hover:translate-x-1`}
                  >
                    <span className="font-bold w-20 text-xs">{apt.time}</span>
                    <span className="flex-1">
                      {apt.title}
                      {apt.location && <span className="text-xs opacity-60 block">{apt.location}</span>}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm opacity-60">No events today</p>
              )}
            </div>
          </div>
        )}

        {/* Emails Widget */}
        {shouldShowWidget('emails') && (
          <div className={`sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift ${currentMode === 'morning' ? 'md:col-span-2 lg:col-span-1' : ''}`}>
            <h2 className="text-xl font-bold mb-3 sketch-underline">
              Inbox
              {loadingEmails && <span className="text-xs ml-2 opacity-50">Loading...</span>}
            </h2>
            <div className="space-y-2">
              {loadingEmails ? (
                <div className="skeleton h-20"></div>
              ) : emails.length > 0 ? (
                emails.slice(0, 5).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 text-sm border-l-2 border-black dark:border-white hover:border-l-4 transition-all cursor-pointer ${
                      msg.unread ? 'font-bold bg-gray-50 dark:bg-gray-700' : ''
                    }`}
                    onClick={() => toggleMessageExpansion(idx)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs">{msg.timeAgo}</span>
                      {msg.unread && <span className="text-xs animate-pulse">●</span>}
                    </div>
                    <p className="text-xs">
                      {msg.from}: {expandedMessages.includes(idx) ? msg.fullMessage : msg.preview}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm opacity-60">No new emails</p>
              )}
            </div>
          </div>
        )}

        {/* News Widget */}
        {shouldShowWidget('news') && (
          <div className="sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift">
            <h2 className="text-xl font-bold mb-3 sketch-underline">Headlines</h2>
            <ul className="space-y-2">
              {newsHeadlines.map((headline, idx) => (
                <li
                  key={idx}
                  className="text-sm p-2 border-l-2 border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-l-4 transition-all"
                >
                  • {headline}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Crypto Widget */}
        {shouldShowWidget('crypto') && (
          <div className="sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift md:col-span-2">
            <h2 className="text-xl font-bold mb-3 sketch-underline">Crypto Market</h2>
            <div className="grid grid-cols-3 gap-4">
              {cryptoData.map((coin, idx) => (
                <div key={idx} className="text-center p-3 sketch-border-light hover:shadow-lg transition-all">
                  <div className="font-bold text-lg">{coin.symbol}</div>
                  <div className="text-xl">{coin.price}</div>
                  <div className={`text-sm ${coin.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {coin.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note Widget */}
        {shouldShowWidget('note') && (
          <div className="sketch-border p-4 bg-white dark:bg-gray-800 md:col-span-2 hover-lift">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold sketch-underline">Daily Note</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingNote(!isEditingNote)}
                  className="text-sm px-2 py-1 sketch-border-light bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isEditingNote ? 'Save' : 'Edit'}
                </button>
                {isEditingNote && (
                  <MicrophoneButton
                    isRecording={noteSpeechToText.isRecording}
                    isStreaming={noteSpeechToText.isStreaming}
                    error={noteSpeechToText.error}
                    onClick={noteSpeechToText.toggleRecording}
                    size="small"
                  />
                )}
              </div>
            </div>
            {isEditingNote ? (
              <textarea
                value={dailyNoteText}
                onChange={(e) => setDailyNoteText(e.target.value)}
                className="w-full h-24 p-2 text-sm border-2 border-black dark:border-white rounded-none bg-transparent focus:outline-none"
                style={{ borderRadius: "2% 6% 5% 4% / 1% 1% 2% 4%" }}
              />
            ) : (
              <p className="text-sm italic leading-relaxed">
                "{dailyNoteText}"
              </p>
            )}
          </div>
        )}

        {/* Breathing/Meditation Widget for Relax Mode */}
        {shouldShowWidget('breathing') && (
          <div className="sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift text-center">
            <h2 className="text-xl font-bold mb-3 sketch-underline">Breathe</h2>
            <div className="breathing-circle mx-auto w-24 h-24 rounded-full border-4 border-black dark:border-white"></div>
            <p className="text-sm mt-4">Inhale... Exhale...</p>
          </div>
        )}

        {/* Workout Widget for Exercise Mode */}
        {shouldShowWidget('workout') && (
          <div className="sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift">
            <h2 className="text-xl font-bold mb-3 sketch-underline">Today's Workout</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>Push-ups</span>
                <span className="font-bold">3x15</span>
              </li>
              <li className="flex justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>Squats</span>
                <span className="font-bold">3x20</span>
              </li>
              <li className="flex justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>Plank</span>
                <span className="font-bold">3x60s</span>
              </li>
            </ul>
          </div>
        )}

        {/* Tomorrow Preview for Night Mode */}
        {shouldShowWidget('tomorrow') && (
          <div className="sketch-border-light p-4 bg-white dark:bg-gray-800 hover-lift md:col-span-2">
            <h2 className="text-xl font-bold mb-3 sketch-underline">Tomorrow's Schedule</h2>
            <p className="text-sm opacity-70">Get ready for tomorrow...</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="p-2 border-l-2 border-black dark:border-white">9:00 AM - Morning standup</li>
              <li className="p-2 border-l-2 border-black dark:border-white">2:00 PM - Client presentation</li>
              <li className="p-2 border-l-2 border-black dark:border-white">4:00 PM - Team review</li>
            </ul>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="mt-8 text-center">
        <div className="sketch-border-light inline-block p-4 bg-white dark:bg-gray-800 hover-lift">
          <p className="text-lg font-bold">
            {currentMode === 'focus' ? 'Stay focused!' : `${config.greeting}`}
          </p>
          <p className="text-xs mt-1 opacity-70">
            {tasks.filter(t => !t.done).length} tasks • {emails.length} emails • {appointments.length} events
          </p>
        </div>
      </footer>

      <style jsx>{`
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-4px) rotate(0.5deg);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }

        .breathing-circle {
          animation: breathe 4s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        .dashboard-minimal {
          background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
        }

        .dashboard-calm {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        }

        .dashboard-energetic {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        }

        .dashboard-tech {
          background: linear-gradient(135deg, #263238 0%, #37474f 100%);
        }

        .dashboard-dark {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }
      `}</style>
    </div>
  );
}
