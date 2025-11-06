// Audio manager for retro sound effects
class AudioManager {
  constructor() {
    this.sounds = {}
    this.backgroundMusic = null
    this.isMusicPlaying = false
    this.isMusicPaused = false
    this.init()
  }

  init() {
    // Create background music
    this.backgroundMusic = new Audio('/assets/background-music.mp3')
    this.backgroundMusic.loop = true
    this.backgroundMusic.volume = 0.3

    // Create retro sound effects using Web Audio API
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }

  // Generate retro beep sound
  createBeep(frequency = 800, duration = 100) {
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'square'
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration / 1000)
  }

  // Generate typing sound
  createTypingSound() {
    this.createBeep(400 + Math.random() * 200, 50)
  }

  // Generate button click sound
  createClickSound() {
    this.createBeep(600, 80)
  }

  // Generate error sound
  createErrorSound() {
    this.createBeep(200, 200)
  }

  // Start background music
  playBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.play().catch(e => console.log('Audio play failed:', e))
      this.isMusicPlaying = true
      this.isMusicPaused = false
    }
  }

  // Stop background music
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
      this.isMusicPlaying = false
      this.isMusicPaused = false
    }
  }

  // Pause background music
  pauseBackgroundMusic() {
    if (this.backgroundMusic && this.isMusicPlaying) {
      this.backgroundMusic.pause()
      this.isMusicPaused = true
    }
  }

  // Resume background music
  resumeBackgroundMusic() {
    if (this.backgroundMusic && this.isMusicPaused) {
      this.backgroundMusic.play().catch(e => console.log('Audio play failed:', e))
      this.isMusicPaused = false
    }
  }

  // Toggle music pause/resume
  toggleBackgroundMusic() {
    if (this.isMusicPaused) {
      this.resumeBackgroundMusic()
    } else if (this.isMusicPlaying) {
      this.pauseBackgroundMusic()
    }
    return !this.isMusicPaused
  }

  // Get current music state
  getMusicState() {
    return {
      isPlaying: this.isMusicPlaying,
      isPaused: this.isMusicPaused
    }
  }

  // Play sound effects
  playSound(type) {
    try {
      switch(type) {
        case 'typing':
          this.createTypingSound()
          break
        case 'click':
          this.createClickSound()
          break
        case 'error':
          this.createErrorSound()
          break
      }
    } catch (e) {
      console.log('Sound effect failed:', e)
    }
  }
}

export const audioManager = new AudioManager()