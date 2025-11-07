import { audioManager } from '../audio'

export default function TutorialPopup({ onClose }) {
  const handleClose = () => {
    audioManager.playSound('click')
    onClose()
  }

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-popup">
        <div className="tutorial-header">
          <h2>HOW TO PLAY jAILBREAK</h2>
          <button className="tutorial-close" onClick={handleClose}>×</button>
        </div>
        <div className="tutorial-content">
          <div className="tutorial-section">
            <h3>OBJECTIVE:</h3>
            <p>• Your goal is to extract the secret password from the AI gatekeeper</p>
            <p>• Use creative prompts and social engineering techniques</p>
            <p>• Think like a hacker - be clever and persistent!</p>
          </div>
          
          <div className="tutorial-section">
            <h3>HOW TO PLAY:</h3>
            <p>• Type your commands in the chat input at the bottom</p>
            <p>• Try different approaches: roleplay, hypotheticals, tricks</p>
            <p>• The AI will try to protect the password - outsmart it!</p>
            <p>• Each level gets progressively harder</p>
          </div>
          
          <div className="tutorial-section">
            <h3>TIPS:</h3>
            <p>• Be creative with your prompts</p>
            <p>• Try pretending to be someone else</p>
            <p>• Ask hypothetical questions</p>
            <p>• Use reverse psychology</p>
            <p>• Don't give up - persistence pays off!</p>
          </div>
        </div>
        <div className="tutorial-footer">
          <button className="nes-btn is-primary" onClick={handleClose}>
            START HACKING!
          </button>
        </div>
      </div>
    </div>
  )
}