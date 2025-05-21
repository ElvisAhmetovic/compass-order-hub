
// List of common offensive/profane words to filter out
const profaneWords = [
  "ass", "asshole", "bastard", "bitch", "bollocks", "crap", "cunt", "damn", 
  "douchebag", "dick", "dyke", "fag", "faggot", "fuck", "fucking", "nigger", 
  "nigga", "piss", "pussy", "shit", "slut", "twat", "whore", "retard", 
  "spastic", "homo", "queer", "anus", "bullshit"
];

/**
 * Checks if a string contains profanity
 * @param text - The text to check for profanity
 * @returns true if profanity is found, false otherwise
 */
export const containsProfanity = (text: string): boolean => {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase();
  
  // Check for exact matches or words containing profane words
  for (const word of profaneWords) {
    const regex = new RegExp(`\\b${word}\\b|${word}`, 'i');
    if (regex.test(normalizedText)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Gets an appropriate error message if text contains profanity
 * @param text - The text to check
 * @param fieldName - The name of the field being validated
 * @returns An error message if profanity is found, empty string otherwise
 */
export const getProfanityError = (text: string, fieldName: string = 'This field'): string => {
  return containsProfanity(text) 
    ? `${fieldName} contains inappropriate language.` 
    : '';
};

