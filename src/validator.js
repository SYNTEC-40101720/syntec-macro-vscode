// syntec-macro v1.3.4 - validator.js
// 语法诊断：括号匹配、IF/END_IF配对、控制流检查、中文字符检测
// v1.3.4: 修复 stripCommentsAndStrings 不去除字符串内容的 bug
//         修复 getKeywordPositions 用 indexOf 造成位置错误的 bug
//         修复 END_闭合时 splice 把嵌套块一起弹出的 bug（改为只弹1个）
//         修复 ELSE 不弹出 IF 导致 ELSEIF 误匹配的 bug（新增 hasElse 标记）
//         修复相邻 CJK 字符报多条重复 error 的 bug

// 块开启关键字 Set
const OPENER_KEYWORDS = new Set(['IF', 'FOR', 'WHILE', 'CASE', 'REPEAT']);

// 块关闭关键字 → 开启关键字的反向映射
const CLOSER_TO_OPENER = {
  'END_IF':     'IF',
  'END_FOR':    'FOR',
  'END_WHILE':  'WHILE',
  'END_CASE':   'CASE',
  'END_REPEAT': 'REPEAT',
};

// ============================================================
// 工具函数
// ============================================================

// 去除字符串和注释，保留代码逻辑
// 字符串内容用空格替换，边界引号也去除
function stripCommentsAndStrings(line) {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < line.length) {
    // 行注释 //
    if (!inString && line.substring(i, i + 2) === '//') {
      result += ' '.repeat(line.length - i);
      break;
    }
    // 块注释 (* *)
    if (!inString && line.substring(i, i + 2) === '(*') {
      const end = line.indexOf('*)', i + 2);
      const endIdx = end >= 0 ? end + 2 : line.length;
      result += ' '.repeat(endIdx - i);
      i = endIdx;
      continue;
    }
    // 字符串（双引号）- 内容替换为空格，边界引号也去除
    if (line[i] === '"') {
      inString = !inString;
      // 不追加引号自身
    } else {
      result += inString ? ' ' : line[i];
    }
    i++;
  }
  return result;
}

// 获取关键字在行中的字符位置（用于 VSCode 诊断）
function getKeywordPositions(line) {
  const clean = stripCommentsAndStrings(line);
  const positions = [];
  const re = /\b([A-Z_][A-Z0-9_]*)\b/g;
  let m;
  while ((m = re.exec(clean)) !== null) {
    positions.push({ keyword: m[1], col: m.index, endCol: m.index + m[1].length });
  }
  return positions;
}

