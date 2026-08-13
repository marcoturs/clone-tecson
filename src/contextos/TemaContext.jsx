import { createContext, useContext, useState, useEffect } from 'react'

const TemaContext = createContext(null)

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(
    () => localStorage.getItem('clone-tecson-tema') ?? 'claro'
  )

  useEffect(() => {
    const html = document.documentElement
    if (tema === 'escuro') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    localStorage.setItem('clone-tecson-tema', tema)
  }, [tema])

  function alternarTema() {
    setTema((t) => (t === 'claro' ? 'escuro' : 'claro'))
  }

  return (
    <TemaContext.Provider value={{ tema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  )
}

export const useTema = () => useContext(TemaContext)
