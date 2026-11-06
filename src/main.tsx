import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App'
import './ui/styles.css'
import './ui/landing.css'
import Landing from './ui/Landing'
import { getPageForPath } from './routes'

createRoot(document.getElementById('root')!).render(<React.StrictMode>{getPageForPath(location.pathname, location.protocol) === 'app' ? <App /> : <Landing />}</React.StrictMode>)
