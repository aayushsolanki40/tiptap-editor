import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CommentThread } from './CommentThreadExtension';
import { v4 as uuidv4 } from 'uuid';

interface CommentStoreContextType {
  threads: CommentThread[];
  addThread: (selectedText: string, comment: string, userId: string, userName: string) => string;
  addCommentToThread: (threadId: string, comment: string, userId: string, userName: string) => void;
  getThread: (threadId: string) => CommentThread | undefined;
  resolveThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  getCommentCount: (threadId: string) => number;
  getAllThreads: () => CommentThread[];
}

const CommentStoreContext = createContext<CommentStoreContextType | undefined>(undefined);

interface CommentStoreProviderProps {
  children: ReactNode;
  initialThreads?: CommentThread[];
  onThreadsChange?: (threads: CommentThread[]) => void;
}

export const CommentStoreProvider: React.FC<CommentStoreProviderProps> = ({ 
  children, 
  initialThreads = [],
  onThreadsChange 
}) => {
  const [threads, setThreads] = useState<CommentThread[]>(initialThreads);

  // Call onThreadsChange whenever threads change
  useEffect(() => {
    if (onThreadsChange) {
      onThreadsChange(threads);
    }
  }, [threads, onThreadsChange]);

  // Add a new thread with the first comment
  const addThread = (selectedText: string, comment: string, userId: string, userName: string): string => {
    const threadId = uuidv4();
    const commentId = uuidv4();
    
    const newThread: CommentThread = {
      id: threadId,
      comments: [{
        id: commentId,
        text: comment,
        userId,
        userName,
        timestamp: Date.now(),
        isResolved: false
      }],
      selectedText // Store the text that was selected when creating this thread
    };
    
    setThreads(prev => [...prev, newThread]);
    return threadId;
  };

  // Add a comment to an existing thread
  const addCommentToThread = (threadId: string, comment: string, userId: string, userName: string) => {
    setThreads(prev => {
      return prev.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            comments: [
              ...thread.comments,
              {
                id: uuidv4(),
                text: comment,
                userId,
                userName,
                timestamp: Date.now()
              }
            ]
          };
        }
        return thread;
      });
    });
  };

  // Get a thread by ID
  const getThread = (threadId: string) => {
    return threads.find(thread => thread.id === threadId);
  };

  // Mark a thread as resolved
  const resolveThread = (threadId: string) => {
    setThreads(prev => {
      return prev.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            isResolved: true
          };
        }
        return thread;
      });
    });
  };

  // Delete a thread
  const deleteThread = (threadId: string) => {
    setThreads(prev => {
      return prev.filter(thread => thread.id !== threadId);
    });
  };

  // Get comment count for a thread
  const getCommentCount = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    return thread ? thread.comments.length : 0;
  };

  // Get all threads
  const getAllThreads = () => {
    return threads;
  };

  return (
    <CommentStoreContext.Provider
      value={{
        threads,
        addThread,
        addCommentToThread,
        getThread,
        resolveThread,
        deleteThread,
        getCommentCount,
        getAllThreads
      }}
    >
      {children}
    </CommentStoreContext.Provider>
  );
};

export const useCommentStore = (): CommentStoreContextType => {
  const context = useContext(CommentStoreContext);
  if (context === undefined) {
    throw new Error('useCommentStore must be used within a CommentStoreProvider');
  }
  return context;
};

export default CommentStoreContext;