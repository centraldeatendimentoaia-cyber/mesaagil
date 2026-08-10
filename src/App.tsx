import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LayoutBarraca } from './layouts/LayoutBarraca'
import { LancarPedido } from './pages/LancarPedido'
import { Cozinha } from './pages/Cozinha'
import { TelaChamada } from './pages/TelaChamada'
import { Ajustes } from './pages/Ajustes'
import { NaoEncontrado } from './pages/NaoEncontrado'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/kawashima" replace />} />
        <Route path="/:slug" element={<LayoutBarraca />}>
          <Route index element={<LancarPedido />} />
          <Route path="cozinha" element={<Cozinha />} />
          <Route path="chamada" element={<TelaChamada />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
