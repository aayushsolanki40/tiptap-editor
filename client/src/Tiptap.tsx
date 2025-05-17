// src/Tiptap.tsx
import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Comment } from "./lib/CommentExtension";
import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";
import CommentModal from "./components/ui/CommentModal";
import LinkModal from "./components/ui/LinkModal";
import "./Tiptap.css";

// define your extension array with TextAlign and Underline
const extensions = [
  StarterKit,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    defaultAlignment: 'left',
  }),
  Underline,
  Link.configure({
    openOnClick: false,  // Prevent links from opening on click
    linkOnPaste: true,
    HTMLAttributes: {
      class: 'tiptap-link',
      rel: 'noopener noreferrer',
      target: '_blank'
    },
  }),
  Comment,
];

const content = "<p>Hello World! Start typing to edit this content...</p>";

const Tiptap = () => {
  const editor = useEditor({
    extensions,
    content,
  });

  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [currentDocument, setCurrentDocument] = useState("Untitled Document");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isHeadingDropdownOpen, setIsHeadingDropdownOpen] = useState(false);
  // Comment Modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentModalPosition, setCommentModalPosition] = useState({ x: 0, y: 0 });
  const [existingComments, setExistingComments] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  // Link Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalPosition, setLinkModalPosition] = useState({ x: 0, y: 0 });
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');
  // Reference to bubble menu's tippy instance
  const bubbleMenuRef = useRef<any>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hide bubble menu when comment modal opens
  useEffect(() => {
    if (isCommentModalOpen && bubbleMenuRef.current?.tippy) {
      // Force hide the bubble menu
      bubbleMenuRef.current.tippy.hide();
    }
  }, [isCommentModalOpen]);

  // Add an effect to manually hide/show all bubble menus when comment modal opens/closes
  useEffect(() => {
    // Find all bubble menu elements in the DOM
    const bubbleMenus = document.querySelectorAll('.bubble-menu');
    
    if (isCommentModalOpen) {
      // Add hide class to all bubble menus when modal is open
      bubbleMenus.forEach(menu => menu.classList.add('hide-bubble-menu'));
      
      // Also disable the tippy instance to prevent it from appearing
      if (bubbleMenuRef.current?.tippy) {
        bubbleMenuRef.current.tippy.hide();
        bubbleMenuRef.current.tippy.disable();
      }
    } else {
      // Remove hide class when modal is closed
      bubbleMenus.forEach(menu => menu.classList.remove('hide-bubble-menu'));
      
      // Re-enable tippy only after modal is closed
      if (bubbleMenuRef.current?.tippy) {
        bubbleMenuRef.current.tippy.enable();
      }
      
      // When modal closes, refresh the editor's selection state to enable bubble menu for new selections
      if (editor) {
        setTimeout(() => {
          editor.commands.focus();
        }, 50);
      }
    }
    
    // Add an event listener to catch any bubble menus that might appear while modal is open
    const preventBubbleMenu = () => {
      if (isCommentModalOpen && bubbleMenuRef.current?.tippy?.state.isShown) {
        bubbleMenuRef.current.tippy.hide();
      }
    };
    
    document.addEventListener('selectionchange', preventBubbleMenu);
    return () => {
      document.removeEventListener('selectionchange', preventBubbleMenu);
    };
  }, [isCommentModalOpen, editor]);

  // Get current active heading or paragraph
  const getActiveHeading = () => {
    if (!editor) return 'Text';
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    if (editor.isActive('heading', { level: 4 })) return 'H4';
    if (editor.isActive('paragraph')) return 'Text';
    return 'Text';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsHeadingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Setup click handler on content with comments
  useEffect(() => {
    if (!editor) return;

    // Function to handle clicks on commented text
    const handleCommentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if clicked element has comments
      if (target.classList.contains('has-comments')) {
        // Store the current selection before anything happens
        const selection = window.getSelection();
        let savedRange: Range | null = null;
        
        if (selection && selection.rangeCount > 0) {
          savedRange = selection.getRangeAt(0).cloneRange();
        }
        
        // Get position for modal - calculate to ensure it doesn't get cut off
        const rect = target.getBoundingClientRect();
        const editorRect = editor.view.dom.getBoundingClientRect();
        
        // Calculate vertical position to ensure modal appears below the text
        // but doesn't go off-screen
        const verticalPosition = Math.min(
          rect.bottom + 10,
          window.innerHeight - 400 // Make sure at least 400px of modal is visible
        );
        
        setCommentModalPosition({
          x: Math.min(
            Math.max(rect.left + (rect.width / 2), 200), // At least 200px from left edge
            window.innerWidth - 200 // At least 200px from right edge
          ),
          y: verticalPosition
        });

        try {
          // Parse comments from the data-comments attribute
          const commentsData = target.getAttribute('data-comments');
          if (commentsData) {
            const comments = JSON.parse(commentsData);
            setExistingComments(Array.isArray(comments) ? comments : [comments]);
            
            // Select the commented text to ensure the comment gets added at the right place
            if (editor && target.textContent) {
              // Create a selection that encompasses the commented text node
              const commentedNode = target.childNodes[0];
              
              if (commentedNode) {
                const range = document.createRange();
                range.selectNodeContents(target); 
                
                // Store the selected text
                setSelectedText(target.textContent);
                
                // Update the selection in editor
                const selection = window.getSelection();
                if (selection) {
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  // Synchronize editor's selection with DOM selection
                  const { from, to } = editor.state.selection;
                  editor.commands.setTextSelection({ from, to });
                }
              }
            }
            
            // Then open the modal
            setIsCommentModalOpen(true);
          }
        } catch (e) {
          console.error('Error parsing comments:', e);
        }

        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Add event listener to editor DOM
    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleCommentClick);
    
    return () => {
      editorElement.removeEventListener('click', handleCommentClick);
    };
  }, [editor]);

  // Add link click handler to edit existing links
  useEffect(() => {
    if (!editor) return;

    // Function to handle clicks on links
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the clicked element is a link
      if (target.tagName === 'A' || target.closest('a')) {
        // Prevent default link behavior (opening URL) immediately
        event.preventDefault();
        event.stopPropagation();
        
        const linkElement = target.tagName === 'A' ? target : target.closest('a');
        if (!linkElement) return;
        
        // Get the link URL
        const href = linkElement.getAttribute('href');
        
        // Get position for modal - calculate to ensure it doesn't get cut off
        const rect = linkElement.getBoundingClientRect();
        
        // Position the modal near the link
        setLinkModalPosition({
          x: rect.left + (rect.width / 2),
          y: rect.bottom + 10
        });
        
        // Set the current link URL and show the modal
        setLinkUrl(href || '');
        
        // Select the link in the editor to ensure the edit applies to it
        if (editor) {
          // Create a selection that encompasses the link
          const range = document.createRange();
          range.selectNodeContents(linkElement);
          
          // Update the selection in editor
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Synchronize editor's selection with DOM selection
            const { from, to } = editor.state.selection;
            editor.commands.setTextSelection({ from, to });
          }
        }
        
        // Open the modal
        setIsLinkModalOpen(true);
        
        return false;
      }
    };

    // Add event listener to editor DOM with capturing phase to catch events early
    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleLinkClick, true);
    
    return () => {
      editorElement.removeEventListener('click', handleLinkClick, true);
    };
  }, [editor]);

  // Handle adding a comment
  const handleAddComment = (event?: ReactMouseEvent) => {
    // Prevent the default behavior that might be causing DOM conflicts
    event?.preventDefault();
    event?.stopPropagation();
    
    if (event) {
      // If called from toolbar button, position modal near cursor
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setCommentModalPosition({
          x: rect.left + (rect.width / 2),
          y: rect.top - 10
        });
        
        // Capture the selected text
        setSelectedText(selection.toString());
      } else {
        // Fallback to click position
        setCommentModalPosition({
          x: event.clientX,
          y: event.clientY
        });
      }
    }

    if (editor?.isActive('comment')) {
      // If selection already has comments, get them
      const comments = editor.commands.getComments();
      setExistingComments(comments);
    } else {
      setExistingComments([]);
    }
    
    // Force hide any bubble menus first
    if (bubbleMenuRef.current?.tippy) {
      bubbleMenuRef.current.tippy.hide();
      // Disable the bubble menu while modal is open
      bubbleMenuRef.current.tippy.disable();
    }
    
    // Ensure all bubble menus have the hide class
    document.querySelectorAll('.bubble-menu').forEach(menu => 
      menu.classList.add('hide-bubble-menu')
    );
    
    // Then show the modal
    setIsCommentModalOpen(true);
  };

  // Handle when comment is submitted from modal
  const handleCommentSubmit = (commentText: string) => {
    if (editor) {
      // Store the current selection position before adding the comment
      const { from, to } = editor.state.selection;
      
      // Add the comment
      editor.chain().focus().addComment({ comment: commentText }).run();
      
      // Check if the selection already had comments before this submission
      const hadExistingComments = existingComments.length > 0;
      
      // Update the list of existing comments to include the new one
      const updatedComments = [...existingComments, commentText];
      setExistingComments(updatedComments);
      
      // Only close the modal if this was a new comment on text without comments
      if (!hadExistingComments) {
        setIsCommentModalOpen(false);
        
        // Reset selection state and ensure bubble menu can appear for future selections
        // but maintain the cursor position near where the comment was added
        setTimeout(() => {
          // Briefly blur to clear any lingering selection state
          editor.commands.blur();
          
          // Then restore focus at the stored selection position rather than at the end
          editor.commands.setTextSelection({ from, to });
          editor.commands.focus();
          
          // Force tippy to update its position
          if (bubbleMenuRef.current?.tippy) {
            bubbleMenuRef.current.tippy.destroy();
            bubbleMenuRef.current.tippy.enable();
          }
        }, 100);
      } else {
        // For additional comments on already commented text, clear input but keep modal open
        // Focus back on comment input for continued conversation and ensure bubble menu stays hidden
        const commentInput = document.querySelector('.comment-input') as HTMLTextAreaElement;
        if (commentInput) {
          commentInput.value = '';
          commentInput.focus();
        }
        
        // Force hide any bubble menus that might appear
        if (bubbleMenuRef.current?.tippy) {
          bubbleMenuRef.current.tippy.hide();
          // Disable the bubble menu temporarily while modal is open
          bubbleMenuRef.current.tippy.disable();
        }
        
        // Also ensure all bubble menus have the hide class
        document.querySelectorAll('.bubble-menu').forEach(menu => 
          menu.classList.add('hide-bubble-menu')
        );
      }
    }
  };

  // Handle opening link modal
  const handleLinkButtonClick = (event: ReactMouseEvent) => {
    // Prevent default behavior
    event.preventDefault();
    
    // Get the selection position for modal placement
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position the modal near the selection
      setLinkModalPosition({
        x: rect.left + (rect.width / 2),
        y: rect.bottom + 10
      });
      
      // Check if we're editing an existing link
      let initialUrl = '';
      if (editor?.isActive('link')) {
        // Get the current link's URL
        initialUrl = editor.getAttributes('link').href || '';
      }
      
      setLinkUrl(initialUrl);
      setIsLinkModalOpen(true);
      
      // Hide bubble menu while link modal is open
      if (bubbleMenuRef.current?.tippy) {
        bubbleMenuRef.current.tippy.hide();
        bubbleMenuRef.current.tippy.disable();
      }
    }
  };
  
  // Handle when link is submitted from modal
  const handleLinkSubmit = (url: string) => {
    if (editor) {
      // Store the selection
      const { from, to } = editor.state.selection;
      
      if (!url) {
        // If URL is empty, unset the link
        editor.chain().focus().unsetLink().run();
      } else {
        // Otherwise set the link with the provided URL
        editor.chain().focus().setLink({ href: url }).run();
      }
      
      // Close the modal
      setIsLinkModalOpen(false);
      
      // Restore selection and focus
      setTimeout(() => {
        editor.commands.setTextSelection({ from, to });
        editor.commands.focus();
        
        if (bubbleMenuRef.current?.tippy) {
          bubbleMenuRef.current.tippy.enable();
        }
      }, 100);
    }
  };

  // Example documents for the sidebar
  const documents = [
    { id: 1, name: "Welcome Document", active: true },
    { id: 2, name: "Project Notes", active: false },
    { id: 3, name: "Meeting Minutes", active: false },
    { id: 4, name: "Ideas", active: false },
  ];

  return (
    <div className="editor-container">
      {/* Top Navigation Bar */}
      <div className="editor-header">
        <div className="editor-brand">
          <span className="icon">📝</span>
          <h1>TipTap Editor</h1>
        </div>
        
        <div className="editor-actions">
          <button className="toolbar-button">
            <span role="img" aria-label="save">💾</span> Save
          </button>
          <button className="toolbar-button">
            <span role="img" aria-label="share">🔗</span> Share
          </button>
          <button className="icon-button" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? (
              <span role="img" aria-label="hide sidebar">◀️</span>
            ) : (
              <span role="img" aria-label="show sidebar">▶️</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Editor Area with Sidebar and Content */}
      <div className="editor-main">
        {/* Sidebar */}
        {showSidebar && (
          <div className="editor-sidebar">
            <div className="sidebar-section">
              <h3>My Documents</h3>
              <div className="sidebar-list">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`sidebar-item ${doc.active ? 'active' : ''}`}
                    onClick={() => {
                      // Would handle document switching here
                      setCurrentDocument(doc.name);
                    }}
                  >
                    <span role="img" aria-label="document">📄</span>
                    {doc.name}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="sidebar-section">
              <h3>Templates</h3>
              <div className="sidebar-list">
                <div className="sidebar-item">
                  <span role="img" aria-label="template">📋</span>
                  Blank Document
                </div>
                <div className="sidebar-item">
                  <span role="img" aria-label="template">📋</span>
                  Blog Post
                </div>
                <div className="sidebar-item">
                  <span role="img" aria-label="template">📋</span>
                  Meeting Notes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="editor-content-area">
          {/* Toolbar */}
          {isToolbarVisible && (
            <div className="editor-toolbar">
              {/* Text formatting options */}
              <div className="toolbar-group">
                <button
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`toolbar-button ${editor?.isActive("bold") ? "is-active" : ""}`}
                >
                  <span role="img" aria-label="bold">𝐁</span>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`toolbar-button ${editor?.isActive("italic") ? "is-active" : ""}`}
                >
                  <span role="img" aria-label="italic">𝐼</span>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={`toolbar-button ${editor?.isActive("strike") ? "is-active" : ""}`}
                >
                  <span role="img" aria-label="strike">𝐒</span>
                </button>
              </div>
              
              {/* Paragraph formatting */}
              <div className="toolbar-group">
                <button
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                  className={`toolbar-button ${editor?.isActive("paragraph") ? "is-active" : ""}`}
                >
                  <span role="img" aria-label="paragraph">¶</span>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`toolbar-button ${editor?.isActive("heading", { level: 1 }) ? "is-active" : ""}`}
                >
                  H1
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`toolbar-button ${editor?.isActive("heading", { level: 2 }) ? "is-active" : ""}`}
                >
                  H2
                </button>
              </div>
              
              {/* List formatting */}
              <div className="toolbar-group">
                <button
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`toolbar-button ${editor?.isActive("bulletList") ? "is-active" : ""}`}
                >
                  <span role="img" aria-label="bullet list">•</span>
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`toolbar-button ${editor?.isActive("orderedList") ? "is-active" : ""}`}
                >
                  <span role="img" aria-label="ordered list">1.</span>
                </button>
              </div>
              
              {/* History actions */}
              <div className="toolbar-group">
                <button 
                  onClick={() => editor?.chain().focus().undo().run()}
                  className="toolbar-button"
                >
                  <span role="img" aria-label="undo">↩️</span>
                </button>
                <button 
                  onClick={() => editor?.chain().focus().redo().run()}
                  className="toolbar-button"
                >
                  <span role="img" aria-label="redo">↪️</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Document Editor */}
          <div className="editor-content-wrapper">
            <div className="document-container">
              <EditorContent editor={editor} />
            </div>
            
            {/* Floating Menu for when cursor is on empty line */}
            <FloatingMenu editor={editor} className="floating-menu">
              <button 
                onClick={() => editor?.chain().focus().setParagraph().run()}
                className="toolbar-button"
              >
                ¶
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                className="toolbar-button"
              >
                H1
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className="toolbar-button"
              >
                H2
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className="toolbar-button"
              >
                •
              </button>
            </FloatingMenu>
            
            {/* Bubble Menu - Modified to prevent DOM conflicts */}
            <BubbleMenu 
              editor={editor} 
              className="bubble-menu" 
              tippyOptions={{
                duration: 100,
                hideOnClick: false,
                onShow: () => {
                  // Only show if comment modal is not open
                  return !isCommentModalOpen;
                },
                onHidden: () => {
                  // When bubble menu hides and it's not because the modal is open,
                  // make sure it can reappear on new selections
                  if (!isCommentModalOpen && editor) {
                    // This minimal delay helps avoid state conflicts
                    setTimeout(() => {
                      // Refresh tippy's state
                      if (bubbleMenuRef.current?.tippy) {
                        bubbleMenuRef.current.tippy.setProps({ 
                          trigger: 'mouseenter focus' 
                        });
                      }
                    }, 10);
                  }
                }
              }}
              ref={bubbleMenuRef} // Attach ref here
            >
              {/* AI Button */}
              <button className="ai-button">
                <span>+AI</span>
              </button>
              
              {/* Divider */}
              <div className="bubble-menu-divider"></div>
              
              {/* Heading dropdown menu */}
              <div ref={dropdownRef} className={`heading-dropdown ${isHeadingDropdownOpen ? 'open' : ''}`}>
                <button 
                  onClick={() => setIsHeadingDropdownOpen(!isHeadingDropdownOpen)}
                  className="heading-button"
                >
                  {getActiveHeading()}
                  <span className="caret">▾</span>
                </button>
                <div className="heading-dropdown-content">
                  <div 
                    className={`heading-option ${editor?.isActive('paragraph') ? 'active' : ''}`}
                    onClick={() => {
                      editor?.chain().focus().setParagraph().run();
                      setIsHeadingDropdownOpen(false);
                    }}
                  >
                    Text
                  </div>
                  <div 
                    className={`heading-option ${editor?.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 1 }).run();
                      setIsHeadingDropdownOpen(false);
                    }}
                  >
                    Heading 1
                  </div>
                  <div 
                    className={`heading-option ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 2 }).run();
                      setIsHeadingDropdownOpen(false);
                    }}
                  >
                    Heading 2
                  </div>
                  <div 
                    className={`heading-option ${editor?.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 3 }).run();
                      setIsHeadingDropdownOpen(false);
                    }}
                  >
                    Heading 3
                  </div>
                  <div 
                    className={`heading-option ${editor?.isActive('heading', { level: 4 }) ? 'active' : ''}`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 4 }).run();
                      setIsHeadingDropdownOpen(false);
                    }}
                  >
                    Heading 4
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="bubble-menu-divider"></div>
              
              {/* Text formatting */}
              <button 
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`toolbar-button ${editor?.isActive("bold") ? "is-active" : ""}`}
              >
                <b>B</b>
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`toolbar-button ${editor?.isActive("italic") ? "is-active" : ""}`}
              >
                <i>I</i>
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={`toolbar-button ${editor?.isActive("underline") ? "is-active" : ""}`}
              >
                <u>U</u>
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={`toolbar-button ${editor?.isActive("strike") ? "is-active" : ""}`}
              >
                <s>S</s>
              </button>
              
              {/* Divider */}
              <div className="bubble-menu-divider"></div>
              
              {/* Paragraph formatting */}
              <button 
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                className={`toolbar-button ${editor?.isActive({ textAlign: 'left' }) ? "is-active" : ""}`}
              >
                <span role="img" aria-label="align left">≡</span>
              </button>
              <button 
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                className={`toolbar-button ${editor?.isActive({ textAlign: 'center' }) ? "is-active" : ""}`}
              >
                <span role="img" aria-label="align center">≡</span>
              </button>
              <button 
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                className={`toolbar-button ${editor?.isActive({ textAlign: 'right' }) ? "is-active" : ""}`}
              >
                <span role="img" aria-label="align right">≡</span>
              </button>
              
              {/* Divider */}
              <div className="bubble-menu-divider"></div>
              
              {/* Links and more */}
              <button 
                onClick={handleLinkButtonClick}
                className={`toolbar-button ${editor?.isActive("link") ? "is-active" : ""}`}
              >
                <span role="img" aria-label="link">🔗</span>
              </button>
              
              {/* Comment tool - Using mousedown instead of click to avoid race conditions */}
              <button 
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddComment(e);
                }}
                className={`toolbar-button ${editor?.isActive("comment") ? "is-active" : ""}`}
              >
                <span role="img" aria-label="comment">💬</span>
              </button>
              
              <button className="toolbar-button">
                <span role="img" aria-label="more options">⚙️</span>
              </button>
            </BubbleMenu>

            {/* Comment Modal Component */}
            <CommentModal
              isOpen={isCommentModalOpen}
              onClose={() => setIsCommentModalOpen(false)}
              onSubmit={handleCommentSubmit}
              existingComments={existingComments}
              selectedText={selectedText}
              position={commentModalPosition}
            />
            
            {/* Link Modal Component */}
            <LinkModal
              isOpen={isLinkModalOpen}
              onClose={() => setIsLinkModalOpen(false)}
              onSubmit={handleLinkSubmit}
              initialUrl={linkUrl}
              position={linkModalPosition}
            />
          </div>
          
          {/* Status Bar */}
          <div className="editor-statusbar">
            <div className="status-item">
              <span>{currentDocument}</span>
            </div>
            <div className="status-item">
              <span>Last edited: Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tiptap;
