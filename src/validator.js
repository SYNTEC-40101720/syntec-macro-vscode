// syntec-macro v1.3.4 - validator.js
// 语法诊断：括号匹配、IF/END_IF配对、控制流检查、中文字符检测
// v1.3.0: 修复 BLOCK_KEYWORDS 反向查找bug（END_* 永远找不到匹配）
//         重构为 OPENER_KEYWORDS (Set) + CLOSER_TO_OPENER 反向映射

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
function stripCommentsAndStrings(line) {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < line.length) {
    // 行注释
    if (!inString && line.substring(i, i + 2) === '//') break;
    // 块注释 (* ... *)
    if (!inString && line.substring(i, i + 2) === '(*') {
      const end = line.indexOf('*)', i + 2);
      i = end >= 0 ? end + 2 : line.length;
      continue;
    }
    // 字符串（双引号）
    if (line[i] === '"') inString = !inString;
    result += line[i];
    i++;
  }
  return result;
}

// 提取一行中的关键字 token（非字符串/注释内）
function extractKeywords(line) {
  const clean = stripCommentsAndStrings(line);
  const re = /\b([A-Z_][A-Z0-9_]*)\b/g;
  const keywords = [];
  let m;
  while ((m = re.exec(clean)) !== null) {
    keywords.push(m[1]);
  }
  return keywords;
}

// 获取关键字在行中的字符位置（保留列号，用于 VSCode 诊断）
function getKeywordPositions(line) {
  const clean = stripCommentsAndStrings(line);
  const positions = [];
  const re = /\b([A-Z_][A-Z0-9_]*)\b/g;
  let m;
  while ((m = re.exec(clean)) !== null) {
    // 计算在原始行中的列位置
    const searchIn = line.split('//')[0]; // 忽略 // 行注之后部分
    const actualPos = searchIn.indexOf(m[1]);
    if (actualPos >= 0) {
      positions.push({ keyword: m[1], col: actualPos, endCol: actualPos + m[1].length });
    }
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

  // 控制流块栈：[{line, keyword}]
  const stack = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const positions = getKeywordPositions(raw);

    for (const pos of positions) {
      const kw = pos.keyword;
      // 去除尾部可能有的分号
      const cleanKw = kw.replace(/;$/, '');

      // --- 块开启关键字（如 IF, FOR, WHILE...）---
      if (OPENER_KEYWORDS.has(cleanKw)) {
        stack.push({ line: lineNum, keyword: cleanKw });
      }

      // --- 块关闭关键字（如 END_IF, END_FOR...）---
      else if (cleanKw in CLOSER_TO_OPENER) {
        const neededOpener = CLOSER_TO_OPENER[cleanKw];
        // 从栈顶向下找最近的对应开启关键字
        let matchIndex = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].keyword === neededOpener) {
            matchIndex = j;
            break;
          }
        }
        if (matchIndex >= 0) {
          // 找到匹配，弹出该块及所有内层嵌套块
          stack.splice(matchIndex);
        } else {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: `${cleanKw} 没有匹配的 ${neededOpener}`,
            severity: 'error',
          });
        }
      }

      // --- ELSE：依附于最近的 IF 或 CASE 块，不入栈 ---
      //     CASE #51 OF ... ELSE ... END_CASE 中 ELSE 属于 CASE
      // --- ELSEIF：只能依附于最近的 IF 块 ---
      else if (cleanKw === 'ELSE' || cleanKw === 'ELSEIF') {
        const validOpeners = cleanKw === 'ELSEIF' ? ['IF'] : ['IF', 'CASE'];
        let nearestIndex = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (validOpeners.includes(stack[j].keyword)) {
            nearestIndex = j;
            break;
          }
        }
        if (nearestIndex < 0) {
          const target = cleanKw === 'ELSEIF' ? 'IF' : 'IF 或 CASE';
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: `${cleanKw} 没有匹配的 ${target}`,
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
  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    diagnostics.push({
      line: unclosed.line, col: 0, endCol: 0,
      msg: `${unclosed.keyword} 块缺少对应的 END_（文件结束）`,
      severity: 'warning',
    });
  }

  // === 中文字符检查（宏程序只允许英文字符）===
  // 中文标点：；：，。（）【】！？""''《》
  const CJK_PUNCT = /[；：，。（）【】！？\u201c\u201d\u2018\u2019《》]/;
  // CJK 统一汉字范围
  const CJK_CHAR = /[\u4e00-\u9fff\u3400-\u4dbf]/;
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    // stripCommentsAndStrings 保留字符串内容，需要额外把字符串内字符替换掉
    const clean = stripCommentsAndStrings(lines[i]);
    if (!clean.trim()) continue;
    // 将字符串内容（引号之间的部分）替换为空格，避免误报
    let codeOnly = '';
    let inStr = false;
    for (let ci = 0; ci < clean.length; ci++) {
      if (clean[ci] === '"') { inStr = !inStr; codeOnly += ' '; continue; }
      codeOnly += inStr ? ' ' : clean[ci];
    }
    for (let ci = 0; ci < codeOnly.length; ci++) {
      const ch = codeOnly[ci];
      if (CJK_PUNCT.test(ch)) {
        diagnostics.push({
          line: lineNum, col: ci, endCol: ci + 1,
          msg: `中文标点 "${ch}"：宏程序应使用英文字符`,
          severity: 'error',
        });
      } else if (CJK_CHAR.test(ch)) {
        diagnostics.push({
          line: lineNum, col: ci, endCol: ci + 1,
          msg: `中文字符：宏程序只允许使用英文字符`,
          severity: 'error',
        });
      }
    }
  }

  // === 括号匹配检查 ===
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const clean = stripCommentsAndStrings(lines[i]);

    // 跳过空行、注释行、标签行
    if (!clean.trim() || clean.trim().startsWith('%@MACRO') || /^\s*N\d+\s*$/.test(clean.trim())) continue;

    const parenStack = [];
    let inStr = false;
    for (let ci = 0; ci < clean.length; ci++) {
      if (clean[ci] === '"') inStr = !inStr;
      if (inStr) continue;
      if (clean[ci] === '(') parenStack.push(ci);
      if (clean[ci] === ')') {
        if (parenStack.length === 0) {
          diagnostics.push({ line: lineNum, col: ci, endCol: ci + 1, msg: "括号不匹配：多余的右括号", severity: 'warning' });
        } else {
          parenStack.pop();
        }
      }
    }
    if (parenStack.length > 0) {
      diagnostics.push({ line: lineNum, col: parenStack[0], endCol: parenStack[0] + 1, msg: `括号不匹配：缺少 ${parenStack.length} 个右括号`, severity: 'warning' });
    }
  }

  return diagnostics;
}

exports.validateDocument = validateDocument;
exports.stripCommentsAndStrings = stripCommentsAndStrings;
