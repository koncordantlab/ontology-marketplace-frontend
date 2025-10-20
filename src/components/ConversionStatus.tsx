import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Database, ArrowRight } from 'lucide-react';

export type ConversionState = 'idle' | 'converting' | 'success' | 'error';

interface ConversionStatusProps {
  state: ConversionState;
  message?: string;
  stats?: {
    nodes_created?: number;
    relationships_created?: number;
    trees?: number;
    total_nodes?: number;
  };
  neo4jUri?: string;
  onClose?: () => void;
}

export const ConversionStatus: React.FC<ConversionStatusProps> = ({
  state,
  message,
  stats,
  neo4jUri,
  onClose
}) => {
  if (state === 'idle') return null;

  const getBrowserUrl = (uri: string) => {
    return uri.replace('bolt://', 'http://').replace(':7687', ':7474');
  };

  return (
    <div className={`mt-4 rounded-lg border p-4 transition-all duration-300 ${
      state === 'converting' ? 'bg-blue-50 border-blue-200' :
      state === 'success' ? 'bg-green-50 border-green-200' :
      state === 'error' ? 'bg-red-50 border-red-200' : ''
    }`}>
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {state === 'converting' && (
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          )}
          {state === 'success' && (
            <CheckCircle className="h-6 w-6 text-green-600" />
          )}
          {state === 'error' && (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Title */}
          <h3 className={`text-sm font-medium ${
            state === 'converting' ? 'text-blue-900' :
            state === 'success' ? 'text-green-900' :
            state === 'error' ? 'text-red-900' : ''
          }`}>
            {state === 'converting' && 'Converting Ontology to Neo4j...'}
            {state === 'success' && 'Conversion Successful!'}
            {state === 'error' && 'Conversion Failed'}
          </h3>

          {/* Message */}
          {message && (
            <p className={`mt-1 text-sm ${
              state === 'converting' ? 'text-blue-700' :
              state === 'success' ? 'text-green-700' :
              state === 'error' ? 'text-red-700' : ''
            }`}>
              {message}
            </p>
          )}

          {/* Progress indicators for converting state */}
          {state === 'converting' && (
            <div className="mt-3 space-y-2">
              {message?.toLowerCase().includes('clear') && (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                  <span>Clearing existing database...</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Downloading ontology file...</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Parsing ontology structure...</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Uploading to Neo4j database...</span>
              </div>
            </div>
          )}

          {/* Stats for success state */}
          {state === 'success' && stats && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.nodes_created !== undefined && (
                <div className="bg-white rounded-md p-2 border border-green-200">
                  <p className="text-xs text-gray-500">Nodes Created</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.nodes_created}</p>
                </div>
              )}
              {stats.total_nodes !== undefined && (
                <div className="bg-white rounded-md p-2 border border-green-200">
                  <p className="text-xs text-gray-500">Total Nodes</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.total_nodes}</p>
                </div>
              )}
              {stats.trees !== undefined && (
                <div className="bg-white rounded-md p-2 border border-green-200">
                  <p className="text-xs text-gray-500">Trees</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.trees}</p>
                </div>
              )}
            </div>
          )}

          {/* Neo4j Browser Link for success */}
          {state === 'success' && neo4jUri && (
            <div className="mt-4">
              <a
                href={getBrowserUrl(neo4jUri)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm bg-white px-4 py-2 rounded-md border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
              >
                <Database className="h-4 w-4" />
                <span>Open Neo4j Browser</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-2 text-xs text-gray-600">
                View your ontology graph at: {getBrowserUrl(neo4jUri)}
              </p>
            </div>
          )}

          {/* Error details */}
          {state === 'error' && message && message.includes('not running') && (
            <div className="mt-3 bg-white rounded-md p-3 border border-red-200">
              <h4 className="text-sm font-medium text-red-900 mb-2">Troubleshooting Tips:</h4>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• Ensure Neo4j Desktop or Server is running</li>
                <li>• Check if bolt protocol is enabled on port 7687</li>
                <li>• Verify firewall settings allow connections</li>
                <li>• Try testing the connection first using the "Test Connection" button</li>
              </ul>
            </div>
          )}
        </div>

        {/* Close button */}
        {(state === 'success' || state === 'error') && onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};