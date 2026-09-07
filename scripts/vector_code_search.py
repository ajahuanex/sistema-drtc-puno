#!/usr/bin/env python3
"""
Buscador Vectorial de Código Semántico (Ahorrador de Tokens).
Uso:
  python scripts/vector_code_search.py "renovación resoluciones backend"
"""

import sys
import json
import re
import math
from pathlib import Path
from typing import List, Dict, Any

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = WORKSPACE_ROOT / ".vector_cache"
INDEX_FILE = CACHE_DIR / "code_index.json"

def tokenize(text: str) -> List[str]:
    words = re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*', text.lower())
    return [w for w in words if len(w) > 2]

def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    intersection = set(vec1.keys()) & set(vec2.keys())
    if not intersection:
        return 0.0
    
    dot_product = sum(vec1[x] * vec2[x] for x in intersection)
    mag1 = math.sqrt(sum(val ** 2 for val in vec1.values()))
    mag2 = math.sqrt(sum(val ** 2 for val in vec2.values()))
    
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)

def search(query: str, top_k: int = 5):
    if not INDEX_FILE.exists():
        print("[ERROR] El indice vectorial no existe. Ejecuta primero:")
        print("   python scripts/vector_code_indexer.py")
        sys.exit(1)
        
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    chunks = data.get("chunks", [])
    query_tokens = tokenize(query)
    
    if not query_tokens:
        print("[WARN] Consulta demasiado corta o sin terminos de busqueda validos.")
        return

    # Crear vector de la consulta
    query_vector = {}
    for t in query_tokens:
        query_vector[t] = query_vector.get(t, 0) + 1.0

    scores = []
    for chunk in chunks:
        vec = chunk.get("vector", {})
        score = cosine_similarity(query_vector, vec)
        
        # Bonificación si coincide en el nombre de archivo o símbolo
        file_path = chunk["file_path"].lower()
        symbol = chunk["symbol"].lower()
        for q in query_tokens:
            if q in file_path:
                score += 0.35
            if q in symbol:
                score += 0.45
                
        if score > 0.05:
            scores.append((score, chunk))

    scores.sort(key=lambda x: x[0], reverse=True)
    results = scores[:top_k]

    print(f"\n=========================================================")
    print(f" [BUSQUEDA VECTORIAL] RESULTADOS PARA: '{query}'")
    print(f" Total de fragmentos evaluados: {len(chunks)}")
    print(f" Mostrando los {len(results)} fragmentos mas relevantes:")
    print(f"=========================================================\n")

    if not results:
        print("No se encontraron resultados coincidentes con la consulta semantica.")
        return

    for rank, (score, chunk) in enumerate(results, start=1):
        print(f"--- #{rank} [Relevancia: {round(score, 3)}] ---")
        print(f"[FILE] file:///{WORKSPACE_ROOT.as_posix()}/{chunk['file_path']}#L{chunk['start_line']}-L{chunk['end_line']}")
        print(f"[SYMBOL] {chunk['symbol']}")
        print(f"---------------------------------------------------------")
        # Mostrar el contenido formateado
        lines = chunk['content'].split('\n')
        preview = lines[:25] # Mostrar hasta 25 líneas por fragmento para no saturar
        preview_text = "\n".join(preview)
        safe_preview = preview_text.encode('ascii', errors='replace').decode('ascii')
        print(safe_preview)
        if len(lines) > 25:
            print(f"... ({len(lines) - 25} lineas adicionales omitidas para ahorrar tokens)")
        print("\n")



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python scripts/vector_code_search.py <consulta_o_característica>")
        print("Ejemplo: python scripts/vector_code_search.py \"renovacion resolucion empresa\"")
        sys.exit(0)

    query_str = " ".join(sys.argv[1:])
    search(query_str)
