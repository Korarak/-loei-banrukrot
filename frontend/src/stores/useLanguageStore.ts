
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'th' | 'en';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'th', // Default to Thai
            setLanguage: (lang) => set({ language: lang }),
            toggleLanguage: () => set((state) => ({ language: state.language === 'th' ? 'en' : 'th' })),
        }),
        {
            name: 'language-storage',
        }
    )
);
