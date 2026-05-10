"""SYNTEC RemoteAPI Python SDK

A Python wrapper for the SYNTEC CNC RemoteAPI DLL.
Handles DLL signature discovery, return value conventions, and emulator limitations.

Usage:
    from remote_api import RemoteAPI, rv, rv1
    api = RemoteAPI()
    ret, pos_x = api.READ_machine_pos(0)
    print(f"X={rv1((ret, pos_x))}")

Emulator Known Limitations:
    READ_offset_*     -> returns -18
    READ_macro_scope  -> FormatException on non-numeric
    READ_nc_OPLog     -> missing OPLog_Fixed.dll
    READ_diskCFreeSpace -> returns -7
"""

from .remote_api import RemoteAPI
from .exceptions import RemoteAPIError, EmulatorNotSupportedError

__version__ = "1.0.0"
__all__ = ["RemoteAPI", "rv", "rv1", "RemoteAPIError", "EmulatorNotSupportedError"]
