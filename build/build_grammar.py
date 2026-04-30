import json, os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

grammar = {
    "name": "Syntec Macro",
    "scopeName": "source.syntec-macro",
    "patterns": [
        {"match": "^%@MACRO", "name": "keyword.control.header.syntec-macro"},
        {"match": "//.*$", "name": "comment.line.double-slash.syntec-macro"},
        {"begin": "\\(\\*", "end": "\\*\\)", "name": "comment.block.stars.syntec-macro"},
        {"match": "\\b(M99|M30|M02)\\b", "name": "keyword.control.end.syntec-macro"},
        {"match": "\\b(IF|THEN|ELSE|ELSEIF|END_IF|ENDIF)\\b", "name": "keyword.control.conditional.syntec-macro"},
        {"match": "\\b(REPEAT|UNTIL|END_REPEAT|ENDREPEAT)\\b", "name": "keyword.control.repeat.syntec-macro"},
        {"match": "\\b(WHILE|DO|END_WHILE|ENDWHILE)\\b", "name": "keyword.control.while.syntec-macro"},
        {"match": "\\b(FOR|TO|BY|END_FOR|ENDFOR)\\b", "name": "keyword.control.for.syntec-macro"},
        {"match": "\\b(CASE|OF|END_CASE|ENDCASE)\\b", "name": "keyword.control.case.syntec-macro"},
        {"match": "\\b(GOTO|EXIT)\\b", "name": "keyword.control.flow.syntec-macro"},
        {"match": "\\b(AND|OR|XOR|NOT)\\b", "name": "keyword.operator.logical.syntec-macro"},
        {"match": ":=", "name": "keyword.operator.assignment.syntec-macro"},
        {"match": "<>|<=|>=|<|>", "name": "keyword.operator.comparison.syntec-macro"},
        {"match": "=", "name": "keyword.operator.assignment.syntec-macro"},
        {"match": "\\b(ABS|ACOS|ASIN|ATAN|ATAN2|COS|SIN|TAN|CEIL|FLOOR|ROUND|SQRT|EXP|LN|LOG|POW|MAX|MIN|SIGN|RANDOM)\\b", "name": "support.function.math.syntec-macro"},
        {"match": "\\b(STR2INT|SCANTEXT|CHR|LEN|MID|STR|FORMAT)\\b", "name": "support.function.string.syntec-macro"},
        {"match": "\\b(OPEN|CLOSE|PRINT|READ|EXIST|DELETE|RENAME|GETARG|GETTRAPARG|PARAM)\\b", "name": "support.function.io.syntec-macro"},
        {"match": "\\b(READDI|READDO|READABIT|SETDO|SETABIT|READRREGBIT|SETRREGBIT|READREG|SETREG)\\b", "name": "support.function.io.rw.syntec-macro"},
        {"match": "\\b(DBOPEN|DBCLOSE|DBNEW|DBLOAD|DBSAVE|DBINSERT|DBDELETE|DBEDIT)\\b", "name": "support.function.db.syntec-macro"},
        {"match": "\\b(ALARM|MSG|WAIT|SLEEP|SYSVAR|SYSDATA|DRVDATA|STD|STDAX|TOOLSET|SETCO)\\b", "name": "support.function.system.syntec-macro"},
        {"match": "\\b(CHKMN|CHKSN|CHKMT|CHKMI|CHKINF)\\b", "name": "support.function.check.syntec-macro"},
        {"match": "\\b(PUSH|POP|STKTOP|AXID)\\b", "name": "support.function.misc.syntec-macro"},
        {"match": "\\b(SETDRAW|DRAWHOLE)\\b", "name": "support.function.draw.syntec-macro"},
        {"match": "\\b(BITAND|BITOR|BITXOR|BITNOT|INLIST|PI|DEG|RAD|MOD)\\b", "name": "support.function.misc.syntec-macro"},
        {"match": "@[A-Za-z_][A-Za-z0-9_]*|@\\d+|@\\[[^\\]]+\\]", "name": "variable.language.global.syntec-macro"},
        {"match": "#\\[[^\\]]+\\]|#[1-9]\\d*|#[A-Za-z_][A-Za-z0-9_]*", "name": "variable.language.local.syntec-macro"},
        {"match": "\\b(AR|MAR)\\d+\\b", "name": "variable.language.app.syntec-macro"},
        {"match": "\\bG\\d+(?:\\.\\d+)?\\b", "name": "entity.name.function.gcode.syntec-macro"},
        {"match": "\\bM\\d+\\b", "name": "entity.name.function.mcode.syntec-macro"},
        {"match": "^\\s*N\\d+\\s*;", "name": "entity.name.label.syntec-macro"},
        {"match": "\\bG65\\b", "name": "keyword.other.call.syntec-macro"},
        {"match": "\\bG66(?:\\.1)?\\b", "name": "keyword.other.modal-call.syntec-macro"},
        {"begin": '"', 'end': '"', "name": "string.quoted.double.syntec-macro"},
        {"match": "\\b\\d+\\.\\d*\\b", "name": "constant.numeric.float.syntec-macro"},
        {"match": "\\b\\d+\\b", "name": "constant.numeric.integer.syntec-macro"}
    ]
}

out = os.path.join(ROOT_DIR, "syntaxes", "syntec-macro.tmLanguage.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(grammar, f, indent=2, ensure_ascii=False)
print(f"Written: {out}")
