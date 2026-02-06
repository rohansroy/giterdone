import type { User } from '../types';

export function getInitials(user: User): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  if (user.first_name) {
    return user.first_name.slice(0, 2).toUpperCase();
  }
  // Use first 2 letters of email
  return user.email.slice(0, 2).toUpperCase();
}

export function getAvatarUrl(user: User, size: number = 40): string {
  const seed = user.email;
  const style = user.avatar_style || 'initials';

  if (style === 'initials') {
    const initials = getInitials(user);
    // Use DiceBear initials style
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}&size=${size}`;
  }

  // Other DiceBear styles
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

export const AVATAR_STYLES = [
  { value: 'initials', label: 'Initials' },
  { value: 'adventurer', label: 'Adventurer' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'bottts', label: 'Bottts (Robot)' },
  { value: 'fun-emoji', label: 'Fun Emoji' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'micah', label: 'Micah' },
  { value: 'notionists', label: 'Notionists' },
  { value: 'pixel-art', label: 'Pixel Art' },
];
