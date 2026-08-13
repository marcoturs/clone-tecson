import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contextos/AuthContext'
import { ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const dataHora = (valor) =>
  new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const detectarCampoData = (obj) => {
  const candidatos = ['created_at', 'data', 'data_venda', 'criado_em', 'inserted_at', 'date', 'timestamp']
  for (const c of candidatos) {
    if (c in obj && obj[c]) return c
  }
  return Object.keys(obj).find((k) => {
    const v = obj[k]
    return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)
  }) ?? null
}

const PERIODOS = [
  { id: 'hoje',   label: 'Hoje' },
  { id: '7dias',  label: '7 dias' },
  { id: '30dias', label: '30 dias' },
  { id: 'tudo',   label: 'Tudo' },
]

function getDataInicial(periodo) {
  if (periodo === 'hoje') {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  if (periodo === '7dias')  return new Date(Date.now() - 7  * 86400000).toISOString()
  if (periodo === '30dias') return new Date(Date.now() - 30 * 86400000).toISOString()
  return null
}

function Historico() {
  const { user } = useAuth()
  const [vendas, setVendas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroVendas, setErroVendas] = useState(null)
  const [vendaSelecionada, setVendaSelecionada] = useState(null)
  const [itens, setItens] = useState([])
  const [carregandoItens, setCarregandoItens] = useState(false)
  const [erroItens, setErroItens] = useState(null)
  const [periodo, setPeriodo] = useState('tudo')

  useEffect(() => {
    async function buscarVendas() {
      setCarregando(true)
      setErroVendas(null)
      let query = supabase
        .from('vendas')
        .select('*, cliente:clientes(nome), vendedor:vendedores(nome)')
        .eq('user_id', user.id)
        .order('criada_em', { ascending: false })
      const dataInicial = getDataInicial(periodo)
      if (dataInicial) query = query.gte('criada_em', dataInicial)
      const { data, error } = await query
      if (error) {
        console.error('Erro ao buscar vendas:', error)
        setErroVendas(error.message)
      } else {
        setVendas(data)
      }
      setCarregando(false)
    }
    buscarVendas()
  }, [periodo])

  const campoData = vendas.length > 0 ? detectarCampoData(vendas[0]) : null

  async function selecionarVenda(venda) {
    setVendaSelecionada(venda)
    setItens([])
    setErroItens(null)
    setCarregandoItens(true)
    const { data, error } = await supabase
      .from('itens_venda')
      .select('*, produtos(nome)')
      .eq('venda_id', venda.id)
    if (error) {
      console.error('Erro ao buscar itens:', error)
      setErroItens(error.message)
    } else {
      setItens(data)
    }
    setCarregandoItens(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Histórico</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Todas as vendas realizadas</p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-6">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={cn(
              'px-3 py-1 text-sm rounded-md transition-colors',
              periodo === p.id
                ? 'bg-[#1f7a5c] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
        {/* Sales list */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas realizadas ({vendas.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {carregando && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm py-4">
                <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-[#1f7a5c] rounded-full animate-spin" />
                Carregando...
              </div>
            )}

            {!carregando && erroVendas && (
              <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-lg px-4 py-3">
                Erro ao carregar vendas: {erroVendas}
              </div>
            )}

            {!carregando && !erroVendas && vendas.length === 0 && (
              <p className="text-sm text-slate-500 py-4">
                {periodo === 'tudo'
                  ? 'Nenhuma venda registrada ainda.'
                  : 'Nenhuma venda no período selecionado.'}
              </p>
            )}

            {!carregando && !erroVendas && vendas.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda) => {
                    const ativa = vendaSelecionada?.id === venda.id
                    return (
                      <TableRow
                        key={venda.id}
                        className={cn('cursor-pointer', ativa && 'bg-emerald-50/60 dark:bg-emerald-950/30')}
                        onClick={() => selecionarVenda(venda)}
                      >
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {venda[campoData] ? dataHora(venda[campoData]) : '—'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {venda.cliente?.nome ?? '—'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {venda.vendedor?.nome ?? '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
                          {moeda(venda.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight
                            className={cn('w-4 h-4 ml-auto', ativa ? 'text-[#1f7a5c]' : 'text-slate-300 dark:text-slate-600')}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sale detail */}
        <Card>
          <CardContent className="pt-6">
            {!vendaSelecionada ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Clique em uma venda para ver os itens.</p>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Itens da venda</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {vendaSelecionada[campoData] ? dataHora(vendaSelecionada[campoData]) : '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cliente: <span className="font-medium">{vendaSelecionada.cliente?.nome ?? '—'}</span>
                    {' · '}
                    Vendedor: <span className="font-medium">{vendaSelecionada.vendedor?.nome ?? '—'}</span>
                  </p>
                </div>

                {carregandoItens && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-[#1f7a5c] rounded-full animate-spin" />
                    Carregando itens...
                  </div>
                )}

                {!carregandoItens && erroItens && (
                  <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-lg px-4 py-3">
                    Erro ao carregar itens: {erroItens}
                  </div>
                )}

                {!carregandoItens && !erroItens && itens.length === 0 && (
                  <p className="text-sm text-slate-500">Nenhum item encontrado.</p>
                )}

                {!carregandoItens && !erroItens && itens.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.produtos?.nome ?? <span className="text-slate-300">—</span>}
                          </TableCell>
                          <TableCell className="text-center">{item.quantidade}</TableCell>
                          <TableCell className="text-right text-slate-500">
                            {moeda(item.preco_unit)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {moeda(item.preco_unit * item.quantidade)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {!carregandoItens && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {moeda(vendaSelecionada.total)}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Historico
