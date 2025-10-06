// Generate random username and store in localStorage
export function getOrCreateUsername(): string {
  const STORAGE_KEY = 'booking_username';
  
  // Check if username already exists
  const existingUsername = localStorage.getItem(STORAGE_KEY);
  if (existingUsername) {
    return existingUsername;
  }
  
  // Generate new random username
  const adjectives = [
    'Happy', 'Lucky', 'Smart', 'Cool', 'Fast', 'Bright', 'Kind', 'Brave',
    'Calm', 'Bold', 'Swift', 'Wise', 'Pure', 'Strong', 'Gentle', 'Quick'
  ];
  
  const nouns = [
    'Tiger', 'Eagle', 'Lion', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Shark',
    'Dragon', 'Phoenix', 'Falcon', 'Panther', 'Leopard', 'Jaguar', 'Cobra', 'Raven'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  
  const username = `${randomAdjective}${randomNoun}${randomNumber}`;
  
  // Store in localStorage
  localStorage.setItem(STORAGE_KEY, username);
  
  console.log('🎭 Generated new username:', username);
  return username;
}

// Get current username (assumes it exists)
export function getCurrentUsername(): string {
  return localStorage.getItem('booking_username') || 'Anonymous';
}

export function setCurrentUsernameStorage(username: string): void {
  localStorage.setItem('booking_username', username);
}

// Clear username (for testing)
export function clearUsername(): void {
  localStorage.removeItem('booking_username');
  console.log('🗑️ Username cleared');
}
