import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Points to your layout setup
import './index.css'        // Loads your Tailwind configuration

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)   