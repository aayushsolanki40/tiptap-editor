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

  // For toggling the toolbar options
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1>Document Editor</h1>
        {isToolbarVisible && (
          <div className="editor-toolbar">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={editor?.isActive("bold") ? "is-active" : ""}
            >
              Bold
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={editor?.isActive("italic") ? "is-active" : ""}
            >
              Italic
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={editor?.isActive("strike") ? "is-active" : ""}
            >
              Strike
            </button>
            <button
              onClick={() => editor?.chain().focus().setParagraph().run()}
              className={editor?.isActive("paragraph") ? "is-active" : ""}
            >
              Paragraph
            </button>
            <button
              onClick={() => 
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={
                editor?.isActive("heading", { level: 1 }) ? "is-active" : ""
              }
            >
              H1
            </button>
            <button
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={
                editor?.isActive("heading", { level: 2 }) ? "is-active" : ""
              }
            >
              H2
            </button>
            <button onClick={() => editor?.chain().focus().undo().run()}>
              Undo
            </button>
            <button onClick={() => editor?.chain().focus().redo().run()}>
              Redo
            </button>
          </div>
        )}
      </div>
      
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} />
        <FloatingMenu editor={editor} className="floating-menu">
          <button onClick={() => editor?.chain().focus().setParagraph().run()}>
            Paragraph
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
        </FloatingMenu>
        <BubbleMenu editor={editor} className="bubble-menu">
          <button onClick={() => editor?.chain().focus().toggleBold().run()}>
            Bold
          </button>
          <button onClick={() => editor?.chain().focus().toggleItalic().run()}>
            Italic
          </button>
          <button onClick={() => editor?.chain().focus().toggleStrike().run()}>
            Strike
          </button>
        </BubbleMenu>
      </div>
    </div>
  );
};

export default Tiptap;
