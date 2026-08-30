import React from 'react'
import { useT } from '/imports/languages/LanguageProvider'

const GameNotFound = () => {
  const t = useT()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-red-500 font-bold text-7xl uppercase tracking-widest">
        {t('errors.notFound')}
      </h1>
    </div>
  )
}

export default GameNotFound
