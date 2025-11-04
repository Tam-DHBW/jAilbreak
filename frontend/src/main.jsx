import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import App from './App'
import 'nes.css/css/nes.min.css'
import './nes-terminal-styles.css'

const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_CP4ZyMSik",
  client_id: "7bgrd9vmbepbe2pup7tupf18ba",
  client_secret: "9nniqasmm9g9nkdb06707no5ic2nb1sfj9e7sci96gm7lr66mbs",
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