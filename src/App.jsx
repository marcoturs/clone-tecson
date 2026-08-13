import { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  UserCog,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  BarChart3,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from './contextos/AuthContext'
import { useTema } from './contextos/TemaContext'
import Login from './paginas/Login'
import Dashboard from './paginas/Dashboard'
import Produtos from './paginas/Produtos'
import Clientes from './paginas/Clientes'
import Fornecedores from './paginas/Fornecedores'
import Vendedores from './paginas/Vendedores'
import Vendas from './paginas/Vendas'
import Historico from './paginas/Historico'
import Financeiro from './paginas/Financeiro'
import Relatorios from './paginas/Relatorios'

const navItems = [
  { id: 'dashboard',   label: 'Início',       Icon: LayoutDashboard },
  { id: 'produtos',    label: 'Produtos',     Icon: Package },
  { id: 'clientes',    label: 'Clientes',     Icon: Users },
  { id: 'fornecedores',label: 'Fornecedores', Icon: Truck },
  { id: 'vendedores',  label: 'Vendedores',   Icon: UserCog },
  { id: 'vendas',      label: 'Vendas',       Icon: ShoppingCart },
  { id: 'historico',   label: 'Histórico',    Icon: ClipboardList },
  { id: 'financeiro',  label: 'Financeiro',   Icon: DollarSign },
  { id: 'relatorios',  label: 'Relatórios',   Icon: BarChart3 },
]

function App() {
  const [tela, setTela] = useState('dashboard')
  const { user, signOut, carregando } = useAuth()
  const { tema, alternarTema } = useTema()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-[#1f7a5c] rounded-full animate-spin" />
          Carregando...
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-[#1f7a5c] flex items-center justify-center">
            <span className="text-white text-xs font-bold">CT</span>
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Clone TecSon</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTela(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                tela === id
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#1f7a5c] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon
                className={cn('w-4 h-4 shrink-0', tela === id ? 'text-[#1f7a5c]' : 'text-slate-400 dark:text-slate-500')}
              />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate" title={user.email}>{user.email}</p>
          <button
            onClick={alternarTema}
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors w-full"
          >
            {tema === 'escuro'
              ? <Sun className="w-3.5 h-3.5" />
              : <Moon className="w-3.5 h-3.5" />}
            {tema === 'escuro' ? 'Tema claro' : 'Tema escuro'}
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {tela === 'dashboard'    && <Dashboard />}
        {tela === 'produtos'     && <Produtos />}
        {tela === 'clientes'     && <Clientes />}
        {tela === 'fornecedores' && <Fornecedores />}
        {tela === 'vendedores'   && <Vendedores />}
        {tela === 'vendas'       && <Vendas />}
        {tela === 'historico'    && <Historico />}
        {tela === 'financeiro'   && <Financeiro />}
        {tela === 'relatorios'   && <Relatorios />}
      </main>
    </div>
  )
}

export default App
