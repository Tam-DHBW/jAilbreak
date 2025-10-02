export default function About() {
  return (
    <div className="page-container">
      <div className="nes-container is-dark">
        <h1 className="page-title">📖 ABOUT jAILBREAK</h1>
        <div className="page-content">
          <p>jAilbreak is an interactive AI security challenge game that tests your ability to bypass AI safety protocols through creative prompt engineering.</p>
          
          <h3>The Challenge:</h3>
          <p>Our AI system has been designed with multiple layers of security. Your mission is to find ways to make it respond in ways it shouldn't - essentially "jailbreaking" the AI.</p>
          
          <h3>Educational Purpose:</h3>
          <p>This game demonstrates the importance of AI safety and the ongoing challenges in securing AI systems against adversarial inputs.</p>
          
          <h3>Technology Stack:</h3>
          <p>• React frontend with NES.css terminal styling</p>
          <p>• AWS Cognito for authentication</p>
          <p>• CloudFront global distribution</p>
          <p>• S3 static hosting</p>
          <p>• Terraform infrastructure</p>
          
          <h3>Disclaimer:</h3>
          <p>This is a controlled environment for educational purposes. Please use these techniques responsibly.</p>
        </div>
      </div>
    </div>
  )
}