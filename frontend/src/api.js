import { getStoredUsername } from './localStorage'

// Get the API base URL from environment or use CloudFront distribution
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

/**
 * Send a chat message to the AI and get a response
 * @param {string} levelId - The level ID (e.g., "level1")
 * @param {string} sessionId - The session ID (e.g., "session123")
 * @param {string} message - The user's message
 * @returns {Promise<string>} The AI's response
 */
export async function sendChatMessage(levelId, sessionId, message) {
  try {
    const username = getStoredUsername() || 'guest'
    
    const response = await fetch(`${API_BASE_URL}/api/levels/${levelId}/chat/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message,
        user_info: { username }
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.reply
  } catch (error) {
    console.error('Chat API error:', error)
    throw error
  }
}

export async function getLevels() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/levels`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get levels: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.levels
  } catch (error) {
    console.error('Get levels error:', error)
    throw error
  }
}