import React, { useEffect, useState } from 'react';
import { ArrowLeft, Circle, CircleDot, CircleDashed } from 'lucide-react';
import { BackendApiClient, RecommendSimilarResult } from '../config/backendApi';

interface RecommendSimilarViewProps {
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

const SourceIcon: React.FC<{ dataSource: RecommendSimilarResult['data_source'] }> = ({ dataSource }) => {
  if (dataSource === 'owl+metadata') return <CircleDot className="h-3.5 w-3.5 text-green-600" />;
  if (dataSource === 'metadata_only') return <Circle className="h-3.5 w-3.5 text-yellow-600" />;
  return <CircleDashed className="h-3.5 w-3.5 text-gray-400" />;
};

export const RecommendSimilarView: React.FC<RecommendSimilarViewProps> = ({ acronym, onNavigate }) => {
  const [results, setResults] = useState<RecommendSimilarResult[]>([]);
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
    BackendApiClient.recommendSimilar(acronym, 20)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setResults(res.data.results);
        } else {
          setError(res.message || 'Failed to load similar ontologies');
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Recommend similar error:', e);
        setError('Failed to load similar ontologies');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [acronym]);

  const goBack = () => onNavigate?.('recommend-detail', acronym || undefined);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to {acronym}
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Similar to {acronym}</h1>
          <p className="text-gray-600 mt-1">
            Ranked by embedding similarity and domain-tag overlap.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Finding similar ontologies...</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No similar ontologies found.</p>
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div className="space-y-2">
            {results.map((s) => (
              <button
                key={s.acronym}
                onClick={() => onNavigate?.('recommend-detail', s.acronym)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{s.acronym}</span>
                    <span className="text-sm text-gray-500 truncate">{s.name}</span>
                  </div>
                  {s.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{s.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <SourceIcon dataSource={s.data_source} />
                      {s.source_label}
                    </span>
                    {s.omrank_score !== null && <span>OMRank {s.omrank_score.toFixed(1)}</span>}
                  </div>
                </div>

                {s.tier && (
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${TIER_STYLES[s.tier] || TIER_STYLES.EvidencePending}`}>
                    {s.tier}
                  </span>
                )}

                <div className="shrink-0 text-right w-16">
                  <div className="text-lg font-bold text-gray-900">{s.similarity.toFixed(1)}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Similarity</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
