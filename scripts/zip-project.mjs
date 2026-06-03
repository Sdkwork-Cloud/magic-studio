import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';
import ignore from 'ignore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'),
);

const DEFAULT_EXCLUDES = [
  '.git',
  '.git/',
  '.DS_Store',
  'node_modules',
  'node_modules/',
  'dist-zip',
  'dist-zip/',
  '.cache',
  '.cache/',
  '.turbo',
  '.turbo/',
  '.worktrees',
  '.worktrees/',
  '.sdk-git-sources',
  '.sdk-git-sources/',
  'coverage',
  'coverage/',
];

const createDefaultOptions = () => ({
  format: 'zip',
  report: false,
  includeDist: true,
  extraExcludes: [],
});

const parseArgs = (args) => {
  const options = createDefaultOptions();

  for (const arg of args) {
    if (arg.startsWith('--format=')) {
      const format = arg.split('=')[1]?.toLowerCase();
      options.format = format === 'tgz' || format === 'tar.gz' ? 'tgz' : 'zip';
      continue;
    }

    if (arg === '--report') {
      options.report = true;
      continue;
    }

    if (arg === '--no-dist' || arg === '--include-dist=false') {
      options.includeDist = false;
      options.extraExcludes.push('dist', 'dist/');
      continue;
    }

    if (arg.startsWith('--exclude=')) {
      const pattern = arg.split('=')[1];
      if (pattern) {
        options.extraExcludes.push(pattern);
      }
      continue;
    }

    if (arg === '--code') {
      options.includeDist = false;
      options.extraExcludes.push(
        'dist',
        'dist/',
        'disk-*',
        'disk-*/',
        'index.new.html',
        'assets/cdn',
        'assets/cdn/',
        'assets/icons',
        'assets/icons/',
      );
    }
  }

  return options;
};

const ensureDirectory = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const toPosixRelative = (basePath, targetPath) =>
  path.relative(basePath, targetPath).replace(/\\/g, '/');

const readGitignorePatterns = (directoryPath) => {
  const gitignorePath = path.join(directoryPath, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  return fs
    .readFileSync(gitignorePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
};

const createIgnoreRule = (directoryPath, extraPatterns = []) => ({
  basePath: directoryPath,
  matcher: ignore().add([...DEFAULT_EXCLUDES, ...extraPatterns, ...readGitignorePatterns(directoryPath)]),
});

const isInsideDist = (targetPath) => {
  const distRoot = path.join(workspaceRoot, 'dist');
  return targetPath === distRoot || targetPath.startsWith(`${distRoot}${path.sep}`);
};

const isIgnored = (targetPath, isDirectory, ignoreRules, includeDist) => {
  if (includeDist && isInsideDist(targetPath)) {
    return false;
  }

  for (let index = ignoreRules.length - 1; index >= 0; index -= 1) {
    const rule = ignoreRules[index];
    const relativePath = toPosixRelative(rule.basePath, targetPath);
    const testPath = isDirectory ? `${relativePath}/` : relativePath;
    const result = rule.matcher.test(testPath);

    if (result.ignored) {
      return true;
    }

    if (result.unignored) {
      return false;
    }
  }

  return false;
};

const createArchive = (format) =>
  format === 'tgz'
    ? archiver('tar', { gzip: true, gzipOptions: { level: 9 } })
    : archiver('zip', { zlib: { level: 9 } });

const createOutputPath = (format) => {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('') + [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  const extension = format === 'tgz' ? 'tar.gz' : 'zip';
  return path.join(
    workspaceRoot,
    'dist-zip',
    `${packageJson.name}-v${packageJson.version}-${timestamp}.${extension}`,
  );
};

const createState = () => ({
  scannedEntries: 0,
  includedFiles: 0,
  excludedEntries: 0,
  traversedDirectories: 0,
  startedAt: Date.now(),
  includedPaths: [],
  excludedPaths: [],
});

const traverseAndArchive = async (
  currentDirectory,
  archive,
  ignoreRules,
  options,
  state,
) => {
  state.traversedDirectories += 1;

  const nextRules = [...ignoreRules];
  if (currentDirectory === workspaceRoot || fs.existsSync(path.join(currentDirectory, '.gitignore'))) {
    nextRules.push(createIgnoreRule(currentDirectory, options.extraExcludes));
  }

  const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDirectory, entry.name);
    state.scannedEntries += 1;

    if (isIgnored(fullPath, entry.isDirectory(), nextRules, options.includeDist)) {
      state.excludedEntries += 1;
      if (options.report) {
        state.excludedPaths.push(toPosixRelative(workspaceRoot, fullPath));
      }
      continue;
    }

    if (entry.isDirectory()) {
      await traverseAndArchive(fullPath, archive, nextRules, options, state);
      continue;
    }

    const archivePath = toPosixRelative(workspaceRoot, fullPath);
    state.includedFiles += 1;
    if (options.report) {
      state.includedPaths.push(archivePath);
    }
    archive.file(fullPath, { name: archivePath });
  }
};

const writeReport = (archivePath, state) => {
  const reportPath = path.join(
    workspaceRoot,
    'dist-zip',
    `zip-report-${path.basename(archivePath)}.txt`,
  );
  const lines = [
    `[Archive] ${archivePath}`,
    `[Included Files] ${state.includedFiles}`,
    ...state.includedPaths.map((entry) => `+ ${entry}`),
    `[Excluded Entries] ${state.excludedEntries}`,
    ...state.excludedPaths.map((entry) => `- ${entry}`),
  ];
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`[zip] report written: ${reportPath}`);
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const outputPath = createOutputPath(options.format);
  const outputDirectory = path.dirname(outputPath);
  const archive = createArchive(options.format);
  const state = createState();

  ensureDirectory(outputDirectory);

  const output = fs.createWriteStream(outputPath);
  const completion = new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
  });

  archive.pipe(output);

  console.log(`[zip] packaging workspace from ${workspaceRoot}`);
  console.log(`[zip] output: ${outputPath}`);

  await traverseAndArchive(workspaceRoot, archive, [], options, state);
  await archive.finalize();
  await completion;

  const durationSeconds = ((Date.now() - state.startedAt) / 1000).toFixed(2);
  const sizeMb = (archive.pointer() / 1024 / 1024).toFixed(2);

  console.log(`[zip] included files: ${state.includedFiles}`);
  console.log(`[zip] excluded entries: ${state.excludedEntries}`);
  console.log(`[zip] archive size: ${sizeMb} MB`);
  console.log(`[zip] duration: ${durationSeconds}s`);

  if (options.report) {
    writeReport(outputPath, state);
  }
};

await run();
