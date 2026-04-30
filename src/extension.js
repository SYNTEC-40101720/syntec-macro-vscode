// syntec-macro v1.4.1 - extension.js
// VSCode 扩展主入口：提供 IntelliSense / Hover / 诊断

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { functions } = require('./functions');
const { keywords } = require('./keywords');
const { validateDocument } = require('./validator');
const packageJson = require('../package.json');

const LANG_ID = 'syntec-macro';

function getConfig(resource) {
  return vscode.workspace.getConfiguration('syntecMacro', resource);
}

function isFeatureEnabled(resource, key) {
  return getConfig(resource).get(key, true);
}

function createNLabelRegex(labelNo) {
  if (labelNo) return new RegExp('^N' + labelNo + '\\s*;', 'i');
  return /^N(\d+)\s*;/i;
}

function getRegexRangeAtPosition(document, position, regex) {
  const line = document.lineAt(position.line).text;
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(line)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (position.character >= start && position.character <= end) {
      return new vscode.Range(position.line, start, position.line, end);
    }
  }
  return null;
}

// =====================
// 1. Completion Provider
// =====================
function provideCompletionItems(document, position) {
  if (!isFeatureEnabled(document.uri, 'enableCompletions')) return [];

  const line = document.lineAt(position).text;
  const textBefore = line.substring(0, position.character);

  const items = [];

  // 变量片段（#）
  if (textBefore.endsWith('#')) {
    // 常用局部变量 #1~#20
    for (let i = 1; i <= 20; i++) {
      const item = new vscode.CompletionItem('#' + i, vscode.CompletionItemKind.Variable);
      item.detail = '局部变量 #' + i;
      item.insertText = String(i);
      items.push(item);
    }
    // 常用大号变量
    const bigVars = [100, 500, 1000, 2000, 9901, 9902, 9903, 9904, 9905, 9906];
    for (const v of bigVars) {
      const item = new vscode.CompletionItem('#' + v, vscode.CompletionItemKind.Variable);
      item.detail = '局部变量 #' + v;
      item.insertText = String(v);
      items.push(item);
    }
    return items;
  }

  // 正在输入函数名（光标前有字母，可能是函数/关键字）
  const wordMatch = textBefore.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  if (!wordMatch) return items;

  const prefix = wordMatch[0].toUpperCase();

  // 补全内置函数
  for (const fn of functions) {
    if (fn.name.startsWith(prefix)) {
      const item = new vscode.CompletionItem(fn.name, vscode.CompletionItemKind.Function);
      item.detail = fn.sig;
      item.documentation = new vscode.MarkdownString('`syntec-macro\n' + fn.sig + '\n`\n\n' + fn.doc);
      item.insertText = fn.name;
      items.push(item);
    }
  }

  // 补全关键字（控制流）
  const allKeywords = [...new Set([
    ...keywords.conditional, ...keywords.repeat, ...keywords.while,
    ...keywords.for, ...keywords.case, ...keywords.flow,
    ...keywords.operators,
  ])];
  for (const kw of allKeywords) {
    if (kw.startsWith(prefix) && kw !== 'GOTO') {
      const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
      items.push(item);
    }
  }

  // 补全 G 代码
  if (prefix.startsWith('G')) {
    for (const g of keywords.gcodes) {
      if (!g.startsWith(prefix)) continue;
      const item = new vscode.CompletionItem(g, vscode.CompletionItemKind.EnumMember);
      item.detail = 'G代码';
      items.push(item);
    }
  }

  // 补全 M 代码
  if (prefix.startsWith('M')) {
    for (const m of keywords.mcodes) {
      if (!m.startsWith(prefix)) continue;
      const item = new vscode.CompletionItem(m, vscode.CompletionItemKind.EnumMember);
      item.detail = 'M代码 / 程序结束';
      if (m === 'M99') item.documentation = '子程序返回 / 主程序结束';
      if (m === 'M30') item.documentation = '程序结束并复位';
      items.push(item);
    }
  }

  return items;
}

