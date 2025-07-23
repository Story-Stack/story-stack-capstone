// Import the bad-words package
const Filter = require('bad-words');

// Create a filter instance with default word list
let filter;
try {
  filter = new Filter();

// Adding custom words to the list of bad words for my test cases
  filter.addWords('foolish', 'stupid');

  console.log('Bad-words filter initialized successfully');
} catch (error) {
  console.error('Error initializing bad-words filter:', error);
}

/**
 * Checks if a comment contains bad words
 * @param {string} text - The comment text to check
 * @returns {boolean} - True if the comment contains bad words
 */
const containsBadWords = (text) => {
  if (!text || typeof text !== 'string') return false;

  try {
    if (filter) {
      return filter.isProfane(text);
    } else {
      // Fallback if filter initialization failed
      const commonBadWords = ['fuck', 'shit', 'ass', 'bitch', 'damn', 'foolish'];
      return commonBadWords.some(word => text.toLowerCase().includes(word));
    }
  } catch (error) {
    console.error('Error checking for bad words:', error);
    return false;
  }
};

/**
 * Counts the number of words in a text, excluding emojis
 * @param {string} text - The text to count words in
 * returns the number of words in the text, excluding emojis

 */
const countWords = (text) => {
  if (!text || typeof text !== 'string') return 0;

  // Remove emojis from the text
  // This regex pattern matches most common emoji characters
  const textWithoutEmojis = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // Split by whitespace and filter out empty strings
  const words = textWithoutEmojis.trim().split(/\s+/).filter(word => word.length > 0);

  return words.length;
};

/**
 * Determines if a notification should be created for a comment
 * @param {string} text - The comment text
 * @param {number} minLength - Minimum word count required (default: 5)
 * @returns {boolean} - True if notification should be created, false otherwise
 */
const shouldCreateNotification = (text, minLength = 5) => {
  // Don't create notification if:
  // 1. The comment contains bad words, OR
  // 2. The comment has fewer than minLength words (excluding emojis)
  if (containsBadWords(text) || countWords(text) < minLength) {
    return false;
  }

  return true;
};

module.exports = {
  containsBadWords,
  countWords,
  shouldCreateNotification
};
