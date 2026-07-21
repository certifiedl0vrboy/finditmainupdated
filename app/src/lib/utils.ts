import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUniqueFullDays(daysArray: string[]): string[] {
  if (!daysArray || !Array.isArray(daysArray)) return [];
  
  const daysMap: Record<string, string> = {
    'mon': 'Monday', 'monday': 'Monday',
    'tue': 'Tuesday', 'tuesday': 'Tuesday',
    'wed': 'Wednesday', 'wednesday': 'Wednesday',
    'thu': 'Thursday', 'thursday': 'Thursday',
    'fri': 'Friday', 'friday': 'Friday',
    'sat': 'Saturday', 'saturday': 'Saturday',
    'sun': 'Sunday', 'sunday': 'Sunday'
  };

  const uniqueFullDays = new Set<string>();
  daysArray.forEach(day => {
    const fullDay = daysMap[day.toLowerCase()];
    if (fullDay) uniqueFullDays.add(fullDay);
    else uniqueFullDays.add(day); // fallback
  });

  const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const result = orderedDays.filter(day => uniqueFullDays.has(day));
  
  // Include any custom days that weren't in the standard list
  uniqueFullDays.forEach(day => {
    if (!orderedDays.includes(day)) result.push(day);
  });
  
  return result;
}