// =====================
// 2. Hover Provider
// =====================
function provideHover(document, position) {
  if (!isFeatureEnabled(document.uri, 'enableHover')) return null;

  const variableRange = getRegexRangeAtPosition(document, position, /#\[[^\]]+\]|#[1-9]\d*|#[A-Za-z_][A-Za-z0-9_]*|@\[[^\]]+\]|@\d+|@[A-Za-z_][A-Za-z0-9_]*/g);
  if (variableRange) {
    const variable = document.getText(variableRange).toUpperCase();
    return new vscode.Hover(new vscode.MarkdownString('**变量**: ' + variable), variableRange);
  }

  const codeRange = getRegexRangeAtPosition(document, position, /\b[GM]\d+(?:\.\d+)?\b/g);
  if (codeRange) {
    const code = document.getText(codeRange).toUpperCase();
    if (code.startsWith('G')) {
      return new vscode.Hover(new vscode.MarkdownString('**G代码**: ' + code), codeRange);
    }
    const desc = code === 'M99' ? '子程序返回 / 宏程序结束' :
                 code === 'M30' ? '程序结束并复位' :
                 code === 'M65' ? '宏程序调用' : 'M代码';
    return new vscode.Hover(new vscode.MarkdownString('**M代码**: ' + code + '\n' + desc), codeRange);
  }

  const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
  if (!range) return null;

  const word = document.getText(range).toUpperCase();

  // 查找函数
  const fn = functions.find(f => f.name === word);
  if (fn) {
    const md = new vscode.MarkdownString();
    md.appendCodeblock(fn.sig, 'syntec-macro');
    md.appendMarkdown('\n' + fn.doc.replace(/\n/g, '\n\n'));
    return new vscode.Hover(md, range);
  }

  // 查找关键字
  const allKw = [
    ...keywords.conditional, ...keywords.repeat, ...keywords.while,
    ...keywords.for, ...keywords.case, ...keywords.flow, ...keywords.operators,
  ];
  if (allKw.includes(word)) {
    const md = new vscode.MarkdownString('**关键字**: ' + word);
    return new vscode.Hover(md, range);
  }

  return null;
}

// =====================
// 3. Go-to Definition
// =====================
function provideDefinition(document, position) {
  const line = document.lineAt(position).text;
  const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
  if (!range) return [];

  const word = document.getText(range).toUpperCase();

  // GOTO 数字 → 跳转到 N 标签行
  // 实测语法：GOTO 100; （不带N），目标为 N100;
  const gotoMatch = line.match(/\bGOTO\s+(\d+)/i);
  if (gotoMatch) {
    const targetLabel = 'N' + gotoMatch[1];
    const labelRegex = createNLabelRegex(gotoMatch[1]);
    const targets = [];
    for (let i = 0; i < document.lineCount; i++) {
      const rawLine = document.lineAt(i).text;
      const l = rawLine.trim();
      if (labelRegex.test(l)) {
        const start = rawLine.search(/\S/);
        const labelRange = new vscode.Range(i, start, i, start + targetLabel.length);
        targets.push(new vscode.Location(document.uri, labelRange));
      }
    }
    return targets;
  }

  // G65 Pxxx → 跳转到宏程序（文件名约定 G0xxx）
  const g65Match = line.match(/G65\s+P(\w+)/i);
  if (g65Match) {
    const progNo = g65Match[1].toUpperCase();
    // 尝试在当前工作区找同名文件
    const targetFile = findMacroFile(document, progNo);
    if (targetFile) {
      return [new vscode.Location(vscode.Uri.file(targetFile), new vscode.Position(0, 0))];
    }
  }

  return [];
}

// 在工作区查找宏程序文件
function findMacroFile(document, progNo) {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) return null;

  const dir = folder.uri.fsPath;

  // 规范化程序号（补足到4位，如 100 → G0100）
  let fileName = progNo;
  if (/^\d+$/.test(fileName)) {
    fileName = 'G' + fileName.padStart(4, '0');
  } else if (/^G?\d+$/i.test(fileName)) {
    fileName = 'G' + fileName.replace(/^G/i, '').padStart(4, '0');
  }

  const candidates = [
    path.join(dir, fileName),
    path.join(dir, fileName + '.macro'),
    path.join(dir, fileName + '.G'),
    path.join(dir, fileName + '.scp'),
  ];

  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }

  const recursiveCandidates = [
    fileName,
    fileName + '.macro',
    fileName + '.G',
    fileName + '.scp',
  ].map(name => name.toUpperCase());

  const found = findFileRecursive(dir, new Set(recursiveCandidates), 5);
  if (found) return found;

  return null;
}

