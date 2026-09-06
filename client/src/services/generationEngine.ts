import type { AdvancedOptions, Algorithm, GeneratedName, NamingStyle } from "@/types";

const prefixes = ["Neo", "Nova", "Next", "Vanta", "Luma", "Nexa", "Meta", "Prime", "Omni", "Astra", "Pro", "Kite"];
const suffixes = ["ify", "ora", "ova", "io", "zen", "ly", "lab", "hub", "sy", "ous", "iq", "lyst"];
const funnyBits = ["y", "bop", "pop", "zilla", "bean", "oodle", "yap", "berry"];
const vowels = "aeiou";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
const unique = <T,>(values: T[]) => Array.from(new Set(values));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function parts(word: string) {
  const clean = normalize(word);
  if (!clean) return ["", "", ""];
  const first = Math.max(2, Math.ceil(clean.length * 0.42));
  const mid = Math.max(2, Math.floor(clean.length * 0.56));
  return [clean.slice(0, first), clean.slice(0, mid), clean.slice(-Math.max(2, Math.ceil(clean.length * 0.42)))];
}

function blend(first: string, second: string) {
  const [a, b] = [parts(first), parts(second)];
  return unique([
    `${a[1]}${b[2]}`,
    `${a[0]}${b[1]}`,
    `${a[2]}${b[0]}`,
    `${a[1].slice(0, -1)}${b[1]}`,
    `${a[0]}${b[2].slice(1)}`,
  ]);
}

function characterFusion(words: string[]) {
  const compact = words.map(normalize).join("");
  const take = (start: number, step: number) => compact.split("").filter((_, index) => index % step === start).join("");
  return unique([take(0, 3), take(1, 3), take(0, 2), compact.slice(0, 3) + compact.slice(-2)]);
}

function pronounceable(seed: string) {
  const clean = normalize(seed);
  if (!clean) return "";
  let result = "";
  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const previous = result[result.length - 1] ?? "";
    if (index > 0 && previous === char && !vowels.includes(char)) continue;
    result += char;
    if (result.length >= 10) break;
  }
  if (result.length > 3 && !vowels.includes(result[result.length - 1])) result += "a";
  return result;
}

function scoreName(name: string, keywords: string[], options: AdvancedOptions) {
  const clean = normalize(name);
  const target = options.preferredLength;
  let score = 62;
  if (clean.length >= 4 && clean.length <= 12) score += 15;
  if (Math.abs(clean.length - target) <= 3) score += 8;
  if (/[aeiou]/.test(clean)) score += 5;
  if (/^[a-z]+$/.test(clean)) score += 4;
  if (!/(.)\1\1/.test(clean)) score += 3;
  const relevance = keywords.filter((keyword) => clean.includes(normalize(keyword).slice(0, 3))).length;
  score += relevance * 3;
  if (clean.length > 18) score -= 8;
  if (options.pronounceable && !/[aeiou].*[aeiou]/.test(clean)) score -= 8;
  if (options.avoidDuplicateCharacters && /(.)\1/.test(clean)) score -= 8;
  return clamp(Math.round(score), 58, 98);
}

function trimToLength(value: string, options: AdvancedOptions) {
  const clean = normalize(value);
  if (!clean) return "";
  if (options.preferredLength < 8 && clean.length > options.preferredLength + 4) {
    return clean.slice(0, options.preferredLength + 2);
  }
  return clean;
}

