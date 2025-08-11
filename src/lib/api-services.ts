// API Services for Gmail and Google Calendar Integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  preview: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  location?: string;
}

export interface EmailResponse {
  success: boolean;
  count: number;
  emails: Email[];
}

export interface CalendarResponse {
  success: boolean;
  count: number;
  events: CalendarEvent[];
}

// Fetch recent emails
export async function fetchEmails(count: number = 5): Promise<Email[]> {
  console.log('Fetching emails from:', `${API_BASE_URL}/quick/emails/${count}`);

  try {
    const response = await fetch(`${API_BASE_URL}/quick/emails/${count}`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
    });

    console.log('Email response status:', response.status);

    if (!response.ok) {
      console.error('Email fetch failed:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data: EmailResponse = await response.json();
    console.log('✅ Emails received:', data.emails?.length || 0, 'emails');
    if (data.emails?.length > 0) {
      console.log('First email:', data.emails[0].subject, 'from', data.emails[0].from);
    }
    return data.emails || [];
  } catch (error) {
    console.error('Error fetching emails:', error);
    console.log('🔄 Using mock email data due to API error');

    // Return mock data that matches your real emails
    return [
      {
        id: "mock1",
        subject: "Security alert",
        from: "Google <no-reply@accounts.google.com>",
        date: new Date().toISOString(),
        preview: "You allowed Composio access to some of your Google Account data..."
      },
      {
        id: "mock2",
        subject: "Partnership Inquiry Response",
        from: "Business Partner <partner@example.com>",
        date: new Date(Date.now() - 3600000).toISOString(),
        preview: "Thank you for reaching out! We'd be happy to discuss potential collaboration..."
      },
      {
        id: "mock3",
        subject: "AI Startups Emulate China's Hardcore 9-9-6 Work Culture",
        from: "The Information <hello@theinformation.com>",
        date: new Date(Date.now() - 7200000).toISOString(),
        preview: "Read the latest article from The Information. Subscribe today..."
      }
    ];
  }
}

// Fetch today's calendar events
export async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  console.log('Fetching calendar from:', `${API_BASE_URL}/quick/calendar/today`);

  try {
    const response = await fetch(`${API_BASE_URL}/quick/calendar/today`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
    });

    console.log('Calendar response status:', response.status);

    if (!response.ok) {
      console.error('Calendar fetch failed:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data: CalendarResponse = await response.json();
    console.log('✅ Calendar events received:', data.events?.length || 0, 'events');
    return data.events || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    console.log('🔄 Using mock calendar data due to API error');

    // Return mock calendar events that would be typical for a workday
    return [
      {
        id: "mock1",
        summary: "Team Standup",
        start: {
          dateTime: new Date().toISOString().split('T')[0] + "T10:00:00",
        },
        end: {
          dateTime: new Date().toISOString().split('T')[0] + "T10:30:00",
        },
        description: "Daily sync with the team",
        location: "Conference Room A"
      },
      {
        id: "mock2",
        summary: "Client Review",
        start: {
          dateTime: new Date().toISOString().split('T')[0] + "T11:30:00",
        },
        end: {
          dateTime: new Date().toISOString().split('T')[0] + "T12:30:00",
        },
        description: "Q3 progress review with client",
        location: "Zoom"
      },
      {
        id: "mock3",
        summary: "Lunch Meeting",
        start: {
          dateTime: new Date().toISOString().split('T')[0] + "T14:00:00",
        },
        end: {
          dateTime: new Date().toISOString().split('T')[0] + "T15:00:00",
        },
        description: "Team lunch and planning session",
        location: "Downtown Restaurant"
      },
      {
        id: "mock4",
        summary: "1-on-1 with Manager",
        start: {
          dateTime: new Date().toISOString().split('T')[0] + "T16:30:00",
        },
        end: {
          dateTime: new Date().toISOString().split('T')[0] + "T17:00:00",
        },
        description: "Weekly sync",
        location: "Manager's Office"
      }
    ];
  }
}

// Fetch this week's calendar events
export async function fetchWeekEvents(): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/quick/calendar/week`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      console.error('Week calendar fetch failed:', response.status);
      return [];
    }

    const data: CalendarResponse = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching week events:', error);
    // Return empty for week view for now
    return [];
  }
}

// Create a quick meeting
export async function createQuickMeeting(
  title: string,
  date: string,
  time: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/quick/meet/${encodeURIComponent(title)}/${date}/${time}`,
      {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error creating meeting:', error);
    return false;
  }
}

// Format email data for display
export function formatEmailForDisplay(email: Email) {
  // Extract sender name from "Name <email@example.com>" format
  const fromMatch = email.from.match(/^([^<]+)(?:\s*<.*>)?$/);
  const senderName = fromMatch ? fromMatch[1].trim() : email.from;

  // Format date
  const emailDate = new Date(email.date);
  const now = new Date();
  const diffMs = now.getTime() - emailDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  let timeAgo = '';
  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    timeAgo = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    timeAgo = `${diffDays}d ago`;
  }

  return {
    id: email.id,
    platform: 'Gmail',
    from: senderName,
    preview: email.subject,
    fullMessage: `${email.subject}\n\n${email.preview}`,
    unread: true, // You might want to check actual read status
    timeAgo,
    date: emailDate,
  };
}

// Format calendar event for display
export function formatEventForDisplay(event: CalendarEvent) {
  const startDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date || '');
  const endDate = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date || '');

  const timeFormat = {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: true,
  };

  const startTime = event.start.dateTime
    ? startDate.toLocaleTimeString('en-US', timeFormat)
    : 'All Day';

  const endTime = event.end.dateTime
    ? endDate.toLocaleTimeString('en-US', timeFormat)
    : '';

  return {
    time: startTime,
    endTime,
    title: event.summary || 'Untitled Event',
    description: event.description || '',
    location: event.location || '',
    important: true, // You might want to add logic to determine importance
    isAllDay: !event.start.dateTime,
  };
}

// Get API summary
export async function getApiSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/quick/summary`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching API summary:', error);
    return null;
  }
}

// Check if APIs are available
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/quick/help`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
    });

    const isHealthy = response.ok;
    console.log('API health check:', isHealthy ? '✅ Connected' : '❌ Failed');
    return isHealthy;
  } catch (error) {
    console.error('API health check failed:', error);
    // Even if health check fails, we'll show mock data
    return false;
  }
}
