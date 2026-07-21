import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Resume from './pages/Resume.jsx'
import NewApplication from './pages/NewApplication.jsx'
import Applications from './pages/Applications.jsx'
import ResumeLibrary from './pages/ResumeLibrary.jsx'
import CoverLetter from './pages/CoverLetter.jsx'
import Analysis from './pages/Analysis.jsx'
import ReviewSuggestions from './pages/ReviewSuggestions.jsx'
import PreviewTailored from './pages/PreviewTailored.jsx'
import { initAnalytics } from './lib/analytics.js'
import './index.css'

initAnalytics()

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'resume', element: <Resume /> },
      { path: 'resume/:id', element: <Resume /> },
      { path: 'resume-library', element: <ResumeLibrary /> },
      { path: 'new', element: <NewApplication /> },
      { path: 'applications', element: <Applications /> },
      { path: 'cover-letter', element: <CoverLetter /> },
      { path: 'analysis', element: <Analysis /> },
      { path: 'analysis/review', element: <ReviewSuggestions /> },
      { path: 'analysis/preview', element: <PreviewTailored /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