function styleCandidates(keywords: string[], style: NamingStyle): Array<[string, Algorithm]> {
  const words = keywords.map(normalize).filter(Boolean);
  const first = words[0] ?? "";
  const second = words[1] ?? "";
  const firstTitle = titleCase(first);
  const secondTitle = titleCase(second);
  const blends = blend(first, second);
  const initials = words.map((word) => word[0]).join("");
  const combined = words.join("");
  const direct = unique([`${firstTitle}${secondTitle}`, `${secondTitle}${firstTitle}`, words.map(titleCase).join("")]);
  const prefix = prefixes.flatMap((item) => [item + titleCase(first), item + titleCase(second)]);
  const suffix = suffixes.flatMap((item) => [first + item, second + item, blends[0] + item]);
  const creative = unique([
    ...blends,
    ...blends.map((item) => `${item}${suffixes[item.length % suffixes.length]}`),
    ...prefix.slice(0, 5),
    ...suffix.slice(0, 8),
    pronounceable(blends[1] ?? combined),
  ]);
  const funny = unique([...blends.map((item) => item + funnyBits[item.length % funnyBits.length]), `${second}y${first}`, `${first}oodle`]);
  const abbreviated = unique([initials, initials.toUpperCase(), words.map((word) => word.slice(0, 3)).join(""), `${first.slice(0, 4)}${second.slice(-3)}`]);
  const minimal = unique([...blends, ...abbreviated, first.slice(0, 5) + second.slice(0, 2), second.slice(0, 5) + first.slice(0, 2)]);
  const professional = unique([...direct, `Prime${titleCase(first)}`, `${titleCase(first)}${titleCase(second)}Group`, `${titleCase(first)}${titleCase(second)}Works`]);
  const premium = unique([`Maison${titleCase(first)}`, `Aure${titleCase(second)}`, `Velour${titleCase(first)}`, ...blends.map((item) => `Atelier${titleCase(item)}`)]);
  const modern = unique([...blends, ...prefix.slice(0, 6), ...suffix.slice(0, 8)]);
  const descriptive = direct;

  switch (style) {
    case "Descriptive": return descriptive.map((name): [string, Algorithm] => [name, "Direct Combination"]);
    case "Abstract": return creative.map((name): [string, Algorithm] => [name, "Creative Transformation"]);
    case "Funny": return funny.map((name): [string, Algorithm] => [name, "Creative Transformation"]);
    case "Professional": return professional.map((name): [string, Algorithm] => [name, "Direct Combination"]);
    case "Modern": return modern.map((name): [string, Algorithm] => [name, "Prefix / Suffix"]);
    case "Minimal": return minimal.map((name): [string, Algorithm] => [name, "Abbreviation"]);
    case "Premium": return premium.map((name): [string, Algorithm] => [name, "Prefix / Suffix"]);
    case "Creative": return creative.map((name): [string, Algorithm] => [name, "Word Blend"]);
    case "Short": return [...minimal.map((name): [string, Algorithm] => [name, "Abbreviation"]), ...abbreviated.map((name): [string, Algorithm] => [name, "Character Fusion"])]
    case "Random": return [...descriptive.map((name): [string, Algorithm] => [name, "Direct Combination"]), ...creative.map((name): [string, Algorithm] => [name, "Word Blend"]), ...funny.map((name): [string, Algorithm] => [name, "Creative Transformation"])]
  }
}

export function generateNameSuggestions(
  keywords: string[],
  styles: NamingStyle[],
  count: number,
  options: AdvancedOptions,
  existingNames: string[] = [],
): GeneratedName[] {
  const cleanedKeywords = unique(keywords.map((keyword) => keyword.trim()).filter(Boolean));
  const selectedStyles: NamingStyle[] = styles.length ? styles : ["Random"];
  const existing = new Set(existingNames.map(normalize));
  const candidates: Array<[string, NamingStyle, Algorithm]> = [];

  const stylePools = selectedStyles.map((style) => ({ style, candidates: styleCandidates(cleanedKeywords, style) }));
  const poolLength = Math.max(...stylePools.map((pool) => pool.candidates.length), 0);
  for (let index = 0; index < poolLength; index += 1) {
    stylePools.forEach(({ style, candidates: pool }) => {
      const entry = pool[index];
      if (!entry) return;
      const [candidate, algorithm] = entry;
      const separators = options.includeHyphens ? ["", "-"] : [""];
      separators.forEach((separator) => candidates.push([`${candidate}`.split(" ").join(separator), style, algorithm]));
    });
  }

  const results: GeneratedName[] = [];
  unique(candidates.map(([name]) => normalize(name))).forEach((key, index) => {
    if (results.length >= count || existing.has(key)) return;
    const original = candidates.find(([name]) => normalize(name) === key);
    if (!original) return;
    let name = trimToLength(original[0], options);
    if (options.includeNumbers && index % 7 === 0) name = `${name}${(index % 9) + 1}`;
    if (options.creativeSpelling && index % 4 === 0) name = name.replace(/c/g, "k").replace(/ph/g, "f");
    if (options.pronounceable && index % 3 === 0) name = pronounceable(name);
    if (options.avoidDuplicateCharacters && /(.)\1/.test(name)) return;
    if (name.length < 3) return;
    const normalizedName = normalize(name);
    if (existing.has(normalizedName) || results.some((result) => normalize(result.name) === normalizedName)) return;
    const score = scoreName(name, cleanedKeywords, options);
    results.push({
      id: `${Date.now()}-${index}-${normalizedName}`,
      name: titleCase(name),
      category: original[1],
      algorithm: original[2],
      score,
      length: name.length,
      keywords: cleanedKeywords,
      favorite: false,
      createdAt: Date.now() + index,
    });
  });

  return results.sort((a, b) => b.score - a.score);
}

export function regenerateName(
  item: GeneratedName,
  keywords: string[],
  styles: NamingStyle[],
  options: AdvancedOptions,
  existingNames: string[],
) {
  const preferred = styles.includes(item.category) ? [item.category] : styles;
  return generateNameSuggestions(keywords, preferred, 1, options, existingNames).find(Boolean);
}
