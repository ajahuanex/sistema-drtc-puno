from fastapi import HTTPException, status
from typing import Any, Dict, Optional

class CustomHTTPException(HTTPException):
    """Excepción HTTP personalizada base"""
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

class EmpresaNotFoundException(HTTPException):
    def __init__(self, empresa_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Empresa con ID {empresa_id} no encontrada"
        )

class EmpresaAlreadyExistsException(HTTPException):
    def __init__(self, ruc: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una empresa con RUC {ruc}"
        )

class VehiculoNotFoundException(CustomHTTPException):
    """Excepción cuando no se encuentra un vehículo"""
    def __init__(self, vehiculo_id: str):
        super().__init__(
            status_code=404,
            detail=f"Vehículo con ID {vehiculo_id} no encontrado"
        )

class VehiculoAlreadyExistsException(CustomHTTPException):
    """Excepción cuando ya existe un vehículo con la misma placa"""
    def __init__(self, placa: str):
        super().__init__(
            status_code=409,
            detail=f"Ya existe un vehículo con placa {placa}"
        )

class RutaNotFoundException(CustomHTTPException):
    """Excepción cuando no se encuentra una ruta"""
    def __init__(self, ruta_id: str):
        super().__init__(
            status_code=404,
            detail=f"Ruta con ID {ruta_id} no encontrada"
        )

class RutaAlreadyExistsException(CustomHTTPException):
    """Excepción cuando ya existe una ruta con el mismo código"""
    def __init__(self, codigo: str):
        super().__init__(
            status_code=409,
            detail=f"Ya existe una ruta con código {codigo}"
        )

class ResolucionNotFoundException(CustomHTTPException):
    """Excepción cuando no se encuentra una resolución"""
    def __init__(self, resolucion_id: str):
        super().__init__(
            status_code=404,
            detail=f"Resolución con ID {resolucion_id} no encontrada"
        )

class ResolucionAlreadyExistsException(CustomHTTPException):
    """Excepción cuando ya existe una resolución con el mismo número"""
    def __init__(self, numero: str):
        super().__init__(
            status_code=409,
            detail=f"Ya existe una resolución con número {numero}"
        )

class TucNotFoundException(CustomHTTPException):
    """Excepción cuando no se encuentra un TUC"""
    def __init__(self, tuc_id: str):
        super().__init__(
            status_code=404,
            detail=f"TUC con ID {tuc_id} no encontrado"
        )

class TucAlreadyExistsException(CustomHTTPException):
    """Excepción cuando ya existe un TUC con el mismo número"""
    def __init__(self, numero: str):
        super().__init__(
            status_code=409,
            detail=f"Ya existe un TUC con número {numero}"
        )

class UsuarioNotFoundException(CustomHTTPException):
    """Excepción cuando no se encuentra un usuario"""
    def __init__(self, usuario_id: str):
        super().__init__(
            status_code=404,
            detail=f"Usuario con ID {usuario_id} no encontrado"
        )

class UsuarioAlreadyExistsException(CustomHTTPException):
    """Excepción cuando ya existe un usuario con el mismo DNI o email"""
    def __init__(self, field: str, value: str):
        super().__init__(
            status_code=409,
            detail=f"Ya existe un usuario con {field} {value}"
        )

class ValidationErrorException(HTTPException):
    def __init__(self, campo: str, mensaje: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error de validación en {campo}: {mensaje}"
        )

class AuthenticationException(CustomHTTPException):
    """Excepción de autenticación"""
    def __init__(self, message: str = "Credenciales inválidas"):
        super().__init__(
            status_code=401,
            detail=message
        )

class TucInvalidException(CustomHTTPException):
    """Excepción cuando un TUC no es válido"""
    def __init__(self, nro_tuc: str, reason: str):
        super().__init__(
            status_code=400,
            detail=f"TUC {nro_tuc} no válido: {reason}"
        )

class SunatValidationError(HTTPException):
    def __init__(self, ruc: str, error: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error al validar RUC {ruc} con SUNAT: {error}"
        )

class DocumentoVencidoException(HTTPException):
    def __init__(self, documento_tipo: str, fecha_vencimiento: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Documento {documento_tipo} vencido el {fecha_vencimiento}"
        )

class ScoreRiesgoAltoException(HTTPException):
    def __init__(self, score: int):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Score de riesgo demasiado alto ({score}/100). Se requiere revisión manual."
        )

class AuditoriaException(HTTPException):
    def __init__(self, mensaje: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en auditoría: {mensaje}"
        )

class NotificacionException(HTTPException):
    def __init__(self, mensaje: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear notificación: {mensaje}"
        ) 