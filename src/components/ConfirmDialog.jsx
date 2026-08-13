import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'

function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  variante = 'default',
  onConfirmar,
  onCancelar,
}) {
  useEffect(() => {
    if (!aberto) return
    function handleKey(e) {
      if (e.key === 'Escape') onCancelar()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [aberto, onCancelar])

  if (!aberto) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancelar}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{titulo}</h2>
          {mensagem && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{mensagem}</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancelar}>
            {textoBotaoCancelar}
          </Button>
          <Button
            variant={variante === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirmar}
          >
            {textoBotaoConfirmar}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmDialog
