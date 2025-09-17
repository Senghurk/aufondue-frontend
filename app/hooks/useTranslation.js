"use client";

import { useLanguage } from "../context/LanguageContext";
import en from "../../messages/en.json";
import th from "../../messages/th.json";

const translations = {
  en,
  th
};

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value || key;
  };

  const tWithParams = (key, params = {}) => {
    let translation = t(key);
    
    if (typeof translation === 'string') {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }
    
    return translation;
  };

  return { t, tWithParams, language };
}