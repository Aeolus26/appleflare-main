import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Login from './login.tsx'
import ApiShieldPage from './pages/ApiShieldPage.tsx'
import PetstorePage from './pages/PetstorePage.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/api-shield" element={<ApiShieldPage />} />
        <Route path="/petstore" element={<PetstorePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)