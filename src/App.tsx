import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Library from './pages/Library'
import Notebooks from './pages/Notebooks'
import NotebookDetail from './pages/NotebookDetail'
import Editor from './pages/Editor'
import Play from './pages/Play'
import Settings from './pages/Settings'
import { useSettings } from './lib/useSettings'
import SplashScreen from './components/SplashScreen'

// Carregado sob demanda: depende do SDK do Supabase (pesado), só baixado
// quando o app realmente precisa checar/pedir login.
const AuthGate = lazy(() => import('./components/AuthGate'))

export default function App() {
  const settings = useSettings()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [settings.theme])

  return (
    <Suspense fallback={<SplashScreen />}>
      <AuthGate>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Library />} />
            <Route path="cadernos" element={<Notebooks />} />
            <Route path="cadernos/:notebookId" element={<NotebookDetail />} />
            <Route path="editor/:songId" element={<Editor />} />
            <Route path="tocar" element={<Play />} />
            <Route path="config" element={<Settings />} />
          </Route>
        </Routes>
      </AuthGate>
    </Suspense>
  )
}
