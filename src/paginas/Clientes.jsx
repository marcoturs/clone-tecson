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

function Clientes() {
  const { user } = useAuth()
  const confirmar = useConfirmar()
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [documento, setDocumento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const [busca, setBusca] = useState('')

  async function buscarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('nome')
    if (error) {
      console.error('Erro ao buscar clientes:', error)
    } else {
      setClientes(data)
    }
    setCarregando(false)
  }

  useEffect(() => {
    buscarClientes()
  }, [])

  async function adicionarCliente(e) {
    e.preventDefault()
    setSalvando(true)
    const { error } = await supabase.from('clientes').insert({
      nome,
      telefone: telefone || null,
      email: email || null,
      documento: documento || null,
      endereco: endereco || null,
      observacoes: observacoes || null,
      user_id: user.id,
    })
    if (error) {
      console.error('Erro ao adicionar cliente:', error)
      toast.error('Erro ao salvar. Veja o console (F12).')
    } else {
      setNome('')
      setTelefone('')
      setEmail('')
      setDocumento('')
      setEndereco('')
      setObservacoes('')
      buscarClientes()
    }
    setSalvando(false)
  }

  function iniciarEdicao(cliente) {
    setEditandoId(cliente.id)
    setEditForm({
      nome: cliente.nome,
      telefone: cliente.telefone ?? '',
      email: cliente.email ?? '',
      documento: cliente.documento ?? '',
      endereco: cliente.endereco ?? '',
      observacoes: cliente.observacoes ?? '',
    })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditForm({})
  }

  async function salvarEdicao() {
    setSalvandoEdicao(true)
    const { error } = await supabase
      .from('clientes')
      .update({
        nome: editForm.nome,
        telefone: editForm.telefone || null,
        email: editForm.email || null,
        documento: editForm.documento || null,
        endereco: editForm.endereco || null,
        observacoes: editForm.observacoes || null,
      })
      .eq('id', editandoId)
    if (error) {
      console.error('Erro ao atualizar cliente:', error)
      toast.error('Erro ao salvar. Veja o console (F12).')
    } else {
      await buscarClientes()
      setEditandoId(null)
      setEditForm({})
    }
    setSalvandoEdicao(false)
  }

  async function excluirCliente(id) {
    const ok = await confirmar({ titulo: 'Confirmar exclusão', mensagem: 'Tem certeza que deseja excluir este cliente?', textoBotaoConfirmar: 'Excluir', variante: 'destructive' })
    if (!ok) return
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir cliente:', error)
      toast.error('Erro ao excluir. Veja o console (F12).')
    } else {
      buscarClientes()
    }
  }

  const clientesFiltrados = busca.trim() === ''
    ? clientes
    : clientes.filter((c) => {
        const q = busca.toLowerCase()
        return (
          c.nome.toLowerCase().includes(q) ||
          (c.telefone ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.documento ?? '').toLowerCase().includes(q)
        )
      })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Clientes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Cadastre e gerencie sua base de clientes</p>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={adicionarCliente} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-nome">Nome</Label>
                <Input
                  id="c-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-telefone">Telefone</Label>
                <Input
                  id="c-telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-email">E-mail</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-documento">CPF / CNPJ</Label>
                <Input
                  id="c-documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-endereco">Endereço</Label>
                <Input
                  id="c-endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-obs">Observações</Label>
                <Input
                  id="c-obs"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <Button type="submit" disabled={salvando} className="w-full">
                {salvando ? 'Salvando...' : 'Adicionar cliente'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Clientes ({clientesFiltrados.length})</CardTitle>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
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

            {!carregando && clientes.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Nenhum cliente cadastrado ainda.</p>
            )}

            {!carregando && clientes.length > 0 && clientesFiltrados.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                Nenhum resultado para &ldquo;{busca}&rdquo;.
              </p>
            )}

            {!carregando && clientesFiltrados.length > 0 && (
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
                  {clientesFiltrados.map((cliente) => (
                    <TableRow
                      key={cliente.id}
                      className={editandoId === cliente.id ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{cliente.nome}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{cliente.telefone || '—'}</TableCell>
                      <TableCell className="text-slate-400 dark:text-slate-500 text-xs">{cliente.documento || '—'}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{cliente.email || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => iniciarEdicao(cliente)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => excluirCliente(cliente.id)}
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
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Editar cliente</h2>
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CPF / CNPJ</label>
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
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</label>
                <Input
                  value={editForm.endereco ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                  placeholder="Rua, número, bairro..."
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

export default Clientes
