import httpx
import re

urls = [
    "https://docs.google.com/spreadsheets/d/1der6W_h03DvqDvTruthU_4vcK9fihDk-cBCFkb-FqcQ",
    "https://docs.google.com/spreadsheets/d/1VAY3H0-J0xUYpbKhWczGeBPTNk2ME0SrOfGa_U2v" # Check if valid
]

for url in urls:
    print(f"\n--- Probando URL: {url} ---")
    try:
        # Descargar HTML para ver las pestañas (gids)
        resp = httpx.get(url, follow_redirects=True, timeout=15.0)
        print(f"HTML Status: {resp.status_code}")
        # Buscar gids y nombres de hojas en el HTML
        gids = re.findall(r'sheetId["\s:]+([0-9]+)', resp.text)
        sheet_names = re.findall(r'name["\s:]+"([^"]+)"', resp.text)
        print(f"GIDs encontrados en HTML: {set(gids)}")
        
        # Probar gid=0
        csv_url_0 = f"{url}/export?format=csv&gid=0"
        r0 = httpx.get(csv_url_0, follow_redirects=True, timeout=15.0)
        lines_0 = len(r0.text.splitlines())
        print(f"  gid=0 líneas: {lines_0}")

        # Probar gids encontrados
        for g in set(gids):
            if g != '0':
                csv_url_g = f"{url}/export?format=csv&gid={g}"
                rg = httpx.get(csv_url_g, follow_redirects=True, timeout=15.0)
                lines_g = len(rg.text.splitlines())
                print(f"  gid={g} líneas: {lines_g}")
    except Exception as e:
        print(f"Error: {e}")
