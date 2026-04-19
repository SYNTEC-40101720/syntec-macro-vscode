## [1.3.6] - 2026-04-19

### 规范修正（依据控制器实测）

**GOTO 语法修正**
- `GOTO 100;`（不带 N）而非 `GOTO N100;`
- `GOTO #变量;` 变量必须是整数
- N 标签格式：`N100;` 才合法，`N100:` 和裸 `N100` 都报错

**移除不支持功能**
- `INT()` 函数不支持（从补全列表移除）
- `ELSIF` 关键字不存在（控制器实测报错）
- `[]` 不能用于运算，仅限间接定值和特定函数
- `NOT` 只能对整数使用

**修复中文乱码**
- 重写 validator.js，修复所有 UTF-8 编码问题

---

## [1.3.5] - 2026-04-17

### 规范对齐（依据 MACRO开发应用手册）

**新增关键字支持**
- 替代关键字（不带下划线）：`ENDIF` / `ENDFOR` / `ENDWHILE` / `ENDCASE` / `ENDREPEAT`
- `ELSIF`（IF 分支关键字）
- `EXIT`（跳出循环块）

**新增诊断规则**
- `%@MACRO` 文件头检查：第一行非注释且为裸 `%`（非 `%@MACRO`）时报 warning
- `GOTO` 标签验证：引用目标 `Nxxx` 不存在时报 warning（支持 `GOTO N数字` 和 `GOTO #变量` 两种形式）
- N标签行格式：`N数字;` 或 `N数字:`（同行含 `GOTO Nxx` 时不误判为标签）

**架构改进**
- `getKeywordPositions` 改用下划线占位法解决 `ENDREPEAT`/`REPEAT` 子串冲突
- EXIT 跳出循环时标记嵌套 IF 为 `exited`，避免误报未闭合

### 文档
- 新增 `MACRO开发应用手册.md` 和 `Macro变数规格.md`（用户提供的完整参考手册）

## [1.3.4] - 2026-04-17

### 新增
- 支持 `.nc` 文件类型
- 新增 validator 单元测试（51个测试用例）

### Bug 修复
- `MSG("END_IF")` 字符串内的关键字被误报
- 嵌套块缺少 END 时内层 warning 被吞掉
- `ELSE` 后接 `ELSEIF` 时误匹配
- 相邻多个 CJK 字符报多条重复 error

---

## [1.3.3] - 2025-04-15

### 新增
- **中文字符诊断**：代码中的中文标点（；：，。等）和中文字符报错，注释和字符串内不报错

---

## [1.3.2] - 2025-04-15

### Bug 修复
- **颜色装饰器**：禁用 syntec-macro 语言的 VSCode 内置颜色预览（`#201` 等变量不再显示 RGB 色块）

---

## [1.3.1] - 2025-04-15

### Bug 修复
- **CASE ELSE 误报**：`CASE ... OF ... ELSE ... END_CASE` 中的 ELSE 不再报"没有匹配的 IF"（ELSE 现在正确匹配最近的 IF 或 CASE 块）
- **ELSEIF 约束**：ELSEIF 仍然只匹配 IF，不会错误匹配 CASE 块

---

## [1.3.0] - 2025-04-15

### Bug 修复
- **诊断误报**：重写 validator.js 块匹配逻辑，修复 IF/ELSEIF/ELSE 嵌套场景下 ELSEIF/ELSE 孤立误报（根因：BLOCK_KEYWORDS 反向查找 bug，END_IF 作为 key 查找返回 undefined）
- **变量高亮**：修复 `#321` 等多位数变量高亮异常（grammar pattern 交替顺序：`#\\[...\\]` → `#[1-9]\\d*` → `#[A-Za-z_]...`）

### 重构
- 项目目录重组：`src/` `syntaxes/` `snippets/` `build/` `data/` `dist/`

---

## [1.2.0]

### 新增功能
- **智能补全**：60+ 内置函数列表，含参数签名
- **Hover 文档**：悬停函数名/G/M代码，显示说明与示例
- **GOTO 跳转**：Ctrl+点击 N标签跳转；G65 P123 跳转宏程序文件
- **实时语法诊断**：IF/END_IF/FOR/WHILE/CASE 块匹配检查，括号配对检查
- **Outline 大纲**：N标签行自动出现在符号导航中

### 架构
- 新增 src/functions.js、src/keywords.js、src/validator.js、extension.js

---

## [1.1.0]
- 完整语法高亮（TextMate grammar）
- 40个代码片段
- 文件关联与自动缩进配置
