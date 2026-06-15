# ========================================
# UTILIDADES PARA VALIDACIÓN BINARIA
# ========================================
# Formato: 3 bits (XXX)
# Bit 0 (001): RUC validado
# Bit 1 (010): Resolución validada
# Bit 2 (100): Localidades validadas
#
# Ejemplos:
# "000" = ninguna validación
# "001" = solo RUC validado
# "010" = solo Resolución validada
# "100" = solo Localidades validadas
# "011" = RUC + Resolución validados
# "101" = RUC + Localidades validados
# "110" = Resolución + Localidades validados
# "111" = todas validadas
# ========================================

class ValidacionBinaria:
    """Clase para manejar la validación binaria de rutas"""
    
    # Constantes de bits
    BIT_RUC = 0           # Bit 0 (001)
    BIT_RESOLUCION = 1    # Bit 1 (010)
    BIT_LOCALIDADES = 2   # Bit 2 (100)
    
    # Valores de bits
    VALOR_RUC = 1          # 001
    VALOR_RESOLUCION = 2   # 010
    VALOR_LOCALIDADES = 4  # 100
    
    @staticmethod
    def crear_binaria(ruc_validado: bool = False, 
                      resolucion_validada: bool = False, 
                      localidades_validadas: bool = False) -> str:
        """Crear una cadena binaria a partir de los estados individuales"""
        valor = 0
        
        if ruc_validado:
            valor |= ValidacionBinaria.VALOR_RUC
        
        if resolucion_validada:
            valor |= ValidacionBinaria.VALOR_RESOLUCION
        
        if localidades_validadas:
            valor |= ValidacionBinaria.VALOR_LOCALIDADES
        
        return format(valor, '03b')  # Formato de 3 bits con ceros a la izquierda
    
    @staticmethod
    def validar_ruc(validacion_binaria: str) -> bool:
        """Verificar si RUC está validado"""
        try:
            valor = int(validacion_binaria, 2)
            return bool(valor & ValidacionBinaria.VALOR_RUC)
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def validar_resolucion(validacion_binaria: str) -> bool:
        """Verificar si Resolución está validada"""
        try:
            valor = int(validacion_binaria, 2)
            return bool(valor & ValidacionBinaria.VALOR_RESOLUCION)
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def validar_localidades(validacion_binaria: str) -> bool:
        """Verificar si Localidades están validadas"""
        try:
            valor = int(validacion_binaria, 2)
            return bool(valor & ValidacionBinaria.VALOR_LOCALIDADES)
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def todas_validadas(validacion_binaria: str) -> bool:
        """Verificar si todas las validaciones están completas (111)"""
        return validacion_binaria == "111"
    
    @staticmethod
    def establecer_ruc(validacion_binaria: str, validado: bool = True) -> str:
        """Establecer el estado del RUC en la validación binaria"""
        valor = int(validacion_binaria, 2) if validacion_binaria else 0
        
        if validado:
            valor |= ValidacionBinaria.VALOR_RUC
        else:
            valor &= ~ValidacionBinaria.VALOR_RUC
        
        return format(valor, '03b')
    
    @staticmethod
    def establecer_resolucion(validacion_binaria: str, validado: bool = True) -> str:
        """Establecer el estado de la Resolución en la validación binaria"""
        valor = int(validacion_binaria, 2) if validacion_binaria else 0
        
        if validado:
            valor |= ValidacionBinaria.VALOR_RESOLUCION
        else:
            valor &= ~ValidacionBinaria.VALOR_RESOLUCION
        
        return format(valor, '03b')
    
    @staticmethod
    def establecer_localidades(validacion_binaria: str, validado: bool = True) -> str:
        """Establecer el estado de Localidades en la validación binaria"""
        valor = int(validacion_binaria, 2) if validacion_binaria else 0
        
        if validado:
            valor |= ValidacionBinaria.VALOR_LOCALIDADES
        else:
            valor &= ~ValidacionBinaria.VALOR_LOCALIDADES
        
        return format(valor, '03b')
    
    @staticmethod
    def obtener_descripcion(validacion_binaria: str) -> dict:
        """Obtener descripción legible del estado de validación"""
        return {
            "binario": validacion_binaria,
            "decimal": int(validacion_binaria, 2) if validacion_binaria else 0,
            "ruc_validado": ValidacionBinaria.validar_ruc(validacion_binaria),
            "resolucion_validada": ValidacionBinaria.validar_resolucion(validacion_binaria),
            "localidades_validadas": ValidacionBinaria.validar_localidades(validacion_binaria),
            "todas_validadas": ValidacionBinaria.todas_validadas(validacion_binaria),
            "descripcion": ValidacionBinaria._generar_descripcion_texto(validacion_binaria)
        }
    
    @staticmethod
    def _generar_descripcion_texto(validacion_binaria: str) -> str:
        """Generar descripción en texto del estado de validación"""
        validaciones = []
        
        if ValidacionBinaria.validar_ruc(validacion_binaria):
            validaciones.append("RUC")
        
        if ValidacionBinaria.validar_resolucion(validacion_binaria):
            validaciones.append("Resolución")
        
        if ValidacionBinaria.validar_localidades(validacion_binaria):
            validaciones.append("Localidades")
        
        if not validaciones:
            return "Pendiente de validar"
        elif len(validaciones) == 3:
            return "Todas validadas"
        else:
            return f"Validadas: {', '.join(validaciones)}"


# Ejemplos de uso:
# crear_binaria(True, True, False) -> "011" (RUC + Resolución)
# validar_ruc("011") -> True
# validar_localidades("011") -> False
# todas_validadas("111") -> True
# establecer_localidades("011", True) -> "111"
# obtener_descripcion("011") -> {"binario": "011", "ruc_validado": True, ...}
