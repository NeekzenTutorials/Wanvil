// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import NewProject from './pages/NewProject'
import ProjectDashboard from './pages/ProjectDashboard'
import OpenProject from './pages/OpenProject'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/new" element={<NewProject />} />
        <Route path="/project/open" element={<OpenProject />} />
        <Route path="/project/:projectId/*" element={<ProjectDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
