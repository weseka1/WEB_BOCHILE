import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { PropertiesProvider } from './lib/PropertiesProvider'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PropertiesProvider>
      <App />
    </PropertiesProvider>
  </React.StrictMode>,
)
