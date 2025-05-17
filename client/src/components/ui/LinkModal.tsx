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
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0, transform: '' });
  
  // Calculate best position for the modal when it opens or position changes
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modalHeight = 180; // Approximate modal height
      const modalWidth = 350;   // Modal width from CSS
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
      
      setModalPosition({
        top: topPos,
        left: leftPos,
        transform
      });
    }
  }, [isOpen, position]);

  useEffect(() => {
    // Set initial URL and focus input when modal opens
    setUrl(initialUrl);
    
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
          position: 'absolute',
          top: `${modalPosition.top}px`,
          left: `${modalPosition.left}px`,
          transform: modalPosition.transform
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