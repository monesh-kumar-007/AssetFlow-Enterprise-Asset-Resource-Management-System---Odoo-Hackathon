<<<<<<< HEAD
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
=======
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Points to your layout setup
import './index.css'        // Loads your Tailwind configuration

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)   
>>>>>>> db7b5401af2fbeeeb8072e986cdf50145d0fb924
