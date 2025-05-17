import React, { useState, useEffect, useRef } from 'react';
import './LinkModal.css';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
  position?: { x: number; y: number };
}

const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialUrl = '',
  position = { x: 0, y: 0 }
}) => {
  const [url, setUrl] = useState(initialUrl);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Set initial URL when modal opens
    setUrl(initialUrl);
    
    // Focus input field when modal opens
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isOpen, initialUrl]);

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
    
    // Ensure URL has protocol prefix
    let formattedUrl = url.trim();
    if (formattedUrl && !formattedUrl.match(/^https?:\/\//)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    onSubmit(formattedUrl);
  };

  const handleRemoveLink = () => {
    onSubmit('');
  };

  if (!isOpen) return null;

  return (
    <div className="link-modal-backdrop">
      <div
        ref={modalRef}
        className="link-modal"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
      >
        <div className="link-modal-header">
          <h3>Edit Link</h3>
          <button className="link-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="link-modal-form">
          <div className="link-input-group">
            <label htmlFor="link-url">URL</label>
            <input
              ref={inputRef}
              id="link-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="link-input"
            />
          </div>
          
          <div className="link-modal-actions">
            {initialUrl && (
              <button 
                type="button" 
                className="link-remove-button"
                onClick={handleRemoveLink}
              >
                Remove
              </button>
            )}
            <div className="action-buttons-right">
              <button 
                type="button" 
                className="link-cancel-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="link-submit-button"
                disabled={!url.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkModal;