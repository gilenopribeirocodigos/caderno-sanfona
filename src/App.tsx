import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Library from './pages/Library'
import Notebooks from './pages/Notebooks'
import NotebookDetail from './pages/NotebookDetail'
import Editor from './pages/Editor'
import Play from './pages/Play'
import Settings from './pages/Settings'

export default function App() {
  return (
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
  )
}
