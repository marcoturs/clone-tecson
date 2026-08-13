import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '../supabase'
import { useAuth } from '../contextos/AuthContext'
import { Plus, Minus, ShoppingBag } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'

const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Vendas() {
  const { user } = useAuth()
  const [produtos, setProdutos] = useState([])
  const [carrinho, setCarrinho] = useState([])
  const [registrando, setRegistrando] = useState(false)
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [vendedorId, setVendedorId] = useState('')

  async function buscarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('user_id', user.id)
      .order('nome')
    if (error) console.error(error)
    else setProdutos(data)
  }

  useEffect(() => {
    buscarProdutos()
    Promise.all([
      supabase.from('clientes').select('id, nome').eq('user_id', user.id).order('nome'),
      supabase.from('vendedores').select('id, nome, comissao_pct').eq('ativo', true).eq('user_id', user.id).order('nome'),
    ]).then(([{ data: dataClientes }, { data: dataVendedores }]) => {
      if (dataClientes) setClientes(dataClientes)
      if (dataVendedores) setVendedores(dataVendedores)
    })
  }, [])

  function adicionarAoCarrinho(produto) {
    const existente = carrinho.find((item) => item.produto.id === produto.id)
    const qtdAtual = existente ? existente.quantidade : 0

    if (qtdAtual + 1 > produto.estoque_atual) {
      toast.warning(`Estoque insuficiente. Só há ${produto.estoque_atual} unidade(s) de ${produto.nome}.`)
      return
    }

    if (existente) {
      setCarrinho(
        carrinho.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      )
    } else {
      setCarrinho([...carrinho, { produto: produto, quantidade: 1 }])
    }
  }

  function alterarQuantidade(produtoId, novaQtd) {
    if (novaQtd <= 0) {
      setCarrinho(carrinho.filter((item) => item.produto.id !== produtoId))
      return
    }

    const item = carrinho.find((i) => i.produto.id === produtoId)
    if (item && novaQtd > item.produto.estoque_atual) {
      toast.warning(`Estoque insuficiente. Só há ${item.produto.estoque_atual} unidade(s) de ${item.produto.nome}.`)
      return
    }

    setCarrinho(
      carrinho.map((i) =>
        i.produto.id === produtoId ? { ...i, quantidade: novaQtd } : i
      )
    )
  }

  const total = carrinho.reduce(
    (soma, item) => soma + item.produto.preco_venda * item.quantidade,
    0
  )

  async function registrarVenda() {
    if (carrinho.length === 0) return
    setRegistrando(true)

    const { data: venda, error: erroVenda } = await supabase
      .from('vendas')
      .insert({ total: total, cliente_id: clienteId || null, vendedor_id: vendedorId || null, user_id: user.id })
      .select()
      .single()

    if (erroVenda) {
      console.error('Erro ao criar venda:', erroVenda)
      toast.error('Erro ao registrar venda. Veja o console (F12).')
      setRegistrando(false)
      return
    }

    const itens = carrinho.map((item) => ({
      venda_id: venda.id,
      produto_id: item.produto.id,
      quantidade: item.quantidade,
      preco_unit: item.produto.preco_venda,
      user_id: user.id,
    }))

    const { error: erroItens } = await supabase.from('itens_venda').insert(itens)
    if (erroItens) {
      console.error('Erro ao gravar itens:', erroItens)
      toast.error('Erro ao gravar itens. Veja o console (F12).')
      setRegistrando(false)
      return
    }

    const { error: erroLancamento } = await supabase.from('lancamentos_financeiros').insert({
      venda_id: venda.id,
      descricao: `Venda #${venda.id.slice(0, 8)}`,
      valor: total,
      tipo: 'receber',
      status: 'pendente',
      user_id: user.id,
    })
    if (erroLancamento) console.error('Erro ao criar lançamento financeiro:', erroLancamento)

    for (const item of carrinho) {
      await supabase.rpc('baixar_estoque', {
        produto: item.produto.id,
        qtd: item.quantidade,
      })
    }

    if (vendedorId) {
      const vendedor = vendedores.find((v) => v.id === vendedorId)
      if (vendedor && vendedor.comissao_pct > 0) {
        const valorComissao = total * (vendedor.comissao_pct / 100)
        const { error: erroComissao } = await supabase.from('lancamentos_financeiros').insert({
          venda_id: venda.id,
          descricao: `Comissão venda #${venda.id.slice(0, 8)} — ${vendedor.nome}`,
          valor: valorComissao,
          tipo: 'pagar',
          status: 'pendente',
          vendedor_id: vendedorId,
          user_id: user.id,
        })
        if (erroComissao) console.error('Erro ao criar lançamento de comissão:', erroComissao)
      }
    }

    toast.success('Venda registrada! Estoque atualizado.')
    setCarrinho([])
    setClienteId('')
    setVendedorId('')
    buscarProdutos()
    setRegistrando(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Vendas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Registre uma nova venda</p>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
        {/* Product list */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => {
                  const semEstoque = produto.estoque_atual <= 0
                  return (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{produto.nome}</TableCell>
                      <TableCell>{moeda(produto.preco_venda)}</TableCell>
                      <TableCell>
                        <span className={semEstoque ? 'text-red-500 font-medium' : 'text-slate-700 dark:text-slate-300'}>
                          {produto.estoque_atual}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={semEstoque ? 'secondary' : 'default'}
                          disabled={semEstoque}
                          onClick={() => adicionarAoCarrinho(produto)}
                        >
                          {semEstoque ? 'Sem estoque' : 'Adicionar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <CardTitle>Venda atual</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 mb-4">
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              >
                <option value="">— Sem cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              >
                <option value="">— Sem vendedor —</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>

            {carrinho.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-2">Nenhum item adicionado.</p>
            ) : (
              <div className="space-y-1">
                {carrinho.map((item) => (
                  <div
                    key={item.produto.id}
                    className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.produto.nome}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{moeda(item.produto.preco_venda)} cada</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                        className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center dark:text-slate-200">{item.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                        className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{moeda(total)}</span>
            </div>

            <Button
              className="w-full mt-4"
              onClick={registrarVenda}
              disabled={carrinho.length === 0 || registrando}
            >
              {registrando ? 'Registrando...' : 'Registrar venda'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Vendas
