import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, CheckCheck } from 'lucide-react';
import { ActivityItem } from '../components/ActivityItem';
import { MessageThread } from '../components/MessageThread';
import { activityService } from '../services/activityService';
import type { ActivityItem as ActivityItemType } from '../types/comment';

interface MessagesViewProps {
  onNavigate: (view: string, ontologyId?: string) => void;
}

const TABS = [
  { key: '', label: 'All' },
  { key: 'comment', label: 'Comments' },
  { key: 'reply', label: 'Replies' },
  { key: 'message', label: 'Messages' },
] as const;

export const MessagesView: React.FC<MessagesViewProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<ActivityItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchItems = useCallback(async (typeFilter?: string, searchQuery?: string) => {
    setLoading(true);
    const result = await activityService.getActivityFeed(
      20, 0,
      typeFilter || undefined,
      searchQuery || undefined
    );
    if (result.success && result.data) {
      setItems(result.data.items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems(activeTab, search);
  }, [activeTab, fetchItems]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchItems(activeTab, value);
    }, 300);
  };

  const handleItemClick = (item: ActivityItemType) => {
    if (item.type === 'message') {
      setSelectedMessageId(item.id);
    } else if (item.ontology_id) {
      onNavigate('ontology-details', item.ontology_id);
    }
  };

  const handleMarkRead = async (itemId: string) => {
    await activityService.markRead(itemId);
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, is_read: true } : i)));
  };

  const handleMarkAllRead = async () => {
    await activityService.markAllRead();
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
  };

  if (selectedMessageId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <MessageThread
            messageId={selectedMessageId}
            onBack={() => { setSelectedMessageId(null); fetchItems(activeTab, search); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600 mt-1">
              Stay updated with comments and activity on your ontologies
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            data-testid="mark-all-read"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="search-input"
          />
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2 mb-4" data-testid="filter-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 text-sm rounded-full ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8" data-testid="loading">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center" data-testid="empty-state">
              <p className="text-gray-500">No messages yet</p>
            </div>
          ) : (
            items.map((item) => (
              <ActivityItem
                key={item.id}
                item={item}
                onClick={handleItemClick}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
