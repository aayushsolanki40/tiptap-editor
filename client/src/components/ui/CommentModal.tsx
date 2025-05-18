import React, { useState, useEffect, useRef } from 'react';
import { useCommentStore } from '../../lib/CommentStore';
import './CommentModal.css';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commentText: string, threadId?: string) => void;
  threadId?: string;
  selectedText?: string;
  position?: { x: number; y: number };
  onResolve?: () => void;
}

// Common emojis for the picker
const commonEmojis = [
  '😊', '😂', '👍', '❤️', '🎉', '👏', '🙌', '👀', '🤔', '😢', 
  '😍', '🔥', '💯', '✅', '⭐', '🚀', '💪', '👎', '😞', '🤷‍♂️',
  '🤷‍♀️', '🙏', '💡', '📝', '💬', '⏰', '💻', '👨‍💻', '👩‍💻', '🤝'
];

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  threadId,
  selectedText = "",
  position = { x: 0, y: 0 },
  onResolve
}) => {
  const [commentText, setCommentText] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [userName] = useState('Aayush Solanki');
  const [userInitials] = useState('AS');
  const [userId] = useState('user-1'); // In a real app, this would come from auth
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0, transform: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Get comment thread data from our store
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { getThread, getCommentCount } = useCommentStore();
  const thread = threadId ? getThread(threadId) : undefined;
  const comments = thread?.comments || [];
  
  // Calculate best position for the modal when it opens or position changes
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Adjust modal height based on whether there are existing comments
      const modalHeight = comments.length > 0? 400 : 200; // Height is 200 initially, 400 with replies
      const modalWidth = 400;   // Approximate comment modal width
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      // Safety margin to keep modal from touching edges
      const safetyMargin = 20;
      
      // Get the editor boundaries
      const editorElement = document.querySelector('.document-container');
      const editorRect = editorElement?.getBoundingClientRect() || {
        left: 0,
        right: viewportWidth,
        top: 0,
        bottom: viewportHeight
      };
      
      // Calculate horizontal position - centered on selection but within editor boundaries
      const leftPos = Math.min(
        Math.max(
          position.x, 
          editorRect.left + (modalWidth / 2) + safetyMargin
        ),
        editorRect.right - (modalWidth / 2) - safetyMargin
      );
      
      // Check if there's enough space below the selection
      const spaceBelow = viewportHeight - position.y - safetyMargin;
      const spaceAbove = position.y - safetyMargin;
      
      let topPos: number;
      let transform: string;
      
      // If we're replying to an existing comment, keep the modal close to the text
      if (comments.length > 0) {
        // For replies, give priority to showing below the text even if slightly cut off
        if (spaceBelow >= modalHeight * 0.7) { // Allow showing if at least 70% fits below
          topPos = position.y;
          transform = 'translate(-50%, 10px)';
        } else {
          // If really not enough space below, show above but closer to text
          topPos = position.y;
          transform = 'translate(-50%, -90%)'; // Position closer to text (90% instead of 100%+10px)
        }
      } else {
        // For new comments, use the standard positioning logic
        // If modal fits below selection, place it there (default)
        if (spaceBelow >= modalHeight) {
          topPos = position.y;
          transform = 'translate(-50%, 10px)';
        } 
        // If not enough space below but enough above, place it above selection
        else if (spaceAbove >= modalHeight) {
          topPos = position.y;
          transform = 'translate(-50%, -100%) translateY(-10px)';
        }
        // In tight spaces, position modal centered in available space
        else {
          // More space below than above
          if (spaceBelow >= spaceAbove) {
            topPos = viewportHeight - modalHeight - safetyMargin + scrollY;
            transform = 'translateX(-50%)';
          } 
          // More space above than below
          else {
            // Ensure we don't position above the editor top
            topPos = Math.max(
              safetyMargin + scrollY,
              editorRect.top + safetyMargin + scrollY
            );
            transform = 'translateX(-50%)';
          }
        }
      }
      
      setModalPosition({
        top: topPos,
        left: leftPos,
        transform
      });
    }
  }, [isOpen, position, comments.length]);

  useEffect(() => {
    // Clear comment text when modal opens
    if (isOpen) {
      setCommentText('');
      setIsResolved(false); // Reset resolved state when opening
      setShowConfirmDialog(false); // Reset confirmation dialog
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

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).classList.contains('input-action-btn')
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onSubmit(commentText, threadId);
      setCommentText('');
      // Don't close the modal automatically - the parent component will handle that
    }
  };

  const toggleTextExpand = () => {
    setIsTextExpanded(!isTextExpanded);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const insertEmoji = (emoji: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const textBeforeEmoji = commentText.substring(0, start);
      const textAfterEmoji = commentText.substring(end);
      
      // Insert emoji at cursor position
      const newText = textBeforeEmoji + emoji + textAfterEmoji;
      setCommentText(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = start + emoji.length;
          inputRef.current.focus();
          inputRef.current.selectionStart = newCursorPos;
          inputRef.current.selectionEnd = newCursorPos;
        }
      }, 0);
    } else {
      setCommentText(commentText + emoji);
    }
  };

  // Handle resolve checkbox change
  const handleResolveChange = () => {
    if (!isResolved) {
      // If changing from unchecked to checked, show confirmation dialog
      setShowConfirmDialog(true);
    } else {
      // If unchecking, just update state
      setIsResolved(false);
    }
  };

  // Handle confirmation dialog responses
  const handleConfirmResolve = () => {
    setIsResolved(true);
    setShowConfirmDialog(false);
    
    // Call the onResolve callback if provided
    if (onResolve) {
      setTimeout(() => {
        onResolve();
      }, 300); // Small delay to show the checkbox checked before closing
    } else {
      // If no callback provided, just close the modal
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  const handleCancelResolve = () => {
    setShowConfirmDialog(false);
    setIsResolved(false);
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;
  
  // Format the highlighted text - limiting it to first 50 characters if not expanded
  const displayText = isTextExpanded || selectedText.length <= 50 
    ? selectedText 
    : selectedText.slice(0, 50) + '...';

  return (
    <div className="comment-modal-backdrop">
      <div
        ref={modalRef}
        className="comment-modal"
        style={{
          position: 'absolute',
          top: `${modalPosition.top}px`,
          left: `${modalPosition.left}px`,
          transform: modalPosition.transform
        }}
      >
        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="confirm-dialog">
            <div className="confirm-dialog-content">
              <p>Are you sure you want to resolve this comment?</p>
              <p className="confirm-dialog-info">This will remove the comment from the document.</p>
              <div className="confirm-dialog-actions">
                <button 
                  className="cancel-button"
                  onClick={handleCancelResolve}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-button"
                  onClick={handleConfirmResolve}
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="comment-modal-header">
          <div className="comment-header-left">
            <input
              type="checkbox"
              className="resolve-checkbox"
              checked={isResolved}
              onChange={handleResolveChange}
              id="resolve-checkbox"
            />
            <label htmlFor="resolve-checkbox">Resolve</label>
          </div>
          <div className="assigned-to">Assigned to: {userName}</div>
          <button className="comment-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="comment-modal-content">
          <div className="comment-thread">
            {/* First comment with highlighted text */}
            {comments.length > 0 && (
              <div className="comment-item">
                <div className="user-avatar">{comments[0].userName.substring(0, 2).toUpperCase()}</div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="user-name">{comments[0].userName}</span>
                    <span className="comment-timestamp">{formatDate(comments[0].timestamp)}</span>
                  </div>

                  {selectedText && (
                    <div
                      className="comment-highlighted"
                      onClick={toggleTextExpand}
                    >
                      <p className="comment-highlighted-text">{displayText}</p>
                      { selectedText.length > 50 &&
                        <span
                          className={`dropdown-icon ${
                            isTextExpanded ? "open" : ""
                          }`}
                        >
                          ▼
                        </span>
                      }
                    </div>
                  )}

                  <div className="comment-text">{comments[0].text}</div>
                </div>
              </div>
            )}

            {/* Additional comments in the thread */}
            {comments.slice(1).map((comment, index) => (
              <div className="comment-item" key={comment.id}>
                <div className="user-avatar">{comment.userName.substring(0, 2).toUpperCase()}</div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="user-name">{comment.userName}</span>
                    <span className="comment-timestamp">{formatDate(comment.timestamp)}</span>
                  </div>
                  <div className="comment-text">{comment.text}</div>
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
              placeholder="Enter comment here..."
              className="comment-input"
            />
            <div className="comment-input-actions">
              <div className="emoji-container">
                <button 
                  className="input-action-btn"
                  onClick={toggleEmojiPicker}
                  type="button"
                >
                  😊
                </button>
                
                {showEmojiPicker && (
                  <div 
                    ref={emojiPickerRef} 
                    className="emoji-picker"
                  >
                    {commonEmojis.map((emoji, index) => (
                      <button 
                        key={index} 
                        className="emoji-btn"
                        type="button"
                        onClick={() => {
                          insertEmoji(emoji);
                          setShowEmojiPicker(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="send-button"
                disabled={!commentText.trim()}
                onClick={handleSubmit}
                type="button"
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