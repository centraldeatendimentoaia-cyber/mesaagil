import type { CapacitorConfig } from '@capacitor/cli'

// App nativo Android que embrulha o mesmo build web (dist/) já usado no
// Cloudflare Pages — não aponta pra uma URL remota (webDir local, servido
// pelo próprio app), pra manter a mesma garantia de "funciona offline" que
// o PWA já tem: só as chamadas ao Supabase (auth/dados) dependem de rede,
// nunca o carregamento do app em si.
const config: CapacitorConfig = {
  appId: 'com.mesaagil.app',
  appName: 'MesaAgil',
  webDir: 'dist',
}

export default config
