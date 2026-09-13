class SystemError(Exception):
    """Base system error"""
    pass

class WorldGenerationError(SystemError):
    """World generation failure"""
    pass

class ValidationError(SystemError):
    """Intent validation failure"""
    pass

class PersistenceError(SystemError):
    """Persistence operation failure"""
    pass

class LLMError(SystemError):
    """LLM processing failure"""
    pass
