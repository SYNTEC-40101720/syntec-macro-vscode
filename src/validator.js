// syntec-macro v1.3.5 - validator.js
// 璇硶璇婃柇锛氭嫭鍙峰尮閰嶃€両F/END_IF閰嶅銆佹帶鍒舵祦妫€鏌ャ€佷腑鏂囧瓧绗︽娴?// v1.3.5: 淇 stripCommentsAndStrings / getKeywordPositions / splice / hasElse / CJK dedup bug
// v1.3.5: 鏇夸唬鍏抽敭瀛楋紙ENDREPEAT绛変紭鍏堝尮閰嶏級銆丒XIT寮瑰惊鐜爤銆丟OTO鏍囩楠岃瘉銆?@MACRO鏂囦欢澶存鏌?
// ============================================================
// 鍧楀叧閿瓧瀹氫箟
// ============================================================

// 鍧楀紑鍚叧閿瓧
const OPENER_KEYWORDS = new Set(['IF', 'FOR', 'WHILE', 'CASE', 'REPEAT']);

// 鍧楀叧闂叧閿瓧鏄犲皠锛堟爣鍑?鏇夸唬褰㈠紡锛?const CLOSER_TO_OPENER = {
  'END_IF':     'IF',    'END_FOR':    'FOR',    'END_WHILE':  'WHILE',
  'END_CASE':   'CASE',  'END_REPEAT': 'REPEAT',
  'ENDIF':      'IF',    'ENDFOR':     'FOR',    'ENDWHILE':   'WHILE',
  'ENDCASE':    'CASE',  'ENDREPEAT':  'REPEAT',
};

// 寰幆绫诲紑鍚叧閿瓧锛圗XIT 涓撶敤锛?const LOOP_OPENERS = new Set(['FOR', 'WHILE', 'REPEAT']);

// ============================================================
// 宸ュ叿鍑芥暟
// ============================================================

// 鍘婚櫎瀛楃涓插拰娉ㄩ噴锛屼繚鐣欎唬鐮侀€昏緫
// 瀛楃涓插唴瀹圭敤绌烘牸鏇挎崲锛岃竟鐣屽紩鍙蜂篃鍘婚櫎
function stripCommentsAndStrings(line) {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < line.length) {
    // 琛屾敞閲?//
    if (!inString && line.substring(i, i + 2) === '//') {
      result += ' '.repeat(line.length - i);
      break;
    }
    // 鍧楁敞閲?(* *)
    if (!inString && line.substring(i, i + 2) === '(*') {
      const end = line.indexOf('*)', i + 2);
      const endIdx = end >= 0 ? end + 2 : line.length;
      result += ' '.repeat(endIdx - i);
      i = endIdx;
      continue;
    }
    // 瀛楃涓诧紙鍙屽紩鍙凤級
    if (line[i] === '"') {
      inString = !inString;
    } else {
      result += inString ? ' ' : line[i];
    }
    i++;
  }
  return result;
}

// 鑾峰彇鍏抽敭瀛楀湪琛屼腑鐨勪綅缃紙闃叉 ENDREPEAT/REPEAT 绛夊瓙涓插啿绐侊級
// 绛栫暐锛氱敤涓嬪垝绾垮崰浣嶆硶锛屽厛鎶婇暱鏇夸唬鍏抽敭瀛楁浛鎹㈡垚绛夐暱鍗犱綅绗︼紝鍐嶅尮閰?function getKeywordPositions(line) {
  const clean = stripCommentsAndStrings(line);

  // 绗竴姝ワ細鎶婇暱鏇夸唬鍏抽敭瀛楁浛鎹㈡垚绛夐暱鍗犱綅绗︼紙闃叉 ENDREPEAT 鍐呯殑 REPEAT 琚鍖归厤锛?  // 椤哄簭锛氳秺闀胯秺鍏堟浛鎹紙ENDREPEAT > ENDFOR > ... > REPEAT > UNTIL锛?  const subs = [
    'ENDREPEAT', 'ENDFOR', 'ENDWHILE', 'ENDCASE', 'ENDIF',
    'END_REPEAT', 'END_FOR', 'END_WHILE', 'END_CASE', 'END_IF',
  ];
  let s = clean;
  const offsetMap = []; // [{origKw, pos}] 璁板綍鍗犱綅鍚庣殑浣嶇疆鏄犲皠
  for (const kw of subs) {
    const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
    let m;
    while ((m = re.exec(s)) !== null) {
      const placeholder = '_'.repeat(kw.length);
      s = s.substring(0, m.index) + placeholder + s.substring(m.index + kw.length);
      offsetMap.push({ kw, col: m.index });
      re.lastIndex = m.index + kw.length; // 閲嶆柊瀹氫綅鍒版浛鎹㈠悗鐨勪綅缃?    }
  }

  // 绗簩姝ワ細鍦ㄦ浛鎹㈠悗鐨勫瓧绗︿覆涓尮閰嶅墿浣欏叧閿瓧
  const positions = [];
  const shortKws = [
    'REPEAT', 'FOR', 'WHILE', 'CASE', 'IF',
    'ELSEIF', 'ELSIF', 'ELSE',
    'UNTIL', 'EXIT',
    'TO', 'BY', 'DO', 'OF',
    'GOTO', 'CALL', 'RETURN',
  ];
  for (const kw of shortKws) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + escaped + '\\b', 'g');
    let m;
    while ((m = re.exec(s)) !== null) {
      positions.push({ keyword: kw, col: m.index, endCol: m.index + kw.length });
    }
  }

  // 绗笁姝ワ細鎶婂崰浣嶇璁板綍涔熻浆鎴?positions锛堢敤鍘熷鍏抽敭瀛楀悕锛?  for (const { kw, col } of offsetMap) {
    positions.push({ keyword: kw, col, endCol: col + kw.length });
  }

  return positions;
}

