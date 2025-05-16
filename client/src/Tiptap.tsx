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
import { useState, useRef, useEffect } from "react";
import "./Tiptap.css";

// define your extension array with TextAlign and Underline
const extensions = [
  StarterKit,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    defaultAlignment: 'left',
  }),
  Underline,
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            
            {/* Bubble Menu - Enhanced with dropdown for headings */}
            <BubbleMenu editor={editor} className="bubble-menu">
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
                onClick={() => {
                  const url = window.prompt('URL')
                  if (url) {
                    editor?.chain().focus().setLink({ href: url }).run()
                  }
                }}
                className={`toolbar-button ${editor?.isActive("link") ? "is-active" : ""}`}
              >
                <span role="img" aria-label="link">🔗</span>
              </button>
              <button className="toolbar-button">
                <span role="img" aria-label="more options">⚙️</span>
              </button>
            </BubbleMenu>
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
