// syntec-macro v1.3.4 - extension.js
// VSCode 扩展主入口：提供 IntelliSense / Hover / 诊断

const vscode = require('vscode');
const { functions } = require('./functions');
const { keywords } = require('./keywords');
const { validateDocument } = require('./validator');

const LANG_ID = 'syntec-macro';

// =====================
// 1. Completion Provider
// =====================
function provideCompletionItems(document, position) {
  const line = document.lineAt(position).text;
  const textBefore = line.substring(0, position.character);

  const items = [];

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
  const allKeywords = [
    ...keywords.conditional, ...keywords.repeat, ...keywords.while,
    ...keywords.for, ...keywords.case, ...keywords.flow,
    ...keywords.operators,
  ];
  for (const kw of allKeywords) {
    if (kw.startsWith(prefix) && kw !== 'GOTO') {
      const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
      items.push(item);
    }
  }

  // 补全 G 代码
  if (prefix === 'G' || prefix === 'G6') {
    for (const g of keywords.gcodes) {
      const item = new vscode.CompletionItem(g, vscode.CompletionItemKind.EnumMember);
      item.detail = 'G代码';
      items.push(item);
    }
  }

  // 补全 M 代码
  if (prefix === 'M') {
    for (const m of keywords.mcodes) {
      const item = new vscode.CompletionItem(m, vscode.CompletionItemKind.EnumMember);
      item.detail = 'M代码 / 程序结束';
      if (m === 'M99') item.documentation = '子程序返回 / 主程序结束';
      if (m === 'M30') item.documentation = '程序结束并复位';
      items.push(item);
    }
  }

  // 变量片段（#）
  if (textBefore.endsWith('#')) {
    for (let i = 1; i <= 20; i++) {
      const item = new vscode.CompletionItem('#' + i, vscode.CompletionItemKind.Variable);
      item.detail = '局部变量 #' + i;
      item.insertText = String(i);
      items.push(item);
    }
  }

  return items;
}

// =====================
// 2. Hover Provider
// =====================
function provideHover(document, position) {
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

  // G/M 代码
  if (/^G\d/.test(word)) {
    return new vscode.Hover(new vscode.MarkdownString('**G代码**: ' + word), range);
  }
  if (/^M\d/.test(word)) {
    const desc = word === 'M99' ? '子程序返回 / 宏程序结束' :
                 word === 'M30' ? '程序结束并复位' :
                 word === 'M65' ? '宏程序调用' : 'M代码';
    return new vscode.Hover(new vscode.MarkdownString('**M代码**: ' + word + '\n' + desc), range);
  }

  // 变量
  if (/^[#@]/.test(word)) {
    return new vscode.Hover(new vscode.MarkdownString('**变量**: ' + word), range);
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

  // GOTO Nxxx → 跳转到 N 标签
  const gotoMatch = line.match(/GOTO\s+(\w+)/i);
  if (gotoMatch) {
    const target = gotoMatch[1].toUpperCase();
    const targets = [];
    for (let i = 0; i < document.lineCount; i++) {
      const l = document.lineAt(i).text.trim();
      if (l === target || l === target + ':') {
        const labelRange = new vscode.Range(i, 0, i, l.length);
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

  const fs = require('fs');
  const path = require('path');
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

  // 模糊搜索
  try {
    const files = fs.readdirSync(dir);
    const match = files.find(f => f.toUpperCase() === fileName.toUpperCase());
    if (match) return path.join(dir, match);
  } catch {}

  return null;
}

// =====================
// 4. Diagnostics（实时语法检查）
// =====================
let diagnosticCollection;

function refreshDiagnostics(document) {
  if (!diagnosticCollection) return;
  if (document.languageId !== LANG_ID) return;

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
// 5. 标签符号（N码导航）
// =====================
function provideDocumentSymbol(document) {
  const symbols = [];
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const text = line.text.trim();
    // N标签行（如 N100）
    const labelMatch = text.match(/^N(\d+)\s*$/);
    if (labelMatch) {
      const sym = new vscode.DocumentSymbol(
        text,
        '标签 N' + labelMatch[1],
        vscode.SymbolKind.Number,
        line.range,
        line.range,
        []
      );
      symbols.push(sym);
    }
    // 子程序定义 %@MACRO ...
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
    }, '.')
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

  // 状态栏提示
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.right, 100
  );
  statusBar.text = ' Syntec Macro v1.3.4';
  statusBar.tooltip = '新代宏程序扩展已激活';
  statusBar.show();
  context.subscriptions.push(statusBar);

  console.log('[syntec-macro] 扩展已激活 v1.3.4');
}

function deactivate() {}

module.exports = { activate, deactivate };