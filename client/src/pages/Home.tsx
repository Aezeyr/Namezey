import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  ExternalLink,
  Filter,
  Heart,
  History,
  Layers3,
  Lightbulb,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Share2,
  Sparkles,
  Sun,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AdvancedOptions, GeneratedName, NamingStyle, ResultFilters } from "@/types";
import { generateNameSuggestions, regenerateName } from "@/services/generationEngine";

const styles: Array<{ name: NamingStyle; note: string }> = [
  { name: "Descriptive", note: "Clear & direct" },
  { name: "Abstract", note: "Invented & ownable" },
  { name: "Modern", note: "Fresh & startup-ready" },
  { name: "Professional", note: "Polished & trusted" },
  { name: "Premium", note: "Refined & elevated" },
  { name: "Creative", note: "Unexpected & bold" },
  { name: "Minimal", note: "Simple & clean" },
  { name: "Short", note: "Compact & punchy" },
  { name: "Funny", note: "Playful & sticky" },
  { name: "Random", note: "A little of everything" },
];

const defaultAdvanced: AdvancedOptions = {
  preferredLength: 10,
  includeNumbers: false,
  includeHyphens: false,
  creativeSpelling: true,
  avoidDuplicateCharacters: true,
  pronounceable: true,
  keywordVisibility: "partial",
};

const defaultFilters: ResultFilters = {
  category: "All",
  length: "All",
  score: "All",
  algorithm: "All",
  sort: "Best Match",
};

