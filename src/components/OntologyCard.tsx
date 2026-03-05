import React from 'react';
import { MoreHorizontal, Eye, Edit } from 'lucide-react';

interface Ontology {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail: string;
  lastModified: string;
}

interface OntologyCardProps {
  ontology: Ontology;
  onView: () => void;
  onEdit: () => void;
}

export const OntologyCard: React.FC<OntologyCardProps> = React.memo(({
  ontology,
  onView,
  onEdit
}) => {
  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-pink-100 text-pink-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      {/* Thumbnail */}
      <div className="p-4 border-b border-gray-100">
        {ontology.thumbnail ? (
          <img 
            src={ontology.thumbnail} 
            alt={`${ontology.title} thumbnail`}
            className="w-full h-32 object-cover rounded-md"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center" style={{ display: ontology.thumbnail ? 'none' : 'flex' }}>
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
            {ontology.title}
          </h3>
          <div className="relative ml-2">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {ontology.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {ontology.tags.map((tag, index) => (
            <span
              key={tag}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(index)}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={onView}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </button>
            <button
              onClick={onEdit}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(ontology.lastModified).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
});