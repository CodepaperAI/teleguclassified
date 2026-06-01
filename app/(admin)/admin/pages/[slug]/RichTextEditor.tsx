"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import {
    Bold, Italic, Underline as UnderlineIcon,
    List, ListOrdered, Quote, Heading1, Heading2,
    Undo, Redo, Palette
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const MenuButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{
            padding: '6px',
            borderRadius: '4px',
            background: isActive ? '#e2e8f0' : 'transparent',
            color: isActive ? '#0f172a' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
        }}
    >
        {children}
    </button>
);

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Underline,
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Toolbar */}
            <div style={{
                padding: '8px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px'
            }}>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon size={18} />
                </MenuButton>

                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </MenuButton>

                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered size={18} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Blockquote"
                >
                    <Quote size={18} />
                </MenuButton>

                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />

                {/* Color Picker (Simple) */}
                <input
                    type="color"
                    onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    title="Text Color"
                    style={{
                        width: '28px',
                        height: '28px',
                        padding: '0',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                    }}
                />

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    <MenuButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        <Undo size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        <Redo size={18} />
                    </MenuButton>
                </div>
            </div>

            {/* Editor Area */}
            <div style={{
                padding: '1rem',
                minHeight: '400px',
                maxHeight: '600px',
                overflowY: 'auto'
            }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .ProseMirror {
                        outline: none;
                        min-height: 400px;
                    }
                    .ProseMirror p { margin-bottom: 0.75rem; }
                    .ProseMirror h1 { font-size: 2rem; margin: 1.5rem 0 1rem; font-weight: 700; }
                    .ProseMirror h2 { font-size: 1.5rem; margin: 1.25rem 0 0.75rem; font-weight: 700; }
                    .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 1rem; }
                    .ProseMirror blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; }
                    .ProseMirror span[style*="color"] { color: inherit; }
                `}} />
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
