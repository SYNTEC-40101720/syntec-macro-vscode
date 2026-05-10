# Syntec RemoteAPI 技术备忘

## DLL 签名问题

实际 DLL 签名与官方文档不符，需通过反射探测真实参数数量。
- 例：READ_nc_pointer 是 1 参数而非文档说的 6 参数

## 返回值约定

- READ_* 方法返回 tuple: `(ret, out1, out2, ...)`
- WRITE/CTRL_* 方法返回 int
- 辅助函数：`rv(r)` 提取返回值，`rv1(r)` 提取第一个 out 参数

## 仿真器已知限制

| 方法 | 限制 |
|------|------|
| READ_offset_* | 返回 -18（控制器不支持） |
| READ_macro_scope | 对非数值宏变量抛 FormatException |
| READ_nc_OPLog | 缺少 OPLog_Fixed.dll |
| READ_diskCFreeSpace | 返回 -7 |

## Python.NET 互操作

Python float 可直接传入 .NET Double ByRef 参数，Python.NET 自动转换，无需手动包装。
