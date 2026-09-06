export type NamingStyle =
  | "Descriptive"
  | "Abstract"
  | "Funny"
  | "Professional"
  | "Modern"
  | "Minimal"
  | "Premium"
  | "Creative"
  | "Short"
  | "Random";

export type Algorithm =
  | "Direct Combination"
  | "Word Blend"
  | "Prefix / Suffix"
  | "Character Fusion"
  | "Vowel-Consonant"
  | "Abbreviation"
  | "Reverse Combination"
  | "Creative Transformation";

export interface GeneratedName {
  id: string;
  name: string;
  category: NamingStyle;
  algorithm: Algorithm;
  score: number;
  length: number;
  keywords: string[];
  favorite: boolean;
  createdAt: number;
}

export interface AdvancedOptions {
  preferredLength: number;
  includeNumbers: boolean;
  includeHyphens: boolean;
  creativeSpelling: boolean;
  avoidDuplicateCharacters: boolean;
  pronounceable: boolean;
  keywordVisibility: "recognizable" | "partial" | "abstract";
}

export interface ResultFilters {
  category: NamingStyle | "All";
  length: "All" | "Very Short" | "Short" | "Medium" | "Long";
  score: "All" | "90+" | "80+" | "70+";
  algorithm: "All" | Algorithm;
  sort: "Best Match" | "Highest Score" | "Shortest" | "Alphabetical" | "Newest";
}
