"""
SQLite-backed term storage for the backend API.

Provides CRUD operations for translation terms (terminology pairs).
"""

import sqlite3
import json
import csv
import io
import os
from datetime import datetime, timezone
from typing import List, Dict

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'terms.db')


def _ensure_db_dir():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_connection() -> sqlite3.Connection:
    _ensure_db_dir()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS terms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            target TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    ''')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_terms_source ON terms(source)')
    conn.commit()
    return conn


def get_all_terms() -> List[Dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            'SELECT id, source, target, created_at, updated_at FROM terms ORDER BY id DESC'
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def add_term(source: str, target: str) -> Dict:
    source = source[:1000]
    target = target[:1000]
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cur = conn.execute(
            'INSERT INTO terms (source, target, created_at, updated_at) VALUES (?, ?, ?, ?)',
            (source, target, now, now),
        )
        conn.commit()
        return {
            'id': cur.lastrowid,
            'source': source,
            'target': target,
            'created_at': now,
            'updated_at': now,
        }
    finally:
        conn.close()


def update_term(term_id: int, source: str, target: str) -> bool:
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cur = conn.execute(
            'UPDATE terms SET source=?, target=?, updated_at=? WHERE id=?',
            (source, target, now, term_id),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def delete_term(term_id: int) -> bool:
    conn = get_connection()
    try:
        cur = conn.execute('DELETE FROM terms WHERE id=?', (term_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def import_terms_csv(csv_content: str) -> int:
    """Import terms from CSV. Expects columns: source, target. Returns count imported."""
    reader = csv.DictReader(io.StringIO(csv_content))
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).isoformat()
        count = 0
        for row in reader:
            src = row.get('source', '').strip()
            tgt = row.get('target', '').strip()
            if src and tgt:
                conn.execute(
                    'INSERT INTO terms (source, target, created_at, updated_at) VALUES (?, ?, ?, ?)',
                    (src, tgt, now, now),
                )
                count += 1
        conn.commit()
        return count
    finally:
        conn.close()


def import_terms_json(json_content: str) -> int:
    """Import terms from JSON array of {source, target}. Returns count imported."""
    items = json.loads(json_content)
    if not isinstance(items, list):
        return 0
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).isoformat()
        count = 0
        for item in items:
            src = item.get('source', '').strip()
            tgt = item.get('target', '').strip()
            if src and tgt:
                conn.execute(
                    'INSERT INTO terms (source, target, created_at, updated_at) VALUES (?, ?, ?, ?)',
                    (src, tgt, now, now),
                )
                count += 1
        conn.commit()
        return count
    finally:
        conn.close()


def correct_term(term_id: int, old_target: str, new_target: str) -> bool:
    """Correct a term's target translation (only if current target matches old_target)."""
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cur = conn.execute(
            'UPDATE terms SET target=?, updated_at=? WHERE id=? AND target=?',
            (new_target, now, term_id, old_target),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()
