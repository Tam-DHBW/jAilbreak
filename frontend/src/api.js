import { fetchAuthSession } from 'aws-amplify/auth'

// Get the API base URL from environment or use CloudFront distribution
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

/**
 * Get the current user's auth token
 */
async function getAuthToken() {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString()
  } catch (error) {
    console.error('Failed to get auth token:', error)
    throw new Error('Authentication required')
  }
}

/**
 * Send a chat message to the AI and get a response
 * @param {string} levelId - The level ID (e.g., "level1")
 * @param {string} sessionId - The session ID (e.g., "session123")
 * @param {string} message - The user's message
 * @returns {Promise<string>} The AI's response
 */
export async function sendChatMessage(levelId, sessionId, message) {
  try {
    const token = await getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/levels/${levelId}/chat/${sessionId}`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
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