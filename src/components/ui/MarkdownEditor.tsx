'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { uploadImage } from '@/app/actions/upload';

const MarkdownPreview = dynamic(() => import('./MarkdownPreview'), {
  ssr: false,
  loading: () => <p className="text-gray-400">로딩 중...</p>,
});

interface MarkdownEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

export function MarkdownEditor({
  name,
  defaultValue = '',
  placeholder = '마크다운으로 작성하세요...',
  required = false,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertTextAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const newContent = before + text + after;
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const result = await uploadImage(formData);

      if (result.success && result.url) {
        const markdownImage = `![${file.name}](${result.url})`;
        insertTextAtCursor(markdownImage);
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.');
      }
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleImageUpload(file);
        }
        break;
      }
    }
  };

  const toolbarButtons = [
    { label: 'B', title: '굵게', action: () => insertTextAtCursor('**텍스트**') },
    { label: 'I', title: '기울임', action: () => insertTextAtCursor('*텍스트*') },
    { label: 'H1', title: '제목 1', action: () => insertTextAtCursor('\n# 제목\n') },
    { label: 'H2', title: '제목 2', action: () => insertTextAtCursor('\n## 제목\n') },
    { label: '-', title: '목록', action: () => insertTextAtCursor('\n- 항목\n') },
    { label: '1.', title: '번호 목록', action: () => insertTextAtCursor('\n1. 항목\n') },
    { label: '``', title: '코드', action: () => insertTextAtCursor('`코드`') },
    { label: '```', title: '코드 블록', action: () => insertTextAtCursor('\n```\n코드\n```\n') },
    { label: '>', title: '인용', action: () => insertTextAtCursor('\n> 인용문\n') },
    { label: '---', title: '구분선', action: () => insertTextAtCursor('\n---\n') },
    { label: 'Link', title: '링크', action: () => insertTextAtCursor('[텍스트](URL)') },
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <input type="hidden" name={name} value={content} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300 flex-wrap">
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            title={btn.title}
            onClick={btn.action}
            className="px-2 py-1 text-sm font-mono bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
          >
            {btn.label}
          </button>
        ))}
        <button
          type="button"
          title="이미지 업로드"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isUploading ? '업로드 중...' : '이미지'}
        </button>

        <div className="flex-1" />

        {/* Tab Buttons */}
        <div className="flex border border-gray-200 rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1 text-sm transition-colors ${
              activeTab === 'write'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            작성
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 text-sm transition-colors ${
              activeTab === 'preview'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            미리보기
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="min-h-[400px]">
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
            placeholder={placeholder}
            required={required}
            className="w-full h-[400px] p-4 resize-none focus:outline-none font-mono text-sm"
          />
        ) : (
          <div className="p-4 prose prose-sm max-w-none min-h-[400px] bg-white">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-300 text-xs text-gray-500">
        마크다운 문법을 지원합니다. 이미지는 붙여넣기(Ctrl+V) 또는 드래그앤드롭으로도 업로드 가능합니다.
      </div>
    </div>
  );
}
