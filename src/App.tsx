import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { desbloquearAudio } from './lib/sons'
import { LayoutBarraca } from './layouts/LayoutBarraca'
import { RotaProtegida } from './components/RotaProtegida'
import { GateFaceId } from './components/GateFaceId'
import { Dashboard } from './pages/Dashboard'
import { LancarPedido } from './pages/LancarPedido'
import { ConfirmarPedido } from './pages/ConfirmarPedido'
import { Cozinha } from './pages/Cozinha'
import { Historico } from './pages/Historico'
import { TelaChamada } from './pages/TelaChamada'
import { Ajustes } from './pages/Ajustes'
import { NaoEncontrado } from './pages/NaoEncontrado'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import { SelecionarBarraca } from './pages/SelecionarBarraca'
import { EsqueciSenha } from './pages/EsqueciSenha'
import { RedefinirSenha } from './pages/RedefinirSenha'
import { Dispatcher } from './pages/Dispatcher'

function App() {
  // Fonte única de verdade do tema claro/escuro: preferência manual do
  // usuário (localStorage) > prefers-color-scheme do dispositivo. O campo
  // modo da barraca no Supabase é legado e não é mais lido por nada.
  useTheme()

  // Destrava o áudio dos sons de notificação no primeiro toque/clique em
  // qualquer lugar do app — navegadores só liberam reprodução depois de um
  // gesto do usuário. Uma vez só, não precisa remover o listener de novo.
  useEffect(() => {
    window.addEventListener('pointerdown', desbloquearAudio, { once: true })
  }, [])

  return (
    <BrowserRouter>
      <GateFaceId>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
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
      </GateFaceId>
    </BrowserRouter>
  )
}

export default App