// 妫€鏌ユ槸鍚?%@MACRO 鏂囦欢澶磋
function isMacroHeaderLine(line) {
  return /^%@MACRO$/i.test(line.trim());
}

// 妫€鏌ヤ竴琛屾槸鍚?N鏍囩锛堣棣栧崟鐙嚭鐜?N+鏁板瓧锛屽悗闈㈣窡鍒嗗彿鎴栧啋鍙凤級
// 鏀寔: N10;  N10:  N10  (涓嶅尮閰?GOTO N10 绛夊惈鍏朵粬鍐呭鐨勮)
function isNLabelLine(line) {
  const t = line.trim();
  // 琛岄 N + 鏁板瓧 + 鍙€夊垎鍙?鍐掑彿/绾灏撅紝鎺掗櫎 GOTO/IF/FOR 绛夊鍚堣
  return /^N(\d+)\s*[;:\s]*$/.test(t) &&
    !/^(IF|FOR|WHILE|CASE|REPEAT|ELSEIF|ELSE|GOTO)/i.test(t);
}

// 鎻愬彇 GOTO 鐩爣锛欸OTO N100 鎴?GOTO #2
// 鍖归厤鏍煎紡: GOTO N鏁板瓧 [闈炲瓧姣嶆暟瀛梋 鎴?GOTO #鏁板瓧
// 瑕佹眰: N鍚庣殑鏁板瓧涓插悗闈㈠繀椤昏窡闈炲崟璇嶅瓧绗︼紙绌虹櫧/鍒嗗彿/琛屽熬绛夛級
function extractGotoTarget(line) {
  // \b at start fails when GOTO is at line beginning (no word char before).
  // Use broader match: after N, digits, then require non-alphanumeric char.
  const m = line.match(/\bGOTO\s+N(\d+)(?![A-Z0-9_])|GOTO\s+N(\d+)\b|GOTO\s+#(\d+)/i);
  if (m) return m[1] || m[2] || m[3] || null;
  return null;
}

// ============================================================
// 涓婚獙璇佸嚱鏁?// ============================================================
function validateDocument(content) {
  const lines = content.split(/\r?\n/);
  const diagnostics = [];
  const stack = []; // 鎺у埗娴佸潡鏍? [{line, keyword, hasElse}]

  // === 绗竴閬嶏細鏀堕泦 N鏍囩 + 妫€鏌?%@MACRO ===
  const nLabels = new Set();
  let firstNonCommentIdx = -1;
  let hasMacroHeader = false;
  let firstNonCommentIsBarePercent = false; // % 鍚庨潰涓嶆槸 @ 鎴栧彧鏈?%

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // 鎵剧涓€涓潪绌洪潪娉ㄩ噴琛?    if (firstNonCommentIdx < 0 && trimmed !== '' && !trimmed.startsWith('//') && !trimmed.startsWith('(*')) {
      firstNonCommentIdx = i;
      // 瑁?%锛? 鍚庨潰涓嶆槸 @锛屾垨鑰呭彧鏈?% 鏈韩
      if (/^%(?!@)/.test(trimmed)) firstNonCommentIsBarePercent = true;
    }

    // N鏍囩锛氳棣栧崟鐙嚭鐜?N鏁板瓧锛堟敮鎸?N10; 鍜?N10: 褰㈠紡锛?    if (isNLabelLine(trimmed)) {
      const nm = trimmed.match(/^N(\d+)/);
      if (nm) { nLabels.add(nm[1]); }
    }

    // 妫€鏌?%@MACRO
    if (!trimmed.startsWith('//') && !trimmed.startsWith('(*')) {
      if (isMacroHeaderLine(trimmed)) hasMacroHeader = true;
    }
  }

  // 绗竴琛岃８ % 涓旀棤 %@MACRO 鈫?璀﹀憡
  if (firstNonCommentIsBarePercent && !hasMacroHeader) {
    const first = lines[firstNonCommentIdx].trim();
    diagnostics.push({
      line: firstNonCommentIdx + 1, col: 0, endCol: first.length,
      msg: '姝ゆ枃浠剁己灏?%@MACRO 鏂囦欢澶达紝闈?MACRO 鏍煎紡鏂囦欢',
      severity: 'warning',
    });
  }

  // === 涓诲惊鐜細閫愯澶勭悊鍏抽敭瀛?===
  const gotoRefs = []; // GOTO 寮曠敤 [{line, target}]

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const positions = getKeywordPositions(raw);

    // GOTO 鐩爣寮曠敤
    const gotoTarget = extractGotoTarget(raw);
    if (gotoTarget) gotoRefs.push({ line: lineNum, target: gotoTarget });

    // 鎸夊瓧绗︿綅缃帓搴忥紙鍚岃涓寜浠庡乏鍒板彸椤哄簭澶勭悊鍏抽敭瀛楋級
    positions.sort((a, b) => a.col - b.col);

    for (const pos of positions) {
      const kw = pos.keyword;

      // --- 寮€鍚叧閿瓧 ---
      if (OPENER_KEYWORDS.has(kw)) {
        stack.push({ line: lineNum, keyword: kw, hasElse: false });
      }

      // --- 鍏抽棴鍏抽敭瀛?---
      else if (kw in CLOSER_TO_OPENER) {
        const opener = CLOSER_TO_OPENER[kw];
        let matchIdx = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].keyword === opener) { matchIdx = j; break; }
        }
        if (matchIdx >= 0) {
          stack.splice(matchIdx, 1);
        } else {
          // END_REPEAT/ENDREPEAT 鍙兘宸插湪鍚岃鐨?UNTIL 澶勫叧闂紝璺宠繃姝ゆ姤閿?          if ((kw === 'END_REPEAT' || kw === 'ENDREPEAT') && positions.some(p => p.keyword === 'UNTIL')) {
            continue; // UNTIL 宸插叧闂?REPEAT锛孍ND_REPEAT 绱ц窡鏄悎娉曠敤娉?          }
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: `${kw} 娌℃湁鍖归厤鐨?${opener}`,
            severity: 'error',
          });
        }
      }

      // --- ELSE ---
      else if (kw === 'ELSE') {
        const valid = ['IF', 'CASE'];
        let ni = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (valid.includes(stack[j].keyword)) { ni = j; break; }
        }
        if (ni < 0) {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: 'ELSE 娌℃湁鍖归厤鐨?IF 鎴?CASE', severity: 'error',
          });
        } else {
          for (let j = ni; j >= 0; j--) {
            if (stack[j].keyword === 'IF') { stack[j].hasElse = true; break; }
          }
        }
      }

      // --- ELSEIF / ELSIF ---
      else if (kw === 'ELSEIF' || kw === 'ELSIF') {
        let ni = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].keyword === 'IF') { ni = j; break; }
        }
        if (ni < 0) {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: 'ELSEIF 娌℃湁鍖归厤鐨?IF', severity: 'error',
          });
        } else if (stack[ni].hasElse) {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: 'ELSEIF 娌℃湁鍖归厤鐨?IF锛堣 IF 鍧楀凡鏈?ELSE锛?, severity: 'error',
          });
        }
      }

      // --- UNTIL锛歊EPEAT/UNTIL 寰幆缁堟 ---
      // 鎵嬪唽瑙勮寖锛歊EPEAT 鍧楀繀椤讳互 UNTIL 鏉′欢 + END_REPEAT 缁撳熬
      // 鍚岃鐨?END_REPEAT 绱ч殢 UNTIL 鏄悎娉曠敤娉曪紙鍦?END_REPEAT 鍒嗘敮涓烦杩囨姤閿欙級
      else if (kw === 'UNTIL') {
        let ni = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].keyword === 'REPEAT') { ni = j; break; }
        }
        if (ni < 0) {
          diagnostics.push({
            line: lineNum, col: pos.col, endCol: pos.endCol,
            msg: 'UNTIL 娌℃湁鍖归厤鐨?REPEAT', severity: 'error',
          });
        } else {
          stack.splice(ni, 1);
        }
      }

      // --- EXIT锛氬脊鍑烘渶杩戠殑寰幆鍧楋紱宓屽鏉′欢鍧楁爣璁?exited=true锛堜笉鎶?unclosed warning锛?--
      else if (kw === 'EXIT') {
        let loopIdx = -1;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (LOOP_OPENERS.has(stack[j].keyword)) { loopIdx = j; break; }
        }
        if (loopIdx >= 0) {
          // 绉婚櫎寰幆鍧楋紱鍏朵笂鏂圭殑宓屽鍧楁爣璁?exited=true
          for (let j = loopIdx - 1; j >= 0; j--) {
            if (stack[j].keyword === 'IF') stack[j].exited = true;
          }
          stack.splice(loopIdx, 1);
        }
        // EXIT 涓嶅叆鏍堬紱鏃犲惊鐜潡鏃朵笉鎶ラ敊
      }
    }
  }

  // === 鏂囦欢缁撴潫鏃舵湭鍏抽棴鐨勫潡 ===
  for (const block of stack) {
    if (block.exited) continue; // EXIT 宸茶烦鍑猴紝璺宠繃姝ゅ潡
    diagnostics.push({
      line: block.line, col: 0, endCol: 0,
      msg: `${block.keyword} 鍧楃己灏戝搴旂殑 END_锛堟枃浠剁粨鏉燂級`,
      severity: 'warning',
    });
  }

  // === GOTO 鏍囩寮曠敤楠岃瘉 ===
  for (const ref of gotoRefs) {
    if (!nLabels.has(ref.target)) {
      diagnostics.push({
        line: ref.line, col: 0, endCol: 0,
        msg: `GOTO 鐩爣 N${ref.target} 涓嶅瓨鍦╜, severity: 'warning',
      });
    }
  }

  // === 涓枃瀛楃妫€鏌?===
  const CJK_PUNCT = /[锛涳細锛屻€傦紙锛夈€愩€戯紒锛焅u201c\u201d\u2018\u2019銆娿€媇/;
  const CJK_CHAR  = /[\u4e00-\u9fff\u3400-\u4dbf]/;
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    let inStr = false, inBC = false;
    let hasCJK = false, firstCJK = -1;
    const puncts = [];

    for (let ci = 0; ci < raw.length; ci++) {
      if (!inStr && !inBC && raw.substring(ci, ci + 2) === '//') break;
      if (!inStr && raw.substring(ci, ci + 2) === '(*') {
        const end = raw.indexOf('*)', ci + 2);
        ci = end >= 0 ? end + 1 : raw.length - 1;
        inBC = true; continue;
      }
      if (inBC && raw.substring(ci, ci + 2) === '*)') {
        inBC = false; ci++; continue;
      }
      if (raw[ci] === '"') { inStr = !inStr; continue; }
      if (inStr || inBC) continue;
      if (CJK_CHAR.test(raw[ci]) && !hasCJK) { hasCJK = true; firstCJK = ci; }
      if (CJK_PUNCT.test(raw[ci])) puncts.push({ col: ci, ch: raw[ci] });
    }
    if (hasCJK) diagnostics.push({ line: lineNum, col: firstCJK, endCol: firstCJK + 1,
      msg: '涓枃瀛楃锛氬畯绋嬪簭鍙厑璁镐娇鐢ㄨ嫳鏂囧瓧绗?, severity: 'error' });
    for (const p of puncts) diagnostics.push({ line: lineNum, col: p.col, endCol: p.col + 1,
      msg: `涓枃鏍囩偣 "${p.ch}"锛氬畯绋嬪簭搴斾娇鐢ㄨ嫳鏂囧瓧绗, severity: 'error' });
  }

  // === 鎷彿鍖归厤妫€鏌?===
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const clean = stripCommentsAndStrings(lines[i]);
    if (!clean.trim()) continue;
    const parenStack = [];
    let inStr = false;
    for (let ci = 0; ci < clean.length; ci++) {
      if (clean[ci] === '"') inStr = !inStr;
      if (inStr) continue;
      if (clean[ci] === '(') parenStack.push(ci);
      else if (clean[ci] === ')') {
        if (parenStack.length === 0) {
          diagnostics.push({ line: lineNum, col: ci, endCol: ci + 1,
            msg: '鎷彿涓嶅尮閰嶏細澶氫綑鐨勫彸鎷彿', severity: 'warning' });
        } else { parenStack.pop(); }
      }
    }
    if (parenStack.length > 0) {
      diagnostics.push({ line: lineNum, col: parenStack[0], endCol: parenStack[0] + 1,
        msg: `鎷彿涓嶅尮閰嶏細缂哄皯 ${parenStack.length} 涓彸鎷彿`, severity: 'warning' });
    }
  }

  return diagnostics;
}

exports.validateDocument = validateDocument;
exports.stripCommentsAndStrings = stripCommentsAndStrings;
exports.getKeywordPositions = getKeywordPositions;
exports.isNLabelLine = isNLabelLine;

