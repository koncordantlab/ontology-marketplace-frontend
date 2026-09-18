import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Download, ArrowUpRight, Layers, Circle, CircleDot, CircleDashed } from 'lucide-react';
import { BackendApiClient, RecommendDetail } from '../config/backendApi';

interface RecommendDetailViewProps {
  acronym: string | null;
  onNavigate?: (view: string, id?: string) => void;
}

const TIER_STYLES: Record<string, string> = {
  Gold: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  Silver: 'bg-gray-200 text-gray-700 border border-gray-300',
  Bronze: 'bg-orange-100 text-orange-800 border border-orange-300',
  Candidate: 'bg-blue-50 text-blue-700 border border-blue-200',
  EvidencePending: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const scoreColor = (value: number | null) => {
  if (value === null) return 'text-gray-400';
  if (value >= 70) return 'text-green-600';
  if (value >= 50) return 'text-amber-600';
  return 'text-gray-500';
};

const SourceIcon: React.FC<{ dataSource: RecommendDetail['data_source'] }> = ({ dataSource }) => {
  if (dataSource === 'owl+metadata') return <CircleDot className="h-3.5 w-3.5 text-green-600" />;
  if (dataSource === 'metadata_only') return <Circle className="h-3.5 w-3.5 text-yellow-600" />;
  return <CircleDashed className="h-3.5 w-3.5 text-gray-400" />;
};

const StatTile: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="bg-gray-50 rounded-md px-3 py-2.5">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-base font-semibold text-gray-900 mt-0.5">{value}</div>
  </div>
);

export const RecommendDetailView: React.FC<RecommendDetailViewProps> = ({ acronym, onNavigate }) => {
  const [detail, setDetail] = useState<RecommendDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!acronym) {
      setError('No ontology specified');
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError('');
    BackendApiClient.recommendDetail(acronym)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setDetail(res.data);
        } else {
          setError(res.message || 'Ontology not found');
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Recommend detail error:', e);
        setError('Failed to load ontology detail');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [acronym]);

  const goBack = () => onNavigate?.('recommend');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading ontology...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <p className="text-red-600">{error || 'Ontology not found'}</p>
        </div>
      </div>
    );
  }

  const r = detail;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-blue-700">{r.acronym}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TIER_STYLES[r.tier] || TIER_STYLES.EvidencePending}`}>
                  {r.tier}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <SourceIcon dataSource={r.data_source} />
                  {r.source_label}
                </span>
              </div>
              <p className="text-lg text-gray-900 mt-1">{r.name}</p>
            </div>
            {r.omrank_score !== null && (
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold text-gray-900">{r.omrank_score.toFixed(2)}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">OMRank Score</div>
                {r.confidence !== null && (
                  <div className="text-xs text-gray-400 mt-1">conf {r.confidence.toFixed(4)}</div>
                )}
              </div>
            )}
          </div>

          {r.description && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">{r.description}</p>
          )}

          {r.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {r.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Links & actions */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Links &amp; Actions</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigate?.('recommend-similar', r.acronym)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
              >
                <Layers className="h-3.5 w-3.5" /> Find similar ontologies
              </button>
              {r.homepage && (
                <a
                  href={r.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors duration-200"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Official Homepage
                </a>
              )}
              {r.download_url && (
                <a
                  href={r.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <Download className="h-3.5 w-3.5" /> {r.data_source === 'kg_csv' ? 'Download Entities CSV' : 'Download OWL File'}
                </a>
              )}
              {r.data_source !== 'kg_csv' && (
                <a
                  href={`https://bioportal.bioontology.org/ontologies/${r.acronym}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" /> View on BioPortal
                </a>
              )}
              {r.data_source === 'kg_csv' && (
                <a
                  href={`https://proto-okn.net`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors duration-200"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" /> View on Proto-OKN
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dimension scores */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Dimension Scores</h2>
            <div className="space-y-4">
              {r.dims.map((d) => (
                <div key={d.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium" title={d.desc}>
                      {d.name} <span className="text-gray-400 font-normal">&times;{d.weight}%</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {d.conf !== null && <span className="text-xs text-gray-400">conf {d.conf}</span>}
                      <span className={`font-semibold ${scoreColor(d.score)}`}>
                        {d.score !== null ? d.score.toFixed(1) : '—'}
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, d.score ?? 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Green &ge; 70 &middot; Amber &ge; 50 &middot; Grey &lt; 50
            </p>
          </div>

          {/* OWL statistics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">OWL Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Classes" value={r.class_count.toLocaleString()} />
              <StatTile label="Properties" value={r.property_count.toLocaleString()} />
              <StatTile label="Individuals" value={r.individual_count.toLocaleString()} />
              <StatTile label="Axioms" value={r.axiom_count.toLocaleString()} />
              <StatTile label="Max Depth" value={r.max_depth} />
              <StatTile label="Avg Depth" value={r.avg_depth} />
              <StatTile label="Has Labels" value={r.has_label_count.toLocaleString()} />
              <StatTile label="Has Definitions" value={r.has_definition_count.toLocaleString()} />
              <StatTile label="Has Synonyms" value={r.has_synonym_count.toLocaleString()} />
              <StatTile label="OWL Profile" value={r.owl_profile || '—'} />
              <StatTile label="External NS" value={r.external_ns_count} />
              <StatTile label="Imports" value={r.import_count} />
            </div>
            {r.language_tags.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-1.5">Languages</div>
                <div className="flex flex-wrap gap-1.5">
                  {r.language_tags.map((lang) => (
                    <span key={lang} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Metadata</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Release Date</dt>
                <dd className="text-gray-900 text-right">{r.release_date || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">OWL Format</dt>
                <dd className="text-gray-900 text-right">{r.owl_format || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Download Status</dt>
                <dd className="text-gray-900 text-right">{r.download_status || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Parse Status</dt>
                <dd className="text-gray-900 text-right">{r.parse_status || '—'}</dd>
              </div>
              {r.version_iri && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 shrink-0">Version IRI</dt>
                  <dd className="text-gray-900 text-right break-all">{r.version_iri}</dd>
                </div>
              )}
              {r.uri && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 shrink-0">URI</dt>
                  <dd className="text-gray-900 text-right break-all">{r.uri}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
