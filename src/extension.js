// syntec-macro v1.3.5 - extension.js
// VSCode 鎵╁睍涓诲叆鍙ｏ細鎻愪緵 IntelliSense / Hover / 璇婃柇

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

  // 姝ｅ湪杈撳叆鍑芥暟鍚嶏紙鍏夋爣鍓嶆湁瀛楁瘝锛屽彲鑳芥槸鍑芥暟/鍏抽敭瀛楋級
  const wordMatch = textBefore.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  if (!wordMatch) return items;

  const prefix = wordMatch[0].toUpperCase();

  // 琛ュ叏鍐呯疆鍑芥暟
  for (const fn of functions) {
    if (fn.name.startsWith(prefix)) {
      const item = new vscode.CompletionItem(fn.name, vscode.CompletionItemKind.Function);
      item.detail = fn.sig;
      item.documentation = new vscode.MarkdownString('`syntec-macro\n' + fn.sig + '\n`\n\n' + fn.doc);
      item.insertText = fn.name;
      items.push(item);
    }
  }

  // 琛ュ叏鍏抽敭瀛楋紙鎺у埗娴侊級
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

  // 琛ュ叏 G 浠ｇ爜
  if (prefix === 'G' || prefix === 'G6') {
    for (const g of keywords.gcodes) {
      const item = new vscode.CompletionItem(g, vscode.CompletionItemKind.EnumMember);
      item.detail = 'G浠ｇ爜';
      items.push(item);
    }
  }

  // 琛ュ叏 M 浠ｇ爜
  if (prefix === 'M') {
    for (const m of keywords.mcodes) {
      const item = new vscode.CompletionItem(m, vscode.CompletionItemKind.EnumMember);
      item.detail = 'M浠ｇ爜 / 绋嬪簭缁撴潫';
      if (m === 'M99') item.documentation = '瀛愮▼搴忚繑鍥?/ 涓荤▼搴忕粨鏉?;
      if (m === 'M30') item.documentation = '绋嬪簭缁撴潫骞跺浣?;
      items.push(item);
    }
  }

  // 鍙橀噺鐗囨锛?锛?  if (textBefore.endsWith('#')) {
    // 甯哥敤灞€閮ㄥ彉閲?#1~#20
    for (let i = 1; i <= 20; i++) {
      const item = new vscode.CompletionItem('#' + i, vscode.CompletionItemKind.Variable);
      item.detail = '灞€閮ㄥ彉閲?#' + i;
      item.insertText = String(i);
      items.push(item);
    }
    // 甯哥敤澶у彿鍙橀噺
    const bigVars = [100, 500, 1000, 2000, 9901, 9902, 9903, 9904, 9905, 9906];
    for (const v of bigVars) {
      const item = new vscode.CompletionItem('#' + v, vscode.CompletionItemKind.Variable);
      item.detail = '灞€閮ㄥ彉閲?#' + v;
      item.insertText = String(v);
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

  // 鏌ユ壘鍑芥暟
  const fn = functions.find(f => f.name === word);
  if (fn) {
    const md = new vscode.MarkdownString();
    md.appendCodeblock(fn.sig, 'syntec-macro');
    md.appendMarkdown('\n' + fn.doc.replace(/\n/g, '\n\n'));
    return new vscode.Hover(md, range);
  }

  // 鏌ユ壘鍏抽敭瀛?  const allKw = [
    ...keywords.conditional, ...keywords.repeat, ...keywords.while,
    ...keywords.for, ...keywords.case, ...keywords.flow, ...keywords.operators,
  ];
  if (allKw.includes(word)) {
    const md = new vscode.MarkdownString('**鍏抽敭瀛?*: ' + word);
    return new vscode.Hover(md, range);
  }

  // G/M 浠ｇ爜
  if (/^G\d/.test(word)) {
    return new vscode.Hover(new vscode.MarkdownString('**G浠ｇ爜**: ' + word), range);
  }
  if (/^M\d/.test(word)) {
    const desc = word === 'M99' ? '瀛愮▼搴忚繑鍥?/ 瀹忕▼搴忕粨鏉? :
                 word === 'M30' ? '绋嬪簭缁撴潫骞跺浣? :
                 word === 'M65' ? '瀹忕▼搴忚皟鐢? : 'M浠ｇ爜';
    return new vscode.Hover(new vscode.MarkdownString('**M浠ｇ爜**: ' + word + '\n' + desc), range);
  }

  // 鍙橀噺
  if (/^[#@]/.test(word)) {
    return new vscode.Hover(new vscode.MarkdownString('**鍙橀噺**: ' + word), range);
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

  // GOTO Nxxx 鈫?璺宠浆鍒?N 鏍囩
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

  // G65 Pxxx 鈫?璺宠浆鍒板畯绋嬪簭锛堟枃浠跺悕绾﹀畾 G0xxx锛?  const g65Match = line.match(/G65\s+P(\w+)/i);
  if (g65Match) {
    const progNo = g65Match[1].toUpperCase();
    // 灏濊瘯鍦ㄥ綋鍓嶅伐浣滃尯鎵惧悓鍚嶆枃浠?    const targetFile = findMacroFile(document, progNo);
    if (targetFile) {
      return [new vscode.Location(vscode.Uri.file(targetFile), new vscode.Position(0, 0))];
    }
  }

  return [];
}

// 鍦ㄥ伐浣滃尯鏌ユ壘瀹忕▼搴忔枃浠?function findMacroFile(document, progNo) {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) return null;

  const fs = require('fs');
  const path = require('path');
  const dir = folder.uri.fsPath;

  // 瑙勮寖鍖栫▼搴忓彿锛堣ˉ瓒冲埌4浣嶏紝濡?100 鈫?G0100锛?  let fileName = progNo;
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

  // 妯＄硦鎼滅储
  try {
    const files = fs.readdirSync(dir);
    const match = files.find(f => f.toUpperCase() === fileName.toUpperCase());
    if (match) return path.join(dir, match);
  } catch {}

  return null;
}

// =====================
// 4. Diagnostics锛堝疄鏃惰娉曟鏌ワ級
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
// 5. 鏍囩绗﹀彿锛圢鐮佸鑸級
// =====================
function provideDocumentSymbol(document) {
  const symbols = [];
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const text = line.text.trim();
    // N鏍囩琛岋紙濡?N100锛?    const labelMatch = text.match(/^N(\d+)\s*$/);
    if (labelMatch) {
      const sym = new vscode.DocumentSymbol(
        text,
        '鏍囩 N' + labelMatch[1],
        vscode.SymbolKind.Number,
        line.range,
        line.range,
        []
      );
      symbols.push(sym);
    }
    // 瀛愮▼搴忓畾涔?%@MACRO ...
    const macroMatch = text.match(/^%@MACRO/);
    if (macroMatch) {
      const sym = new vscode.DocumentSymbol(
        '%@MACRO',
        '瀹忕▼搴忓叆鍙?,
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
// 鎵╁睍婵€娲?// =====================
function activate(context) {
  // 娉ㄥ唽璇█鏈嶅姟
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

  // 鍒濆鎵弿 + 瀹炴椂鏇存柊
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

  // 鐘舵€佹爮鎻愮ず
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.right, 100
  );
  statusBar.text = ' Syntec Macro v1.3.5';
  statusBar.tooltip = '鏂颁唬瀹忕▼搴忔墿灞曞凡婵€娲?;
  statusBar.show();
  context.subscriptions.push(statusBar);

  console.log('[syntec-macro] 鎵╁睍宸叉縺娲?v1.3.5');
}

function deactivate() {}

module.exports = { activate, deactivate };
