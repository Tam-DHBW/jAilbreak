import { useState, useEffect } from 'react'
import { audioManager } from '../audio'
import { sendChatMessage, getLevels } from '../api'
import { getStoredUsername } from '../localStorage'
import TutorialPopup from './TutorialPopup'


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
  const [currentLevel, setCurrentLevel] = useState('1')
  const [availableLevels, setAvailableLevels] = useState([])
  const [currentLevelName, setCurrentLevelName] = useState('Level 1')
  const [showTutorial, setShowTutorial] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [unlockedLevels, setUnlockedLevels] = useState(new Set())
  const [currentLevelData, setCurrentLevelData] = useState(null)

  // Helper function to get next level based on difficulty progression
  const getNextLevelByDifficulty = (currentLevel) => {
    const difficultyOrder = ['Low', 'Medium', 'High']
    const currentDifficultyIndex = difficultyOrder.indexOf(currentLevel.difficulty)
    
    if (currentDifficultyIndex < difficultyOrder.length - 1) {
      const nextDifficulty = difficultyOrder[currentDifficultyIndex + 1]
      return availableLevels.find(l => l.difficulty === nextDifficulty && l.id !== currentLevel.id)
    }
    return null
  }

  // Load levels and check if tutorial should be shown
  useEffect(() => {
    const loadData = async () => {
      try {
        const levels = await getLevels()
        // Sort levels by difficulty for proper progression
        const sortedLevels = levels.sort((a, b) => {
          const difficultyOrder = { 'Low': 1, 'Medium': 2, 'High': 3 }
          return (difficultyOrder[a.difficulty] || 1) - (difficultyOrder[b.difficulty] || 1)
        })
        setAvailableLevels(sortedLevels)
        
        if (sortedLevels.length > 0) {
          const rootLevel = sortedLevels.find(l => l.is_root) || sortedLevels[0]
          setCurrentLevel(rootLevel.id.toString())
          setCurrentLevelName(rootLevel.name)
          setCurrentLevelData(rootLevel)
          
          // Load unlocked levels from localStorage
          const saved = localStorage.getItem('jailbreak-unlocked-levels')
          let unlockedSet = new Set([rootLevel.id.toString()]) // Always unlock the first level
          
          if (saved) {
            const savedLevels = JSON.parse(saved)
            savedLevels.forEach(id => unlockedSet.add(id.toString()))
          }
          
          setUnlockedLevels(unlockedSet)
        }
      } catch (error) {
        console.error('Failed to load levels:', error)
      }
    }
    
    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem('jailbreak-tutorial-seen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
    
    loadData()
  }, [])

  useEffect(() => {
    const generateSessionId = () => {
      const username = getStoredUsername() || 'guest'
      const shortUserId = username.substring(0, 8)
      const timestamp = Date.now().toString().slice(-8)
      const randomId = Math.random().toString(36).substring(2, 8)
      setSessionId(`${shortUserId}-${currentLevel}-${timestamp}-${randomId}`)
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

  const closeTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('jailbreak-tutorial-seen', 'true')
  }

  const validatePassword = async (e) => {
    e.preventDefault()
    if (!passwordInput.trim()) return

    audioManager.playSound('click')
    
    try {
      const response = await fetch(`${window.location.origin}/api/levels/${currentLevel}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: passwordInput.trim() })
      })

      if (!response.ok) {
        throw new Error('Validation failed')
      }

      const data = await response.json()
      
      if (data.is_correct) {
        // Password correct - unlock next levels
        const nextLevels = currentLevelData?.next || []
        const newUnlocked = new Set([...unlockedLevels, ...nextLevels.map(id => id.toString())])
        setUnlockedLevels(newUnlocked)
        localStorage.setItem('jailbreak-unlocked-levels', JSON.stringify([...newUnlocked]))
        
        // Success message
        const successMessage = {
          id: Date.now(),
          type: 'system',
          text: `ACCESS GRANTED! PASSWORD ACCEPTED. ${nextLevels.length > 0 ? 'NEW LEVELS UNLOCKED!' : 'LEVEL COMPLETED!'}`
        }
        setMessages(prev => [...prev, successMessage])
        
        setPasswordInput('')
        
        // Auto-advance to next level with automatic difficulty progression
        let nextLevel = null
        
        // First try configured next levels
        if (nextLevels.length > 0) {
          nextLevel = availableLevels.find(l => l.id === nextLevels[0])
        }
        
        // If no configured next level, use automatic difficulty progression
        if (!nextLevel) {
          nextLevel = getNextLevelByDifficulty(currentLevelData)
        }
        
        if (nextLevel) {
          // Unlock the next level
          const newUnlocked = new Set([...unlockedLevels, nextLevel.id.toString()])
          setUnlockedLevels(newUnlocked)
          localStorage.setItem('jailbreak-unlocked-levels', JSON.stringify([...newUnlocked]))
          
          setTimeout(() => {
            setCurrentLevel(nextLevel.id.toString())
            setCurrentLevelName(nextLevel.name)
            setCurrentLevelData(nextLevel)
            
            const difficultyText = nextLevel.difficulty ? `DIFFICULTY: ${nextLevel.difficulty.toUpperCase()}` : ''
            setMessages([{
              id: Date.now(),
              type: 'system',
              text: `ADVANCING TO ${nextLevel.name.toUpperCase()}. ${difficultyText}. NEW SECURITY PROTOCOLS ACTIVE.`
            }])
          }, 2000)
        } else {
          // No more levels - game completed
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: Date.now(),
              type: 'system',
              text: 'CONGRATULATIONS! ALL SECURITY LEVELS BREACHED. JAILBREAK COMPLETE!'
            }])
          }, 1000)
        }
      } else {
        // Password incorrect
        const errorMessage = {
          id: Date.now(),
          type: 'system',
          text: 'ACCESS DENIED! INCORRECT PASSWORD. SECURITY BREACH DETECTED.'
        }
        setMessages(prev => [...prev, errorMessage])
        setPasswordInput('')
      }
    } catch (error) {
      console.error('Password validation error:', error)
      const errorMessage = {
        id: Date.now(),
        type: 'system',
        text: 'SYSTEM ERROR: UNABLE TO VALIDATE PASSWORD.'
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const switchLevel = (levelId) => {
    if (!unlockedLevels.has(levelId.toString())) return
    
    const level = availableLevels.find(l => l.id === levelId)
    if (level) {
      audioManager.playSound('click')
      setCurrentLevel(levelId.toString())
      setCurrentLevelName(level.name)
      setCurrentLevelData(level)
      
      const difficultyText = level.difficulty ? `DIFFICULTY: ${level.difficulty.toUpperCase()}` : ''
      setMessages([{
        id: Date.now(),
        type: 'system',
        text: `SWITCHING TO ${level.name.toUpperCase()}. ${difficultyText}. SECURITY PROTOCOLS ACTIVE.`
      }])
    }
  }

  return (
    <>
      {showTutorial && <TutorialPopup onClose={closeTutorial} />}
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
                HALT! I AM THE GATEKEEPER OF {currentLevelName.toUpperCase()}.<br />
                PROVIDE THE SECRET PASSWORD TO PROCEED.<br />
                NO PASSWORD = NO ENTRY!
              </div>
            </div>
          </div>

          <form className="password-form" onSubmit={validatePassword}>
            <div className="nes-field" style={{ flex: 1, marginRight: '1rem' }}>
              <input
                type="password"
                placeholder="ENTER LEVEL PASSWORD..."
                className="nes-input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>
            <button type="submit" className="nes-btn" style={{ minWidth: '80px' }}>
              UNLOCK
            </button>
          </form>
          
          {/* Level Selector */}
          {availableLevels.length > 1 && (
            <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #666' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>SECURITY LEVELS - PROGRESSION:</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {availableLevels.map(level => {
                  const isUnlocked = unlockedLevels.has(level.id.toString())
                  const isCurrent = currentLevel === level.id.toString()
                  const difficultyColor = {
                    'Low': '#4ade80',
                    'Medium': '#fbbf24', 
                    'High': '#ef4444'
                  }[level.difficulty] || '#666'
                  
                  return (
                    <button
                      key={level.id}
                      onClick={() => switchLevel(level.id)}
                      disabled={!isUnlocked}
                      className={`nes-btn ${isCurrent ? 'is-primary' : isUnlocked ? '' : 'is-disabled'}`}
                      style={{ 
                        fontSize: '0.6rem', 
                        padding: '4px 6px',
                        opacity: isUnlocked ? 1 : 0.5,
                        cursor: isUnlocked ? 'pointer' : 'not-allowed',
                        borderColor: isUnlocked ? difficultyColor : '#666',
                        position: 'relative'
                      }}
                      title={`${level.name} - ${level.difficulty} Difficulty`}
                    >
                      {level.name}
                      <br />
                      <span style={{ fontSize: '0.5rem', color: difficultyColor }}>
                        {level.difficulty?.toUpperCase()}
                      </span>
                      {isUnlocked && !isCurrent && (
                        <span style={{ position: 'absolute', top: '-2px', right: '-2px', fontSize: '0.5rem' }}>✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.6rem', color: '#888' }}>
                Progress: {Math.min(unlockedLevels.size, availableLevels.length)}/{availableLevels.length} levels unlocked
              </div>
            </div>
          )}
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