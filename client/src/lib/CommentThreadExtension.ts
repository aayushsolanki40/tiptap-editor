import { Mark, mergeAttributes } from '@tiptap/core'

export interface CommentThreadOptions {
  HTMLAttributes: Record<string, any>,
}

// Define a type for a thread
export interface CommentThread {
  id: string;
  comments: Comment[];
}

// Define a type for a comment
export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
  isResolved?: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentThread: {
      /**
       * Toggle a comment thread mark
       */
      toggleCommentThread: (attributes?: { threadId: string }) => ReturnType,
      /**
       * Add a thread ID to the selected text
       */
      addCommentThread: (attributes: { threadId: string }) => ReturnType,
      /**
       * Get the thread ID from the current selection
       */
      getCommentThreadId: () => string | null,
      /**
       * Remove comment thread mark from selected text
       */
      unsetCommentThread: () => ReturnType,
    }
  }
}

export const CommentThread = Mark.create<CommentThreadOptions>({
  name: 'commentThread',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: element => {
          return element.getAttribute('data-thread-id');
        },
        renderHTML: attributes => {
          if (!attributes.threadId) {
            return {}
          }

          return {
            'data-thread-id': attributes.threadId,
            'class': 'has-comments',
            'data-comment-count': '1', // This could be updated with actual count if needed
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-thread-id]',
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      toggleCommentThread: attributes => ({ commands }) => {
        if (attributes?.threadId) {
          return commands.setMark(this.name, { threadId: attributes.threadId });
        }
        return commands.toggleMark(this.name);
      },
      
      addCommentThread: attributes => ({ commands, editor }) => {
        if (!attributes?.threadId) return false;

        // Get the current selection
        const { from, to } = editor.state.selection;
        
        // Check if there's no text selected
        if (from === to) {
          return false;
        }
        
        // Add the thread ID to the selected text
        return commands.setMark(this.name, { threadId: attributes.threadId });
      },
      
      getCommentThreadId: () => {
        const { from } = this.editor.state.selection;

        // Get the marks at the current position
        const marks = this.editor.state.doc.nodeAt(from)?.marks || [];
        
        // Find the comment thread mark
        const commentThreadMark = marks.find(mark => mark.type.name === this.name);
        
        // Return the thread ID if found
        return commentThreadMark?.attrs.threadId || null;
      },
      
      unsetCommentThread: () => ({ commands }) => {
        // Remove comment thread mark
        return commands.unsetMark(this.name);
      },
    }
  },
})

export default CommentThread;