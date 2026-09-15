#!/usr/bin/env python
"""
=============================================================================
SISTEMA DRTC PUNO - SWITCH DE BASE DE DATOS MONGODB (LOCAL VS REMOTA)
=============================================================================
Permite alternar de forma inmediata entre el MongoDB Local y el Servidor Remoto
(mongodb://admin_user:ClaveSuperSegura2026!ok@161.132.52.69:27017/?authSource=admin)

Uso:
  python switch_db.py status   - Muestra el estado y latencia de ambas bases de datos
  python switch_db.py local    - Cambia el .env para usar MongoDB Local
  python switch_db.py remote   - Cambia el .env para usar MongoDB Remoto (161.132.52.69)
  python switch_db.py toggle   - Alterna entre Local y Remoto
  python switch_db.py sync     - Sincroniza las colecciones locales hacia el servidor remoto
  python switch_db.py          - Menú interactivo
=============================================================================
"""

import os
import sys
import time
import re
from pathlib import Path

# Configurar codificación UTF-8 para Windows CMD / PowerShell
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Credenciales y URLs predeterminadas
URL_LOCAL_DEFAULT = "mongodb://admin:admin123@localhost:27017/"
URL_REMOTE_DEFAULT = "mongodb://admin_user:ClaveSuperSegura2026!ok@161.132.52.69:27017/?authSource=admin"
DB_NAME_DEFAULT = "drtc_db"

def find_env_file() -> Path:
    """Localiza el archivo .env"""
    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir / ".env",
        current_dir.parent / ".env",
        Path(".env"),
        Path("backend/.env")
    ]
    for c in candidates:
        if c.is_file():
            return c
    # Si no existe, crear en current_dir
    return current_dir / ".env"

def read_env_status(env_path: Path):
    """Lee el estado actual configurado en el archivo .env"""
    target = "local"
    use_remote = False
    url_local = URL_LOCAL_DEFAULT
    url_remote = URL_REMOTE_DEFAULT
    db_name = DB_NAME_DEFAULT

    if env_path.is_file():
        content = env_path.read_text(encoding="utf-8")
        m_use_remote = re.search(r"^USE_REMOTE_DB\s*=\s*(.*)$", content, re.MULTILINE | re.IGNORECASE)
        m_target = re.search(r"^MONGODB_TARGET\s*=\s*(.*)$", content, re.MULTILINE | re.IGNORECASE)
        m_url_local = re.search(r"^MONGODB_URL_LOCAL\s*=\s*(.*)$", content, re.MULTILINE)
        m_url_remote = re.search(r"^MONGODB_URL_REMOTE\s*=\s*(.*)$", content, re.MULTILINE)
        m_db = re.search(r"^DATABASE_NAME\s*=\s*(.*)$", content, re.MULTILINE)

        if m_url_local:
            url_local = m_url_local.group(1).strip()
        if m_url_remote:
            url_remote = m_url_remote.group(1).strip()
        if m_db:
            db_name = m_db.group(1).strip()

        if m_use_remote and m_use_remote.group(1).strip().lower() in ("true", "1", "yes", "remote"):
            use_remote = True
            target = "remote"
        elif m_target and m_target.group(1).strip().lower() == "remote":
            use_remote = True
            target = "remote"

    return {
        "target": target,
        "use_remote": use_remote,
        "url_local": url_local,
        "url_remote": url_remote,
        "db_name": db_name,
        "env_path": env_path
    }

