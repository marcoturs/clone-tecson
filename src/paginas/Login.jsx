import { useState } from 'react'
import { useAuth } from '../contextos/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ERROS = {
  'Invalid login credentials': 'Email ou senha inválidos.',
  'User already registered': 'Esse email já está cadastrado.',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
}

function mapearErro(msg) {
  for (const [chave, traducao] of Object.entries(ERROS)) {
    if (msg.includes(chave)) return traducao
  }
  return msg
}

const inputCls =
  'w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 dark:focus:border-emerald-500'

function Login() {
  const { signIn, signUp } = useAuth()
  const [aba, setAba] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [confirmacao, setConfirmacao] = useState(false)

  function trocarAba(novaAba) {
    setAba(novaAba)
    setErro(null)
    setConfirmacao(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    if (aba === 'entrar') {
      const { error } = await signIn(email, senha)
      if (error) setErro(mapearErro(error.message))
    } else {
      const { data, error } = await signUp(email, senha)
      if (error) {
        setErro(mapearErro(error.message))
      } else if (data.session) {
        // confirmação desligada: sessão criada imediatamente → App redireciona
      } else {
        setConfirmacao(true)
        setAba('entrar')
        setEmail('')
        setSenha('')
      }
    }

    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#1f7a5c] flex items-center justify-center">
            <span className="text-white text-xs font-bold">CT</span>
          </div>
          <span className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Clone TecSon</span>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Abas */}
            <div className="flex gap-0 border-b border-slate-200 dark:border-slate-700 mb-6">
              {[
                { id: 'entrar',   label: 'Entrar' },
                { id: 'cadastro', label: 'Criar conta' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => trocarAba(tab.id)}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                    aba === tab.id
                      ? 'border-[#1f7a5c] text-[#1f7a5c]'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Aviso de confirmação de email */}
            {confirmacao && (
              <div className="mb-4 text-sm text-[#1f7a5c] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
                Conta criada! Verifique seu email para confirmar antes de entrar.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="login-senha">
                  Senha
                </label>
                <input
                  id="login-senha"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>

              {erro && (
                <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-lg px-4 py-3">
                  {erro}
                </div>
              )}

              <Button type="submit" disabled={carregando} className="w-full">
                {carregando
                  ? (aba === 'entrar' ? 'Entrando...' : 'Criando conta...')
                  : (aba === 'entrar' ? 'Entrar' : 'Criar conta')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
