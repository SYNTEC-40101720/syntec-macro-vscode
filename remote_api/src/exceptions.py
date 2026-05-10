"""RemoteAPI exceptions."""

class RemoteAPIError(Exception):
    """Base exception for all RemoteAPI errors."""
    pass

class EmulatorNotSupportedError(RemoteAPIError):
    """Raised when an API call is not supported by the emulator."""
    pass

class APICallError(RemoteAPIError):
    """Raised when an API call returns a non-zero return code."""
    def __init__(self, method: str, ret: int, message: str = ""):
        self.method = method
        self.ret = ret
        super().__init__(
            f"{method} returned {ret}" + (f": {message}" if message else "")
        )
