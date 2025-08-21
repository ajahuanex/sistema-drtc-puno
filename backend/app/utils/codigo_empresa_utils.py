import re
from typing import List, Optional
from app.models.empresa import TipoEmpresa

class CodigoEmpresaUtils:
    """Utilidades para manejo de códigos de empresa"""
    
    @staticmethod
    def validar_formato_codigo(codigo: str) -> bool:
        """
        Valida que el código tenga el formato correcto: 4 dígitos + 3 letras
        Ejemplo: 0123PRT
        """
        if not codigo or len(codigo) != 7:
            return False
        
        # Verificar que los primeros 4 caracteres sean dígitos
        digitos = codigo[:4]
        if not digitos.isdigit():
            return False
        
        # Verificar que los últimos 3 caracteres sean letras válidas
        letras = codigo[4:].upper()
        letras_validas = [TipoEmpresa.PERSONAS, TipoEmpresa.REGIONAL, TipoEmpresa.TURISMO]
        
        # Verificar que las letras estén en el orden correcto y sean válidas
        if len(letras) != 3:
            return False
        
        # Verificar que las letras sean únicas y estén en el orden correcto
        letras_unicas = set(letras)
        if len(letras_unicas) != 3:
            return False
        
        # Verificar que todas las letras sean válidas
        for letra in letras:
            if letra not in letras_validas:
                return False
        
        return True
    
    @staticmethod
    def generar_codigo_empresa(numero_secuencial: int, tipos_empresa: List[TipoEmpresa]) -> str:
        """
        Genera un código de empresa basado en un número secuencial y los tipos de empresa
        
        Args:
            numero_secuencial: Número secuencial de 4 dígitos (1-9999)
            tipos_empresa: Lista de tipos de empresa (máximo 3)
        
        Returns:
            Código de empresa en formato 4 dígitos + 3 letras
        """
        if numero_secuencial < 1 or numero_secuencial > 9999:
            raise ValueError("El número secuencial debe estar entre 1 y 9999")
        
        if len(tipos_empresa) > 3:
            raise ValueError("No se pueden especificar más de 3 tipos de empresa")
        
        # Formatear el número secuencial a 4 dígitos
        numero_formateado = f"{numero_secuencial:04d}"
        
        # Generar las letras basadas en los tipos de empresa
        letras = []
        for tipo in tipos_empresa:
            letras.append(tipo.value)
        
        # Si no se especificaron 3 tipos, completar con tipos por defecto
        tipos_disponibles = [TipoEmpresa.PERSONAS, TipoEmpresa.REGIONAL, TipoEmpresa.TURISMO]
        for tipo in tipos_disponibles:
            if tipo not in tipos_empresa and len(letras) < 3:
                letras.append(tipo.value)
        
        # Asegurar que tengamos exactamente 3 letras
        while len(letras) < 3:
            letras.append(TipoEmpresa.PERSONAS.value)
        
        # Combinar número y letras
        codigo = numero_formateado + ''.join(letras[:3])
        
        return codigo
    
    @staticmethod
    def generar_codigo_empresa_simple(numero_secuencial: int) -> str:
        """
        Genera un código de empresa simple con el formato estándar PRT
        """
        return CodigoEmpresaUtils.generar_codigo_empresa(
            numero_secuencial, 
            [TipoEmpresa.PERSONAS, TipoEmpresa.REGIONAL, TipoEmpresa.TURISMO]
        )
    
    @staticmethod
    def extraer_informacion_codigo(codigo: str) -> dict:
        """
        Extrae información del código de empresa
        
        Returns:
            Diccionario con número secuencial y tipos de empresa
        """
        if not CodigoEmpresaUtils.validar_formato_codigo(codigo):
            raise ValueError("Formato de código inválido")
        
        numero_secuencial = int(codigo[:4])
        letras = codigo[4:].upper()
        
        tipos_empresa = []
        for letra in letras:
            if letra == TipoEmpresa.PERSONAS.value:
                tipos_empresa.append(TipoEmpresa.PERSONAS)
            elif letra == TipoEmpresa.REGIONAL.value:
                tipos_empresa.append(TipoEmpresa.REGIONAL)
            elif letra == TipoEmpresa.TURISMO.value:
                tipos_empresa.append(TipoEmpresa.TURISMO)
        
        return {
            "numero_secuencial": numero_secuencial,
            "tipos_empresa": tipos_empresa,
            "codigo_completo": codigo
        }
    
    @staticmethod
    def obtener_descripcion_tipos(tipos: List[TipoEmpresa]) -> str:
        """
        Obtiene la descripción legible de los tipos de empresa
        """
        descripciones = {
            TipoEmpresa.PERSONAS: "Personas",
            TipoEmpresa.REGIONAL: "Regional", 
            TipoEmpresa.TURISMO: "Turismo"
        }
        
        return ", ".join([descripciones[tipo] for tipo in tipos])
    
    @staticmethod
    def generar_siguiente_codigo_disponible(codigos_existentes: List[str]) -> str:
        """
        Genera el siguiente código disponible basado en los códigos existentes
        
        Args:
            codigos_existentes: Lista de códigos ya existentes
        
        Returns:
            Siguiente código disponible
        """
        if not codigos_existentes:
            return "0001PRT"
        
        # Extraer números secuenciales existentes
        numeros_existentes = []
        for codigo in codigos_existentes:
            if CodigoEmpresaUtils.validar_formato_codigo(codigo):
                numero = int(codigo[:4])
                numeros_existentes.append(numero)
        
        if not numeros_existentes:
            return "0001PRT"
        
        # Encontrar el siguiente número disponible
        siguiente_numero = max(numeros_existentes) + 1
        
        # Si excede 9999, reiniciar desde 1
        if siguiente_numero > 9999:
            siguiente_numero = 1
        
        return CodigoEmpresaUtils.generar_codigo_empresa_simple(siguiente_numero)
