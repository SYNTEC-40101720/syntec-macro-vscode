import json, os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

snippets = {
    "IF 语句（带 ELSEIF 和 ELSE）": {
        "prefix": "ife",
        "body": [
            "IF ${1:条件} THEN",
            "${2:// 代码}",
            "ELSEIF ${3:条件} THEN",
            "${4:// 代码}",
            "ELSE",
            "${5:// 代码}",
            "END_IF"
        ],
        "description": "IF 条件语句（含 ELSEIF / ELSE）"
    },
    "IF 语句（简化版）": {
        "prefix": "if",
        "body": [
            "IF ${1:条件} THEN",
            "${2:// 代码}",
            "END_IF"
        ],
        "description": "IF 条件语句（仅 IF/END_IF）"
    },
    "FOR 循环": {
        "prefix": "for",
        "body": [
            "FOR ${1:#i} = ${2:1} TO ${3:10} BY ${4:1} DO",
            "${5:// 代码}",
            "END_FOR"
        ],
        "description": "FOR 循环（从起始到终止，步进执行）"
    },
    "WHILE 循环": {
        "prefix": "while",
        "body": [
            "WHILE ${1:条件} DO",
            "${2:// 代码}",
            "END_WHILE"
        ],
        "description": "WHILE 循环（条件为真时重复执行）"
    },
    "REPEAT 循环": {
        "prefix": "repeat",
        "body": [
            "REPEAT",
            "${1:// 代码}",
            "UNTIL ${2:条件}",
            "END_REPEAT"
        ],
        "description": "REPEAT 循环（先执行后判断，必须以 END_REPEAT 结尾）"
    },
    "CASE 选择": {
        "prefix": "case",
        "body": [
            "CASE ${1:#变量} OF",
            "${2:值1}: ${3:// 代码}",
            "${4:值2}: ${5:// 代码}",
            "DEFAULT: ${6:// 代码}",
            "END_CASE"
        ],
        "description": "CASE 多分支选择语句"
    },
    "GOTO 跳转": {
        "prefix": "goto",
        "body": ["GOTO ${1:标签}"],
        "description": "GOTO 跳转到指定标签"
    },
    "变量赋值": {
        "prefix": "set",
        "body": ["${1:#变量} := ${2:值}"],
        "description": "变量赋值（:=）"
    },
    "带注释赋值": {
        "prefix": "setc",
        "body": ["${1:#变量} := ${2:值}  ${3:// 注释说明}"],
        "description": "带注释的变量赋值"
    },
    "完整MACRO程序模板": {
        "prefix": "macro",
        "body": [
            "%@MACRO",
            "",
            "// ===== 程序信息 =====",
            "// 程序名: ${1:程序名称}",
            "// 功能描述: ${2:功能描述}",
            "// 创建日期: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DAY}",
            "// 作者: ${6:作者}",
            "",
            "// ===== 变量声明 =====",
            "// ${7:// 在此声明局部变量和参数}",
            "",
            "N10;",
            "${8:// 主程序代码}",
            "",
            "M99  // 程序结束返回"
        ],
        "description": "完整的 MACRO 程序模板（含文件头注释）"
    },
    "子程序模板": {
        "prefix": "sub",
        "body": [
            "%@MACRO",
            "",
            "// ===== 子程序 =====",
            "// 子程序名: ${1:子程序名称}",
            "// 参数说明: #1=${2:参数1}, #2=${3:参数2}",
            "",
            "${4:// 子程序代码}",
            "",
            "M99  // 返回主程序"
        ],
        "description": "MACRO 子程序模板"
    },
    "ALARM 报警": {
        "prefix": "alarm",
        "body": ["ALARM(${1:报警编号}, \"${2:报警信息}\")"],
        "description": "触发报警（编号 + 提示信息）"
    },
    "MSG 消息提示": {
        "prefix": "msg",
        "body": ["MSG(\" ${1:提示信息}\")"],
        "description": "屏幕显示消息提示"
    },
    "WAIT 等待": {
        "prefix": "wait",
        "body": ["WAIT(${1:等待时间毫秒})"],
        "description": "程序暂停等待（单位：毫秒）"
    },
    "OPEN 打开文件": {
        "prefix": "open",
        "body": ["OPEN(${1:文件号}, \"${2:文件路径}\", ${3:模式})"],
        "description": "打开文件（模式: R读取 / W写入 / A追加）"
    },
    "PRINT 写入文件": {
        "prefix": "print",
        "body": ["PRINT(${1:文件号}, \"${2:内容}\")"],
        "description": "向已打开的文件写入内容"
    },
    "CLOSE 关闭文件": {
        "prefix": "close",
        "body": ["CLOSE(${1:文件号})"],
        "description": "关闭已打开的文件"
    },
    "READDI 读取DI信号": {
        "prefix": "readdi",
        "body": ["#${1:变量} := READDI(${2:DI端口号})"],
        "description": "读取数字输入（DI）信号状态"
    },
    "SETDO 设置DO信号": {
        "prefix": "setdo",
        "body": ["SETDO(${1:DO端口号}, ${2:0或1})"],
        "description": "设置数字输出（DO）信号"
    },
    "READABIT 读取ABIT": {
        "prefix": "readabit",
        "body": ["#${1:变量} := READABIT(${2:端口号}, ${3:位号})"],
        "description": "读取指定端口的指定位"
    },
    "SETABIT 设置ABIT": {
        "prefix": "setabit",
        "body": ["SETABIT(${1:端口号}, ${2:位号}, ${3:0或1})"],
        "description": "设置指定端口的指定位"
    },
    "G65 调用宏程序": {
        "prefix": "g65",
        "body": ["G65 P${1:宏程序号} L${2:调用次数} A${3:参数1} B${4:参数2}"],
        "description": "G65 调用宏程序（P=程序号, L=次数, A/B/C...=参数传递）"
    },
    "DBOPEN 打开数据库": {
        "prefix": "dbopen",
        "body": ["DBOPEN(\"${1:数据库文件名}\")"],
        "description": "打开数据库文件"
    },
    "DBSAVE 保存数据库": {
        "prefix": "dbsave",
        "body": ["DBSAVE(\"${1:数据库文件名}\")"],
        "description": "保存数据库到文件"
    },
    "DBINSERT 插入数据": {
        "prefix": "dbinsert",
        "body": ["DBINSERT(${1:数据组})"],
        "description": "向数据库插入一条数据"
    },
    "DBLOAD 加载数据": {
        "prefix": "dbload",
        "body": ["DBLOAD(${1:数据组})"],
        "description": "从数据库加载一条数据"
    },
    "DBDELETE 删除数据": {
        "prefix": "dbdelete",
        "body": ["DBDELETE(${1:数据组})"],
        "description": "从数据库删除一条数据"
    },
    "DBNEW 新建数据库": {
        "prefix": "dbnew",
        "body": ["DBNEW(\"${1:字段定义}\")"],
        "description": "新建数据库（定义字段结构）"
    },
    "SETDRAW 绘图设置": {
        "prefix": "setdraw",
        "body": ["SETDRAW(${1:绘图模式}, ${2:颜色})"],
        "description": "设置刀具路径绘图（仿真用）"
    },
    "块注释": {
        "prefix": "bc",
        "body": ["(* ${1:注释内容} *)"],
        "description": "块注释 (* *)"
    },
    "SYSVAR 系统变量": {
        "prefix": "sysvar",
        "body": ["#${1:变量} := SYSVAR(\"${2:系统变量名}\")"],
        "description": "读取系统变量"
    },
    "CHKMN 检查M码": {
        "prefix": "chkmn",
        "body": ["#${1:变量} := CHKMN(${2:M码编号})"],
        "description": "检查M代码是否可用"
    },
    "PARAM 参数读取": {
        "prefix": "param",
        "body": ["#${1:变量} := PARAM(${2:参数类型}, ${3:参数编号})"],
        "description": "读取系统参数"
    },
    "PUSH 压栈": {
        "prefix": "push",
        "body": ["PUSH(${1:值})"],
        "description": "将值压入堆栈"
    },
    "POP 出栈": {
        "prefix": "pop",
        "body": ["#${1:变量} := POP()"],
        "description": "从堆栈弹出值"
    }
}

out_dir = os.path.join(ROOT_DIR, "snippets")
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, "syntec-macro.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(snippets, f, indent=2, ensure_ascii=False)
print(f"Snippets written: {out}")
