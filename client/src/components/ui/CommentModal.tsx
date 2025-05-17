import React, { useState, useEffect, useRef } from 'react';
import './CommentModal.css';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (commentText: string) => void;
  existingComments?: string[];
  selectedText?: string;
  position?: { x: number; y: number };
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
  existingComments = [],
  selectedText = "",
  position = { x: 0, y: 0 }
}) => {
  const [commentText, setCommentText] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [userName] = useState('Aayush Solanki');
  const [userInitials] = useState('AS');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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
      onSubmit(commentText);
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
          <div className="assigned-to">Assigned to Anyone by {userName}</div>
          <button className="comment-modal-close" onClick={onClose}>
            ×
          </button>
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

                  <div
                    className="comment-highlighted"
                    onClick={toggleTextExpand}
                  >
                    <p className="comment-highlighted-text">{displayText}</p>
                    { displayText.length > 50 &&
                      <span
                        className={`dropdown-icon ${
                          isTextExpanded ? "open" : ""
                        }`}
                      >
                        ▼
                      </span>
                    }
                  </div>

                  <div className="comment-text">{existingComments[0]}</div>
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
                  <div className="comment-text">{comment}</div>
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
              <div className="emoji-container">
                <button 
                  className="input-action-btn"
                  onClick={toggleEmojiPicker}
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