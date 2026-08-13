import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contextos/AuthContext'
import { useTema } from '../contextos/TemaContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const ABAS = [
  { id: 'vendas-periodo', label: 'Vendas por período' },
  { id: 'top-clientes',   label: 'Top clientes' },
  { id: 'top-vendedores', label: 'Top vendedores' },
]

const Spinner = () => (
  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm py-6">
    <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-[#1f7a5c] rounded-full animate-spin" />
    Carregando...
  </div>
)

// ─── Aba 1 ────────────────────────────────────────────────────────────────────

function VendasPeriodo() {
  const { user } = useAuth()
  const { tema } = useTema()
  const [periodo, setPeriodo] = useState(30)
  const [chartData, setChartData] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscar() {
      setCarregando(true)
      const dataInicial = new Date(Date.now() - periodo * 86400000).toISOString()
      const { data, error } = await supabase
        .from('vendas')
        .select('total, criada_em')
        .eq('user_id', user.id)
        .gte('criada_em', dataInicial)
        .order('criada_em')
      if (error) {
        console.error('Erro ao buscar vendas por período:', error)
        setCarregando(false)
        return
      }

      const map = {}
      data.forEach((v) => {
        const dia = v.criada_em.slice(0, 10)
        map[dia] = (map[dia] || 0) + Number(v.total)
      })

      const dias = []
      for (let i = periodo - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dias.push(d.toISOString().slice(0, 10))
      }

      setChartData(
        dias.map((iso) => ({
          dia: iso.slice(8, 10) + '/' + iso.slice(5, 7),
          iso,
          total: map[iso] || 0,
        }))
      )
      setCarregando(false)
    }
    buscar()
  }, [periodo])

  const totalPeriodo = chartData.reduce((s, d) => s + d.total, 0)
  const mediaDiaria = totalPeriodo / periodo
  const melhorDia = chartData.reduce(
    (best, d) => (d.total > best.total ? d : best),
    { dia: '—', total: 0 }
  )

  const kpis = [
    {
      label: 'Total no período',
      valor: moeda(totalPeriodo),
      cor: 'text-[#1f7a5c]',
    },
    {
      label: 'Média diária',
      valor: moeda(mediaDiaria),
      cor: 'text-slate-900',
    },
    {
      label: 'Melhor dia',
      valor: melhorDia.total > 0 ? `${melhorDia.dia} · ${moeda(melhorDia.total)}` : '—',
      cor: 'text-amber-600',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[7, 30, 90].map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={cn(
              'px-3 py-1 text-sm rounded-md transition-colors',
              periodo === p
                ? 'bg-[#1f7a5c] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            {p} dias
          </button>
        ))}
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{k.label}</p>
              <p className={cn('text-xl font-bold mt-1', k.cor === 'text-slate-900' ? 'text-slate-900 dark:text-slate-100' : k.cor)}>{k.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="pt-5">
          {carregando ? (
            <Spinner />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: tema === 'escuro' ? '#64748b' : '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={periodo === 7 ? 0 : periodo === 30 ? 4 : 9}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: tema === 'escuro' ? '#64748b' : '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v === 0 ? 'R$0' : 'R$' + (v / 1000 >= 1 ? (v / 1000).toFixed(0) + 'k' : v)
                  }
                  width={56}
                />
                <Tooltip
                  formatter={(value) => [moeda(value), 'Total']}
                  labelFormatter={(label) => `Dia ${label}`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: tema === 'escuro' ? '1px solid #334155' : '1px solid #e2e8f0',
                    backgroundColor: tema === 'escuro' ? '#1e293b' : '#ffffff',
                    color: tema === 'escuro' ? '#f1f5f9' : '#0f172a',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" fill="#1f7a5c" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Aba 2 ────────────────────────────────────────────────────────────────────

function TopClientes() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscar() {
      const { data, error } = await supabase
        .from('vendas')
        .select('total, cliente_id, cliente:clientes(nome)')
        .eq('user_id', user.id)
        .not('cliente_id', 'is', null)
      if (error) {
        console.error('Erro ao buscar top clientes:', error)
        setCarregando(false)
        return
      }

      const map = {}
      data.forEach((v) => {
        const id = v.cliente_id
        const nome = v.cliente?.nome ?? '—'
        if (!map[id]) map[id] = { nome, totalComprado: 0, qtdVendas: 0 }
        map[id].totalComprado += Number(v.total)
        map[id].qtdVendas += 1
      })

      setRanking(
        Object.values(map)
          .sort((a, b) => b.totalComprado - a.totalComprado)
          .slice(0, 10)
      )
      setCarregando(false)
    }
    buscar()
  }, [])

  if (carregando) return <Spinner />

  if (ranking.length === 0)
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
        Nenhuma venda com cliente vinculado ainda.
      </p>
    )

  return (
    <Card>
      <CardContent className="pt-0 px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-10">#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Vendas</TableHead>
              <TableHead className="text-right pr-6">Total comprado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((c, i) => (
              <TableRow key={c.nome + i}>
                <TableCell className="pl-6 text-slate-400 dark:text-slate-500 font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-slate-100">{c.nome}</TableCell>
                <TableCell className="text-right text-slate-600 dark:text-slate-300">{c.qtdVendas}</TableCell>
                <TableCell className="text-right font-semibold pr-6">{moeda(c.totalComprado)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Aba 3 ────────────────────────────────────────────────────────────────────

function TopVendedores() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscar() {
      const [resVendas, resComissoes] = await Promise.all([
        supabase
          .from('vendas')
          .select('total, vendedor_id, vendedor:vendedores(nome, comissao_pct)')
          .eq('user_id', user.id)
          .not('vendedor_id', 'is', null),
        supabase
          .from('lancamentos_financeiros')
          .select('valor, vendedor_id, status')
          .eq('user_id', user.id)
          .eq('tipo', 'pagar')
          .not('vendedor_id', 'is', null),
      ])

      if (resVendas.error) console.error('Erro ao buscar vendas por vendedor:', resVendas.error)
      if (resComissoes.error) console.error('Erro ao buscar comissões:', resComissoes.error)

      const vendasData = resVendas.data ?? []
      const comissoesData = resComissoes.data ?? []

      const vendasMap = {}
      vendasData.forEach((v) => {
        const id = v.vendedor_id
        const nome = v.vendedor?.nome
        if (!nome) return  // vendedor excluído — ignora
        if (!vendasMap[id]) vendasMap[id] = { nome, totalVendido: 0, qtdVendas: 0 }
        vendasMap[id].totalVendido += Number(v.total)
        vendasMap[id].qtdVendas += 1
      })

      const comissoesMap = {}
      comissoesData.forEach((l) => {
        const id = l.vendedor_id
        if (!comissoesMap[id]) comissoesMap[id] = { gerada: 0, paga: 0 }
        comissoesMap[id].gerada += Number(l.valor)
        if (l.status === 'pago') comissoesMap[id].paga += Number(l.valor)
      })

      // Só inclui vendedores presentes no map de vendas (nome válido)
      const merged = Object.entries(vendasMap).map(([id, v]) => ({
        ...v,
        comissaoGerada: comissoesMap[id]?.gerada ?? 0,
        comissaoPaga: comissoesMap[id]?.paga ?? 0,
      }))

      setRanking(merged.sort((a, b) => b.totalVendido - a.totalVendido))
      setCarregando(false)
    }
    buscar()
  }, [])

  if (carregando) return <Spinner />

  if (ranking.length === 0)
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
        Nenhuma venda com vendedor vinculado ainda.
      </p>
    )

  return (
    <Card>
      <CardContent className="pt-0 px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-10">#</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Vendas</TableHead>
              <TableHead className="text-right">Total vendido</TableHead>
              <TableHead className="text-right">Comissão gerada</TableHead>
              <TableHead className="text-right pr-6">Comissão paga</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((v, i) => (
              <TableRow key={v.nome + i}>
                <TableCell className="pl-6 text-slate-400 dark:text-slate-500 font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-slate-100">{v.nome}</TableCell>
                <TableCell className="text-right text-slate-600 dark:text-slate-300">{v.qtdVendas}</TableCell>
                <TableCell className="text-right font-semibold">{moeda(v.totalVendido)}</TableCell>
                <TableCell className="text-right text-slate-600 dark:text-slate-300">{moeda(v.comissaoGerada)}</TableCell>
                <TableCell className="text-right font-semibold text-[#1f7a5c] pr-6">
                  {moeda(v.comissaoPaga)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Relatorios() {
  const [abaAtiva, setAbaAtiva] = useState('vendas-periodo')

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Relatórios</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Análises e indicadores do negócio</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-slate-200 dark:border-slate-800">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              abaAtiva === aba.id
                ? 'border-[#1f7a5c] text-[#1f7a5c]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            )}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {abaAtiva === 'vendas-periodo'  && <VendasPeriodo />}
      {abaAtiva === 'top-clientes'    && <TopClientes />}
      {abaAtiva === 'top-vendedores'  && <TopVendedores />}
    </div>
  )
}

export default Relatorios
