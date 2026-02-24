import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const damagedFiles = [
  'src/modules/video/constants.ts',
  'src/modules/image/constants.ts',
  'src/modules/portal-video/constants.ts',
  'src/modules/portal-video/pages/AIToolsPage.tsx',
  'src/modules/portal-video/pages/PortalPage.tsx',
  'src/modules/portal-video/components/ToolsGrid.tsx',
  'src/modules/portal-video/components/ViralFeed.tsx',
  'src/modules/notes/components/MiniProgramModal.tsx',
  'src/modules/notes/components/AIDrafterModal.tsx',
  'src/modules/notes/components/editor/MiniProgramNode.tsx',
  'src/modules/magic-cut/components/Timeline/canvas/TimelineGrid.tsx',
  'src/modules/magic-cut/services/ShortcutManager.ts',
  'src/modules/film/components/FilmWorkspace.tsx',
  'src/modules/film/components/EntityList.tsx',
  'src/modules/film/components/LocationList.tsx',
  'src/modules/film/components/ProjectList.tsx',
  'src/modules/film/components/PropList.tsx',
  'src/modules/editor/components/CodeEditor.tsx',
  'src/modules/chat/components/MessageBubble.tsx',
  'src/modules/chat/pages/ChatPage.tsx',
];

const fixes = [
  { pattern: /'([^']*[\u4e00-\u9fa5][^']*)\?',/g, replacement: "'$1',", description: "Fix truncated Chinese strings ending with ?" },
  { pattern: /'([^']*[\u4e00-\u9fa5][^']*)\?]/g, replacement: "'$1']", description: "Fix truncated Chinese strings in arrays" },
  { pattern: /'([^']*[\u4e00-\u9fa5][^']*)\?(\s*[,\n\]\}])/g, replacement: "'$1'$2", description: "Fix truncated Chinese strings" },
  { pattern: /icon: '([^']*)\?',/g, replacement: "icon: '$1',", description: "Fix truncated icon strings" },
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  for (const { pattern, replacement, description } of fixes) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      console.log(`Applied fix: ${description}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

for (const file of damagedFiles) {
  console.log(`\nProcessing: ${file}`);
  fixFile(file);
}

console.log('\nDone!');
