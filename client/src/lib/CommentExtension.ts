import { Mark, mergeAttributes } from '@tiptap/core'

export interface CommentOptions {
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Toggle a comment mark
       */
      toggleComment: (attributes?: { comment: string }) => ReturnType,
      /**
       * Add a new comment to existing comments or create new comment mark
       */
      addComment: (attributes: { comment: string }) => ReturnType,
      /**
       * Get all comments on the current selection
       */
      getComments: () => string[],
      /**
       * Remove comment mark from selected text
       */
      unsetComment: () => ReturnType,
    }
  }
}

export const Comment = Mark.create<CommentOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      comments: {
        default: null,
        parseHTML: element => {
          const commentsAttr = element.getAttribute('data-comments');
          if (!commentsAttr) return null;
          try {
            return JSON.parse(commentsAttr);
          } catch {
            return [commentsAttr]; // Fallback to array with single comment
          }
        },
        renderHTML: attributes => {
          if (!attributes.comments) {
            return {}
          }

          // Ensure comments is an array
          const commentsArray = Array.isArray(attributes.comments) 
            ? attributes.comments 
            : [attributes.comments];

          return {
            'data-comments': JSON.stringify(commentsArray),
            'class': 'has-comments',
            'title': commentsArray.join('\n---\n'),
            'data-comment-count': commentsArray.length,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comments]',
      },
      // Backward compatibility with old data-comment attribute
      {
        tag: 'span[data-comment]',
        getAttrs: element => {
          if (typeof element === 'string') return {};
          
          const comment = element.getAttribute('data-comment');
          if (!comment) return {};
          
          return { comments: [comment] };
        },
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      toggleComment: attributes => ({ commands }) => {
        // If there's a comment, add it to an array
        if (attributes?.comment) {
          return commands.updateAttributes('comment', {
            comments: [attributes.comment]
          });
        }
        return commands.toggleMark(this.name);
      },
      
      addComment: attributes => ({ commands, editor }) => {
        if (!attributes?.comment) return false;

        // Get the current selection
        const { from, to } = editor.state.selection;
        
        // Check if there's no text selected
        if (from === to) {
          return false;
        }
        
        // Check if selection already has comment mark
        const hasComment = editor.state.doc.rangeHasMark(from, to, this.type);
        
        if (hasComment) {
          // Get existing comments from the node at the selection start
          const node = editor.state.doc.nodeAt(from);
          const marks = node?.marks.filter(mark => mark.type.name === this.name) || [];
          
          if (marks.length > 0) {
            // Get existing comments
            const existingComments = marks[0].attrs.comments || [];
            let updatedComments: string[] = [];
            
            // Ensure existingComments is treated as an array
            if (Array.isArray(existingComments)) {
              updatedComments = [...existingComments, attributes.comment];
            } else if (existingComments) {
              updatedComments = [existingComments, attributes.comment];
            } else {
              updatedComments = [attributes.comment];
            }
            
            // Use updateAttributes which is safer than unset+set
            return commands.updateAttributes(this.name, { 
              comments: updatedComments 
            });
          }
        }
        
        // No existing comment, create new one
        return commands.setMark(this.name, { comments: [attributes.comment] });
      },
      
      getComments: () => {
        const { from, to } = this.editor.state.selection;

        // Don't proceed if no selection
        if (from === to) return [];

        // Check if selection has comment mark
        const hasCommentMark = this.editor.state.doc.rangeHasMark(from, to, this.type);

        if (!hasCommentMark) return [];

        // Get comments from marks
        const node = this.editor.state.doc.nodeAt(from);
        const marks = node?.marks.filter(mark => mark.type.name === this.name) || [];

        if (marks.length > 0) {
          const comments = marks[0].attrs.comments;
          return Array.isArray(comments) ? comments : comments ? [comments] : [];
        }

        return [];
      },
      
      unsetComment: () => ({ commands, editor }) => {
        // Get the current selection
        const { from, to } = editor.state.selection;
        
        // Check if there's no text selected
        if (from === to) {
          return false;
        }
        
        // Check if selection has comment mark
        const hasCommentMark = editor.state.doc.rangeHasMark(from, to, this.type);
        
        if (!hasCommentMark) return false;
        
        // Remove comment mark using the correct API
        return commands.unsetMark(this.name);
      },
    }
  },
})

export default Comment