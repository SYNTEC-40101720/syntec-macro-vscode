// syntec-macro v1.3.7 - functions.js
// 内置函数完整定义：补全数据 + Hover文档

exports.functions = [

  // ===== 数学函数 =====
  { name: 'ABS',   sig: 'ABS(num)',           doc: '返回绝对值\nABS(num) → number\n示例: #3 := ABS(#2 - #1)' },
  { name: 'ACOS',  sig: 'ACOS(num)',           doc: '返回反余弦（弧度）\nACOS(num) → number' },
  { name: 'ASIN',  sig: 'ASIN(num)',           doc: '返回反正弦（弧度）\nASIN(num) → number' },
  { name: 'ATAN',  sig: 'ATAN(num)',           doc: '返回反正切（弧度）\nATAN(num) → number' },
  { name: 'ATAN2', sig: 'ATAN2(y, x)',         doc: '返回 y/x 的反正切（弧度，支持象限）\nATAN2(y, x) → number' },
  { name: 'COS',   sig: 'COS(angle)',          doc: '返回余弦（弧度）\nCOS(angle) → number' },
  { name: 'SIN',   sig: 'SIN(angle)',          doc: '返回正弦（弧度）\nSIN(angle) → number' },
  { name: 'TAN',   sig: 'TAN(angle)',          doc: '返回正切（弧度）\nTAN(angle) → number' },
  { name: 'SQRT',  sig: 'SQRT(num)',           doc: '返回平方根\nSQRT(num) → number' },
  { name: 'CEIL',  sig: 'CEIL(num)',           doc: '向上取整\nCEIL(3.2) → 4' },
  { name: 'FLOOR', sig: 'FLOOR(num)',          doc: '向下取整\nFLOOR(3.8) → 3' },
  { name: 'ROUND', sig: 'ROUND(num)',          doc: '四舍五入\nROUND(3.5) → 4' },
  { name: 'EXP',   sig: 'EXP(num)',            doc: '返回 e 的 n 次幂\nEXP(1) → 2.718' },
  { name: 'LN',    sig: 'LN(num)',             doc: '返回自然对数\nLN(2.718) → 1' },
  { name: 'LOG',   sig: 'LOG(num)',            doc: '返回常用对数（底10）\nLOG(100) → 2' },
  { name: 'POW',   sig: 'POW(base, exp)',      doc: '返回幂\nPOW(2, 3) → 8' },
  { name: 'MAX',   sig: 'MAX(a, b)',            doc: '返回较大值\nMAX(3, 5) → 5' },
  { name: 'MIN',   sig: 'MIN(a, b)',            doc: '返回较小值\nMIN(3, 5) → 3' },
  { name: 'SIGN',  sig: 'SIGN(num)',            doc: '返回符号（-1/0/1）\nSIGN(-5) → -1' },
  { name: 'RANDOM', sig: 'RANDOM()',           doc: '返回0~1随机数\nRANDOM() → 0.732...' },

  // ===== 字符串函数 =====
  { name: 'STR2INT', sig: 'STR2INT(string)',   doc: '将字符串转换为整数\nSTR2INT("123") → 123\n常与 SCANTEXT 配合使用' },
  { name: 'SCANTEXT', sig: 'SCANTEXT(addr)',  doc: '从内存地址读取字符串\nSCANTEXT(60001) → 字符串内容\n参数: NC内存地址（整数）\n返回值: 字符串' },
  { name: 'CHR',    sig: 'CHR(code)',          doc: '将ASCII码转换为字符\nCHR(65) → "A"' },
  { name: 'LEN',    sig: 'LEN(string)',        doc: '返回字符串长度\nLEN("ABC") → 3' },
  { name: 'MID',   sig: 'MID(str, start, len)', doc: '截取子字符串\nMID("ABCDEF", 2, 3) → "BCD"' },
  { name: 'STR',   sig: 'STR(num)',            doc: '将数字转换为字符串\nSTR(123) → "123"' },
  { name: 'FORMAT', sig: 'FORMAT(fmt, val)',   doc: '格式化数字为字符串\nFORMAT("%.2f", #1)' },

  // ===== 参数/变量读写 =====
  { name: 'GETARG',    sig: 'GETARG(Xn)',     doc: '读取宏调用传入参数\nGETARG(X1) → 第1个参数值\n参数类型: X1~X15 对应 A~O\nG65 P__ X1#1 → #1 = GETARG(X1)' },
  { name: 'GETTRAPARG', sig: 'GETTRAPARG(n)', doc: '读取陷阱触发时保存的参数\nGETTRAPARG(n)' },
  { name: 'PARAM',     sig: 'PARAM(type, idx)', doc: '读取NC系统参数\nPARAM(type, idx) → number\ntype: 0=轴参数, 1=系统参数, 2=螺距补偿\n示例: #1 := PARAM(1, 1001)' },
  { name: 'SYSVAR',    sig: 'SYSVAR("name")', doc: '读取系统变量\nSYSVAR("SYSTEM::NC_MODE") → 值\n示例: #1 := SYSVAR("SYSTEM::FEEDRATE")' },
  { name: 'SYSDATA',   sig: 'SYSDATA(axis)',  doc: '读取当前轴位置数据\nSYSDATA(axis) → number\naxis: X=0, Y=1, Z=2, A=3, B=4, C=5' },
  { name: 'DRVDATA',   sig: 'DRVDATA(axis)',  doc: '读取驱动数据\nDRVDATA(axis) → number' },

  // ===== 文件 I/O =====
  { name: 'OPEN',   sig: 'OPEN(fileNo, path, mode)', doc: '打开文件\nOPEN(1, "C:\\TEMP\\LOG.TXT", "W")\nmode: R=读, W=写, A=追加\n返回值: 0=成功, <0=失败' },
  { name: 'CLOSE',  sig: 'CLOSE(fileNo)',    doc: '关闭文件\nCLOSE(1)' },
  { name: 'PRINT',  sig: 'PRINT(fileNo, "text")', doc: '向文件写入文本\nPRINT(1, "Hello")\nPRINT(1, STR(#1)) 写入变量值' },
  { name: 'READ',   sig: 'READ(fileNo, var)', doc: '从文件读取一行到变量\nREAD(1, #var)' },
  { name: 'EXIST',  sig: 'EXIST("path")',    doc: '检查文件是否存在\nEXIST("C:\\TEMP\\DATA.TXT") → 1=存在, 0=不存在' },
  { name: 'DELETE', sig: 'DELETE("path")',   doc: '删除文件\nDELETE("C:\\TEMP\\OLD.TXT")' },
  { name: 'RENAME', sig: 'RENAME(old, new)',  doc: '重命名文件\nRENAME("A.TXT", "B.TXT")' },

  // ===== 数字量 I/O =====
  { name: 'READDI',  sig: 'READDI(port)',   doc: '读取数字输入DI\nREADDI(1) → 0或1\nport: DI端口号（整数）' },
  { name: 'READDO',  sig: 'READDO(port)',   doc: '读取数字输出DO\nREADDO(1) → 0或1' },
  { name: 'SETDO',   sig: 'SETDO(port, val)', doc: '设置数字输出\nSETDO(1, 1) → DO1=1\nSETDO(1, 0) → DO1=0' },
  { name: 'READABIT', sig: 'READABIT(port, bit)', doc: '读取端口指定位\nREADABIT(1, 3) → 读取PORT1的第3位' },
  { name: 'SETABIT',  sig: 'SETABIT(port, bit, val)', doc: '设置端口指定位\nSETABIT(1, 3, 1)' },
  { name: 'READRREGBIT', sig: 'READRREGBIT(reg)', doc: '读取寄存器位\nREADRREGBIT(reg)' },
  { name: 'SETRREGBIT',  sig: 'SETRREGBIT(reg, val)', doc: '设置寄存器位\nSETRREGBIT(reg, val)' },
  { name: 'READREG',  sig: 'READREG(regNo)', doc: '读取寄存器值\nREADREG(1) → 寄存器1的值' },
  { name: 'SETREG',   sig: 'SETREG(regNo, val)', doc: '设置寄存器值\nSETREG(1, 100)' },

  // ===== 宏程序调用 =====
  { name: 'GOTO',  sig: 'GOTO label',       doc: '跳转到N标签行\nGOTO 100; → 跳转到 N100;\n注意：不带N前缀，目标标签必须以分号结尾' },

  // ===== 刀具/坐标系 =====
  { name: 'TOOLSET', sig: 'TOOLSET(toolNo)', doc: '设置当前刀具号\nTOOLSET(5) → 切换到5号刀' },
  { name: 'STD',    sig: 'STD(ax)',          doc: '设置工件坐标系轴\nSTD(X) → 设置X轴' },
  { name: 'STDAX',  sig: 'STDAX(X, Y, Z)',   doc: '同时设置多个轴\nSTDAX(X, Y, Z)' },
  { name: 'SETCO',  sig: 'SETCO(coord)',     doc: '设置当前坐标系\nSETCOOR(1) → G54\nSETCOOR(6) → G59' },

  // ===== 数据库 =====
  { name: 'DBOPEN',   sig: 'DBOPEN("filename")',  doc: '打开数据库文件\nDBOPEN("TOOL.DB")\n返回值: 0=成功' },
  { name: 'DBCLOSE',  sig: 'DBCLOSE',        doc: '关闭当前数据库\nDBCLOSE' },
  { name: 'DBNEW',    sig: 'DBNEW("schema")', doc: '创建新数据库\nDBNEW("ID:I,NAME:S,LENGTH:D")' },
  { name: 'DBLOAD',   sig: 'DBLOAD(group)',  doc: '从数据库加载一条记录\nDBLOAD(groupNo)' },
  { name: 'DBSAVE',   sig: 'DBSAVE("filename")', doc: '保存数据库到文件\nDBSAVE("TOOL.DB")' },
  { name: 'DBINSERT', sig: 'DBINSERT(group)', doc: '向数据库插入一条记录\nDBINSERT(groupNo)' },
  { name: 'DBDELETE', sig: 'DBDELETE(group)', doc: '删除当前记录\nDBDELETE(groupNo)' },
  { name: 'DBEDIT',   sig: 'DBEDIT(field, val)', doc: '编辑当前记录字段\nDBEDIT(2, "ToolName")' },

  // ===== 仿真/绘图 =====
  { name: 'SETDRAW',  sig: 'SETDRAW(mode, color)', doc: '设置刀具路径绘图模式\nSETDRAW(0, 1) → mode=0关闭, 1=实线, 2=虚线\ncolor: 颜色代码' },
  { name: 'DRAWHOLE', sig: 'DRAWHOLE(x, y, r)', doc: '绘制钻孔轨迹\nDRAWHOLE(X, Y, R)' },

  // ===== 系统/诊断 =====
  { name: 'ALARM',   sig: 'ALARM(no, "msg")', doc: '触发报警并暂停程序\nALARM(1001, "刀具未就绪")\nno: 报警编号\nmsg: 显示信息' },
  { name: 'MSG',     sig: 'MSG("text")',     doc: '在屏幕显示消息（不暂停）\nMSG(" 当前进度: " + STR(#1) + "%")' },
  { name: 'WAIT',    sig: 'WAIT(ms)',         doc: '等待（毫秒）\nWAIT(2000) → 等待2秒' },
  { name: 'SLEEP',   sig: 'SLEEP(sec)',       doc: '等待（秒）\nSLEEP(1) → 等待1秒\nWAIT vs SLEEP: WAIT=毫秒, SLEEP=秒' },
  { name: 'CHKMI',   sig: 'CHKMI',           doc: '检查M码是否激活\nCHKMI → 0=未激活, 1=已激活' },
  { name: 'CHKMN',   sig: 'CHKMN(Mnn)',       doc: '检查指定M代码是否存在\nCHKMN(98) → 1=存在' },
  { name: 'CHKSN',   sig: 'CHKSN(Snn)',       doc: '检查S代码\nCHKSN(1000)' },
  { name: 'CHKMT',   sig: 'CHKMT(Tnn)',       doc: '检查T代码\nCHKMT(5)' },
  { name: 'CHKINF',  sig: 'CHKINF(axis)',     doc: '检查轴信息\nCHKINF(X)' },
  { name: 'AXID',    sig: 'AXID("name")',     doc: '获取轴ID号\nAXID("X") → 0' },

  // ===== 堆栈 =====
  { name: 'PUSH',   sig: 'PUSH(value)',      doc: '将值压入堆栈\nPUSH(#1)' },
  { name: 'POP',    sig: 'POP()',            doc: '弹出堆栈顶端值\n#1 := POP()' },
  { name: 'STKTOP', sig: 'STKTOP()',         doc: '读取堆栈顶端值（不弹出）\n#1 := STKTOP()' },

  // ===== 刀具路径 =====
  { name: 'ARC',   sig: 'ARC(X, Y, I, J)',   doc: '绘制圆弧路径（仿真）\nARC(X, Y, I, J)\nI,J=圆心相对坐标' },
  { name: 'LINE',  sig: 'LINE(X, Y)',        doc: '绘制直线路径（仿真）\nLINE(X, Y)' },

  // ===== 其他 =====
  { name: 'BITAND',  sig: 'BITAND(a, b)',   doc: '按位与\nBITAND(5, 3) → 1' },
  { name: 'BITOR',   sig: 'BITOR(a, b)',    doc: '按位或\nBITOR(5, 3) → 7' },
  { name: 'BITXOR',  sig: 'BITXOR(a, b)',   doc: '按位异或\nBITXOR(5, 3) → 6' },
  { name: 'BITNOT',  sig: 'BITNOT(a)',      doc: '按位取反\nBITNOT(5)' },
  { name: 'INLIST',  sig: 'INLIST(val, a, b, c...)', doc: '检查值是否在列表中\nINLIST(#1, 1, 2, 3, 4, 5)' },
  { name: 'PI',      sig: 'PI()',           doc: '返回圆周率\nPI() → 3.14159...' },
  { name: 'DEG',     sig: 'DEG(rad)',        doc: '弧度转角度\nDEG(3.14159) → 180' },
  { name: 'RAD',     sig: 'RAD(deg)',        doc: '角度转弧度\nRAD(180) → 3.14159' },
  { name: 'MOD',     sig: 'MOD(a, b)',       doc: '取模（余数）\nMOD(10, 3) → 1' },
];