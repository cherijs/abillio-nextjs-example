import 'server-only';

const dictionaries = {
  en: () => import('./en.json').then((m) => m.default),
  lv: () => import('./lv.json').then((m) => m.default),
};

export const getDictionary = async (locale: 'en' | 'lv') => dictionaries[locale](); 