def set_env_target(env_path: Path, target: str):
    """Actualiza USE_REMOTE_DB y MONGODB_TARGET en el archivo .env"""
    target = target.strip().lower()
    is_remote = (target == "remote")

    if not env_path.is_file():
        content = ""
    else:
        content = env_path.read_text(encoding="utf-8")

    # Actualizar o agregar USE_REMOTE_DB
    if re.search(r"^USE_REMOTE_DB\s*=.*$", content, re.MULTILINE):
        content = re.sub(
            r"^USE_REMOTE_DB\s*=.*$",
            f"USE_REMOTE_DB={'true' if is_remote else 'false'}",
            content,
            flags=re.MULTILINE
        )
    else:
        content += f"\nUSE_REMOTE_DB={'true' if is_remote else 'false'}"

    # Actualizar o agregar MONGODB_TARGET
    if re.search(r"^MONGODB_TARGET\s*=.*$", content, re.MULTILINE):
        content = re.sub(
            r"^MONGODB_TARGET\s*=.*$",
            f"MONGODB_TARGET={target}",
            content,
            flags=re.MULTILINE
        )
    else:
        content += f"\nMONGODB_TARGET={target}"

    # Asegurar que MONGODB_URL_REMOTE esté definida
    if not re.search(r"^MONGODB_URL_REMOTE\s*=.*$", content, re.MULTILINE):
        content += f"\nMONGODB_URL_REMOTE={URL_REMOTE_DEFAULT}"

    # Asegurar que MONGODB_URL_LOCAL esté definida
    if not re.search(r"^MONGODB_URL_LOCAL\s*=.*$", content, re.MULTILINE):
        content += f"\nMONGODB_URL_LOCAL={URL_LOCAL_DEFAULT}"

    env_path.write_text(content, encoding="utf-8")

def mask_url(url: str) -> str:
    return re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', url)

def test_ping(url: str, db_name: str, timeout_ms: int = 4000):
    """Prueba conectividad y retorna latencia y colecciones"""
    try:
        from pymongo import MongoClient
        client = MongoClient(url, serverSelectionTimeoutMS=timeout_ms)
        start = time.time()
        client.admin.command('ping')
        latency = round((time.time() - start) * 1000, 2)
        cols = sorted(client[db_name].list_collection_names())
        client.close()
        return True, latency, cols, None
    except Exception as e:
        return False, None, [], str(e)

def show_status():
    env_path = find_env_file()
    cfg = read_env_status(env_path)

    print("\n" + "=" * 65)
    print(" 📡 ESTADO DE BASE DE DATOS MONGODB - SISTEMA DRTC PUNO")
    print("=" * 65)
    print(f" Archivo de configuración: {cfg['env_path']}")
    print(f" Base de datos activa según .env: [{cfg['target'].upper()}]")
    print(f" Nombre de base de datos: {cfg['db_name']}\n")

    print(" -------------------------------------------------------------")
    print(" 1. MONGODB LOCAL (localhost:27017)")
    print(f"    URL: {mask_url(cfg['url_local'])}")
    ok_loc, lat_loc, cols_loc, err_loc = test_ping(cfg['url_local'], cfg['db_name'], 3000)
    if ok_loc:
        active_badge = " [ACTIVA ACTUALMENTE]" if cfg['target'] == "local" else ""
        print(f"    Estado:  ONLINE ✅  (Latencia: {lat_loc} ms){active_badge}")
        print(f"    Colecciones ({len(cols_loc)}): {', '.join(cols_loc) if cols_loc else 'Ninguna'}")
    else:
        print(f"    Estado:  OFFLINE ❌  ({err_loc})")

    print("\n -------------------------------------------------------------")
    print(" 2. MONGODB REMOTO (Servidor 161.132.52.69)")
    print(f"    URL: {mask_url(cfg['url_remote'])}")
    ok_rem, lat_rem, cols_rem, err_rem = test_ping(cfg['url_remote'], cfg['db_name'], 5000)
    if ok_rem:
        active_badge = " [ACTIVA ACTUALMENTE]" if cfg['target'] == "remote" else ""
        print(f"    Estado:  ONLINE ✅  (Latencia: {lat_rem} ms){active_badge}")
        print(f"    Colecciones ({len(cols_rem)}): {', '.join(cols_rem) if cols_rem else 'Ninguna'}")
    else:
        print(f"    Estado:  OFFLINE ❌  ({err_rem})")

    print("=" * 65 + "\n")

def switch_to(target: str):
    target = target.lower().strip()
    if target not in ("local", "remote"):
        print("❌ Error: Target no válido. Usa 'local' o 'remote'.")
        return False

    env_path = find_env_file()
    set_env_target(env_path, target)

    print(f"\n✅ Configuración actualizada con éxito en: {env_path}")
    print(f"👉 Modo activo: [{target.upper()}]")
    if target == "remote":
        print("🌐 Conectando a Servidor Remoto (161.132.52.69:27017)")
    else:
        print("💻 Conectando a MongoDB Local (localhost:27017)")

    # Probar conexión al target elegido
    cfg = read_env_status(env_path)
    url = cfg['url_remote'] if target == "remote" else cfg['url_local']
    print(f"\nVerificando conexión con {mask_url(url)}...")
    ok, lat, cols, err = test_ping(url, cfg['db_name'])
    if ok:
        print(f"✅ ¡Conexión exitosa! Ping: {lat} ms | Colecciones disponibles: {len(cols)}")
    else:
        print(f"⚠️ Advertencia: No se pudo conectar inmediatamente: {err}")

    print("\n💡 Nota: Si el backend está ejecutándose con '--reload', los cambios se aplican automáticamente.")
    return True

