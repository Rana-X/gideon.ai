"use client";

import { useState, useEffect } from "react";
import { config, showConfiguredAPIs } from "@/lib/config";

export default function ApiStatusPage() {
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    // Log configuration status to console
    showConfiguredAPIs();
  }, []);

  const maskKey = (key: string) => {
    if (!key) return "Not configured";
    if (!showKeys) {
      return key.substring(0, 8) + "..." + key.substring(key.length - 4);
    }
    return key;
  };

  const apiStatus = [
    {
      name: "OpenWeather API",
      status: config.weather.apiKey ? "✓" : "✗",
      key: config.weather.apiKey,
      endpoint: `${config.weather.endpoint}?q=${config.weather.city}`,
      description: "Provides real-time weather data and forecasts"
    },
    {
      name: "Apple Health",
      status: config.appleHealth.clientId ? "✓" : "✗",
      key: config.appleHealth.clientId,
      endpoint: config.appleHealth.redirectUri,
      description: "Syncs health data from Apple devices"
    },
    {
      name: "News API",
      status: config.news.apiKey ? "✓" : "✗",
      key: config.news.apiKey,
      endpoint: config.news.endpoint,
      description: "Fetches top headlines and breaking news"
    },
    {
      name: "iMessage Bridge",
      status: config.imessage.token ? "✓" : "✗",
      key: config.imessage.token,
      endpoint: `${config.imessage.host}:${config.imessage.port}`,
      description: "Connects to local Mac for iMessage access"
    },
    {
      name: "LinkedIn",
      status: config.linkedin.clientId ? "✓" : "✗",
      key: config.linkedin.clientId,
      endpoint: config.linkedin.redirectUri,
      description: "Shows professional network updates"
    },
    {
      name: "Instagram",
      status: config.instagram.appId ? "✓" : "✗",
      key: config.instagram.appId,
      endpoint: config.instagram.redirectUri,
      description: "Displays Instagram notifications"
    },
    {
      name: "Gmail",
      status: config.gmail.clientId ? "✓" : "✗",
      key: config.gmail.clientId,
      endpoint: config.gmail.redirectUri,
      description: "Shows important emails"
    },
    {
      name: "Spotify",
      status: config.spotify.clientId ? "✓" : "✗",
      key: config.spotify.clientId,
      endpoint: "https://api.spotify.com/v1",
      description: "Plays morning playlists"
    },
    {
      name: "Google Calendar",
      status: config.calendar.apiKey ? "✓" : "✗",
      key: config.calendar.apiKey,
      endpoint: `Calendar ID: ${config.calendar.calendarId}`,
      description: "Syncs daily schedule and appointments"
    },
    {
      name: "Todoist",
      status: config.todoist.apiToken ? "✓" : "✗",
      key: config.todoist.apiToken,
      endpoint: "https://api.todoist.com/rest/v2",
      description: "Manages tasks and priorities"
    },
    {
      name: "Oura Ring",
      status: config.oura.clientId ? "✓" : "✗",
      key: config.oura.clientId,
      endpoint: config.oura.redirectUri,
      description: "Tracks sleep quality and recovery"
    },
    {
      name: "Supabase Database",
      status: config.database.supabaseUrl ? "✓" : "✗",
      key: config.database.supabaseAnonKey,
      endpoint: config.database.supabaseUrl,
      description: "Stores user preferences and data"
    }
  ];

  const featureFlags = [
    { name: "Voice Commands", enabled: config.features.voiceCommands },
    { name: "AI Suggestions", enabled: config.features.aiSuggestions },
    { name: "Export Feature", enabled: config.features.exportFeature },
    { name: "Focus Mode", enabled: config.features.focusMode }
  ];

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8">
        <div className="sketch-border p-6 bg-white">
          <h1 className="text-4xl font-bold mb-2 sketch-underline">API Configuration Status</h1>
          <p className="text-gray-600">Environment variables and integration status</p>
        </div>
      </header>

      <div className="mb-6">
        <button
          onClick={() => setShowKeys(!showKeys)}
          className="sketch-border-light p-3 bg-white hover:bg-gray-100"
        >
          {showKeys ? "Hide" : "Show"} API Keys
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {apiStatus.map((api, idx) => (
          <div key={idx} className="sketch-border-light p-4 bg-white">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg">{api.name}</h3>
              <span className={`text-2xl ${api.status === "✓" ? "text-green-600" : "text-red-600"}`}>
                {api.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{api.description}</p>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-gray-50 font-mono break-all">
                <span className="font-bold">Key/ID: </span>
                {maskKey(api.key)}
              </div>
              <div className="p-2 bg-gray-50 font-mono break-all">
                <span className="font-bold">Endpoint: </span>
                {api.endpoint}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="sketch-border-light p-4 bg-white">
          <h3 className="font-bold text-lg mb-4">Feature Flags</h3>
          <div className="space-y-2">
            {featureFlags.map((feature, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 border-b">
                <span>{feature.name}</span>
                <span className={`font-bold ${feature.enabled ? "text-green-600" : "text-gray-400"}`}>
                  {feature.enabled ? "ON" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sketch-border-light p-4 bg-white">
          <h3 className="font-bold text-lg mb-4">System Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 border-b">
              <span>Timezone</span>
              <span className="font-mono">{config.settings.timezone}</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span>Debug Mode</span>
              <span className="font-bold">{config.settings.debugMode ? "ON" : "OFF"}</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span>Log Level</span>
              <span className="font-mono">{config.settings.logLevel}</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span>Weather API Limit</span>
              <span>{config.rateLimits.weatherApiCallsPerMinute}/min</span>
            </div>
            <div className="flex justify-between p-2">
              <span>News API Limit</span>
              <span>{config.rateLimits.newsApiCallsPerDay}/day</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center">
        <div className="sketch-border-light inline-block p-4 bg-white">
          <p className="text-sm text-gray-600">
            Note: All API keys shown are fake/example values for demonstration purposes
          </p>
        </div>
      </footer>
    </div>
  );
}
