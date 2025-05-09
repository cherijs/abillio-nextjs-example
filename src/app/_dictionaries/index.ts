// import 'server-only';

import en from './en.json';
import lv from './lv.json';

const dictionaries = { en, lv };

export function getDictionary(locale: 'en' | 'lv') {
  return dictionaries[locale];
}
