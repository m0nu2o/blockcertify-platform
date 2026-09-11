
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);
export const formatDate = (value: string | Date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
