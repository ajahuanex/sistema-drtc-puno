class BaseCustomException(Exception):
    """Excepción base personalizada"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class NotFoundError(BaseCustomException):
    """Excepción para recursos no encontrados"""
    pass

class ValidationError(BaseCustomException):
    """Excepción para errores de validación"""
    pass

class DuplicateError(BaseCustomException):
    """Excepción para recursos duplicados"""
    pass

class PermissionError(BaseCustomException):
    """Excepción para errores de permisos"""
    pass