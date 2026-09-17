import React, { useState } from 'react';
import { Search, Sparkles, ChevronDown, ChevronUp, Circle, CircleDot, CircleDashed } from 'lucide-react';
import { BackendApiClient, RecommendResult } from '../config/backendApi';

type Mode = 'keyword' | 'semantic';
type Platform = 'all' | 'bioportal' | 'proto-okn';
type Preset = 'default' | 'discovery';

const TIER_STYLES: Record<string, string> = {
  Gold: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  Silver: 'bg-gray-200 text-gray-700 border border-gray-300',
  Bronze: 'bg-orange-100 text-orange-800 border border-orange-300',
  Candidate: 'bg-blue-50 text-blue-700 border border-blue-200',
  EvidencePending: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const DIMENSIONS: { key: keyof RecommendResult; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'semantic', label: 'Semantic Quality' },
  { key: 'structural', label: 'Structural Fitness' },
  { key: 'fair', label: 'FAIR Metadata' },
  { key: 'interop', label: 'Interoperability' },
  { key: 'adoption', label: 'Adoption' },
  { key: 'governance', label: 'Governance' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'intl', label: 'Internationalization' },
];

const SourceIcon: React.FC<{ dataSource: RecommendResult['data_source'] }> = ({ dataSource }) => {
  if (dataSource === 'owl+metadata') return <CircleDot className="h-3.5 w-3.5 text-green-600" />;
  if (dataSource === 'metadata_only') return <Circle className="h-3.5 w-3.5 text-yellow-600" />;
  return <CircleDashed className="h-3.5 w-3.5 text-gray-400" />;
};

const DimensionBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
      <span>{label}</span>
      <span className="font-medium text-gray-700">{value.toFixed(1)}</span>
    </div>
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

const ResultRow: React.FC<{ result: RecommendResult; onOpen: (acronym: string) => void }> = ({ result: r, onOpen }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      <div className="w-full flex items-center gap-4 p-4 text-left">
        <span className="w-7 shrink-0 text-center text-sm font-semibold text-gray-400">
          {r.rank}
        </span>

        <button
          onClick={() => onOpen(r.acronym)}
          className="min-w-0 flex-1 text-left group"
          title={`Open ${r.acronym} detail page`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 group-hover:text-blue-600 group-hover:underline">{r.acronym}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.acronym.startsWith('OKN-') ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
              {r.acronym.startsWith('OKN-') ? 'Proto-OKN' : 'BioPortal'}
            </span>
            <span className="text-sm text-gray-500 truncate">{r.name}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <SourceIcon dataSource={r.data_source} />
              {r.source_label}
            </span>
            <span>{r.class_count.toLocaleString()} classes</span>
          </div>
        </button>

        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${TIER_STYLES[r.tier] || TIER_STYLES.EvidencePending}`}>
          {r.tier}
        </span>

        <button onClick={() => onOpen(r.acronym)} className="shrink-0 text-right w-16">
          <div className="text-lg font-bold text-gray-900">{r.score.toFixed(1)}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">OMRank</div>
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-1 rounded hover:bg-gray-100"
          title={expanded ? 'Hide dimension breakdown' : 'Quick preview dimension breakdown'}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 mt-3">
            {DIMENSIONS.map((d) => (
              <DimensionBar key={d.key} label={d.label} value={Number(r[d.key])} />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">
              Confidence: {(r.confidence * 100).toFixed(0)}%
            </p>
            <button
              onClick={() => onOpen(r.acronym)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              View full detail &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface RecommendViewProps {
  onNavigate?: (view: string, acronym?: string) => void;
}

export const RecommendView: React.FC<RecommendViewProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('keyword');
  const [platform, setPlatform] = useState<Platform>('all');
  const [preset, setPreset] = useState<Preset>('default');
  const [results, setResults] = useState<RecommendResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [semanticAvailable, setSemanticAvailable] = useState(true);

  const runSearch = async (q: string, m: Mode, p: Platform, pr: Preset) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await BackendApiClient.recommend(trimmed, m, 20, p, pr);
      if (res.success && res.data) {
        setResults(res.data.results);
        setSearchedQuery(trimmed);
        setSemanticAvailable(res.data.semantic_available);
      } else {
        setError(res.message || 'Failed to get recommendations');
        setResults([]);
      }
    } catch (e) {
      console.error('Recommend error:', e);
      setError('Failed to get recommendations');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query, mode, platform, preset);
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    if (searchedQuery) runSearch(searchedQuery, m, platform, preset);
  };

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    if (searchedQuery) runSearch(searchedQuery, mode, p, preset);
  };

  const handlePresetChange = (pr: Preset) => {
    setPreset(pr);
    if (searchedQuery) runSearch(searchedQuery, mode, platform, pr);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recommend</h1>
          <p className="text-gray-600 mt-1">
            Find the best-fit ontology for a keyword or concept, ranked across 9 evidence-based dimensions.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a keyword or concept (e.g. food, drug metabolism)"
              className="w-full pl-10 pr-28 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Search
            </button>
          </div>

          {/* Mode + Platform toggles */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Mode:</span>
              <button
                type="button"
                onClick={() => handleModeChange('keyword')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                  mode === 'keyword' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Keyword
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('semantic')}
                disabled={!semanticAvailable}
                title={!semanticAvailable ? 'Semantic search is unavailable on the server' : undefined}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                  mode === 'semantic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                Semantic
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Platform:</span>
              {(['all', 'bioportal', 'proto-okn'] as Platform[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlatformChange(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                    platform === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p === 'all' ? 'All' : p === 'bioportal' ? 'BioPortal' : 'Proto-OKN'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Preset:</span>
              <button
                type="button"
                onClick={() => handlePresetChange('default')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                  preset === 'default' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Default
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('discovery')}
                title="Boosts relevance score — surfaces niche and knowledge-graph ontologies"
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                  preset === 'discovery' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                Discovery
              </button>
            </div>
          </div>

          {/* Preset description */}
          <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-400">
            <span className="mt-0.5 shrink-0">ⓘ</span>
            {preset === 'default' ? (
              <span>
                <span className="font-medium text-gray-500">Default</span> — balanced ranking across all 9 quality dimensions (semantic coverage, FAIR metadata, governance, interoperability, and more).
              </span>
            ) : (
              <span>
                <span className="font-medium text-purple-600">Discovery</span> — weights relevance heavily (35%) to surface niche and knowledge-graph ontologies that closely match your query, even if less established.
              </span>
            )}
          </div>
        </form>

        {/* Results */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Ranking ontologies...</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!isLoading && !error && searchedQuery && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No ontologies found for "{searchedQuery}"</p>
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              {results.length} results for "{searchedQuery}"
            </p>
            <div className="space-y-2">
              {results.map((r) => (
                <ResultRow
                  key={r.acronym}
                  result={r}
                  onOpen={(acronym) => onNavigate?.('recommend-detail', acronym)}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !searchedQuery && !error && (
          <div className="text-center py-16">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Enter a keyword above to get ranked ontology recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
};
