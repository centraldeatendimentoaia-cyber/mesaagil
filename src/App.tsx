import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { LayoutBarraca } from './layouts/LayoutBarraca'
import { RotaProtegida } from './components/RotaProtegida'
import { Dashboard } from './pages/Dashboard'
import { LancarPedido } from './pages/LancarPedido'
import { ConfirmarPedido } from './pages/ConfirmarPedido'
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
  // Fonte única de verdade do tema claro/escuro: preferência manual do
  // usuário (localStorage) > prefers-color-scheme do dispositivo. O campo
  // modo da barraca no Supabase é legado e não é mais lido por nada.
  useTheme()

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
          <Route index element={<Dashboard />} />
          <Route path="lancar" element={<LancarPedido />} />
          <Route path="confirmar" element={<ConfirmarPedido />} />
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
