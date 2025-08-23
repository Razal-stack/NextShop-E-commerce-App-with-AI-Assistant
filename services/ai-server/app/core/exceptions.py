"""
Custom exception classes for the AI server.
"""


class AIServerError(Exception):
    """Base exception class for AI server errors"""
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(message)


class ValidationError(AIServerError):
    """Raised when request validation fails"""
    pass


class ModelNotLoadedError(AIServerError):
    """Raised when a required model is not loaded"""
    pass


class ProcessingError(AIServerError):
    """Raised when processing fails"""
    pass


class ConfigurationError(AIServerError):
    """Raised when configuration is invalid"""
    pass


class ResourceError(AIServerError):
    """Raised when system resources are insufficient"""
    pass
