import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ontologyService } from '../services/ontologyService';

interface Neo4jConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: Neo4jCredentials) => void;
  isLoading: boolean;
}

export interface Neo4jCredentials {
  uri: string;
  username: string;
  password: string;
  rootLabel?: string;
  clearExisting: boolean;
}

export const Neo4jConnectionModal: React.FC<Neo4jConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isLoading
}) => {
  const [credentials, setCredentials] = useState<Neo4jCredentials>({
    uri: 'bolt://localhost:7687',
    username: 'neo4j',
    password: '',
    rootLabel: '',
    clearExisting: true
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({ tested: false, success: false, message: '' });

  const handleTestConnection = async () => {
    if (!credentials.password) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: 'Please enter Neo4j password'
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus({ tested: false, success: false, message: '' });

    try {
      const result = await ontologyService.testNeo4jConnection({
        neo4j_uri: credentials.uri,
        neo4j_user: credentials.username,
        neo4j_password: credentials.password
      });

      setConnectionStatus({
        tested: true,
        success: result.success,
        message: result.success
          ? 'Connection successful! Neo4j is ready.'
          : (result.error || 'Connection failed')
      });
    } catch (error) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.password) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: 'Please enter Neo4j password'
      });
      return;
    }
    onConnect(credentials);
  };

  const resetModal = () => {
    setConnectionStatus({ tested: false, success: false, message: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Connect to Local Neo4j</h2>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-500"
            disabled={isLoading || testingConnection}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Neo4j URI
            </label>
            <input
              type="text"
              value={credentials.uri}
              onChange={(e) => {
                setCredentials({ ...credentials, uri: e.target.value });
                setConnectionStatus({ tested: false, success: false, message: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="bolt://localhost:7687"
              disabled={isLoading || testingConnection}
            />
            <p className="mt-1 text-xs text-gray-500">
              The connection URI for your local Neo4j database
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => {
                setCredentials({ ...credentials, username: e.target.value });
                setConnectionStatus({ tested: false, success: false, message: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="neo4j"
              disabled={isLoading || testingConnection}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => {
                setCredentials({ ...credentials, password: e.target.value });
                setConnectionStatus({ tested: false, success: false, message: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Neo4j password"
              disabled={isLoading || testingConnection}
              required
            />
          </div>

          {/* Connection Test Button and Status */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || isLoading}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {testingConnection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            {connectionStatus.tested && (
              <div className={`p-3 rounded-md flex items-start space-x-2 ${
                connectionStatus.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}>
                {connectionStatus.success ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-sm">
                  {connectionStatus.message}
                  {!connectionStatus.success && connectionStatus.message.includes('not running') && (
                    <div className="mt-2 text-xs">
                      <strong>Troubleshooting:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Ensure Neo4j Desktop or Server is running</li>
                        <li>Check if the bolt protocol is enabled (default port: 7687)</li>
                        <li>Verify firewall settings allow connections</li>
                      </ul>
                    </div>
                  )}
                  {!connectionStatus.success && connectionStatus.message.includes('Authentication failed') && (
                    <div className="mt-2 text-xs">
                      <strong>Troubleshooting:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Verify your Neo4j username and password</li>
                        <li>Default username is usually 'neo4j'</li>
                        <li>You may need to reset the password in Neo4j Desktop</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Root Label (Optional)
            </label>
            <input
              type="text"
              value={credentials.rootLabel}
              onChange={(e) => setCredentials({ ...credentials, rootLabel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Spatial Object"
              disabled={isLoading || testingConnection}
            />
            <p className="mt-1 text-xs text-gray-500">
              Specify a root label to start the tree from a specific node
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={credentials.clearExisting}
                onChange={(e) => setCredentials({ ...credentials, clearExisting: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading || testingConnection}
              />
              <span className="text-sm text-gray-700">Clear existing database before import</span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              If unchecked, the ontology will be added to existing data
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Important:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Neo4j must be running locally before conversion</li>
                  <li>Large ontologies may take several minutes to process</li>
                  <li>The conversion will download and parse the ontology file</li>
                  {credentials.clearExisting && (
                    <li className="text-red-700 font-medium">
                      Warning: This will DELETE all existing data in your Neo4j database!
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading || testingConnection}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed flex items-center ${
                connectionStatus.tested && connectionStatus.success
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
              }`}
              disabled={isLoading || testingConnection}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Converting...
                </>
              ) : (
                <>
                  {connectionStatus.tested && connectionStatus.success && (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Convert to Neo4j
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};