"""Vector Store service — manages ChromaDB client, collections, and embeddings for Pasal chunks."""
import os
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings

COLLECTION_NAME = "lexindo_pasals"

# Hybrid embedding function supporting Gemini API, SentenceTransformer, or offline fallback.
class LexIndoEmbeddingFunction(chromadb.EmbeddingFunction):
    """Hybrid embedding function:
    1. If EMBEDDING_PROVIDER == 'gemini' and GEMINI_API_KEY present: uses Google text-embedding-004.
    2. If EMBEDDING_PROVIDER == 'sentence-transformers' or fallback: uses SentenceTransformer model.
    3. If none available or offline: uses deterministic 384-dim normalized term/n-gram embeddings.
    """
    def __init__(self, provider: str = settings.EMBEDDING_PROVIDER, model_name: str = settings.EMBEDDING_MODEL):
        self.provider = provider
        self.model_name = model_name
        self.gemini_model = settings.GEMINI_EMBEDDING_MODEL
        self._st_model = None
        self._st_attempted = False
        self._gemini_warned = False

    def _embed_gemini(self, docs: chromadb.Documents) -> Optional[chromadb.Embeddings]:
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() in ("", "your-gemini-api-key-here"):
            return None
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            embeddings: List[List[float]] = []
            chunk_size = 50
            for i in range(0, len(docs), chunk_size):
                batch = docs[i:i + chunk_size]
                res = genai.embed_content(
                    model=self.gemini_model,
                    content=batch,
                    task_type="retrieval_document",
                )
                if isinstance(res, dict) and "embedding" in res:
                    emb = res["embedding"]
                    if emb and isinstance(emb[0], (int, float)):
                        embeddings.append(emb)
                    else:
                        embeddings.extend(emb)
            if len(embeddings) == len(docs):
                return embeddings
        except Exception as e:
            if not self._gemini_warned:
                self._gemini_warned = True
                print(f"[LexIndoEmbedding] Gemini embedding notice: {e}. Falling back to secondary provider.", flush=True)
            return None
        return None

    def _get_st_model(self):
        if not self._st_attempted:
            self._st_attempted = True
            try:
                from sentence_transformers import SentenceTransformer
                self._st_model = SentenceTransformer(self.model_name)
            except Exception:
                self._st_model = None
        return self._st_model

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        # 1. Try Gemini provider if selected
        if self.provider == "gemini":
            gemini_embs = self._embed_gemini(input)
            if gemini_embs is not None:
                return gemini_embs

        # 2. Try SentenceTransformer if selected or as secondary
        if self.provider in ("sentence-transformers", "gemini"):
            model = self._get_st_model()
            if model is not None:
                prefixed = [f"passage: {doc}" for doc in input]
                embeddings = model.encode(prefixed, normalize_embeddings=True)
                return embeddings.tolist()

        # 3. Offline deterministic vector fallback: 384-dimensional normalized bag-of-ngrams
        dim = 384
        result: List[List[float]] = []
        for doc in input:
            vec = np.zeros(dim, dtype=np.float32)
            words = doc.lower().split()
            if not words:
                words = ["empty"]
            for word in words:
                h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
                idx = h % dim
                sign = 1.0 if (h >> 1) & 1 else -1.0
                vec[idx] += sign

            for i in range(len(doc) - 2):
                ngram = doc[i:i+3].lower()
                h = int(hashlib.sha256(ngram.encode("utf-8")).hexdigest(), 16)
                idx = h % dim
                sign = 1.0 if (h >> 1) & 1 else -1.0
                vec[idx] += 0.5 * sign

            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            result.append(vec.tolist())

        return result


_client: Optional[chromadb.ClientAPI] = None
_embedding_fn = LexIndoEmbeddingFunction()


def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        os.makedirs(settings.CHROMA_PATH, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=settings.CHROMA_PATH,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_pasal_collection() -> chromadb.Collection:
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=_embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )


def upsert_pasal_chunk(
    chunk_id: str,
    text: str,
    metadata: Dict[str, Any],
) -> None:
    """Upsert a single Pasal chunk into ChromaDB."""
    collection = get_pasal_collection()
    # Flatten metadata for ChromaDB compatibility (string, int, float, bool only)
    cleaned_meta = {}
    for k, v in metadata.items():
        if v is not None:
            cleaned_meta[k] = str(v) if not isinstance(v, (int, float, bool)) else v

    collection.upsert(
        ids=[chunk_id],
        documents=[text],
        metadatas=[cleaned_meta],
    )


def upsert_pasal_chunks_batch(
    chunk_ids: List[str],
    texts: List[str],
    metadatas: List[Dict[str, Any]],
) -> None:
    """Batch upsert Pasal chunks into ChromaDB."""
    if not chunk_ids:
        return
    collection = get_pasal_collection()
    cleaned_metas = []
    for meta in metadatas:
        cm = {}
        for k, v in meta.items():
            if v is not None:
                cm[k] = str(v) if not isinstance(v, (int, float, bool)) else v
        cleaned_metas.append(cm)

    collection.upsert(
        ids=chunk_ids,
        documents=texts,
        metadatas=cleaned_metas,
    )


def delete_regulation_chunks(regulation_id: int) -> None:
    """Remove all indexed chunks belonging to a regulation."""
    collection = get_pasal_collection()
    try:
        collection.delete(where={"regulation_id": regulation_id})
    except Exception:
        pass


def query_pasals(
    query_text: str,
    top_k: int = 5,
    where: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Query ChromaDB for relevant Pasal chunks."""
    collection = get_pasal_collection()
    results = collection.query(
        query_texts=[query_text],
        n_results=top_k,
        where=where,
    )

    items = []
    if not results or not results.get("ids") or not results["ids"][0]:
        return items

    ids = results["ids"][0]
    docs = results["documents"][0]
    metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(ids)
    distances = results["distances"][0] if results.get("distances") else [0.0] * len(ids)

    for chunk_id, doc, meta, dist in zip(ids, docs, metas, distances):
        # In cosine distance space: distance = 1 - cosine_similarity
        # similarity = 1 - distance
        similarity = max(0.0, min(1.0, 1.0 - dist))
        items.append({
            "chroma_id": chunk_id,
            "text": doc,
            "metadata": meta,
            "distance": dist,
            "similarity": similarity,
        })

    return items

