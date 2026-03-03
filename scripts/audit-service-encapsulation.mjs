import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const ROOT_DIR = process.cwd();
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const REPORT_DIR = path.join(ROOT_DIR, 'docs', 'reports');
const DATE_TAG = new Date().toISOString().slice(0, 10);
const STRICT_MODE = process.argv.includes('--strict');
const POLICY_FILE = path.join(ROOT_DIR, 'docs', 'plans', 'service-encapsulation-policy.json');
const normalizePath = (value) => value.split(path.sep).join('/');
const DEFAULT_POLICY = {
  infrastructurePackages: ['sdkwork-app-sdk-typescript', 'sdkwork-react-types'],
  seamExemptPackages: ['sdkwork-react-core'],
  rootServiceExportExemptPackages: ['sdkwork-react-core'],
  allowedOutsideServicePatterns: [
    'packages\\/sdkwork-react-core\\/src\\/platform\\/web\\.ts$',
    'packages\\/sdkwork-react-core\\/src\\/ai\\/genAIService\\.ts$',
    'packages\\/sdkwork-app-sdk-typescript\\/'
  ],
  interactionRules: [
    { key: 'fetch', label: 'Network Fetch' },
    { key: 'storage', label: 'Web Storage' },
    { key: 'clipboard', label: 'Clipboard API' },
    { key: 'invoke', label: 'Tauri Invoke' },
    { key: 'runtimePlatform', label: 'Runtime Platform Bridge' },
    { key: 'runtimeUploadHelper', label: 'Runtime Upload Helper Bridge' }
  ]
};

const toStringArray = (value, fallback) => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  return value.filter((item) => typeof item === 'string');
};

const toInteractionRules = (value, fallback) => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const rules = value
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.key === 'string' &&
        typeof item.label === 'string'
    )
    .map((item) => ({ key: item.key, label: item.label }));
  return rules.length > 0 ? rules : [...fallback];
};

const loadPolicy = () => {
  if (!fs.existsSync(POLICY_FILE)) {
    return {
      policy: DEFAULT_POLICY,
      policySource: 'default'
    };
  }
  try {
    const raw = fs.readFileSync(POLICY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      policy: {
        infrastructurePackages: toStringArray(
          parsed.infrastructurePackages,
          DEFAULT_POLICY.infrastructurePackages
        ),
        seamExemptPackages: toStringArray(
          parsed.seamExemptPackages,
          DEFAULT_POLICY.seamExemptPackages
        ),
        rootServiceExportExemptPackages: toStringArray(
          parsed.rootServiceExportExemptPackages,
          DEFAULT_POLICY.rootServiceExportExemptPackages
        ),
        allowedOutsideServicePatterns: toStringArray(
          parsed.allowedOutsideServicePatterns,
          DEFAULT_POLICY.allowedOutsideServicePatterns
        ),
        interactionRules: toInteractionRules(
          parsed.interactionRules,
          DEFAULT_POLICY.interactionRules
        )
      },
      policySource: normalizePath(path.relative(ROOT_DIR, POLICY_FILE))
    };
  } catch (error) {
    console.error(
      `[ServiceAudit] Failed to parse policy file: ${normalizePath(path.relative(ROOT_DIR, POLICY_FILE))}. Falling back to defaults.`,
      error
    );
    return {
      policy: DEFAULT_POLICY,
      policySource: 'default (fallback due parse error)'
    };
  }
};

const { policy, policySource } = loadPolicy();

const INFRASTRUCTURE_PACKAGES = new Set(policy.infrastructurePackages);
const SEAM_EXEMPT_PACKAGES = new Set([
  ...INFRASTRUCTURE_PACKAGES,
  ...policy.seamExemptPackages
]);
const ROOT_SERVICE_EXPORT_EXEMPT_PACKAGES = new Set([
  ...INFRASTRUCTURE_PACKAGES,
  ...policy.rootServiceExportExemptPackages
]);

const ALLOWED_OUTSIDE_SERVICE = policy.allowedOutsideServicePatterns.map(
  (pattern) => new RegExp(pattern)
);

