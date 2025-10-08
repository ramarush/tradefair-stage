/**
 * Format a date to show full timestamp with milliseconds
 * @param date - Date object or string
 * @returns Formatted timestamp string
 */
export const formatTimestampWithMs = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
  }).format(dateObj);
};

/**
 * Format a date for display in admin tables
 * @param date - Date object or string
 * @returns Formatted date string for tables
 */
export const formatTableTimestamp = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const formatted = formatTimestampWithMs(dateObj);
  return formatted.replace(',', '');
};

/**
 * Get relative time with millisecond precision
 * @param date - Date object or string
 * @returns Relative time string
 */
export const getRelativeTimeWithMs = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  
  if (diffMs < 1000) {
    return `${diffMs}ms ago`;
  } else if (diffMs < 60000) {
    return `${Math.floor(diffMs / 1000)}s ago`;
  } else if (diffMs < 3600000) {
    return `${Math.floor(diffMs / 60000)}m ago`;
  } else {
    return formatTableTimestamp(dateObj);
  }
};
