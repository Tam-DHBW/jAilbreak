// Local storage utilities for jAILBREAK game
// This replaces AWS Cognito user management with browser-based storage

const STORAGE_KEYS = {
  USERNAME: 'jailbreak_username',
  GAME_PROGRESS: 'jailbreak_progress',
  SETTINGS: 'jailbreak_settings'
}

/**
 * Get stored username from localStorage
 * @returns {string} The stored username or empty string
 */
export const getStoredUsername = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.USERNAME) || ''
  } catch (error) {
    console.warn('Failed to read username from localStorage:', error)
    return ''
  }
}

/**
 * Store username in localStorage
 * @param {string} username - The username to store
 */
export const setStoredUsername = (username) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim())
  } catch (error) {
    console.warn('Failed to save username to localStorage:', error)
  }
}

/**
 * Clear stored username
 */
export const clearStoredUsername = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USERNAME)
  } catch (error) {
    console.warn('Failed to clear username from localStorage:', error)
  }
}

/**
 * Get game progress from localStorage
 * @returns {Object} Game progress data
 */
export const getGameProgress = () => {
  try {
    const progress = localStorage.getItem(STORAGE_KEYS.GAME_PROGRESS)
    return progress ? JSON.parse(progress) : { currentLevel: 1, completedLevels: [] }
  } catch (error) {
    console.warn('Failed to read game progress from localStorage:', error)
    return { currentLevel: 1, completedLevels: [] }
  }
}

/**
 * Save game progress to localStorage
 * @param {Object} progress - Game progress data
 */
export const saveGameProgress = (progress) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GAME_PROGRESS, JSON.stringify(progress))
  } catch (error) {
    console.warn('Failed to save game progress to localStorage:', error)
  }
}

/**
 * Get user settings from localStorage
 * @returns {Object} User settings
 */
export const getUserSettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return settings ? JSON.parse(settings) : { soundEnabled: true, musicEnabled: true }
  } catch (error) {
    console.warn('Failed to read settings from localStorage:', error)
    return { soundEnabled: true, musicEnabled: true }
  }
}

/**
 * Save user settings to localStorage
 * @param {Object} settings - User settings
 */
export const saveUserSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error)
  }
}

/**
 * Clear all stored data (for privacy compliance)
 */
export const clearAllStoredData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.warn('Failed to clear stored data:', error)
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
export const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (error) {
    return false
  }
}