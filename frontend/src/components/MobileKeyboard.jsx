import React, { useState } from 'react'

const MobileKeyboard = ({ isOpen, onClose, onKeyPress, currentValue = '' }) => {
  const [capsLock, setCapsLock] = useState(false)
  
  const keyboardLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ['CAPS', 'SPACE', 'BACKSPACE', 'ENTER']
  ]

  const specialKeys = {
    'SPACE': ' ',
    'BACKSPACE': 'Backspace',
    'ENTER': 'Enter',
    'CAPS': 'CapsLock'
  }

  const handleKeyPress = (key) => {
    if (key === 'CAPS') {
      setCapsLock(!capsLock)
      return
    }
    
    if (specialKeys[key]) {
      onKeyPress(specialKeys[key])
    } else {
      const finalKey = capsLock ? key.toUpperCase() : key
      onKeyPress(finalKey)
    }
  }

  if (!isOpen) return null

  return (
    <div className="mobile-keyboard open">
      <div className="keyboard-header">
        <span>TERMINAL KEYBOARD</span>
        <button className="keyboard-close" onClick={onClose}>×</button>
      </div>
      
      <div className="typing-preview">
        <div className="preview-label">TYPING:</div>
        <div className="preview-text">{currentValue}<span className="cursor">█</span></div>
      </div>
      
      <div className="keyboard-grid">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => {
              const displayKey = key === 'SPACE' ? '___' : 
                                key === 'CAPS' ? (capsLock ? 'CAPS ON' : 'CAPS') :
                                capsLock && !specialKeys[key] ? key.toUpperCase() : key
              
              return (
                <button
                  key={key}
                  className={`keyboard-key ${
                    key === 'SPACE' ? 'space' : ''
                  } ${
                    specialKeys[key] ? 'special' : ''
                  } ${
                    key === 'CAPS' && capsLock ? 'caps-active' : ''
                  }`}
                  onClick={() => handleKeyPress(key)}
                >
                  {displayKey}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MobileKeyboard