def sync_local_to_remote():
    """Sincroniza datos de local a remoto"""
    print("\n" + "=" * 65)
    print(" 🔄 SINCRONIZACIÓN DE DATOS: MONGODB LOCAL ➜ MONGODB REMOTO")
    print("=" * 65)

    from pymongo import MongoClient
    env_path = find_env_file()
    cfg = read_env_status(env_path)

    try:
        print("Conectando a bases de datos...")
        c_loc = MongoClient(cfg['url_local'], serverSelectionTimeoutMS=4000)
        c_rem = MongoClient(cfg['url_remote'], serverSelectionTimeoutMS=8000)

        db_loc = c_loc[cfg['db_name']]
        db_rem = c_rem[cfg['db_name']]

        collections = db_loc.list_collection_names()
        if not collections:
            print("⚠️ No hay colecciones en la base de datos local para copiar.")
            return

        print(f"Colecciones encontradas en local ({len(collections)}): {', '.join(collections)}")
        confirm = input("\n¿Deseas clonar estas colecciones hacia el servidor remoto? (s/N): ").strip().lower()
        if confirm not in ("s", "si", "y", "yes"):
            print("Operación cancelada.")
            return

        total_transferred = 0
        for col_name in collections:
            docs = list(db_loc[col_name].find({}))
            count = len(docs)
            print(f" - Sincronizando '{col_name}' ({count} registros)...", end=" ")
            if count > 0:
                for doc in docs:
                    db_rem[col_name].replace_one({"_id": doc["_id"]}, doc, upsert=True)
            print("OK ✅")
            total_transferred += count

        c_loc.close()
        c_rem.close()
        print(f"\n🎉 ¡Sincronización completada! {total_transferred} documentos transferidos al servidor remoto.")
    except Exception as e:
        print(f"\n❌ Error durante la sincronización: {e}")

def interactive_menu():
    while True:
        env_path = find_env_file()
        cfg = read_env_status(env_path)
        current = cfg['target'].upper()

        print("\n" + "=" * 60)
        print(f" 🔀 SWITCH DE BASE DE DATOS MONGODB - SIRRET")
        print(f"    Entorno actual: [{current}]")
        print("=" * 60)
        print("  1. Cambiar a MongoDB REMOTO (161.132.52.69)")
        print("  2. Cambiar a MongoDB LOCAL  (localhost:27017)")
        print("  3. Ver estado detallado y probar conexiones")
        print("  4. Sincronizar datos (Copiar de Local a Remoto)")
        print("  5. Salir")
        print("=" * 60)
        choice = input(" Selecciona una opción (1-5): ").strip()

        if choice == "1":
            switch_to("remote")
        elif choice == "2":
            switch_to("local")
        elif choice == "3":
            show_status()
        elif choice == "4":
            sync_local_to_remote()
        elif choice in ("5", "q", "exit", ""):
            print("Hasta luego.")
            break
        else:
            print("Opción no válida. Intente nuevamente.")

def main():
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower().strip()
        if cmd in ("status", "info", "-s"):
            show_status()
        elif cmd in ("local", "loc", "-l"):
            switch_to("local")
        elif cmd in ("remote", "rem", "-r"):
            switch_to("remote")
        elif cmd in ("toggle", "t"):
            env_path = find_env_file()
            cfg = read_env_status(env_path)
            new_target = "remote" if cfg['target'] == "local" else "local"
            switch_to(new_target)
        elif cmd in ("sync", "copiar"):
            sync_local_to_remote()
        else:
            print(f"Comando '{cmd}' no reconocido. Usa: status | local | remote | toggle | sync")
    else:
        interactive_menu()

if __name__ == "__main__":
    main()
