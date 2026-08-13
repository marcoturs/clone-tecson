import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useConfirmar } from '../hooks/useConfirmar'
import { supabase } from '../supabase'
import { useAuth } from '../contextos/AuthContext'
import { Search, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'

const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Produtos() {
  const { user } = useAuth()
  const confirmar = useConfirmar()
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [nome, setNome] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [estoqueAtual, setEstoqueAtual] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const [busca, setBusca] = useState('')

  async function buscarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('user_id', user.id)
      .order('nome')

    if (error) {
      console.error('Erro ao buscar produtos:', error)
    } else {
      setProdutos(data)
    }
    setCarregando(false)
  }

  useEffect(() => {
    buscarProdutos()
  }, [])

  async function adicionarProduto(e) {
    e.preventDefault()
    setSalvando(true)

    const { error } = await supabase.from('produtos').insert({
      nome: nome,
      codigo_barras: codigoBarras || null,
      preco_custo: Number(precoCusto) || 0,
      preco_venda: Number(precoVenda) || 0,
      estoque_atual: Number(estoqueAtual) || 0,
      estoque_minimo: Number(estoqueMinimo) || 0,
      user_id: user.id,
    })

    if (error) {
      console.error('Erro ao adicionar produto:', error)
      toast.error('Erro ao salvar. Veja o console (F12).')
    } else {
      setNome('')
      setCodigoBarras('')
      setPrecoCusto('')
      setPrecoVenda('')
      setEstoqueAtual('')
      setEstoqueMinimo('')
      buscarProdutos()
    }
    setSalvando(false)
  }

  function iniciarEdicao(produto) {
    setEditandoId(produto.id)
    setEditForm({
      nome: produto.nome,
      codigo_barras: produto.codigo_barras ?? '',
      preco_custo: produto.preco_custo,
      preco_venda: produto.preco_venda,
      estoque_atual: produto.estoque_atual,
      estoque_minimo: produto.estoque_minimo,
    })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditForm({})
  }

  async function excluirProduto(id) {
    const ok = await confirmar({ titulo: 'Confirmar exclusão', mensagem: 'Tem certeza que deseja excluir este produto?', textoBotaoConfirmar: 'Excluir', variante: 'destructive' })
    if (!ok) return
    const { error } = await supabase.from('produtos').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir. Veja o console (F12).')
    } else {
      buscarProdutos()
    }
  }

  async function salvarEdicao() {
    setSalvandoEdicao(true)
    const { error } = await supabase
      .from('produtos')
      .update({
        nome: editForm.nome,
        codigo_barras: editForm.codigo_barras || null,
        preco_custo: Number(editForm.preco_custo) || 0,
        preco_venda: Number(editForm.preco_venda) || 0,
        estoque_atual: Number(editForm.estoque_atual) || 0,
        estoque_minimo: Number(editForm.estoque_minimo) || 0,
      })
      .eq('id', editandoId)

    if (error) {
      console.error('Erro ao atualizar produto:', error)
      toast.error('Erro ao salvar. Veja o console (F12).')
    } else {
      await buscarProdutos()
      setEditandoId(null)
      setEditForm({})
    }
    setSalvandoEdicao(false)
  }

  const produtosBaixos = produtos.filter(
    (p) => p.estoque_atual <= p.estoque_minimo
  ).length

  const produtosFiltrados = busca.trim() === ''
    ? produtos
    : produtos.filter((p) => {
        const q = busca.toLowerCase()
        return (
          p.nome.toLowerCase().includes(q) ||
          (p.codigo_barras ?? '').toLowerCase().includes(q)
        )
      })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Produtos</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Cadastre e gerencie o catálogo</p>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6 items-start">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar produto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={adicionarProduto} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome do produto</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Ex: Caneta BIC azul"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codigo">Código de barras</Label>
                <Input
                  id="codigo"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="custo">Custo (R$)</Label>
                  <Input
                    id="custo"
                    type="number"
                    step="0.01"
                    value={precoCusto}
                    onChange={(e) => setPrecoCusto(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="venda">Venda (R$)</Label>
                  <Input
                    id="venda"
                    type="number"
                    step="0.01"
                    value={precoVenda}
                    onChange={(e) => setPrecoVenda(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="estAtual">Estoque atual</Label>
                  <Input
                    id="estAtual"
                    type="number"
                    value={estoqueAtual}
                    onChange={(e) => setEstoqueAtual(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estMin">Estoque mínimo</Label>
                  <Input
                    id="estMin"
                    type="number"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <Button type="submit" disabled={salvando} className="w-full">
                {salvando ? 'Salvando...' : 'Adicionar produto'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produtos ({produtosFiltrados.length})</CardTitle>
              {produtosBaixos > 0 && (
                <Badge variant="destructive">{produtosBaixos} com estoque baixo</Badge>
              )}
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome ou código..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {carregando && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm py-4">
                <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-[#1f7a5c] rounded-full animate-spin" />
                Carregando...
              </div>
            )}

            {!carregando && produtos.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Nenhum produto cadastrado ainda.</p>
            )}

            {!carregando && produtos.length > 0 && produtosFiltrados.length === 0 && (
              <p className="text-sm text-slate-500 py-4">
                Nenhum resultado para &ldquo;{busca}&rdquo;.
              </p>
            )}

            {!carregando && produtosFiltrados.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[130px]">Nome</TableHead>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead className="w-20">Custo</TableHead>
                    <TableHead className="w-20">Venda</TableHead>
                    <TableHead className="w-36">Estoque</TableHead>
                    <TableHead className="w-44" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.map((produto) => {
                    const baixo = produto.estoque_atual <= produto.estoque_minimo

                    return (
                      <TableRow
                        key={produto.id}
                        className={editandoId === produto.id ? 'bg-emerald-50/30 dark:bg-emerald-900/20' : ''}
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">{produto.nome}</TableCell>
                        <TableCell className="text-slate-400 dark:text-slate-500 text-xs">
                          {produto.codigo_barras || '—'}
                        </TableCell>
                        <TableCell>{moeda(produto.preco_custo)}</TableCell>
                        <TableCell>{moeda(produto.preco_venda)}</TableCell>
                        <TableCell>
                          <Badge variant={baixo ? 'destructive' : 'success'}>
                            {produto.estoque_atual}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-0.5">mín: {produto.estoque_minimo}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => iniciarEdicao(produto)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => excluirProduto(produto.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit modal */}
      {editandoId && createPortal(
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={cancelarEdicao}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Editar produto</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{editForm.nome}</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                <Input
                  value={editForm.nome ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Código de barras</label>
                <Input
                  value={editForm.codigo_barras ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, codigo_barras: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custo (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.preco_custo ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, preco_custo: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Venda (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.preco_venda ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, preco_venda: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estoque atual</label>
                  <Input
                    type="number"
                    value={editForm.estoque_atual ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, estoque_atual: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estoque mínimo</label>
                  <Input
                    type="number"
                    value={editForm.estoque_minimo ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, estoque_minimo: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={cancelarEdicao} disabled={salvandoEdicao}>
                Cancelar
              </Button>
              <Button onClick={salvarEdicao} disabled={salvandoEdicao}>
                {salvandoEdicao ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Produtos
