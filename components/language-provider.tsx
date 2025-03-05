"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Language, DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES, createTranslator } from "@/lib/i18n"

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
  availableLanguages: typeof AVAILABLE_LANGUAGES
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({
  children,
  defaultLanguage = DEFAULT_LANGUAGE,
}: {
  children: React.ReactNode
  defaultLanguage?: Language
}) {
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const [translator, setTranslator] = useState(() => createTranslator(defaultLanguage))

  // Update translator when language changes
  useEffect(() => {
    setTranslator(() => createTranslator(language))
    
    // Store language preference
    localStorage.setItem("luxury-management-language", language)
    
    // Set lang attribute on html tag
    document.documentElement.setAttribute("lang", language)
  }, [language])

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("luxury-management-language") as Language | null
    
    if (savedLanguage && Object.keys(AVAILABLE_LANGUAGES).includes(savedLanguage)) {
      setLanguage(savedLanguage)
    } else {
      // Try to detect browser language preference
      const browserLang = navigator.language.split("-")[0] as Language
      
      if (Object.keys(AVAILABLE_LANGUAGES).includes(browserLang)) {
        setLanguage(browserLang)
      }
    }
  }, [])

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translator,
        availableLanguages: AVAILABLE_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  
  return context
}