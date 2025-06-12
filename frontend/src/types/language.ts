/**
 * 语言相关类型定义
 */

export type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  availableLanguages: { code: string; name: string }[];
};
