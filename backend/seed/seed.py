"""One-command seed runner for LexIndo labor law corpus.

Loads regulations from labor_law_seed.json, creates records in SQLite,
establishes the BP3 amendment chain (UU 13/2003 Pasal 59 -> UU Cipta Kerja Pasal 59),
and indexes all Pasal chunks into ChromaDB.
"""
import os
import sys
import json

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models.regulation import Regulation, RegulationType, RegulationStatus
from app.models.pasal_chunk import PasalChunk, ChunkStatus
from app.services.vector_store import upsert_pasal_chunks_batch, get_pasal_collection

SEED_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "labor_law_seed.json")


def run_seed():
    print("=== LexIndo Labor Law Corpus Seed Runner ===", flush=True)

    if not os.path.exists(SEED_JSON_PATH):
        print(f"Error: Seed file not found at {SEED_JSON_PATH}", flush=True)
        return

    with open(SEED_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Reset ChromaDB collection for clean seed
        try:
            coll = get_pasal_collection()
            # Delete all documents in collection
            all_ids = coll.get()["ids"]
            if all_ids:
                coll.delete(ids=all_ids)
            print(f"[OK] ChromaDB collection reset ({len(all_ids)} old chunks cleared)", flush=True)
        except Exception as e:
            print(f"[NOTE] ChromaDB reset info: {e}", flush=True)

        # Clear existing regulations in SQLite
        db.query(PasalChunk).delete()
        db.query(Regulation).delete()
        db.commit()
        print("[OK] SQLite regulations and pasal_chunks tables cleared", flush=True)

        # Map temporary keys to created PasalChunk models
        key_to_chunk: dict[str, PasalChunk] = {}
        pending_amendments: list[tuple[PasalChunk, str]] = []

        all_chroma_ids = []
        all_chroma_texts = []
        all_chroma_metas = []

        for reg_data in data.get("regulations", []):
            reg = Regulation(
                reg_type=RegulationType(reg_data["reg_type"]),
                number=str(reg_data["number"]),
                year=int(reg_data["year"]),
                title=reg_data["title"],
                status=RegulationStatus(reg_data.get("status", "berlaku")),
                source_url=reg_data.get("source_url"),
            )
            db.add(reg)
            db.flush()

            for p_data in reg_data.get("pasals", []):
                chunk = PasalChunk(
                    regulation_id=reg.id,
                    bab=p_data.get("bab"),
                    pasal=str(p_data["pasal"]),
                    ayat=str(p_data.get("ayat", "1")),
                    text=p_data["text"],
                    status=ChunkStatus(p_data.get("status", "berlaku")),
                )
                db.add(chunk)
                db.flush()

                cid = f"chunk_{chunk.id}"
                chunk.chroma_id = cid

                # Check if this chunk is keyed for amendment references
                if "key" in p_data:
                    key_to_chunk[p_data["key"]] = chunk

                # Check if this chunk is amended by another
                if "amended_by_key" in p_data:
                    pending_amendments.append((chunk, p_data["amended_by_key"]))

                # Prepare ChromaDB payload
                label = f"{reg.short_name} Pasal {chunk.pasal}"
                if chunk.ayat:
                    label += f" ayat ({chunk.ayat})"

                all_chroma_ids.append(cid)
                all_chroma_texts.append(chunk.text)
                all_chroma_metas.append({
                    "chunk_id": chunk.id,
                    "regulation_id": reg.id,
                    "reg_type": reg.reg_type.value,
                    "number": reg.number,
                    "year": reg.year,
                    "title": reg.title,
                    "bab": chunk.bab or "",
                    "pasal": chunk.pasal,
                    "ayat": chunk.ayat or "",
                    "status": chunk.status.value,
                    "citation_label": label,
                })

            print(f"[OK] Inserted: {reg.short_name} - {reg.title[:45]}...", flush=True)

        # Link BP3 Amendment chains
        for original_chunk, amending_key in pending_amendments:
            target_chunk = key_to_chunk.get(amending_key)
            if target_chunk:
                original_chunk.amended_by_id = target_chunk.id
                print(
                    f"[OK] Linked BP3 Amendment: Pasal {original_chunk.pasal} "
                    f"-> Diubah oleh Pasal {target_chunk.pasal} (ID: {target_chunk.id})",
                    flush=True,
                )

        db.commit()

        # Index all chunks into ChromaDB
        if all_chroma_ids:
            upsert_pasal_chunks_batch(all_chroma_ids, all_chroma_texts, all_chroma_metas)
            print(f"[OK] Indexed {len(all_chroma_ids)} Pasal chunks into ChromaDB vector store", flush=True)

        print("\nSEED COMPLETED SUCCESSFULLY! [OK]", flush=True)

    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
