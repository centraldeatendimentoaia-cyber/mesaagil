import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LayoutBarraca } from './layouts/LayoutBarraca'
import { RotaProtegida } from './components/RotaProtegida'
import { LancarPedido } from './pages/LancarPedido'
import { Cozinha } from './pages/Cozinha'
import { Historico } from './pages/Historico'
import { TelaChamada } from './pages/TelaChamada'
import { Ajustes } from './pages/Ajustes'
import { NaoEncontrado } from './pages/NaoEncontrado'
import { Login } from './pages/Login'
import { EsqueciSenha } from './pages/EsqueciSenha'
import { RedefinirSenha } from './pages/RedefinirSenha'
import { Dispatcher } from './pages/Dispatcher'
import { SelecionarBarraca } from './pages/SelecionarBarraca'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        <Route path="/" element={<Dispatcher />} />

        <Route
          path="/selecionar-barraca"
          element={
            <RotaProtegida>
              <SelecionarBarraca />
            </RotaProtegida>
          }
        />

        <Route
          path="/:slug"
          element={
            <RotaProtegida verificarSlug>
              <LayoutBarraca />
            </RotaProtegida>
          }
        >
          <Route index element={<LancarPedido />} />
          <Route path="cozinha" element={<Cozinha />} />
          <Route path="historico" element={<Historico />} />
          <Route path="chamada" element={<TelaChamada />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>

        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