const INTERACTION_RULES = policy.interactionRules;

const INTERACTION_KEYS = INTERACTION_RULES.map((rule) => rule.key);

const toPosixPath = (value) => value.split(path.sep).join('/');

const isCodeFile = (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return false;
  }
  if (filePath.endsWith('.d.ts')) {
    return false;
  }
  return true;
};

const walkFiles = (dirPath, list = []) => {
  if (!fs.existsSync(dirPath)) {
    return list;
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'node_modules') {
        continue;
      }
      walkFiles(abs, list);
      continue;
    }
    if (entry.isFile() && isCodeFile(abs)) {
      list.push(abs);
    }
  }
  return list;
};

const getScriptKind = (filePath) => {
  return filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
};

const parseSourceFile = (filePath, content) =>
  ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, getScriptKind(filePath));

const createInteractionCounter = () => ({
  fetch: 0,
  storage: 0,
  clipboard: 0,
  invoke: 0,
  runtimePlatform: 0,
  runtimeUploadHelper: 0
});

const hasExportModifier = (node) => {
  return !!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
};

const isGlobalStorageExpression = (node) => {
  if (ts.isIdentifier(node)) {
    return node.text === 'window' || node.text === 'globalThis';
  }
  if (ts.isPropertyAccessExpression(node)) {
    return isGlobalStorageExpression(node.expression);
  }
  if (ts.isAsExpression(node)) {
    return isGlobalStorageExpression(node.expression);
  }
  return false;
};

const isDeclarationIdentifier = (node) => {
  const parent = node.parent;
  if (!parent) {
    return false;
  }
  if (ts.isVariableDeclaration(parent) && parent.name === node) return true;
  if (ts.isParameter(parent) && parent.name === node) return true;
  if (ts.isFunctionDeclaration(parent) && parent.name === node) return true;
  if (ts.isClassDeclaration(parent) && parent.name === node) return true;
  if (ts.isInterfaceDeclaration(parent) && parent.name === node) return true;
  if (ts.isTypeAliasDeclaration(parent) && parent.name === node) return true;
  if (ts.isImportSpecifier(parent) && parent.name === node) return true;
  if (ts.isImportClause(parent) && parent.name === node) return true;
  if (ts.isNamespaceImport(parent) && parent.name === node) return true;
  if (ts.isPropertySignature(parent) && parent.name === node) return true;
  if (ts.isMethodDeclaration(parent) && parent.name === node) return true;
  if (ts.isMethodSignature(parent) && parent.name === node) return true;
  return false;
};

