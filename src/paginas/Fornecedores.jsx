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
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'

function Fornecedores() {
  const { user } = useAuth()
  const confirmar = useConfirmar()
  const [fornecedores, setFornecedores] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [documento, setDocumento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const [busca, setBusca] = useState('')

  async function buscarFornecedores() {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('user_id', user.id)
      .order('nome')
    if (error) {
      console.error('Erro ao buscar fornecedores:', error)
    } else {
      setFornecedores(data)
    }
    setCarregando(false)
  }

  useEffect(() => {
    buscarFornecedores()
  }, [])

  async function adicionarFornecedor(e) {
    e.preventDefault()
    setSalvando(true)
    const { error } = await supabase.from('fornecedores').insert({
      nome,
      telefone: telefone || null,
      email: email || null,
      documento: documento || null,
      observacoes: observacoes || null,
      user_id: user.id,
    })
    if (error) {
      console.error('Erro ao adicionar fornecedor:', error)
      toast.error('Erro ao salvar. Veja o console (F12).')
    } else {
      setNome('')
      setTelefone('')
      setEmail('')
      setDocumento('')
      setObservacoes('')
      buscarFornecedores()
    }
    setSalvando(false)
  }

  function iniciarEdicao(fornecedor) {
    setEditandoId(fornecedor.id)
    setEditForm({
      nome: fornecedor.nome,
      telefone: fornecedor.telefone ?? '',
      email: fornecedor.email ?? '',
      documento: fornecedor.documento ?? '',
      observacoes: fornecedor.observacoes ?? '',
    })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditForm({})
  }

  async function salvarEdicao() {
    setSalvandoEdicao(true)
    const { error } = await supabase
      .from('fornecedores')
      .update({
        nome: editForm.nome,
        telefone: editForm.telefone || null,
        email: editForm.email || null,
        documento: editForm.documento || null,
        observacoes: editForm.observacoes || null,
      })
      .eq('id', editandoId)
    if (error) {
      console.error('Erro ao atualizar fornecedor:', error)
      toast.error('Erro ao salvar. Veja o console (F12).')
    } else {
      await buscarFornecedores()
      setEditandoId(null)
      setEditForm({})
    }
    setSalvandoEdicao(false)
  }

  async function excluirFornecedor(id) {
    const ok = await confirmar({ titulo: 'Confirmar exclusão', mensagem: 'Tem certeza que deseja excluir este fornecedor?', textoBotaoConfirmar: 'Excluir', variante: 'destructive' })
    if (!ok) return
    const { error } = await supabase.from('fornecedores').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir fornecedor:', error)
      toast.error('Erro ao excluir. Veja o console (F12).')
    } else {
      buscarFornecedores()
    }
  }

  const fornecedoresFiltrados = busca.trim() === ''
    ? fornecedores
    : fornecedores.filter((f) => {
        const q = busca.toLowerCase()
        return (
          f.nome.toLowerCase().includes(q) ||
          (f.telefone ?? '').toLowerCase().includes(q) ||
          (f.email ?? '').toLowerCase().includes(q) ||
          (f.documento ?? '').toLowerCase().includes(q)
        )
      })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Fornecedores</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Cadastre e gerencie seus fornecedores</p>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={adicionarFornecedor} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="f-nome">Nome / Razão social</Label>
                <Input
                  id="f-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Nome ou razão social"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-telefone">Telefone</Label>
                <Input
                  id="f-telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-email">E-mail</Label>
                <Input
                  id="f-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-documento">CNPJ / CPF</Label>
                <Input
                  id="f-documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-obs">Observações</Label>
                <Input
                  id="f-obs"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <Button type="submit" disabled={salvando} className="w-full">
                {salvando ? 'Salvando...' : 'Adicionar fornecedor'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fornecedores ({fornecedoresFiltrados.length})</CardTitle>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, telefone, e-mail ou documento..."
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

            {!carregando && fornecedores.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Nenhum fornecedor cadastrado ainda.</p>
            )}

            {!carregando && fornecedores.length > 0 && fornecedoresFiltrados.length === 0 && (
              <p className="text-sm text-slate-500 py-4">
                Nenhum resultado para &ldquo;{busca}&rdquo;.
              </p>
            )}

            {!carregando && fornecedoresFiltrados.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-0">Nome</TableHead>
                    <TableHead className="w-32">Telefone</TableHead>
                    <TableHead className="w-28">Documento</TableHead>
                    <TableHead className="w-40">E-mail</TableHead>
                    <TableHead className="w-44" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedoresFiltrados.map((fornecedor) => (
                    <TableRow
                      key={fornecedor.id}
                      className={editandoId === fornecedor.id ? 'bg-emerald-50/30 dark:bg-emerald-900/20' : ''}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{fornecedor.nome}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{fornecedor.telefone || '—'}</TableCell>
                      <TableCell className="text-slate-400 dark:text-slate-500 text-xs">{fornecedor.documento || '—'}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{fornecedor.email || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => iniciarEdicao(fornecedor)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => excluirFornecedor(fornecedor.id)}
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
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Editar fornecedor</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{editForm.nome}</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                <Input
                  value={editForm.nome ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  placeholder="Nome ou razão social"
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ / CPF</label>
                  <Input
                    value={editForm.documento ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, documento: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações</label>
                <Input
                  value={editForm.observacoes ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                  placeholder="Opcional"
                />
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

export default Fornecedores
