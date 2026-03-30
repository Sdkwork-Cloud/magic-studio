import React, { useState } from 'react';
import { Github, Rocket } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { useEditorStore } from '@sdkwork/react-editor';
import { GitHubSyncModal } from '@sdkwork/react-editor';
import { PublishAppModal } from '@sdkwork/react-editor';

interface EditorProjectActionsProps {
  projectName?: string;
}

const EditorProjectActions: React.FC<EditorProjectActionsProps> = ({ projectName }) => {
  const { t } = useTranslation();
  const { syncToGitHub, publishApp, rootPath } = useEditorStore();

  const [showGitModal, setShowGitModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  if (!rootPath) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-1 px-2 h-full border-r border-gray-200 dark:border-[#1a1a1a]">
        <button
          onClick={() => setShowGitModal(true)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors"
          title={t('editor.explorer.git.title')}
        >
          <Github size={14} />
        </button>
        <button
          onClick={() => setShowPublishModal(true)}
          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors"
          title={t('editor.explorer.publish.title')}
        >
          <Rocket size={14} />
        </button>
      </div>

      {showGitModal && (
        <GitHubSyncModal
          onClose={() => setShowGitModal(false)}
          onSync={syncToGitHub}
        />
      )}

      {showPublishModal && (
        <PublishAppModal
          onClose={() => setShowPublishModal(false)}
          onPublish={publishApp}
          initialName={projectName || 'my-app'}
        />
      )}
    </>
  );
};

export default EditorProjectActions;