const scanInteractionHits = (sourceFile) => {
  const hits = createInteractionCounter();

  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      if (name === 'fetch') {
        hits.fetch += 1;
      } else if (name === 'invoke') {
        hits.invoke += 1;
      }
    }

    if (ts.isPropertyAccessExpression(node)) {
      const propertyName = node.name.text;
      if (
        (propertyName === 'localStorage' || propertyName === 'sessionStorage') &&
        isGlobalStorageExpression(node.expression)
      ) {
        hits.storage += 1;
      } else if (
        propertyName === 'clipboard' &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'navigator'
      ) {
        hits.clipboard += 1;
      }
    }

    if (ts.isIdentifier(node)) {
      const name = node.text;
      if (name === '__sdkworkPlatform') {
        hits.runtimePlatform += 1;
      } else if (name === '__sdkworkUploadHelper') {
        hits.runtimeUploadHelper += 1;
      } else if ((name === 'localStorage' || name === 'sessionStorage') && !isDeclarationIdentifier(node)) {
        const parent = node.parent;
        const isPropertyName =
          ts.isPropertyAccessExpression(parent) && parent.name === node;
        if (!isPropertyName) {
          hits.storage += 1;
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return hits;
};

const containsAnyKeyword = (node) => {
  let found = false;
  const visit = (current) => {
    if (found) {
      return;
    }
    if (current.kind === ts.SyntaxKind.AnyKeyword) {
      found = true;
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return found;
};

const countAnyInNodes = (nodes) => {
  return nodes.some((node) => !!node && containsAnyKeyword(node));
};

const isPublicLikeClassMember = (member) => {
  const modifiers = member.modifiers || [];
  if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword)) {
    return false;
  }
  return true;
};

const classMemberSignatureNodes = (member) => {
  if (ts.isMethodDeclaration(member)) {
    return [
      ...member.parameters.map((parameter) => parameter.type).filter(Boolean),
      member.type
    ].filter(Boolean);
  }
  if (ts.isPropertyDeclaration(member)) {
    return [member.type].filter(Boolean);
  }
  if (ts.isGetAccessorDeclaration(member)) {
    return [member.type].filter(Boolean);
  }
  if (ts.isSetAccessorDeclaration(member)) {
    return member.parameters.map((parameter) => parameter.type).filter(Boolean);
  }
  return [];
};

const interfaceMemberSignatureNodes = (member) => {
  if (ts.isMethodSignature(member)) {
    return [
      ...member.parameters.map((parameter) => parameter.type).filter(Boolean),
      member.type
    ].filter(Boolean);
  }
  if (ts.isPropertySignature(member)) {
    if (ts.isFunctionTypeNode(member.type)) {
      return [
        ...member.type.parameters.map((parameter) => parameter.type).filter(Boolean),
        member.type.type
      ].filter(Boolean);
    }
    return [member.type].filter(Boolean);
  }
  if (ts.isIndexSignatureDeclaration(member)) {
    return [
      ...member.parameters.map((parameter) => parameter.type).filter(Boolean),
      member.type
    ].filter(Boolean);
  }
  return [];
};

const countExportedAnyHits = (sourceFile) => {
  let hits = 0;

  for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) {
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      if (countAnyInNodes([statement.type])) {
        hits += 1;
      }
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      const signatureNodes = statement.members.flatMap((member) =>
        interfaceMemberSignatureNodes(member)
      );
      if (countAnyInNodes(signatureNodes)) {
        hits += 1;
      }
      continue;
    }

    if (ts.isFunctionDeclaration(statement)) {
      const signatureNodes = [
        ...statement.parameters.map((parameter) => parameter.type).filter(Boolean),
        statement.type
      ].filter(Boolean);
      if (countAnyInNodes(signatureNodes)) {
        hits += 1;
      }
      continue;
    }

    if (ts.isClassDeclaration(statement)) {
      const signatureNodes = statement.members
        .filter((member) => isPublicLikeClassMember(member))
        .flatMap((member) => classMemberSignatureNodes(member));
      if (countAnyInNodes(signatureNodes)) {
        hits += 1;
      }
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      const signatureNodes = statement.declarationList.declarations
        .map((declaration) => declaration.type)
        .filter(Boolean);
      if (countAnyInNodes(signatureNodes)) {
        hits += 1;
      }
    }
  }

  return hits;
};

const isPromiseWithoutServiceResult = (typeNode, sourceFile) => {
  const text = typeNode.getText(sourceFile).replace(/\s+/g, ' ');
  if (!text.startsWith('Promise<')) {
    return false;
  }
  return !text.includes('ServiceResult<');
};

const countBusinessServiceContractGaps = (sourceFile, filePath) => {
  const baseName = path.basename(filePath);
  if (!baseName.includes('BusinessService')) {
    return 0;
  }

  const gapSignatures = new Set();
  const checkReturnType = (typeNode) => {
    if (typeNode && isPromiseWithoutServiceResult(typeNode, sourceFile)) {
      return true;
    }
    return false;
  };

  for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement) || !ts.isInterfaceDeclaration(statement)) {
      continue;
    }

    const interfaceName = statement.name.text;
    const isBusinessBoundaryInterface =
      interfaceName.endsWith('BusinessAdapter') ||
      interfaceName.endsWith('BusinessService') ||
      interfaceName.startsWith('I') && interfaceName.endsWith('BusinessService');
    if (!isBusinessBoundaryInterface) {
      continue;
    }

    for (const member of statement.members) {
      if (ts.isMethodSignature(member)) {
        if (checkReturnType(member.type)) {
          const methodName = member.name.getText(sourceFile);
          gapSignatures.add(`${interfaceName}.${methodName}`);
        }
      } else if (ts.isPropertySignature(member) && member.type && ts.isFunctionTypeNode(member.type)) {
        if (checkReturnType(member.type.type)) {
          const propertyName = member.name.getText(sourceFile);
          gapSignatures.add(`${interfaceName}.${propertyName}`);
        }
      }
    }
  }

  return gapSignatures.size;
};

