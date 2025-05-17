import React, { useState, useEffect, useRef } from 'react';
import './CommentModal.css';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commentText: string) => void;
  existingComments?: string[];
  position?: { x: number; y: number };
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingComments = [],
  position = { x: 0, y: 0 }
}) => {
  const [commentText, setCommentText] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [userName] = useState('Aayush Solanki');
  const [userInitials] = useState('AS');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    // Clear comment text when modal opens
    if (isOpen) {
      setCommentText('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onSubmit(commentText);
      setCommentText('');
      // Don't close the modal automatically - the parent component will handle that
    }
  };

  const toggleTextExpand = () => {
    setIsTextExpanded(!isTextExpanded);
  };

  if (!isOpen) return null;
  
  // Format the highlighted text - limiting it to first 50 characters if not expanded
  const highlightedText = existingComments[0] || "sfsdfsdfsfq";
  const displayText = isTextExpanded || highlightedText.length <= 50 
    ? highlightedText 
    : highlightedText.slice(0, 50) + '...';

  return (
    <div className="comment-modal-backdrop">
      <div 
        ref={modalRef} 
        className="comment-modal"
        style={{ 
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
      >
        <div className="comment-modal-header">
          <div className="comment-header-left">
            <input 
              type="checkbox" 
              className="resolve-checkbox" 
              checked={isResolved}
              onChange={() => setIsResolved(!isResolved)}
              id="resolve-checkbox"
            />
            <label htmlFor="resolve-checkbox">Resolve</label>
          </div>
          <div className="assigned-to">
            Assigned to Anyone by {userName}
          </div>
          <button className="comment-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="comment-modal-content">
          <div className="comment-thread">
            {/* First comment with highlighted text */}
            {existingComments.length > 0 && (
              <div className="comment-item">
                <div className="user-avatar">{userInitials}</div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="user-name">{userName}</span>
                    <span className="comment-timestamp">Just now</span>
                  </div>
                  
                  <div className="comment-highlighted" onClick={toggleTextExpand}>
                    <p className="comment-highlighted-text">{displayText}</p>
                    <span className={`dropdown-icon ${isTextExpanded ? 'open' : ''}`}>
                      ▼
                    </span>
                  </div>
                  
                  <div className="comment-text">
                    {existingComments[0]}
                  </div>
                  
                  <div className="comment-actions">
                    <button className="comment-action-btn">
                      👍
                    </button>
                    <button className="comment-action-btn">
                      👎
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional comments here if needed */}
            {existingComments.slice(1).map((comment, index) => (
              <div className="comment-item" key={index}>
                <div className="user-avatar">{userInitials}</div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="user-name">{userName}</span>
                    <span className="comment-timestamp">Just now</span>
                  </div>
                  <div className="comment-text">
                    {comment}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Comment input area */}
        <div className="comment-input-area">
          <div className="current-user-avatar">{userInitials}</div>
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Comment or type '/' for commands and AI actions"
              className="comment-input"
            />
            <div className="comment-input-actions">
              <button className="input-action-btn">
                😊
              </button>
              <button 
                className="send-button"
                disabled={!commentText.trim()}
                onClick={handleSubmit}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;