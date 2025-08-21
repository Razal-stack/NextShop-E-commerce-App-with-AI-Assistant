/**
 * Chat List Component
 * Shows all chat sessions with smart management features
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  Search, 
  Filter,
  Clock,
  Star,
  Archive,
  MoreVertical,
  Download,
  Upload,
  X,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatHistoryService, type ChatSession } from '@/services/chatHistoryService';
import { toast } from 'sonner';

interface ChatListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (session: ChatSession) => void;
  onNewChat: () => void;
  currentSessionId: string | null;
}

export default function ChatList({ 
  isOpen, 
  onClose, 
  onSelectChat, 
  onNewChat, 
  currentSessionId 
}: ChatListProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => ChatHistoryService.getSessions());
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const refreshSessions = () => {
    setSessions(ChatHistoryService.getSessions());
  };

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectChat = (session: ChatSession) => {
    if (isSelectionMode) {
      const newSelected = new Set(selectedSessions);
      if (newSelected.has(session.id)) {
        newSelected.delete(session.id);
      } else {
        newSelected.add(session.id);
      }
      setSelectedSessions(newSelected);
    } else {
      onSelectChat(session);
      onClose();
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    ChatHistoryService.deleteSession(sessionId);
    refreshSessions();
    setShowDeleteConfirm(null);
    toast.success('Chat deleted successfully');
  };

  const handleDeleteSelected = () => {
    selectedSessions.forEach(sessionId => {
      ChatHistoryService.deleteSession(sessionId);
    });
    refreshSessions();
    setSelectedSessions(new Set());
    setIsSelectionMode(false);
    toast.success(`${selectedSessions.size} chats deleted`);
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const exportHistory = () => {
    const data = ChatHistoryService.exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nextshop-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Chat history exported');
  };

  const importHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (ChatHistoryService.importHistory(content)) {
        refreshSessions();
        toast.success('Chat history imported successfully');
      } else {
        toast.error('Failed to import chat history');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Chat History</h2>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                  {sessions.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isSelectionMode && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSelectionMode(false)}
                    >
                      Cancel
                    </Button>
                    {selectedSessions.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSelected}
                      >
                        Delete ({selectedSessions.size})
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={exportHistory}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <label className="cursor-pointer">
                <Button variant="ghost" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importHistory}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No matching chats' : 'No chat history'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Start a new conversation to begin your chat history'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={handleNewChat}>
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Chat
                  </Button>
                )}
              </div>
            ) : (
              filteredSessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${session.id === currentSessionId 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${isSelectionMode && selectedSessions.has(session.id)
                      ? 'ring-2 ring-indigo-500 bg-indigo-50'
                      : ''
                    }
                  `}
                  onClick={() => handleSelectChat(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {session.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {session.preview}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(session.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {session.messages.length} messages
                        </span>
                        {session.isActive && (
                          <span className="flex items-center gap-1 text-green-500">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!isSelectionMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Chat?
                </h3>
                <p className="text-gray-500 mb-4">
                  This action cannot be undone. The chat and all its messages will be permanently deleted.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteSession(showDeleteConfirm)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
