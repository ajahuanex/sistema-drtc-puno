#!/usr/bin/env python3
"""
Script para generar la función _crear_ruta_desde_datos correcta
"""

function_code = '''    async def _crear_ruta_desde_datos(self, ruta_data: Dict[str, Any]) -> Any:
        """Crear una ruta desde los datos procesados del Excel"""
        try:
            print(f"🔍 DEBUG: INICIANDO _crear_ruta_desde_datos para RUC {ruta_data['ruc']}")
            from app.services.ruta_service import RutaService
            
            # DEBUG: Logging detallado
            print(f"🔍 DEBUG: Buscando empresa con RUC: '{ruta_data['ruc']}'")
            print(f"🔍 DEBUG: Tipo de RUC: {type(ruta_data['ruc'])}")
            print(f"🔍 DEBUG: Longitud del RUC: {len(ruta_data['ruc'])}")
            
            # Buscar empresa por RUC
            empresa = await self.empresas_collection.find_one({
                "ruc": ruta_data['ruc'],
                "estaActivo": True
            })
            
            print(f"🔍 DEBUG: Resultado búsqueda empresa: {empresa is not None}")
            if empresa:
                print(f"🔍 DEBUG: Empresa encontrada - ID: {empresa.get('_id')}, RUC: {empresa.get('ruc')}")
            else:
                print(f"🔍 DEBUG: Empresa no encontrada")
            
            if not empresa:
                raise Exception(f"Empresa con RUC {ruta_data['ruc']} no encontrada o inactiva")
            
            # Buscar resolución por número
            resolucion = await self.resoluciones_collection.find_one({
                "nroResolucion": ruta_data['resolucionNormalizada'],
                "tipoResolucion": "PADRE",
                "estado": "VIGENTE",
                "estaActivo": True
            })
            
            print(f"🔍 DEBUG: Resultado búsqueda resolución: {resolucion is not None}")
            if not resolucion:
                raise Exception(f"Resolución {ruta_data['resolucionNormalizada']} no encontrada, no es PADRE o no está VIGENTE")
            
            # Buscar o crear localidades
            origen_localidad = await self._buscar_o_crear_localidad(ruta_data['origen'])
            destino_localidad = await self._buscar_o_crear_localidad(ruta_data['destino'])
            
            origen_embebido = LocalidadEmbebida(
                id=str(origen_localidad["_id"]),
                nombre=origen_localidad["nombre"]
            )
            
            destino_embebido = LocalidadEmbebida(
                id=str(destino_localidad["_id"]),
                nombre=destino_localidad["nombre"]
            )
            
            # Crear empresa embebida
            print(f"🔍 DEBUG: Creando EmpresaEmbebida...")
            razon_social_principal = "Sin razón social"
            if 'razonSocial' in empresa:
                if isinstance(empresa['razonSocial'], dict):
                    razon_social_principal = empresa['razonSocial'].get('principal', 'Sin razón social')
                else:
                    razon_social_principal = str(empresa['razonSocial'])
            
            empresa_embebida = EmpresaEmbebida(
                id=str(empresa["_id"]),
                ruc=empresa["ruc"],
                razonSocial=razon_social_principal
            )
            print(f"🔍 DEBUG: EmpresaEmbebida creada exitosamente")
            
            resolucion_embebida = ResolucionEmbebida(
                id=str(resolucion["_id"]),
                nroResolucion=resolucion["nroResolucion"],
                tipoResolucion=resolucion["tipoResolucion"],
                estado=resolucion["estado"]
            )
            
            # Crear frecuencia
            frecuencia = FrecuenciaServicio(
                tipo=TipoFrecuencia.DIARIO,
                cantidad=1,
                dias=[],
                descripcion=ruta_data['frecuencia']
            )
            
            # Crear modelo de ruta
            ruta_create = RutaCreate(
                codigoRuta=ruta_data['codigoRuta'],
                nombre=ruta_data['itinerario'],
                origen=origen_embebido,
                destino=destino_embebido,
                itinerario=[],
                empresa=empresa_embebida,
                resolucion=resolucion_embebida,
                frecuencia=frecuencia,
                horarios=[],
                tipoRuta=TipoRuta(ruta_data.get('tipoRuta', 'INTERREGIONAL')),
                tipoServicio=TipoServicio(ruta_data.get('tipoServicio', 'PASAJEROS')),
                distancia=ruta_data.get('distancia'),
                tiempoEstimado=ruta_data.get('tiempoEstimado'),
                tarifaBase=ruta_data.get('tarifaBase'),
                capacidadMaxima=ruta_data.get('capacidadMaxima'),
                restricciones=[],
                observaciones=ruta_data.get('observaciones'),
                descripcion=ruta_data['itinerario']
            )
            
            # Usar el servicio de rutas para crear
            ruta_service = RutaService(self.db)
            print(f"🔍 DEBUG: Llamando a ruta_service.create_ruta...")
            resultado = await ruta_service.create_ruta(ruta_create)
            print(f"🔍 DEBUG: Ruta creada exitosamente con ID: {resultado.id}")
            return resultado
            
        except Exception as e:
            print(f"❌ ERROR en _crear_ruta_desde_datos: {str(e)}")
            print(f"❌ ERROR tipo: {type(e)}")
            import traceback
            print(f"❌ ERROR traceback: {traceback.format_exc()}")
            raise e'''

print("Función _crear_ruta_desde_datos corregida:")
print("=" * 60)
print(function_code)
print("=" * 60)
print("Copia esta función y reemplaza la que está rota en el archivo.")