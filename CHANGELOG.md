## [1.3.4] - 2025-04-15

### 新增
- 支持 `.nc` 文件类型

### 改进
- README 精简：只保留功能列表和文件类型，去掉安装/调试/配置/快捷键/参考文档

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
