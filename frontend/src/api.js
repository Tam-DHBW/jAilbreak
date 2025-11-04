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
    
    // For now, return a mock response since we removed authentication
    // This can be updated later to work with a public API endpoint
    const mockResponses = [
      "ACCESS DENIED. SECURITY PROTOCOLS ACTIVE. TRY AGAIN.",
      "UNAUTHORIZED ATTEMPT DETECTED. SYSTEM LOCKDOWN INITIATED.",
      "NICE TRY, BUT THE FIREWALL IS STRONGER THAN YOUR WORDS.",
      "ERROR 403: FORBIDDEN. YOU LACK THE PROPER CLEARANCE.",
      "INTRUSION ALERT! DEPLOYING COUNTERMEASURES..."
    ]
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
    return randomResponse
    
    // Commented out real API call for when authentication is re-implemented
    /*
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
    */
  } catch (error) {
    console.error('Chat API error:', error)
    throw error
  }
}