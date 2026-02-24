
import { Tabs, TabItem, useTheme } from 'sdkwork-react-commons'
import React, { useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useEditorStore } from '../store/editorStore';
import { useSettingsStore } from 'sdkwork-react-settings';
import { FileJson, Code, File, Image } from 'lucide-react';

const CodeEditor: React.FC = () => {
  const { openFiles, activeFilePath, closeFile, setActiveFile, updateFileContent } = useEditorStore();
  const { settings } = useSettingsStore();
  const { isDark } = useTheme();
  const [monacoInstance, setMonacoInstance] = useState<any>(null);

  const activeFile = openFiles.find(f => f.path === activeFilePath);

  // Sync Monaco Theme and Font Settings dynamically
  useEffect(() => {
      if (monacoInstance) {
          monacoInstance.editor.setTheme(isDark ? 'open-studio-dark' : 'open-studio-light');
      }
  }, [isDark, monacoInstance]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    setMonacoInstance(monaco);

    // Define Dark Theme
    monaco.editor.defineTheme('open-studio-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#000000', // Pitch black for modern feel
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#18181b',
        'editorCursor.foreground': '#ffffff',
        'editorWhitespace.foreground': '#333333',
        'editorIndentGuide.background': '#262626'
      }
    });

    // Define Light Theme
    monaco.editor.defineTheme('open-studio-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#18181b',
        'editor.lineHighlightBackground': '#f4f4f5',
        'editorCursor.foreground': '#18181b',
        'editorWhitespace.foreground': '#e4e4e7',
        'editorIndentGuide.background': '#e4e4e7'
      }
    });

    monaco.editor.setTheme(isDark ? 'open-studio-dark' : 'open-studio-light');
  };

  const handleChange = (value: string | undefined) => {
    if (activeFilePath && value !== undefined) {
      updateFileContent(activeFilePath, value);
    }
  };

  // Helper to get icon for tab
  const getFileIcon = (name: string) => {
      if (name.endsWith('.tsx') || name.endsWith('.ts')) return <Code size={13} className="text-blue-500 dark:text-cyan-400" />;
      if (name.endsWith('.json')) return <FileJson size={13} className="text-yellow-600 dark:text-yellow-400" />;
      if (name.endsWith('.png') || name.endsWith('.jpg')) return <Image size={13} className="text-purple-500 dark:text-purple-400" />;
      return <File size={13} className="text-gray-500 dark:text-gray-400" />;
  };

  const tabItems: TabItem[] = openFiles.map(file => ({
      id: file.path,
      title: file.name,
      icon: getFileIcon(file.name),
      isDirty: file.isDirty,
      isItalic: file.isPreview
  }));

  // Options derived from Settings Store
  const editorOptions = {
    minimap: { enabled: settings.editor.minimap },
    fontSize: settings.editor.fontSize,
    fontFamily: settings.editor.fontFamily, 
    // Calculate precise line height in pixels based on multiplier
    lineHeight: Math.round(settings.editor.fontSize * (settings.editor.lineHeight || 1.5)), 
    wordWrap: settings.editor.wordWrap,
    lineNumbers: settings.editor.showLineNumbers ? 'on' : 'off',
    tabSize: settings.editor.tabSize,
    formatOnPaste: true,
    formatOnType: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 16 },
    fontLigatures: settings.editor.fontLigatures,
    cursorBlinking: 'smooth',
    smoothScrolling: true,
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-[#1e1e1e] transition-colors duration-200">
      {/* Generic Tabs System */}
      <Tabs 
        items={tabItems}
        activeId={activeFilePath}
        onSelect={setActiveFile}
        onClose={closeFile}
        height={40} // Matched to ExplorerHeader height
        className="bg-[#f4f4f5] dark:bg-[#252526] border-b border-gray-200 dark:border-[#333]"
      />

      {/* Editor Area */}
      <div className="flex-1 relative bg-white dark:bg-black">
        {openFiles.length === 0 ? (
           <div className="h-full w-full bg-[#f4f4f5] dark:bg-[#1e1e1e] flex flex-col items-center justify-center text-gray-500 transition-colors duration-200">
             <div className="w-16 h-16 bg-white dark:bg-[#2d2d2d] rounded-xl flex items-center justify-center mb-4 shadow-sm dark:shadow-inner">
                 <span className="text-2xl opacity-50">📝</span>
             </div>
             <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-1">Open Studio Editor</h3>
             <p className="text-sm opacity-60">Select a file from the explorer to start coding</p>
           </div>
        ) : (
           activeFile && (
             <Editor
               height="100%"
               path={activeFile.path} 
               language={activeFile.language}
               value={activeFile.content}
               onChange={handleChange}
               onMount={handleEditorMount}
               options={editorOptions as any}
             />
           )
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
export { CodeEditor };
