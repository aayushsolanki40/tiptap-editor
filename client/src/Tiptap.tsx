// src/Tiptap.tsx
import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import "./Tiptap.css";

// define your extension array
const extensions = [StarterKit];

const content = "<p>Hello World! Start typing to edit this content...</p>";

const Tiptap = () => {
  const editor = useEditor({
    extensions,
    content,
  });

  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [currentDocument, setCurrentDocument] = useState("Untitled Document");
  const [showSidebar, setShowSidebar] = useState(true);
  
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
            
            {/* Bubble Menu for when text is selected */}
            <BubbleMenu editor={editor} className="bubble-menu">
              <button 
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`toolbar-button ${editor?.isActive("bold") ? "is-active" : ""}`}
              >
                𝐁
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`toolbar-button ${editor?.isActive("italic") ? "is-active" : ""}`}
              >
                𝐼
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={`toolbar-button ${editor?.isActive("strike") ? "is-active" : ""}`}
              >
                𝐒
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
