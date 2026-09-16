import asyncio
import sys
import os
import traceback
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.dependencies.db import get_database
from backend.app.services.resolucion_primigenia_service import ResolucionPrimigeniaService

async def main():
    try:
        db = await get_database()
        svc = ResolucionPrimigeniaService(db)
        res = await svc.get_resoluciones_by_ruc('20322008261')
        print(res)
    except Exception as e:
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
