import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import { CommentSystem } from './CommentSystem';

interface CommentsDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  ontologyId?: string;
  currentUserEmail?: string;
  isOntologyOwner?: boolean;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onToggle,
  ontologyId,
  currentUserEmail,
  isOntologyOwner,
}) => {
  return (
    <>
      {/* Toggle button when drawer is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 z-40"
          title="Open Comments"
          data-testid="open-drawer"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '73px', height: 'calc(100vh - 73px)' }}
        data-testid="comments-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
            title="Close Comments"
            data-testid="close-drawer"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Comments content */}
        <div className="overflow-y-auto p-4" style={{ height: 'calc(100% - 65px)' }}>
          {ontologyId ? (
            <CommentSystem
              ontologyId={ontologyId}
              currentUserEmail={currentUserEmail}
              isOntologyOwner={isOntologyOwner}
            />
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Select an ontology to see comments</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
