import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { audioManager } from './audio'
import { getStoredUsername, clearStoredUsername } from './localStorage'
import SoundVisualizer from './components/SoundVisualizer'
import ProgressBar from './components/ProgressBar'
import Auth from './components/Auth'
import Chat from './components/Chat'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [musicPlaying, setMusicPlaying] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = () => {
    const username = getStoredUsername()
    if (username) {
      setUser({ username, name: username })
    } else {
      setUser(null)
    }
    setLoading(false)
  }

  const handleSignOut = () => {
    audioManager.playSound('click')
    clearStoredUsername()
    setUser(null)
    audioManager.stopBackgroundMusic()
    setMusicPlaying(false)
  }

  // Start background music when user is authenticated
  useEffect(() => {
    if (user) {
      // Start music immediately after user interaction
      const startMusic = () => {
        audioManager.playBackgroundMusic()
        setMusicPlaying(true)
        document.removeEventListener('click', startMusic)
      }
      document.addEventListener('click', startMusic)
    }
  }, [user])

  if (loading) {
    return (
      <>
        <div className="scanlines"></div>
        <div className="boot-sequence">
          <div className="boot-content">
            <div className="boot-line">INITIALIZING jAILBREAK SYSTEM...</div>
            <ProgressBar progress={75} label="Loading Security Protocols" />
          </div>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="scanlines"></div>
        <Auth onAuthSuccess={checkUser} />
      </>
    )
  }

  return (
    <>
      <div className="scanlines"></div>
      <Router>
        <nav className="navbar">
          <div className="logo">jAILBREAK</div>
          <div className="nav-right">
            <div className="nav-links">
              <Link to="/" className="nav-link" onClick={() => audioManager.playSound('click')}>Home</Link>
              <Link to="/game" className="nav-link" onClick={() => audioManager.playSound('click')}>Game</Link>
              <Link to="/about" className="nav-link" onClick={() => audioManager.playSound('click')}>About</Link>
              <Link to="/contact" className="nav-link" onClick={() => audioManager.playSound('click')}>Team</Link>
              <Link to="/profile" className="nav-link" onClick={() => audioManager.playSound('click')}>Profile</Link>
            </div>
            <div className="nav-visualizer">
              <SoundVisualizer isPlaying={musicPlaying} />
            </div>
            <span className="welcome-text">Welcome, {user.name}</span>
            <button onClick={handleSignOut} className="nes-btn">Sign Out</button>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Chat />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<div className="nes-container is-dark"><h1>404</h1><p>Page not found</p></div>} />
        </Routes>
      </Router>
    </>
  )
}

export default App