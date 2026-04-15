from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List

from config import ANALYSIS_HISTORY_LIMIT, DATABASE_PATH


def _get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True, sort_keys=True)


def _json_loads(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def init_storage() -> None:
    Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)

    with _get_connection() as connection:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                analysis_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                media_type TEXT NOT NULL,
                filename TEXT NOT NULL,
                content_type TEXT NOT NULL,
                label TEXT NOT NULL,
                confidence REAL NOT NULL,
                processing_ms INTEGER,
                fake_score REAL,
                real_score REAL,
                file_size_bytes INTEGER,
                file_sha256 TEXT,
                result_json TEXT NOT NULL,
                report_json TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_analyses_created_at
            ON analyses (created_at DESC)
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_analyses_label
            ON analyses (label)
            """
        )


def get_storage_status() -> Dict[str, Any]:
    try:
        init_storage()
        with _get_connection() as connection:
            row = connection.execute("SELECT COUNT(*) AS total FROM analyses").fetchone()
        return {
            "ready": True,
            "engine": "sqlite",
            "database_path": str(DATABASE_PATH),
            "history_limit": ANALYSIS_HISTORY_LIMIT,
            "stored_analyses": int(row["total"]) if row else 0,
        }
    except Exception as exc:
        return {
            "ready": False,
            "engine": "sqlite",
            "database_path": str(DATABASE_PATH),
            "history_limit": ANALYSIS_HISTORY_LIMIT,
            "error": str(exc),
        }


def save_analysis(
    result: Dict[str, Any],
    *,
    file_size_bytes: int,
    file_sha256: str,
) -> None:
    analysis_id = str(result.get("analysis_id") or "").strip()
    if not analysis_id:
        raise ValueError("Analysis result is missing analysis_id")

    scores = result.get("scores") or {}
    with _get_connection() as connection:
        connection.execute(
            """
            INSERT OR REPLACE INTO analyses (
                analysis_id,
                created_at,
                media_type,
                filename,
                content_type,
                label,
                confidence,
                processing_ms,
                fake_score,
                real_score,
                file_size_bytes,
                file_sha256,
                result_json,
                report_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                result.get("created_at"),
                result.get("media_type"),
                result.get("filename"),
                result.get("content_type") or "application/octet-stream",
                result.get("label"),
                float(result.get("confidence") or 0.0),
                result.get("processing_ms"),
                float(scores.get("fake") or 0.0),
                float(scores.get("real") or 0.0),
                int(file_size_bytes),
                file_sha256,
                _json_dumps(result),
                _json_dumps(result.get("report")) if result.get("report") is not None else None,
            ),
        )


def _row_to_history_item(row: sqlite3.Row) -> Dict[str, Any]:
    payload = _json_loads(row["result_json"], {})
    return {
        "id": row["analysis_id"],
        "file_name": row["filename"],
        "file_type": row["content_type"],
        "file_size_bytes": int(row["file_size_bytes"] or 0),
        "file_sha256": row["file_sha256"],
        "media_type": row["media_type"],
        "timestamp": row["created_at"],
        "result": row["label"],
        "confidence": round(float(row["confidence"]) * 100, 2),
        "payload": payload,
    }


def list_analyses(limit: int | None = None) -> List[Dict[str, Any]]:
    resolved_limit = max(1, min(limit or ANALYSIS_HISTORY_LIMIT, ANALYSIS_HISTORY_LIMIT))
    with _get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                analysis_id,
                created_at,
                media_type,
                filename,
                content_type,
                label,
                confidence,
                file_size_bytes,
                file_sha256,
                result_json
            FROM analyses
            ORDER BY created_at DESC, analysis_id DESC
            LIMIT ?
            """,
            (resolved_limit,),
        ).fetchall()
    return [_row_to_history_item(row) for row in rows]


def get_analysis(analysis_id: str) -> Dict[str, Any] | None:
    with _get_connection() as connection:
        row = connection.execute(
            """
            SELECT
                analysis_id,
                created_at,
                media_type,
                filename,
                content_type,
                label,
                confidence,
                file_size_bytes,
                file_sha256,
                result_json
            FROM analyses
            WHERE analysis_id = ?
            """,
            (analysis_id,),
        ).fetchone()
    if row is None:
        return None
    return _row_to_history_item(row)


def delete_analysis(analysis_id: str) -> bool:
    with _get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM analyses WHERE analysis_id = ?",
            (analysis_id,),
        )
    return cursor.rowcount > 0
