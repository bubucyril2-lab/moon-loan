import { format as dateFnsFormat } from 'date-fns';

/**
 * Safely parses a date string or number into a Date object.
 * Handles SQLite's CURRENT_TIMESTAMP format (YYYY-MM-DD HH:MM:SS).
 */
export const safeDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  
  // If it's a string from SQLite (YYYY-MM-DD HH:MM:SS), convert to ISO format
  if (typeof dateVal === 'string' && dateVal.includes(' ') && !dateVal.includes('T')) {
    dateVal = dateVal.replace(' ', 'T');
    // If it doesn't have a timezone, assume UTC (since SQLite CURRENT_TIMESTAMP is UTC)
    if (!dateVal.includes('Z') && !dateVal.includes('+')) {
      dateVal += 'Z';
    }
  }
  
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date value encountered:', dateVal);
    return new Date();
  }
  return date;
};

/**
 * Safely formats a date using date-fns.
 */
export const safeFormat = (dateVal: any, formatStr: string): string => {
  try {
    return dateFnsFormat(safeDate(dateVal), formatStr);
  } catch (error) {
    console.error('Error formatting date:', error, dateVal);
    return 'N/A';
  }
};
