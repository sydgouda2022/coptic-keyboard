"""Recoverable release publication for the flat four-file Git source layout.

A filesystem cannot atomically replace four unrelated file paths. This module
stages + fsyncs all assets, saves verified backups, installs a durable recovery
journal, replaces MANIFEST LAST, and restores the old complete generation
following any regular error. If the process is killed/power is lost, call
recover_release() (or the CLI --recover) before other release operations.

Readers of unpackaged working trees must verify the manifest+payload pair;
Git commits and deployed packages are atomic at the repository version level.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil

ASSETS = ("lexicon.json", "coverage.json", "lexicon.sqlite3", "manifest.json")
JOURNAL = ".publish-journal"


def _hash(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as src:
        for chunk in iter(lambda: src.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _sync_directory(directory: Path) -> None:
    if os.name == "nt":
        return  # Windows doesn't support opening directories with os.open reliably.
    fd = os.open(directory, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def _copy_synced(src: Path, dest: Path) -> None:
    with src.open("rb") as inp, dest.open("wb") as out:
        shutil.copyfileobj(inp, out)
        out.flush()
        os.fsync(out.fileno())


def _replace_from(src: Path, dest: Path) -> None:
    # Recovery must remain repeatable even after a second hard interruption.
    temp = dest.with_name(dest.name + ".restore-tmp")
    _copy_synced(src, temp)
    os.replace(temp, dest)
    _sync_directory(dest.parent)


def recover_release(target: Path) -> bool:
    """Restore a complete previous release if a journal indicates interruption.

    The absence of a marker means publication never started and live files
    were never touched. A missing/corrupt marked backup is a hard error.
    """
    target = Path(target)
    journal = target / JOURNAL
    if not journal.exists():
        return False
    marker = journal / "recovery.json"
    if not marker.is_file():
        shutil.rmtree(journal)  # Only staging, no live replacement yet.
        return True
    meta = json.loads(marker.read_text("utf8"))
    if meta.get("schema") != 1 or set(meta.get("backup", {})) != set(ASSETS):
        raise ValueError("Invalid release recovery journal; manual review required")
    # Validate all backups before touching any live file.
    for name in ASSETS:
        previous = journal / "backup" / name
        if not previous.is_file() or _hash(previous) != meta["backup"][name]:
            raise ValueError("Release rollback backup missing/corrupt: " + name)
    for name in ASSETS:
        _replace_from(journal / "backup" / name, target / name)
    shutil.rmtree(journal)
    _sync_directory(target)
    return True


def publish_release(generated: Path, target: Path, on_replace=None) -> None:
    """Publish a validated generation with rollback + power-loss recovery.

    on_replace is test-only injection after each live replacement.
    """
    generated, target = Path(generated), Path(target)
    if generated.resolve() == target.resolve():
        raise ValueError("Refusing to publish a directory over itself")
    if (target / JOURNAL).exists():
        raise ValueError("Unrecovered publication exists: run --recover first")
    for name in ASSETS:
        if not (generated / name).is_file() or not (target / name).is_file():
            raise FileNotFoundError("Missing old/new release asset: " + name)
    journal = target / JOURNAL
    journal.mkdir()
    try:
        (journal / "backup").mkdir()
        (journal / "stage").mkdir()
        backup, staged = {}, {}
        for name in ASSETS:
            _copy_synced(target / name, journal / "backup" / name)
            _copy_synced(generated / name, journal / "stage" / name)
            backup[name] = _hash(journal / "backup" / name)
            staged[name] = _hash(journal / "stage" / name)
            if staged[name] != _hash(generated / name):
                raise IOError("Staged asset digest mismatch: " + name)
        _sync_directory(journal / "backup")
        _sync_directory(journal / "stage")
        marker = journal / "recovery.json"
        pending = journal / "recovery.tmp"
        _copy_json({"schema": 1, "backup": backup}, pending)
        os.replace(pending, marker)
        _sync_directory(journal)
        _sync_directory(target)
        # Manifest is installed LAST so its hash identifies the intended
        # current generation. Readers still validate the corresponding bytes.
        for step, name in enumerate(ASSETS):
            os.replace(journal / "stage" / name, target / name)
            _sync_directory(target)
            if on_replace:
                on_replace(step, name)
        for name in ASSETS:
            if _hash(target / name) != staged[name]:
                raise IOError("Published file differs from staging: " + name)
        shutil.rmtree(journal)
        _sync_directory(target)
    except Exception:
        # Regular I/O failures immediately restore the last complete release.
        # Hard process termination leaves the journal for explicit recovery.
        recover_release(target)
        raise


def _copy_json(document: dict, destination: Path) -> None:
    raw = (json.dumps(document, sort_keys=True, separators=(",", ":")) + "\n").encode()
    with destination.open("wb") as out:
        out.write(raw)
        out.flush()
        os.fsync(out.fileno())
