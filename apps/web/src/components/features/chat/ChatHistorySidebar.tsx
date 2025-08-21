import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatHistoryStore } from '@/lib/store';
import { 
  X, 
  Trash2, 
  MessageCircle, 
  Calendar,
  Search,
  ShoppingBag,
  HelpCircle,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (messages: any[]) => void;
  onNewChat: () => void;
}

export function ChatHistorySidebar({ 
  isOpen, 
  onClose, 
  onLoadSession, 
  onNewChat 
}: ChatHistorySidebarProps) {
  const { 
    sessions, 
    deleteSession, 
    loadSession, 
    clearAllSessions,
    generateSessionTitle 
  } = useChatHistoryStore();

  const handleLoadSession = (sessionId: string) => {
    const messages = loadSession(sessionId);
    if (messages) {
      onLoadSession(messages);
      onClose();
      toast.success('Chat loaded from history');
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(sessionId);
    toast.success('Chat deleted');
  };

  const handleClearAll = () => {
    clearAllSessions();
    toast.success('All chats cleared');
  };

  const getSessionIcon = (title: string) => {
    if (title.includes('🔍')) return Search;
    if (title.includes('🛍️')) return ShoppingBag;
    if (title.includes('❓')) return HelpCircle;
    return MessageCircle;
  };

  const groupSessionsByDate = (sessions: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    return {
      today: sessions.filter(s => new Date(s.createdAt) >= today),
      yesterday: sessions.filter(s => {
        const date = new Date(s.createdAt);
        return date >= yesterday && date < today;
      }),
      thisWeek: sessions.filter(s => {
        const date = new Date(s.createdAt);
        return date >= weekAgo && date < yesterday;
      }),
      thisMonth: sessions.filter(s => {
        const date = new Date(s.createdAt);
        return date >= monthAgo && date < weekAgo;
      }),
      older: sessions.filter(s => new Date(s.createdAt) < monthAgo),
    };
  };

  const groupedSessions = groupSessionsByDate(sessions);

  const renderSessionGroup = (title: string, groupSessions: any[]) => {
    if (groupSessions.length === 0) return null;

    return (
      <div key={title} className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-3">
          {title}
        </h4>
        <div className="space-y-1">
          {groupSessions.map((session) => {
            const IconComponent = getSessionIcon(session.title);
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group relative"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 hover:bg-blue-50 transition-colors"
                  onClick={() => handleLoadSession(session.id)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <IconComponent className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {session.title.replace(/^[🔍🛍️❓💬]\s*/, '')}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {session.messages.length} messages
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Button>
                
                {/* Session Actions */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-white border-l shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Chat History</h3>
                    <p className="text-xs text-gray-500">{sessions.length} conversations</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={onNewChat}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <MessageCircle className="w-3 h-3 mr-2" />
                  New Chat
                </Button>
                {sessions.length > 0 && (
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* History List */}
            <ScrollArea className="flex-1 p-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">No chat history</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Your conversations will appear here
                  </p>
                  <Button onClick={onNewChat} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Start a conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {renderSessionGroup("Today", groupedSessions.today)}
                  {renderSessionGroup("Yesterday", groupedSessions.yesterday)}
                  {renderSessionGroup("This Week", groupedSessions.thisWeek)}
                  {renderSessionGroup("This Month", groupedSessions.thisMonth)}
                  {renderSessionGroup("Older", groupedSessions.older)}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Conversations are saved automatically</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