const isAllowedOutsideService = (relPath) => {
  return ALLOWED_OUTSIDE_SERVICE.some((rule) => rule.test(relPath));
};

const hasServicesExportInRootIndex = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = parseSourceFile(filePath, content);
  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) {
      continue;
    }
    if (
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === './services'
    ) {
      return true;
    }
  }
  return false;
};

const hasAnyExportInFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = parseSourceFile(filePath, content);
  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement) || hasExportModifier(statement)) {
      return true;
    }
  }
  return false;
};

const packageNames = fs
  .readdirSync(PACKAGES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

const packageReports = [];

for (const packageName of packageNames) {
  const packageRoot = path.join(PACKAGES_DIR, packageName);
  const srcRoot = path.join(packageRoot, 'src');
  const servicesRoot = path.join(srcRoot, 'services');
  const servicesIndexPath = path.join(servicesRoot, 'index.ts');
  const rootIndexPath = path.join(srcRoot, 'index.ts');
  const hasSrc = fs.existsSync(srcRoot);
  const hasServicesDir = fs.existsSync(servicesRoot);
  const hasServicesIndex = fs.existsSync(servicesIndexPath);
  const hasRootIndex = fs.existsSync(rootIndexPath);
  const sourceFiles = hasSrc ? walkFiles(srcRoot) : [];
  const serviceFiles = hasServicesDir ? walkFiles(servicesRoot) : [];
  const hasEmptyServicesDir = hasServicesDir && serviceFiles.length === 0;

  let hasAdapterController = false;
  let hasAdapterTriplet = false;
  let hasSetAdapterExport = false;
  let hasGetAdapterExport = false;
  let hasResetAdapterExport = false;
  let exportedAnyCount = 0;
  let businessServiceContractGapCount = 0;

  for (const filePath of serviceFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = parseSourceFile(filePath, content);

    exportedAnyCount += countExportedAnyHits(sourceFile);
    businessServiceContractGapCount += countBusinessServiceContractGaps(
      sourceFile,
      filePath
    );

    if (content.includes('createServiceAdapterController')) {
      hasAdapterController = true;
    }
    if (/export\s+const\s+set[A-Za-z0-9_]*Adapter/.test(content)) {
      hasSetAdapterExport = true;
    }
    if (/export\s+const\s+get[A-Za-z0-9_]*Adapter/.test(content)) {
      hasGetAdapterExport = true;
    }
    if (/export\s+const\s+reset[A-Za-z0-9_]*Adapter/.test(content)) {
      hasResetAdapterExport = true;
    }
  }

  if (hasSetAdapterExport && hasGetAdapterExport && hasResetAdapterExport) {
    hasAdapterTriplet = true;
  }

  const violationRows = [];
  const allowedRows = [];

  for (const filePath of sourceFiles) {
    const relPath = toPosixPath(path.relative(ROOT_DIR, filePath));
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = parseSourceFile(filePath, content);
    const isServiceLayer = relPath.includes('/src/services/');
    const interactionHits = scanInteractionHits(sourceFile);

    for (const rule of INTERACTION_RULES) {
      const count = interactionHits[rule.key];
      if (!count) {
        continue;
      }

      const row = {
        file: relPath,
        rule: rule.key,
        label: rule.label,
        count
      };

      if (!isServiceLayer) {
        if (isAllowedOutsideService(relPath)) {
          allowedRows.push(row);
        } else {
          violationRows.push(row);
        }
      }
    }
  }

  const violationCount = violationRows.reduce((sum, row) => sum + row.count, 0);
  const allowedCount = allowedRows.reduce((sum, row) => sum + row.count, 0);
  const needsServiceDir =
    !hasServicesDir &&
    violationCount > 0 &&
    !INFRASTRUCTURE_PACKAGES.has(packageName);
  const hasSdkAdapterSeam = hasAdapterController || hasAdapterTriplet;
  const needsSdkAdapterSeam =
    hasServicesDir &&
    serviceFiles.length > 0 &&
    !SEAM_EXEMPT_PACKAGES.has(packageName) &&
    !hasSdkAdapterSeam;
  const hasRootServicesExport = hasRootIndex ? hasServicesExportInRootIndex(rootIndexPath) : false;
  const needsRootServicesExport =
    hasServicesDir &&
    serviceFiles.length > 0 &&
    hasRootIndex &&
    !ROOT_SERVICE_EXPORT_EXEMPT_PACKAGES.has(packageName) &&
    !hasRootServicesExport;
  const hasServicesIndexExports = hasServicesIndex ? hasAnyExportInFile(servicesIndexPath) : false;
  const needsServicesIndexContract =
    hasServicesDir &&
    serviceFiles.length > 0 &&
    (!hasServicesIndex || !hasServicesIndexExports);

  packageReports.push({
    packageName,
    hasSrc,
    hasServicesDir,
    hasServicesIndex,
    hasServicesIndexExports,
    hasRootIndex,
    hasRootServicesExport,
    hasEmptyServicesDir,
    serviceFileCount: serviceFiles.length,
    hasAdapterController,
    hasAdapterTriplet,
    hasSdkAdapterSeam,
    exportedAnyCount,
    businessServiceContractGapCount,
    violationCount,
    allowedCount,
    needsServiceDir,
    needsSdkAdapterSeam,
    needsServicesIndexContract,
    needsRootServicesExport,
    violations: violationRows,
    allowed: allowedRows
  });
}

const packagesWithViolations = packageReports.filter((row) => row.violationCount > 0);
const packagesNeedingServiceDir = packageReports.filter((row) => row.needsServiceDir);
const packagesMissingSdkSeam = packageReports.filter((row) => row.needsSdkAdapterSeam);
const packagesMissingServicesIndexContract = packageReports.filter(
  (row) => row.needsServicesIndexContract
);
const packagesMissingRootServicesExport = packageReports.filter(
  (row) => row.needsRootServicesExport
);
const packagesWithEmptyServicesDir = packageReports.filter((row) => row.hasEmptyServicesDir);
const packagesWithExportedAny = packageReports.filter((row) => row.exportedAnyCount > 0);
const packagesWithBusinessContractGaps = packageReports.filter(
  (row) => row.businessServiceContractGapCount > 0
);
const totalViolations = packageReports.reduce((sum, row) => sum + row.violationCount, 0);
const totalExportedAny = packageReports.reduce(
  (sum, row) => sum + row.exportedAnyCount,
  0
);
const totalBusinessContractGaps = packageReports.reduce(
  (sum, row) => sum + row.businessServiceContractGapCount,
  0
);

const mdLines = [];
mdLines.push('# Service Encapsulation Audit');
mdLines.push('');
mdLines.push(`- Date: ${DATE_TAG}`);
mdLines.push(`- Packages scanned: ${packageReports.length}`);
mdLines.push(`- Policy source: ${policySource}`);
mdLines.push(
  `- Packages with direct interactions outside services: ${packagesWithViolations.length}`
);
mdLines.push(`- Total direct interaction hits outside services: ${totalViolations}`);
mdLines.push(
  `- Packages missing \`src/services\` but needing service layer: ${packagesNeedingServiceDir.length}`
);
mdLines.push(
  `- Packages with services but missing SDK adapter seam: ${packagesMissingSdkSeam.length}`
);
mdLines.push(
  `- Packages with services but missing valid \`src/services/index.ts\` contract: ${packagesMissingServicesIndexContract.length}`
);
mdLines.push(
  `- Packages with services but missing root \`src/index.ts\` export for \`./services\`: ${packagesMissingRootServicesExport.length}`
);
mdLines.push(
  `- Packages with empty \`src/services\` directory: ${packagesWithEmptyServicesDir.length}`
);
mdLines.push(
  `- Packages with exported \`any\` in service API lines: ${packagesWithExportedAny.length}`
);
mdLines.push(`- Total exported \`any\` hits in service API lines: ${totalExportedAny}`);
mdLines.push(
  `- Packages with business service Promise contract gaps: ${packagesWithBusinessContractGaps.length}`
);
mdLines.push(
  `- Total business service Promise contract gaps: ${totalBusinessContractGaps}`
);
mdLines.push('');
mdLines.push('## Priority Findings');
mdLines.push('');

if (packagesWithViolations.length === 0) {
  mdLines.push('- No direct interaction violations found outside service layer.');
} else {
  for (const pkg of packagesWithViolations.sort((a, b) => b.violationCount - a.violationCount)) {
    mdLines.push(`- \`${pkg.packageName}\`: ${pkg.violationCount} hit(s) outside service layer`);
    for (const item of pkg.violations.slice(0, 8)) {
      mdLines.push(`  - ${item.file} -> ${item.label} x${item.count}`);
    }
    if (pkg.violations.length > 8) {
      mdLines.push(`  - ... ${pkg.violations.length - 8} more item(s)`);
    }
  }
}

if (packagesMissingSdkSeam.length === 0) {
  mdLines.push('- No SDK adapter seam gaps found for service-bearing feature packages.');
} else {
  for (const pkg of packagesMissingSdkSeam.sort((a, b) => b.serviceFileCount - a.serviceFileCount)) {
    mdLines.push(
      `- \`${pkg.packageName}\`: has \`src/services\` but no adapter seam (\`createServiceAdapterController\` or exported \`set/get/reset*Adapter\`)`
    );
  }
}

if (packagesMissingServicesIndexContract.length === 0) {
  mdLines.push('- No services index contract gaps found for service-bearing packages.');
} else {
  for (const pkg of packagesMissingServicesIndexContract.sort((a, b) =>
    a.packageName.localeCompare(b.packageName)
  )) {
    mdLines.push(
      `- \`${pkg.packageName}\`: requires \`src/services/index.ts\` with at least one export.`
    );
  }
}

if (packagesMissingRootServicesExport.length === 0) {
  mdLines.push('- No root service export gaps found for service-bearing feature packages.');
} else {
  for (const pkg of packagesMissingRootServicesExport.sort((a, b) =>
    a.packageName.localeCompare(b.packageName)
  )) {
    mdLines.push(
      `- \`${pkg.packageName}\`: has service files but missing \`export * from './services'\` in \`src/index.ts\``
    );
  }
}

if (packagesWithEmptyServicesDir.length === 0) {
  mdLines.push('- No empty services directories found.');
} else {
  for (const pkg of packagesWithEmptyServicesDir.sort((a, b) => a.packageName.localeCompare(b.packageName))) {
    mdLines.push(`- \`${pkg.packageName}\`: has empty \`src/services\` directory.`);
  }
}

if (packagesWithExportedAny.length === 0) {
  mdLines.push('- No exported `any` usage found in service API lines.');
} else {
  for (const pkg of packagesWithExportedAny.sort((a, b) => b.exportedAnyCount - a.exportedAnyCount)) {
    mdLines.push(`- \`${pkg.packageName}\`: exported \`any\` hits x${pkg.exportedAnyCount}`);
  }
}

if (packagesWithBusinessContractGaps.length === 0) {
  mdLines.push('- No business service Promise contract gaps found.');
} else {
  for (const pkg of packagesWithBusinessContractGaps.sort(
    (a, b) => b.businessServiceContractGapCount - a.businessServiceContractGapCount
  )) {
    mdLines.push(
      `- \`${pkg.packageName}\`: business service Promise contract gaps x${pkg.businessServiceContractGapCount}`
    );
  }
}

mdLines.push('');
mdLines.push('## Service Structure Summary');
mdLines.push('');
mdLines.push(
  '| Package | Services Dir | Services Index | Services Index Exports | Root Index | Root Services Export | Empty Services Dir | Service Files | Adapter Controller | Adapter Triplet | SDK Seam | Exported any | Business Promise Gaps | Violations | Allowed Baseline |'
);
mdLines.push('| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | ---: | ---: | ---: | ---: |');
for (const row of packageReports) {
  mdLines.push(
    `| ${row.packageName} | ${row.hasServicesDir ? 'yes' : 'no'} | ${row.hasServicesIndex ? 'yes' : 'no'} | ${row.hasServicesIndexExports ? 'yes' : 'no'} | ${row.hasRootIndex ? 'yes' : 'no'} | ${row.hasRootServicesExport ? 'yes' : 'no'} | ${row.hasEmptyServicesDir ? 'yes' : 'no'} | ${row.serviceFileCount} | ${row.hasAdapterController ? 'yes' : 'no'} | ${row.hasAdapterTriplet ? 'yes' : 'no'} | ${row.hasSdkAdapterSeam ? 'yes' : 'no'} | ${row.exportedAnyCount} | ${row.businessServiceContractGapCount} | ${row.violationCount} | ${row.allowedCount} |`
  );
}

mdLines.push('');
mdLines.push('## Proposed Next Actions');
mdLines.push('');
mdLines.push('1. Eliminate remaining direct interactions in non-infrastructure packages.');
mdLines.push(
  '2. Add business adapter controller or set/get/reset adapter triplet for packages with service files but no SDK seam.'
);
mdLines.push(
  '3. Keep infrastructure-level direct interactions only in core/platform and app-sdk adapter layers.'
);
mdLines.push(
  '4. Gradually migrate business Promise contracts to `Promise<ServiceResult<T>>` where cross-boundary.'
);
mdLines.push(
  '5. Ensure package root `src/index.ts` re-exports `./services` for service-bearing feature packages.'
);
mdLines.push(
  '6. Ensure `src/services/index.ts` exists and exports service APIs for every service-bearing package.'
);

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const reportPath = path.join(REPORT_DIR, `${DATE_TAG}-service-encapsulation-audit.md`);
fs.writeFileSync(reportPath, `${mdLines.join('\n')}\n`, 'utf8');

const jsonPath = path.join(REPORT_DIR, `${DATE_TAG}-service-encapsulation-audit.json`);
fs.writeFileSync(jsonPath, JSON.stringify(packageReports, null, 2), 'utf8');

console.log(`Audit report written to: ${toPosixPath(path.relative(ROOT_DIR, reportPath))}`);
console.log(`Audit data written to: ${toPosixPath(path.relative(ROOT_DIR, jsonPath))}`);
console.log(`Policy source: ${policySource}`);
console.log(`Packages with violations: ${packagesWithViolations.length}`);
console.log(`Total violations: ${totalViolations}`);
console.log(`Packages missing SDK seam: ${packagesMissingSdkSeam.length}`);
console.log(
  `Packages missing services index contract: ${packagesMissingServicesIndexContract.length}`
);
console.log(`Packages missing root services export: ${packagesMissingRootServicesExport.length}`);
console.log(`Packages with empty services dir: ${packagesWithEmptyServicesDir.length}`);
console.log(`Packages with exported any in service API lines: ${packagesWithExportedAny.length}`);
console.log(`Total exported any hits in service API lines: ${totalExportedAny}`);
console.log(
  `Packages with business service Promise contract gaps: ${packagesWithBusinessContractGaps.length}`
);
console.log(`Total business service Promise contract gaps: ${totalBusinessContractGaps}`);

const strictFailureCount =
  totalViolations +
  packagesMissingSdkSeam.length +
  packagesMissingServicesIndexContract.length +
  packagesMissingRootServicesExport.length +
  packagesWithEmptyServicesDir.length +
  totalExportedAny +
  totalBusinessContractGaps;

if (STRICT_MODE && strictFailureCount > 0) {
  console.error(
    `Strict audit failed with ${strictFailureCount} blocking issue(s). See ${toPosixPath(path.relative(ROOT_DIR, reportPath))}`
  );
  process.exitCode = 1;
}
