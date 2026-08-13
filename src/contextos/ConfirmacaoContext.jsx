import { createContext, useContext, useState, useCallback, useRef } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

export const ConfirmacaoContext = createContext(null)

export function ConfirmacaoProvider({ children }) {
  const [config, setConfig] = useState(null)
  const resolveRef = useRef(null)

  const confirmar = useCallback(({
    titulo,
    mensagem,
    textoBotaoConfirmar = 'Confirmar',
    textoBotaoCancelar = 'Cancelar',
    variante = 'default',
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setConfig({ titulo, mensagem, textoBotaoConfirmar, textoBotaoCancelar, variante })
    })
  }, [])

  function handleConfirmar() {
    setConfig(null)
    resolveRef.current?.(true)
  }

  function handleCancelar() {
    setConfig(null)
    resolveRef.current?.(false)
  }

  return (
    <ConfirmacaoContext.Provider value={{ confirmar }}>
      {children}
      <ConfirmDialog
        aberto={!!config}
        titulo={config?.titulo ?? ''}
        mensagem={config?.mensagem ?? ''}
        textoBotaoConfirmar={config?.textoBotaoConfirmar ?? 'Confirmar'}
        textoBotaoCancelar={config?.textoBotaoCancelar ?? 'Cancelar'}
        variante={config?.variante ?? 'default'}
        onConfirmar={handleConfirmar}
        onCancelar={handleCancelar}
      />
    </ConfirmacaoContext.Provider>
  )
}

export const useConfirmar = () => useContext(ConfirmacaoContext).confirmar