function findFileRecursive(dir, targetUpperNames, maxDepth, depth = 0) {
  if (depth > maxDepth) return null;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (targetUpperNames.has(entry.name.toUpperCase())) return path.join(dir, entry.name);
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const found = findFileRecursive(path.join(dir, entry.name), targetUpperNames, maxDepth, depth + 1);
    if (found) return found;
  }

  return null;
}

// =====================
// 4. Diagnostics（实时语法检查）
// =====================
let diagnosticCollection;

function refreshDiagnostics(document) {
  if (!diagnosticCollection) return;
  if (document.languageId !== LANG_ID) return;
  if (!isFeatureEnabled(document.uri, 'enableDiagnostics')) {
    diagnosticCollection.delete(document.uri);
    return;
  }

  const text = document.getText();
  const problems = validateDocument(text);

  const diagnostics = problems.map(p => {
    const d = new vscode.Diagnostic(
      new vscode.Range(p.line - 1, p.col, p.line - 1, p.endCol || p.col + 1),
      p.msg,
      p.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
    );
    d.source = 'syntec-macro';
    return d;
  });

  diagnosticCollection.set(document.uri, diagnostics);
}

// =====================
// 5. 标签符号（N 码导航）
// =====================
function provideDocumentSymbol(document) {
  const symbols = [];
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const text = line.text.trim();
    // N标签行（如 N100;）
    const labelMatch = text.match(createNLabelRegex());
    if (labelMatch) {
      const sym = new vscode.DocumentSymbol(
        'N' + labelMatch[1],
        '标签 N' + labelMatch[1],
        vscode.SymbolKind.Number,
        line.range,
        line.range,
        []
      );
      symbols.push(sym);
    }
    // 宏程序入口 %@MACRO
    const macroMatch = text.match(/^%@MACRO/);
    if (macroMatch) {
      const sym = new vscode.DocumentSymbol(
        '%@MACRO',
        '宏程序入口',
        vscode.SymbolKind.Namespace,
        line.range,
        line.range,
        []
      );
      symbols.push(sym);
    }
  }
  return symbols;
}

// =====================
// 扩展激活
// =====================
function activate(context) {
  // 注册语言服务
  const selector = { language: LANG_ID };

  // Completion
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(selector, {
      provideCompletionItems,
    }, '.', '#')
  );

  // Hover
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, { provideHover })
  );

  // Go-to Definition
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, { provideDefinition })
  );

  // Document Symbols
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(selector, { provideDocumentSymbol })
  );

  // Diagnostics
  diagnosticCollection = vscode.languages.createDiagnosticCollection(LANG_ID);
  context.subscriptions.push(diagnosticCollection);

  // 初始扫描 + 实时更新
  for (const doc of vscode.workspace.textDocuments) {
    refreshDiagnostics(doc);
  }

  const changeWatcher = vscode.workspace.onDidChangeTextDocument(e => {
    refreshDiagnostics(e.document);
  });
  context.subscriptions.push(changeWatcher);

  const openWatcher = vscode.workspace.onDidOpenTextDocument(doc => {
    refreshDiagnostics(doc);
  });
  context.subscriptions.push(openWatcher);

  const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
    if (!e.affectsConfiguration('syntecMacro')) return;
    for (const doc of vscode.workspace.textDocuments) {
      refreshDiagnostics(doc);
    }
  });
  context.subscriptions.push(configWatcher);

  // 状态栏提示
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.right, 100
  );
  statusBar.text = ' Syntec Macro v' + packageJson.version;
  statusBar.tooltip = '新代宏程序扩展已激活';
  statusBar.show();
  context.subscriptions.push(statusBar);

  console.log('[syntec-macro] 扩展已激活 v' + packageJson.version);
}

function deactivate() {}

module.exports = { activate, deactivate };
