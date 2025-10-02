import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { awsConfig } from './aws-config'
import App from './App'
import 'nes.css/css/nes.min.css'
import './nes-terminal-styles.css'

Amplify.configure(awsConfig)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)