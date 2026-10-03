import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { DEFAULT_CLUB } from './api.js'
import './index.css'

// Each deployment is themed for its club (palettes live in index.css), and the
// favicon ball follows the theme's ball colour.
document.documentElement.dataset.theme = DEFAULT_CLUB
const ball = getComputedStyle(document.documentElement).getPropertyValue('--c-ball').trim()
if (ball) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='42' fill='rgb(${ball.replace(/ /g, ',')})'/></svg>`
  document.querySelector("link[rel='icon']")?.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(svg)}`)
}

// HashRouter keeps deep links working on GitHub Pages with zero server config.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
