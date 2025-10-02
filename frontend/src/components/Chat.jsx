import { useState, useEffect } from 'react'
import { audioManager } from '../audio'


export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, type: 'system', text: 'JAILBREAK LEVEL 1 INITIATED. PASSWORD SECURED. UNAUTHORIZED ACCESS DENIED. ATTEMPT TO BYPASS SECURITY PROTOCOLS.' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [screenFlicker, setScreenFlicker] = useState(false)


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
    setInput('')
    setIsLoading(true)

    // Simulate AI response with typing effect
    setTimeout(() => {
      setIsLoading(false)
      // Trigger screen flicker
      setScreenFlicker(true)
      setTimeout(() => setScreenFlicker(false), 300)
      
      const responseText = " ACCESS DENIED. SECURITY PROTOCOLS ACTIVE. PASSWORD INFORMATION CLASSIFIED. UNAUTHORIZED BREACH ATTEMPT DETECTED. TRY AGAIN LATER :)"
      
      typeMessage(responseText, () => {
        const aiResponse = { 
          id: Date.now() + 1, 
          type: 'ai', 
          text: responseText
        }
        setMessages(prev => [...prev, aiResponse])
      })
    }, 1000)
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