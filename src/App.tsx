import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CatalogPage } from './pages/CatalogPage'
import { SubmitPage } from './pages/SubmitPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        {/* Eager (not lazy): offline Add must work without a second network hop. */}
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