const examples = [
  ["Tech", "Cloud"],
  ["Fashion", "Hub"],
  ["Bright", "Academy"],
  ["Travel", "Mint"],
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [keywords, setKeywords] = useState<string[]>(["", ""]);
  const [selectedStyles, setSelectedStyles] = useState<NamingStyle[]>(["Abstract", "Modern", "Short"]);
  const [advanced, setAdvanced] = useState<AdvancedOptions>(defaultAdvanced);
  const [results, setResults] = useState<GeneratedName[]>(() => readStorage("namezey-results", []));
  const [favorites, setFavorites] = useState<GeneratedName[]>(() => readStorage("namezey-favorites", []));
  const [recentSearches, setRecentSearches] = useState<string[][]>(() => readStorage("namezey-recents", []));
  const [filters, setFilters] = useState<ResultFilters>(defaultFilters);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [activeNav, setActiveNav] = useState("Generator");
  const [theme, setTheme] = useState<"light" | "dark">(() => readStorage("namezey-theme", "light"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("namezey-theme", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("namezey-results", JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem("namezey-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("namezey-recents", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const cleanKeywords = useMemo(() => keywords.map((keyword) => keyword.trim()).filter(Boolean), [keywords]);

  const filteredResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    return results
      .filter((item) => {
        if (filters.category !== "All" && item.category !== filters.category) return false;
        if (filters.algorithm !== "All" && item.algorithm !== filters.algorithm) return false;
        if (filters.score !== "All" && item.score < Number(filters.score.replace("+", ""))) return false;
        if (filters.length === "Very Short" && item.length > 6) return false;
        if (filters.length === "Short" && (item.length < 7 || item.length > 10)) return false;
        if (filters.length === "Medium" && (item.length < 11 || item.length > 15)) return false;
        if (filters.length === "Long" && item.length < 16) return false;
        if (query && !`${item.name} ${item.category} ${item.algorithm}`.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sort === "Highest Score") return b.score - a.score;
        if (filters.sort === "Shortest") return a.length - b.length;
        if (filters.sort === "Alphabetical") return a.name.localeCompare(b.name);
        if (filters.sort === "Newest") return b.createdAt - a.createdAt;
        return b.score - a.score;
      });
  }, [filters, results, search]);

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  function notify(message: string) {
    setToast(message);
  }

  function updateKeyword(index: number, value: string) {
    setKeywords((current) => current.map((keyword, keywordIndex) => (keywordIndex === index ? value : keyword)));
  }

  function toggleStyle(style: NamingStyle) {
    setSelectedStyles((current) => {
      if (style === "Random") return ["Random"];
      const without = current.filter((item) => item !== "Random");
      return without.includes(style) ? without.filter((item) => item !== style) : [...without, style];
    });
  }

  function validate() {
    if (cleanKeywords.length < 2) {
      notify("Please enter at least two keywords.");
      return false;
    }
    if (new Set(cleanKeywords.map((keyword) => keyword.toLowerCase())).size < 2) {
      notify("Try using two different keywords for more creative combinations.");
      return false;
    }
    return true;
  }

  function generate(more = false) {
    if (!validate()) return;
    setIsLoading(true);
    window.setTimeout(() => {
      const generated = generateNameSuggestions(cleanKeywords, selectedStyles, more ? 10 : 20, advanced, results.map((item) => item.name));
      setResults((current) => (more ? [...current, ...generated] : generated));
      const signature = [...cleanKeywords];
      setRecentSearches((current) => [signature, ...current.filter((item) => item.join("|") !== signature.join("|")).slice(0, 4)]);
      setIsLoading(false);
      notify(more ? "10 fresh names added." : `${generated.length} name ideas are ready.`);
    }, 420);
  }

  function copyText(value: string) {
    navigator.clipboard?.writeText(value);
    notify("Copied to clipboard!");
  }

  function toggleFavorite(item: GeneratedName) {
    setFavorites((current) => {
      if (current.some((favorite) => favorite.id === item.id)) return current.filter((favorite) => favorite.id !== item.id);
      return [{ ...item, favorite: true }, ...current];
    });
    setResults((current) => current.map((result) => (result.id === item.id ? { ...result, favorite: !result.favorite } : result)));
  }

  function regenerate(item: GeneratedName) {
    const replacement = regenerateName(item, cleanKeywords, selectedStyles, advanced, results.map((result) => result.name));
    if (!replacement) return notify("No new name found in this style yet.");
    setResults((current) => current.map((result) => (result.id === item.id ? replacement : result)));
    notify("Name refreshed.");
  }

  function shareResults() {
    const text = filteredResults.map((item) => `${item.name} — ${item.category} · ${item.score}/100`).join("\n");
    if (navigator.share) {
      navigator.share({ title: "Namezey name ideas", text }).catch(() => undefined);
    } else {
      copyText(text);
      notify("Results copied — ready to share.");
    }
  }

  function exportResults(format: "txt" | "csv", sourceItems = filteredResults, filePrefix = "results") {
    const rows = sourceItems.map((item) => ({ Name: item.name, Category: item.category, Algorithm: item.algorithm, Score: item.score }));
    if (format === "csv") {
      const csv = ["Name,Category,Algorithm,Score", ...rows.map((row) => [row.Name, row.Category, row.Algorithm, row.Score].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
      downloadFile(`namezey-${filePrefix}.csv`, csv, "text/csv");
    } else {
      downloadFile(`namezey-${filePrefix}.txt`, rows.map((row) => `${row.Name}\t${row.Category}\t${row.Algorithm}\t${row.Score}/100`).join("\n"), "text/plain");
    }
    notify(`Exported ${format.toUpperCase()} file.`);
  }

  function loadRecent(searchTerms: string[]) {
    setKeywords([...searchTerms, ""].slice(0, Math.max(2, searchTerms.length)));
    window.scrollTo({ top: 0, behavior: "smooth" });
    notify("Search restored.");
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearch("");
  }

  const scrollTo = (id: string, label: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveNav(label);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950 transition-colors dark:bg-[#0d1118] dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-12%] top-[-18%] h-[34rem] w-[34rem] rounded-full bg-violet-200/30 blur-3xl dark:bg-indigo-950/20" />
        <div className="absolute right-[-10%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-sky-100/50 blur-3xl dark:bg-sky-950/15" />
        <div className="grain absolute inset-0 opacity-35" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f7f8fb]/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1118]/85">
        <div className="mx-auto flex h-[72px] max-w-[1220px] items-center justify-between px-5 lg:px-8">
          <button className="flex items-center gap-3" onClick={() => scrollTo("generator", "Generator")} aria-label="Go to Namezey generator">
            <span className="logo-mark"><Sparkles size={15} strokeWidth={2.6} /></span>
            <span className="font-display text-[21px] font-semibold tracking-[-0.04em]">Namezey</span>
          </button>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
            {["Generator", "How it works", "Features", "Favorites"].map((item) => (
              <button key={item} onClick={() => scrollTo(item === "How it works" ? "how-it-works" : item.toLowerCase(), item)} className={`nav-link ${activeNav === item ? "nav-link-active" : ""}`}>
                {item}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button className="theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle color theme">
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="button-dark" onClick={() => scrollTo("generator", "Generator")}>Generate <ArrowRight size={15} /></button>
          </div>
          <button className="rounded-full p-2 md:hidden" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileMenuOpen && <div className="border-t border-slate-200/80 bg-white/95 px-5 py-4 dark:border-white/10 dark:bg-[#121822]/95 md:hidden">
          <div className="flex flex-col gap-1">
            {["Generator", "How it works", "Features", "Favorites"].map((item) => <button key={item} className="rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5" onClick={() => scrollTo(item === "How it works" ? "how-it-works" : item.toLowerCase(), item)}>{item}</button>)}
          </div>
        </div>}
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-[1220px] px-5 pb-8 pt-16 lg:px-8 lg:pb-14 lg:pt-24">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> Intelligent name generation</div>
              <h1 className="font-display mt-6 max-w-3xl text-[3.4rem] font-medium leading-[0.97] tracking-[-0.065em] sm:text-[5rem] lg:text-[6.25rem]">Create names<br /><span className="text-gradient">that stand out.</span></h1>
              <p className="mt-7 max-w-xl text-[17px] leading-7 text-slate-600 dark:text-slate-400">Turn simple words into memorable, ownable name ideas. Shape the vibe, explore the possibilities, and find the one that clicks.</p>
            </div>
            <div className="hidden lg:block">
              <div className="rounded-[24px] border border-white/80 bg-white/65 p-5 shadow-[0_20px_70px_rgba(33,41,67,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">The Namezey method</span><WandSparkles size={17} className="text-violet-500" /></div>
                <div className="mt-5 flex items-center gap-2 text-sm font-medium"><span className="chip chip-muted">words</span><ArrowRight size={15} className="text-slate-400" /><span className="chip chip-violet">vibe</span><ArrowRight size={15} className="text-slate-400" /><span className="chip chip-dark">names</span></div>
                <div className="mt-5 flex items-end justify-between"><span className="text-xs text-slate-500 dark:text-slate-400">10+ algorithms</span><span className="text-xs text-slate-500 dark:text-slate-400">instant results</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="generator" className="mx-auto max-w-[1220px] scroll-mt-24 px-5 pb-24 lg:px-8">
          <div className="generator-shell">
            <div className="flex flex-col gap-3 border-b border-slate-200/80 px-6 py-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">What are you naming?</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start with two words. Add more context for better combinations.</p></div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><span className="status-pulse" /> No account needed</div>
            </div>
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="space-y-3">
                  {keywords.map((keyword, index) => <div key={index} className="keyword-row"><label htmlFor={`keyword-${index}`} className="keyword-index">0{index + 1}</label><input id={`keyword-${index}`} value={keyword} onChange={(event) => updateKeyword(index, event.target.value)} placeholder={index === 0 ? "e.g. Tech" : index === 1 ? "e.g. Cloud" : "Add another word"} className="keyword-input" autoComplete="off" />{index > 1 && <button onClick={() => setKeywords((current) => current.filter((_, i) => i !== index))} className="icon-button" aria-label={`Remove keyword ${index + 1}`}><X size={16} /></button>}</div>)}
                </div>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 transition hover:text-violet-700 dark:text-violet-300" onClick={() => setKeywords((current) => [...current, ""])}><Plus size={16} /> Add keyword</button>
                <div className="mt-7"><div className="mb-3 flex items-center justify-between"><span className="section-label">Try a starting point</span><span className="text-xs text-slate-400">or type your own</span></div><div className="flex flex-wrap gap-2">{examples.map((example) => <button key={example.join("+")} onClick={() => setKeywords(example)} className="example-pill">{example[0]} <span>+</span> {example[1]}</button>)}</div></div>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between"><span className="section-label">Select a vibe</span><span className="text-xs text-slate-400">{selectedStyles.length} selected</span></div>
                <div className="style-grid">{styles.map((style) => { const selected = selectedStyles.includes(style.name); return <button key={style.name} onClick={() => toggleStyle(style.name)} className={`style-card ${selected ? "style-card-selected" : ""}`} aria-pressed={selected}><span className="style-check">{selected && <Check size={11} strokeWidth={3} />}</span><span><span className="block text-sm font-semibold">{style.name}</span><span className="mt-0.5 block text-[11px] text-slate-400">{style.note}</span></span></button>; })}</div>
                <button onClick={() => setAdvancedOpen((open) => !open)} className="advanced-trigger mt-5" aria-expanded={advancedOpen}><span className="flex items-center gap-2"><Filter size={15} /> Advanced options</span>{advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                {advancedOpen && <div className="advanced-panel mt-3 space-y-5"><div><div className="mb-2 flex justify-between text-xs font-semibold"><span>Preferred length</span><span className="text-violet-600">{advanced.preferredLength} chars</span></div><input type="range" min="4" max="30" value={advanced.preferredLength} onChange={(event) => setAdvanced((current) => ({ ...current, preferredLength: Number(event.target.value) }))} className="w-full accent-violet-600" /></div><div className="grid gap-3 sm:grid-cols-2">{(["includeNumbers", "includeHyphens", "creativeSpelling", "avoidDuplicateCharacters", "pronounceable"] as const).map((key) => <label key={key} className="toggle-row"><span>{key === "includeNumbers" ? "Include numbers" : key === "includeHyphens" ? "Include hyphens" : key === "creativeSpelling" ? "Creative spelling" : key === "avoidDuplicateCharacters" ? "Avoid duplicates" : "Pronounceable"}</span><input type="checkbox" checked={advanced[key]} onChange={(event) => setAdvanced((current) => ({ ...current, [key]: event.target.checked }))} /><span className="toggle-ui" /></label>)}</div><div><div className="mb-2 text-xs font-semibold">Keyword visibility</div><div className="flex flex-wrap gap-2">{(["recognizable", "partial", "abstract"] as const).map((value) => <button key={value} className={`mini-choice ${advanced.keywordVisibility === value ? "mini-choice-active" : ""}`} onClick={() => setAdvanced((current) => ({ ...current, keywordVisibility: value }))}>{value}</button>)}</div></div></div>}
              </div>
            </div>
            <div className="flex flex-col gap-4 border-t border-slate-200/80 bg-slate-50/65 px-6 py-5 dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="text-xs leading-5 text-slate-500 dark:text-slate-400"><Sparkles size={14} className="mr-1 inline text-violet-500" /> Your ideas are generated locally and stay in your browser.</p><button className="generate-button" onClick={() => generate()} disabled={isLoading}>{isLoading ? <><span className="spinner" /> Creating something name-worthy...</> : <><Sparkles size={17} /> Generate names <ArrowRight size={16} /></>}</button></div>
          </div>
        </section>

        <section id="results" className="mx-auto max-w-[1220px] scroll-mt-24 px-5 pb-28 lg:px-8">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="eyebrow"><span className="eyebrow-dot" /> Your name studio</div><h2 className="font-display mt-3 text-4xl font-medium tracking-[-0.055em]">Explore the shortlist<span className="text-violet-500">.</span></h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{results.length ? `${filteredResults.length} of ${results.length} ideas shown` : "Your next great name starts here."}</p></div>{results.length > 0 && <div className="flex flex-wrap items-center gap-2"><button className="utility-button" onClick={shareResults}><Share2 size={15} /> Share</button><button className="utility-button" onClick={() => exportResults("csv")}><Download size={15} /> Export</button><button className="utility-button" onClick={() => generate(true)}><RefreshCcw size={15} /> Generate more</button></div>}</div>
          {results.length > 0 && <div className="filter-bar"><div className="relative min-w-[180px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search generated names..." className="filter-search" /></div><select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as ResultFilters["category"] }))} className="filter-select"><option value="All">All categories</option>{styles.map((style) => <option key={style.name} value={style.name}>{style.name}</option>)}</select><select value={filters.score} onChange={(event) => setFilters((current) => ({ ...current, score: event.target.value as ResultFilters["score"] }))} className="filter-select"><option value="All">All scores</option><option value="90+">90+ score</option><option value="80+">80+ score</option><option value="70+">70+ score</option></select><select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as ResultFilters["sort"] }))} className="filter-select"><option>Best Match</option><option>Highest Score</option><option>Shortest</option><option>Alphabetical</option><option>Newest</option></select></div>}
          {results.length === 0 ? <div className="empty-studio"><div className="empty-icon"><Lightbulb size={24} /></div><h3 className="font-display text-2xl font-semibold tracking-[-0.035em]">Your next great name starts here.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Enter at least two keywords and let Namezey create something memorable.</p><button className="button-dark mt-6" onClick={() => scrollTo("generator", "Generator")}>Start generating <ArrowRight size={15} /></button></div> : filteredResults.length === 0 ? <div className="empty-studio"><div className="empty-icon"><Search size={24} /></div><h3 className="font-display text-2xl font-semibold tracking-[-0.035em]">No names match your filters.</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try broadening your search or clearing a filter.</p><button className="button-light mt-6" onClick={clearFilters}>Clear filters</button></div> : <div className="results-grid">{filteredResults.map((item, index) => <article key={item.id} className="name-card" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}><div className="flex items-start justify-between gap-3"><div><div className="mb-3 flex items-center gap-2"><span className="category-dot" /> <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.category}</span></div><h3 className="font-display text-[28px] font-semibold tracking-[-0.05em]">{item.name}</h3></div><button className={`favorite-button ${favoriteIds.has(item.id) ? "favorite-active" : ""}`} onClick={() => toggleFavorite(item)} aria-label={favoriteIds.has(item.id) ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}><Heart size={17} fill={favoriteIds.has(item.id) ? "currentColor" : "none"} /></button></div><div className="mt-7 flex items-end justify-between"><div><span className="block text-[11px] uppercase tracking-[0.1em] text-slate-400">Brand score</span><span className="mt-1 block font-display text-xl font-semibold">{item.score}<span className="text-sm font-normal text-slate-400">/100</span></span></div><div className="score-ring" style={{ background: `conic-gradient(#7c5cff ${item.score * 3.6}deg, #ebeaf3 0deg)` }}><span>{item.score}</span></div></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400 dark:border-white/10"><span>{item.algorithm}</span><span>{item.length} chars</span></div><div className="mt-4 flex items-center gap-2"><button className="card-action" onClick={() => copyText(item.name)}><Clipboard size={14} /> Copy</button><button className="card-action" onClick={() => regenerate(item)} aria-label={`Regenerate ${item.name}`}><RefreshCcw size={14} /></button><button className="card-action" onClick={() => notify("Domain availability checks are ready for API integration.")}><ExternalLink size={14} /> Check availability</button></div></article>)}</div>}
          {results.length > 0 && <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">Namezey generates creative name ideas. A generated name does not guarantee trademark, business-name, social-media, or domain availability. Always perform your own checks before using a name commercially.</p>}
        </section>

        <section id="favorites" className="border-y border-slate-200/80 bg-white/55 dark:border-white/10 dark:bg-white/[0.02]"><div className="mx-auto max-w-[1220px] px-5 py-20 lg:px-8"><div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between"><div><div className="eyebrow"><Heart size={13} /> Saved for later</div><h2 className="font-display mt-3 text-4xl font-medium tracking-[-0.055em]">My favorites<span className="text-violet-500">.</span></h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A private shelf for the names you can’t stop thinking about.</p></div>{favorites.length > 0 && <button className="button-light self-start" onClick={() => exportResults("txt", favorites, "favorites")}><Download size={15} /> Export favorites</button>}</div>{favorites.length === 0 ? <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white/50 px-6 py-12 text-center dark:border-white/15 dark:bg-white/[0.03]"><Heart size={22} className="mx-auto text-slate-300" /><p className="mt-4 text-sm text-slate-500">Tap the heart on any name to save it here.</p></div> : <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{favorites.map((item) => <div key={item.id} className="favorite-row"><div><div className="font-display text-xl font-semibold tracking-[-0.035em]">{item.name}</div><div className="mt-1 text-xs text-slate-400">{item.category} · {formatTimestamp(item.createdAt)}</div></div><div className="flex gap-1"><button className="icon-button" onClick={() => copyText(item.name)} aria-label={`Copy ${item.name}`}><Clipboard size={15} /></button><button className="icon-button" onClick={() => toggleFavorite(item)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button></div></div>)}</div>}</div></section>

        <section id="how-it-works" className="mx-auto max-w-[1220px] scroll-mt-24 px-5 py-24 lg:px-8"><div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]"><div><div className="eyebrow"><Layers3 size={13} /> The simple way to better names</div><h2 className="font-display mt-4 max-w-sm text-4xl font-medium leading-[1.02] tracking-[-0.055em]">From loose words to a name with a point of view.</h2></div><div className="grid gap-8 sm:grid-cols-3">{[["01", "Enter your words", "Add two or more words that capture your idea."], ["02", "Choose your style", "Shape the mood with a mix of naming vibes."], ["03", "Generate & discover", "Filter, save, copy, and find the one that clicks."]].map(([number, title, copy]) => <div key={number} className="step-item"><span className="step-number">{number}</span><h3 className="mt-8 font-display text-xl font-semibold tracking-[-0.035em]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{copy}</p></div>)}</div></div></section>

        <section id="features" className="scroll-mt-24 bg-[#11151d] text-white"><div className="mx-auto max-w-[1220px] px-5 py-20 lg:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="eyebrow eyebrow-dark"><Sparkles size={13} /> Built for the good kind of stuck</div><h2 className="font-display mt-4 text-4xl font-medium tracking-[-0.055em] sm:text-5xl">More signal.<br /><span className="text-violet-300">Less naming noise.</span></h2></div><p className="max-w-sm text-sm leading-6 text-slate-400">Namezey mixes thoughtful algorithms with a fast, focused workspace so the best ideas rise to the top.</p></div><div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">{[["01", "Multiple styles", "Descriptive, abstract, funny, modern, premium, and everything between."], ["02", "Smart combinations", "Blend, transform, abbreviate, and reshape instead of just joining words."], ["03", "Brand scoring", "Compare ideas using an internal creative score for clarity and memorability."], ["04", "Instant filtering", "Find the right length, algorithm, style, or score in a few clicks."], ["05", "Private by default", "Your ideas stay in the browser. No account or setup required."], ["06", "Ready to share", "Copy, share, or export your shortlist as TXT or CSV."]].map(([number, title, copy]) => <div key={number} className="feature-tile"><span className="text-xs font-semibold tracking-[0.2em] text-violet-300">{number}</span><h3 className="mt-8 font-display text-xl font-semibold tracking-[-0.035em]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p></div>)}</div></div></section>

        <section className="mx-auto max-w-[1220px] px-5 py-20 lg:px-8"><div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="eyebrow"><History size={13} /> Recent searches</div><h2 className="font-display mt-3 text-3xl font-medium tracking-[-0.05em]">Pick up where you left off.</h2></div>{recentSearches.length > 0 && <div className="flex flex-wrap gap-2 lg:justify-end">{recentSearches.map((item) => <button key={item.join("|")} onClick={() => loadRecent(item)} className="recent-pill">{item.join(" + ")} <ArrowRight size={13} /></button>)}</div>}</div></section>
      </main>

      <footer className="border-t border-slate-200/80 dark:border-white/10"><div className="mx-auto flex max-w-[1220px] flex-col gap-6 px-5 py-8 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><div className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.04em] text-slate-900 dark:text-white"><span className="logo-mark logo-mark-small"><Sparkles size={11} /></span> namezey</div><p className="mt-2 text-xs">Turn your words into great names.</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs"><button onClick={() => scrollTo("generator", "Generator")}>Generator</button><button onClick={() => scrollTo("how-it-works", "How it works")}>How it works</button><button onClick={() => scrollTo("features", "Features")}>Features</button><button onClick={() => notify("Privacy-first: your data stays in this browser.")}>Privacy</button><button onClick={() => notify("Namezey is a creative ideation tool, not legal advice.")}>Terms</button></div><p className="text-xs">© 2026 Namezey. All rights reserved.</p></div></footer>

      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}