// ============================================================
// 主验证函数
// ============================================================
// 返回: Array<{line, col, endCol, msg, severity}>
function validateDocument(content) {
  const lines = content.split(/\r?\n/);
  const diagnostics = [];

  // 控制流块栈：[{line, keyword, hasElse}]
  const stack = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const positions = getKeywordPositions(raw);

    for (const pos of positions) {
      const kw = pos.keyword;
      const cleanKw = kw.replace(/;$/, '');

      // --- 块开启关键字（如 IF, FOR, WHILE...）---
      if (OPENER_KEYWORDS.has(cleanKw)) {
        stack.push({ line: lineNum, keyword: cleanKw, hasElse: false });
      }

      // --- 块关闭关键字（如 END_IF, END_FOR...）---
      else if (cleanKw in CLOSER_TO_OPENER) {
        const neededOpener = CLOSER_TO_OPENER[cleanKw];
        // 从栈顶向下找最近的对应开启关键字
        let matchIndex = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].keyword === neededOpener) { matchIndex = j; break; }
        }
        if (matchIndex >= 0) {
          // 只弹出被匹配到的那个块；内层未闭合块留在栈里（文件结束时统一报告）
          stack.splice(matchIndex, 1);
        } else {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: `${cleanKw} 没有匹配的 ${neededOpener}`,
            severity: 'error',
          });
        }
      }

      // --- ELSE：依附于最近的 IF 或 CASE 块，标记 hasElse=true ---
      else if (cleanKw === 'ELSE') {
        const validOpeners = ['IF', 'CASE'];
        let nearestIndex = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (validOpeners.includes(stack[j].keyword)) { nearestIndex = j; break; }
        }
        if (nearestIndex < 0) {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: 'ELSE 没有匹配的 IF 或 CASE',
            severity: 'error',
          });
        } else {
          // 标记该 IF 已有 ELSE（防止 ELSEIF 重复匹配）
          for (let j = nearestIndex; j >= 0; j--) {
            if (stack[j].keyword === 'IF') { stack[j].hasElse = true; break; }
          }
        }
      }

      // --- ELSEIF：只能依附于最近的 IF 块，且该 IF 尚未有 ELSE ---
      else if (cleanKw === 'ELSEIF') {
        let nearestIndex = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].keyword === 'IF') { nearestIndex = j; break; }
        }
        if (nearestIndex < 0) {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: 'ELSEIF 没有匹配的 IF',
            severity: 'error',
          });
        } else if (stack[nearestIndex].hasElse) {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: 'ELSEIF 没有匹配的 IF（该 IF 块已有 ELSE）',
            severity: 'error',
          });
        }
      }

      // --- UNTIL：REPEAT/UNTIL 配对 ---
      else if (cleanKw === 'UNTIL') {
        let nearestRepeatIndex = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].keyword === 'REPEAT') { nearestRepeatIndex = j; break; }
        }
        if (nearestRepeatIndex < 0) {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: 'UNTIL 没有匹配的 REPEAT',
            severity: 'error',
          });
        } else {
          stack.splice(nearestRepeatIndex, 1);
        }
      }
    }
  }

  // === 文件结束时未关闭的块 ===
  for (const block of stack) {
    diagnostics.push({
      line: block.line, col: 0, endCol: 0,
      msg: `${block.keyword} 块缺少对应的 END_（文件结束）`,
      severity: 'warning',
    });
  }

  // === 中文字符检查（宏程序只允许英文字符）===
  // 直接跑在原始行上，跳过字符串/注释范围；同类错误每行只报一次
  const CJK_PUNCT = /[；：，。（）【】！？\u201c\u201d\u2018\u2019《》]/;
  const CJK_CHAR  = /[\u4e00-\u9fff\u3400-\u4dbf]/;
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    let inStr = false, inBlockComment = false;
    let hasCJKChar = false, firstCJKChar = -1;
    const punctErrors = [];

    for (let ci = 0; ci < raw.length; ci++) {
      // 行注释
      if (!inStr && !inBlockComment && raw.substring(ci, ci + 2) === '//') break;
      // 块注释
      if (!inStr && raw.substring(ci, ci + 2) === '(*') {
        const end = raw.indexOf('*)', ci + 2);
        ci = end >= 0 ? end + 1 : raw.length - 1;
        inBlockComment = true;
        continue;
      }
      if (inBlockComment && raw.substring(ci, ci + 2) === '*)') {
        inBlockComment = false;
        ci++; // skip closing *
        continue;
      }
      // 字符串边界
      if (raw[ci] === '"') { inStr = !inStr; continue; }
      if (inStr || inBlockComment) continue;

      if (CJK_CHAR.test(raw[ci]) && !hasCJKChar) {
        hasCJKChar = true; firstCJKChar = ci;
      }
      if (CJK_PUNCT.test(raw[ci])) {
        punctErrors.push({ col: ci, ch: raw[ci] });
      }
    }

    // 中文字符统一报一条
    if (hasCJKChar) {
      diagnostics.push({ line: lineNum, col: firstCJKChar, endCol: firstCJKChar + 1,
        msg: '中文字符：宏程序只允许使用英文字符', severity: 'error' });
    }
    // 中文标点逐字符报告
    for (const e of punctErrors) {
      diagnostics.push({ line: lineNum, col: e.col, endCol: e.col + 1,
        msg: `中文标点 "${e.ch}"：宏程序应使用英文字符`, severity: 'error' });
    }
  }

  // === 括号匹配检查 ===
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const clean = stripCommentsAndStrings(lines[i]);
    if (!clean.trim() || /^\s*%@MACRO/.test(clean) || /^\s*N\d+\s*$/.test(clean.trim())) continue;

    const parenStack = [];
    let inStr = false;
    for (let ci = 0; ci < clean.length; ci++) {
      if (clean[ci] === '"') inStr = !inStr;
      if (inStr) continue;
      if (clean[ci] === '(') parenStack.push(ci);
      if (clean[ci] === ')') {
        if (parenStack.length === 0) {
          diagnostics.push({ line: lineNum, col: ci, endCol: ci + 1,
            msg: '括号不匹配：多余的右括号', severity: 'warning' });
        } else {
          parenStack.pop();
        }
      }
    }
    if (parenStack.length > 0) {
      diagnostics.push({ line: lineNum, col: parenStack[0], endCol: parenStack[0] + 1,
        msg: `括号不匹配：缺少 ${parenStack.length} 个右括号`, severity: 'warning' });
    }
  }

  return diagnostics;
}

exports.validateDocument = validateDocument;
exports.stripCommentsAndStrings = stripCommentsAndStrings;
