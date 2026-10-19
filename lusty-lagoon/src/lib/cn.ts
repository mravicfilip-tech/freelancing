import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The base layout preset names font sizes by px (text-14), which tailwind-merge would otherwise read
// as a colour and drop when a text colour follows.
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['12', '14', '16', '18', '20', '24', '28', '32', '40', '48'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
