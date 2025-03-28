/**
 * Utility functions for handling time and date
 */

/**
 * Returns the current date and time in a structured format
 */
export function getCurrentTime() {
  const now = new Date();

  return {
    timestamp: now.getTime(),
    iso: now.toISOString(),
    utc: now.toUTCString(),
    local: now.toString(),
    formatted: {
      date: now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
}

/**
 * Returns a human-readable relative time (e.g., "2 hours ago")
 */
export function getRelativeTimeString(date: Date | number): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
}

/**
 * Returns a formatted string with current time information to be included in system prompts
 * This allows the LLM to be aware of the current date and time
 */
export function getCurrentTimeForSystemPrompt(): string {
  const now = new Date();

  return `Current date and time information:
- Current date: ${now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
- Current time: ${now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}
- Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
- ISO timestamp: ${now.toISOString()}
- Unix timestamp: ${Math.floor(now.getTime() / 1000)}`;
}
