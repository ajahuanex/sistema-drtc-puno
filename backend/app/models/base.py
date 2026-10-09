"""
Modelo Base con configuración para serialización dual (snake_case en Python y camelCase en JSON)
Compatible con Pydantic v2 y FastAPI.
"""
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """
    Modelo base que genera automáticamente alias camelCase a partir de atributos snake_case,
    permitiendo la interoperabilidad transparente entre el frontend Angular (camelCase)
    y el backend Python (snake_case).
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True
    )


class MongoCamelModel(CamelModel):
    """
    Modelo base extendido para colecciones de MongoDB.
    Provee soporte automático para _id e id.
    """
    id: Optional[str] = Field(None, alias="_id")

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True
    )
