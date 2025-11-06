import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import App from './App'
import 'nes.css/css/nes.min.css'
import './nes-terminal-styles.css'

const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_CP4ZyMSik",
  client_id: "6optohklh97aifpu3d4o7jvrh1",
  redirect_uri: "https://d1ec4fqqusaq2g.cloudfront.net/admin",
  response_type: "code",
  scope: "openid",
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
)