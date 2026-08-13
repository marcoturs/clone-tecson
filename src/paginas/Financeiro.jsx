import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contextos/AuthContext'
import { Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatarData = (valor) => {
  if (!valor) return '—'
  const [ano, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${ano}`
}

const formatarDataHora = (valor) => {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const PERIODOS_FIN = [
  { id: 'hoje',   label: 'Hoje' },
  { id: '7dias',  label: '7 dias' },
  { id: '30dias', label: '30 dias' },
  { id: 'tudo',   label: 'Tudo' },
]

function getDataInicialFin(periodo) {
  if (periodo === 'hoje') {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  if (periodo === '7dias')  return new Date(Date.now() - 7  * 86400000).toISOString()
  if (periodo === '30dias') return new Date(Date.now() - 30 * 86400000).toISOString()
  return null
}

function Financeiro() {
  const { user } = useAuth()
  const [lancamentos, setLancamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [marcando, setMarcando] = useState(null)
  const [periodo, setPeriodo] = useState('tudo')

  async function buscar(p) {
    setCarregando(true)
    let query = supabase
      .from('lancamentos_financeiros')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
    const dataInicial = getDataInicialFin(p)
    if (dataInicial) query = query.gte('criado_em', dataInicial)
    const { data, error } = await query
    if (error) console.error('Erro ao buscar lançamentos:', error)
    else setLancamentos(data)
    setCarregando(false)
  }

  useEffect(() => { buscar(periodo) }, [periodo])

  async function marcarComoPago(id) {
    setMarcando(id)
    const { error } = await supabase
      .from('lancamentos_financeiros')
      .update({ status: 'pago' })
      .eq('id', id)
    if (error) {
      console.error('Erro ao atualizar lançamento:', error)
      toast.error('Erro ao marcar como pago. Veja o console (F12).')
    } else {
      setLancamentos((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'pago' } : l))
      )
    }
    setMarcando(null)
  }

  const totalAReceber = lancamentos
    .filter((l) => l.tipo === 'receber' && l.status === 'pendente')
    .reduce((s, l) => s + Number(l.valor), 0)

  const totalRecebido = lancamentos
    .filter((l) => l.tipo === 'receber' && l.status === 'pago')
    .reduce((s, l) => s + Number(l.valor), 0)

  const totalAPagar = lancamentos
    .filter((l) => l.tipo === 'pagar' && l.status === 'pendente')
    .reduce((s, l) => s + Number(l.valor), 0)

  const totalPago = lancamentos
    .filter((l) => l.tipo === 'pagar' && l.status === 'pago')
    .reduce((s, l) => s + Number(l.valor), 0)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Financeiro</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Controle de lançamentos e recebimentos</p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2">
        {PERIODOS_FIN.map((p) => (
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">A receber</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{moeda(totalAReceber)}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Recebido</p>
                <p className="text-2xl font-bold mt-1 text-[#1f7a5c]">{moeda(totalRecebido)}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#1f7a5c] dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">A pagar</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{moeda(totalAPagar)}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pago</p>
                <p className="text-2xl font-bold mt-1 text-slate-500 dark:text-slate-400">{moeda(totalPago)}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lancamentos table */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Lançamentos ({lancamentos.length})
          </h2>
        </div>

        <CardContent className="pt-0 px-0 pb-0">
          {carregando && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm p-6">
              <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-[#1f7a5c] rounded-full animate-spin" />
              Carregando...
            </div>
          )}

          {!carregando && lancamentos.length === 0 && (
            <p className="text-sm text-slate-500 p-6">
              {periodo === 'tudo'
                ? 'Nenhum lançamento encontrado.'
                : 'Nenhum lançamento no período selecionado.'}
            </p>
          )}

          {!carregando && lancamentos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-6">
                      <Badge variant={l.tipo === 'receber' ? 'success' : 'destructive'}>
                        {l.tipo === 'receber' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{l.descricao}</TableCell>
                    <TableCell className="text-right font-semibold">{moeda(l.valor)}</TableCell>
                    <TableCell>
                      <Badge variant={l.status === 'pago' ? 'success' : 'warning'}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{formatarData(l.vencimento)}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{formatarDataHora(l.criado_em)}</TableCell>
                    <TableCell className="pr-6">
                      {l.status === 'pendente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => marcarComoPago(l.id)}
                          disabled={marcando === l.id}
                        >
                          {marcando === l.id ? 'Salvando...' : 'Marcar como pago'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Financeiro
