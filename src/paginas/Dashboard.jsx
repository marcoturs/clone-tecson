import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contextos/AuthContext'
import { DollarSign, TrendingUp, ShoppingCart, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'

const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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

function Dashboard() {
  const { user } = useAuth()
  const [vendas, setVendas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const [resVendas, resProdutos, resItens] = await Promise.all([
        supabase.from('vendas').select('*').eq('user_id', user.id),
        supabase.from('produtos').select('id, nome, estoque_atual, estoque_minimo').eq('user_id', user.id),
        supabase.from('itens_venda').select('produto_id, quantidade, produtos(nome)').eq('user_id', user.id),
      ])
      if (!resVendas.error) setVendas(resVendas.data)
      if (!resProdutos.error) setProdutos(resProdutos.data)
      if (!resItens.error) setItens(resItens.data)
      setCarregando(false)
    }
    carregar()
  }, [])

  const campoData = vendas.length > 0 ? detectarCampoData(vendas[0]) : null
  const hoje = new Date().toISOString().slice(0, 10)

  const faturamentoHoje = vendas
    .filter((v) => campoData && v[campoData]?.startsWith(hoje))
    .reduce((s, v) => s + Number(v.total), 0)

  const faturamentoTotal = vendas.reduce((s, v) => s + Number(v.total), 0)

  const estoqueBaixo = produtos.filter((p) => p.estoque_atual <= p.estoque_minimo)

  const contagemMap = {}
  itens.forEach((item) => {
    const id = item.produto_id
    const nome = item.produtos?.nome ?? '—'
    if (!contagemMap[id]) contagemMap[id] = { nome, total: 0 }
    contagemMap[id].total += item.quantidade
  })
  const topProdutos = Object.values(contagemMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const kpis = [
    {
      label: 'Faturamento hoje',
      valor: moeda(faturamentoHoje),
      Icon: DollarSign,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      iconColor: 'text-[#1f7a5c] dark:text-emerald-400',
    },
    {
      label: 'Faturamento total',
      valor: moeda(faturamentoTotal),
      Icon: TrendingUp,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      iconColor: 'text-[#1f7a5c] dark:text-emerald-400',
    },
    {
      label: 'Total de vendas',
      valor: vendas.length,
      Icon: ShoppingCart,
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-500 dark:text-slate-400',
    },
    {
      label: 'Estoque baixo',
      valor: estoqueBaixo.length,
      Icon: AlertTriangle,
      iconBg: estoqueBaixo.length > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30',
      iconColor: estoqueBaixo.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-[#1f7a5c] dark:text-emerald-400',
      valorColor: estoqueBaixo.length > 0 ? 'text-red-600' : 'text-[#1f7a5c]',
    },
  ]

  if (carregando) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-[#1f7a5c] rounded-full animate-spin" />
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Início</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Visão geral do sistema</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${kpi.valorColor ?? 'text-slate-900 dark:text-slate-100'}`}>
                    {kpi.valor}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                  <kpi.Icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-2 gap-6">
        {/* Estoque baixo */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {estoqueBaixo.length === 0 ? (
              <p className="text-sm text-[#1f7a5c] font-medium">Estoque saudável</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Estoque atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoqueBaixo.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{p.estoque_atual}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {topProdutos.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma venda registrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProdutos.map((p, i) => (
                    <TableRow key={p.nome}>
                      <TableCell className="text-slate-400 dark:text-slate-500 font-medium">{i + 1}</TableCell>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell className="text-right font-semibold">{p.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
