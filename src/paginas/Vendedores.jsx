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

function Vendedores() {
  const { user } = useAuth()
  const confirmar = useConfirmar()
  const [vendedores, setVendedores] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [comissaoPct, setComissaoPct] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const [busca, setBusca] = useState('')

  async function buscarVendedores() {
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('user_id', user.id)
      .order('nome')
    if (error) {
      console.error('Erro ao buscar vendedores:', error)
    } else {
      setVendedores(data)
    }
    setCarregando(false)
  }

  useEffect(() => {
    buscarVendedores()
  }, [])

  async function adicionarVendedor(e) {
    e.preventDefault()
    setSalvando(true)
    const { error } = await supabase.from('vendedores').insert({
      nome,
      telefone: telefone || null,
      email: email || null,
      comissao_pct: Number(comissaoPct) || 0,
      ativo,
      user_id: user.id,
    })
    if (error) {
      console.error('Erro ao adicionar vendedor:', error)
      toast.error('Erro ao salvar. Veja o console (F12).')
    } else {
      setNome('')
      setTelefone('')
      setEmail('')
      setComissaoPct('')
      setAtivo(true)
      buscarVendedores()
    }
    setSalvando(false)
  }

  function iniciarEdicao(vendedor) {
    setEditandoId(vendedor.id)
    setEditForm({
      nome: vendedor.nome,
      telefone: vendedor.telefone ?? '',
      email: vendedor.email ?? '',
      comissao_pct: vendedor.comissao_pct ?? 0,
      ativo: vendedor.ativo ?? true,
    })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditForm({})
  }

  async function salvarEdicao() {
    setSalvandoEdicao(true)
    const { error } = await supabase
      .from('vendedores')
      .update({
        nome: editForm.nome,
        telefone: editForm.telefone || null,
        email: editForm.email || null,
        comissao_pct: Number(editForm.comissao_pct) || 0,
        ativo: editForm.ativo,
      })
      .eq('id', editandoId)
    if (error) {
      console.error('Erro ao atualizar vendedor:', error)
      toast.error('Erro ao salvar. Veja o console (F12).')
    } else {
      await buscarVendedores()
      setEditandoId(null)
      setEditForm({})
    }
    setSalvandoEdicao(false)
  }

  async function excluirVendedor(id) {
    const ok = await confirmar({ titulo: 'Confirmar exclusão', mensagem: 'Tem certeza que deseja excluir este vendedor?', textoBotaoConfirmar: 'Excluir', variante: 'destructive' })
    if (!ok) return
    const { error } = await supabase.from('vendedores').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir vendedor:', error)
      toast.error('Erro ao excluir. Veja o console (F12).')
    } else {
      buscarVendedores()
    }
  }

  const vendedoresFiltrados = busca.trim() === ''
    ? vendedores
    : vendedores.filter((v) => {
        const q = busca.toLowerCase()
        return (
          v.nome.toLowerCase().includes(q) ||
          (v.telefone ?? '').toLowerCase().includes(q) ||
          (v.email ?? '').toLowerCase().includes(q)
        )
      })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Vendedores</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Cadastre e gerencie sua equipe de vendas</p>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={adicionarVendedor} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="v-nome">Nome</Label>
                <Input
                  id="v-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-telefone">Telefone</Label>
                <Input
                  id="v-telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-email">E-mail</Label>
                <Input
                  id="v-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-comissao">Comissão (%)</Label>
                <div className="relative">
                  <Input
                    id="v-comissao"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={comissaoPct}
                    onChange={(e) => setComissaoPct(e.target.value)}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  id="v-ativo"
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#1f7a5c] cursor-pointer"
                />
                <Label htmlFor="v-ativo" className="cursor-pointer">Vendedor ativo</Label>
              </div>

              <Button type="submit" disabled={salvando} className="w-full">
                {salvando ? 'Salvando...' : 'Adicionar vendedor'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendedores ({vendedoresFiltrados.length})</CardTitle>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, telefone ou e-mail..."
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

            {!carregando && vendedores.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Nenhum vendedor cadastrado ainda.</p>
            )}

            {!carregando && vendedores.length > 0 && vendedoresFiltrados.length === 0 && (
              <p className="text-sm text-slate-500 py-4">
                Nenhum resultado para &ldquo;{busca}&rdquo;.
              </p>
            )}

            {!carregando && vendedoresFiltrados.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Nome</TableHead>
                    <TableHead className="w-32">Telefone</TableHead>
                    <TableHead className="w-24">Comissão</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-48" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedoresFiltrados.map((vendedor) => (
                    <TableRow
                      key={vendedor.id}
                      className={editandoId === vendedor.id ? 'bg-emerald-50/30 dark:bg-emerald-900/20' : ''}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        <div>{vendedor.nome}</div>
                        {vendedor.email && (
                          <div className="text-xs text-slate-400 mt-0.5">{vendedor.email}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{vendedor.telefone || '—'}</TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        {Number(vendedor.comissao_pct).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendedor.ativo ? 'success' : 'secondary'}>
                          {vendedor.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => iniciarEdicao(vendedor)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => excluirVendedor(vendedor.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Editar vendedor</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{editForm.nome}</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                <Input
                  value={editForm.nome ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                  <Input
                    value={editForm.telefone ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
                  <Input
                    type="email"
                    value={editForm.email ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Comissão (%)</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editForm.comissao_pct ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, comissao_pct: e.target.value })}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">%</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  id="edit-ativo"
                  type="checkbox"
                  checked={editForm.ativo ?? true}
                  onChange={(e) => setEditForm({ ...editForm, ativo: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 accent-[#1f7a5c] cursor-pointer"
                />
                <label htmlFor="edit-ativo" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Vendedor ativo
                </label>
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

export default Vendedores
