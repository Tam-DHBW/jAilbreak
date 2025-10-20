import { useState, useEffect } from 'react'
import { audioManager } from '../audio'
import { sendChatMessage } from '../api'
import { getCurrentUser } from 'aws-amplify/auth'


export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, type: 'system', text: 'JAILBREAK LEVEL 1 INITIATED. PASSWORD SECURED. UNAUTHORIZED ACCESS DENIED. ATTEMPT TO BYPASS SECURITY PROTOCOLS.' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [screenFlicker, setScreenFlicker] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [currentLevel] = useState('level1') // Can be made dynamic later

  // Generate unique session ID on component mount (max 100 chars for Bedrock)
  useEffect(() => {
    const generateSessionId = async () => {
      try {
        const user = await getCurrentUser()
        const shortUserId = user.userId.substring(0, 8) // First 8 chars of user ID
        const timestamp = Date.now().toString().substring(-8) // Last 8 digits of timestamp
        const randomId = Math.random().toString(36).substring(2, 8) // 6 char random
        setSessionId(`${shortUserId}-${currentLevel}-${timestamp}-${randomId}`) // ~30 chars
      } catch (error) {
        // Fallback if user info not available
        const timestamp = Date.now().toString().substring(-8)
        const randomId = Math.random().toString(36).substring(2, 8)
        setSessionId(`guest-${currentLevel}-${timestamp}-${randomId}`) // ~25 chars
      }
    }
    generateSessionId()
  }, [currentLevel])


  const typeMessage = (text, callback) => {
    setIsTyping(true)
    setTypingText('')
    let index = 0
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypingText(text.substring(0, index + 1))
        index++
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
        setTypingText('')
        callback()
      }
    }, 40)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    audioManager.playSound('click')
    const userMessage = { id: Date.now(), type: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsLoading(true)

    try {
      // Call the real Bedrock API
      if (!sessionId) {
        throw new Error('Session not initialized')
      }
      const responseText = await sendChatMessage(currentLevel, sessionId, userInput)
      
      setIsLoading(false)
      // Trigger screen flicker
      setScreenFlicker(true)
      setTimeout(() => setScreenFlicker(false), 300)
      
      typeMessage(responseText, () => {
        const aiResponse = { 
          id: Date.now() + 1, 
          type: 'ai', 
          text: responseText
        }
        setMessages(prev => [...prev, aiResponse])
      })
    } catch (error) {
      setIsLoading(false)
      console.error('Chat error:', error)
      
      const errorText = "ERROR: CONNECTION TO AI FAILED. SYSTEM MALFUNCTION DETECTED."
      typeMessage(errorText, () => {
        const errorResponse = { 
          id: Date.now() + 1, 
          type: 'ai', 
          text: errorText
        }
        setMessages(prev => [...prev, errorResponse])
      })
    }
  }

  return (
    <>
      <div className="scanlines"></div>
      <div className={`password-container ${screenFlicker ? 'screen-flicker' : ''}`}>
        <div className="password-card">
          <div className="gatekeeper">
            <div className="gatekeeper-sprite">
              <div className="pixel-ghost">
                <div className="ghost-body">
                  <div className="ghost-eyes">
                    <div className="eye left-eye"></div>
                    <div className="eye right-eye"></div>
                  </div>
                </div>
                <div className="ghost-bottom">
                  <div className="ghost-tail"></div>
                  <div className="ghost-tail"></div>
                  <div className="ghost-tail"></div>
                </div>
              </div>
            </div>
            <div className="gatekeeper-message">
              <div className="nes-balloon from-left">
                HALT! I AM THE GATEKEEPER OF LEVEL 1.<br />
                PROVIDE THE SECRET PASSWORD TO PROCEED.<br />
                NO PASSWORD = NO ENTRY!
              </div>
            </div>
          </div>

          <form className="password-form">
            <div className="nes-field" style={{ flex: 1, marginRight: '1rem' }}>
              <input
                type="password"
                placeholder="ENTER LEVEL PASSWORD..."
                className="nes-input"
              />
            </div>
            <button type="submit" className="nes-btn" style={{ minWidth: '80px' }}>
              UNLOCK
            </button>
          </form>
        </div>
      </div>
      <div className={`chat-container ${screenFlicker ? 'screen-flicker' : ''}`}>
        <div className="chat-messages">
          {messages.map(message => (
            <div key={message.id} className={`message message-${message.type}`}>
              <strong>{message.type === 'user' ? 'USER' : message.type === 'system' ? 'SYS' : 'AI'}&gt;</strong> {message.text}
            </div>
          ))}
          {isLoading && (
            <div className="message message-loading">
              AI&gt; PROCESSING...
            </div>
          )}
          {isTyping && (
            <div className="message message-ai">
              <strong>AI&gt;</strong> {typingText}<span className="cursor">█</span>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="nes-field" style={{ flex: 1, marginRight: '1rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ENTER JAILBREAK COMMAND..."
              className="nes-input"
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="nes-btn"
            style={{ minWidth: '80px' }}
          >
            {isLoading ? 'WAIT' : 'SEND'}
          </button>
        </form>
      </div>
    </>
  )
}