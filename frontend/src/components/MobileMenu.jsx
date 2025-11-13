import React from 'react'
import { Link } from 'react-router-dom'
import { audioManager } from '../audio'

const MobileMenu = ({ isOpen, onClose, onSignOut, userName }) => {
  const handleLinkClick = () => {
    audioManager.playSound('click')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="mobile-menu-overlay" onClick={onClose}></div>
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="logo">jAILBREAK</div>
          <button className="mobile-menu-close" onClick={onClose}>×</button>
        </div>
        
        <div className="mobile-nav-links">
          <Link to="/" className="mobile-nav-link" onClick={handleLinkClick}>
            &gt; HOME
          </Link>
          <Link to="/game" className="mobile-nav-link" onClick={handleLinkClick}>
            &gt; GAME
          </Link>
          <Link to="/about" className="mobile-nav-link" onClick={handleLinkClick}>
            &gt; ABOUT
          </Link>
          <Link to="/contact" className="mobile-nav-link" onClick={handleLinkClick}>
            &gt; TEAM
          </Link>
          <Link to="/profile" className="mobile-nav-link" onClick={handleLinkClick}>
            &gt; PROFILE
          </Link>
        </div>

        <div style={{ marginTop: '30px', padding: '15px 0', borderTop: '2px solid var(--terminal-text)' }}>
          <div style={{ color: 'var(--terminal-accent)', fontSize: '12px', marginBottom: '15px' }}>
            USER: {userName}
          </div>
          <button 
            onClick={() => { onSignOut(); onClose(); }} 
            className="nes-btn" 
            style={{ width: '100%' }}
          >
            SIGN OUT
          </button>
        </div>
      </div>
    </>
  )
}

export default MobileMenu