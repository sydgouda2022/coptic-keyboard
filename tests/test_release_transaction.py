"""Filesystem failure/kill recovery for the four release artifacts."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from release_transaction import ASSETS,JOURNAL,publish_release,recover_release


def create_release(directory, label):
    directory.mkdir(parents=True,exist_ok=True)
    for name in ASSETS:
        (directory/name).write_bytes((label+":"+name).encode("utf8"))


def digests(directory):
    return {name:hashlib.sha256((directory/name).read_bytes()).hexdigest()
            for name in ASSETS}


class PublishRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root=Path(self.temp.name)
        self.old,self.new=root/"release",root/"generated"
        create_release(self.old,"old")
        create_release(self.new,"new")
        self.original=digests(self.old)
        self.replacement=digests(self.new)

    def test_successful_publication_installs_all_new_assets_and_removes_journal(self):
        publish_release(self.new,self.old)
        self.assertEqual(digests(self.old),self.replacement)
        self.assertFalse((self.old/JOURNAL).exists())
        self.assertFalse(recover_release(self.old))

    def test_each_interrupted_swap_rolls_back_every_asset(self):
        for failure_at in range(len(ASSETS)):
            # Restore fixture before next failing publication.
            for name in ASSETS:
                (self.old/name).write_bytes(("old:"+name).encode("utf8"))
            def fail_after(step,name):
                if step==failure_at:
                    raise OSError("Injected disk error after "+name)
            with self.assertRaisesRegex(OSError,"Injected disk error"):
                publish_release(self.new,self.old,on_replace=fail_after)
            self.assertEqual(digests(self.old),self.original)
            self.assertFalse((self.old/JOURNAL).exists())

    def test_hard_process_termination_leaves_recoverable_journal(self):
        def interrupted(step,name):
            if step==1:
                raise KeyboardInterrupt("Simulated SIGKILL after live file swap")
        with self.assertRaises(KeyboardInterrupt):
            publish_release(self.new,self.old,on_replace=interrupted)
        self.assertTrue((self.old/JOURNAL/"recovery.json").exists())
        self.assertNotEqual(digests(self.old),self.original)
        self.assertTrue(recover_release(self.old))
        self.assertEqual(digests(self.old),self.original)
        self.assertFalse(recover_release(self.old))

    def test_recovery_fails_closed_if_any_backup_is_corrupted(self):
        def interrupted(step,name):
            if step==0:
                raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):
            publish_release(self.new,self.old,on_replace=interrupted)
        previous=self.old/JOURNAL/"backup"/"manifest.json"
        valid=previous.read_bytes()
        previous.write_bytes(b"tampered")
        with self.assertRaisesRegex(ValueError,"rollback backup"):
            recover_release(self.old)
        self.assertTrue((self.old/JOURNAL).exists())
        previous.write_bytes(valid)
        self.assertTrue(recover_release(self.old))
        self.assertEqual(digests(self.old),self.original)

    def test_incomplete_staging_does_not_touch_live_release(self):
        staging=self.old/JOURNAL
        staging.mkdir()
        (staging/"recovery.tmp").write_text("incomplete marker")
        self.assertTrue(recover_release(self.old))
        self.assertEqual(digests(self.old),self.original)
        self.assertFalse(staging.exists())

    def test_missing_assets_or_self_publishing_does_not_replace_live_release(self):
        with self.assertRaises(ValueError):
            publish_release(self.old,self.old)
        (self.new/"lexicon.sqlite3").unlink()
        with self.assertRaises(FileNotFoundError):
            publish_release(self.new,self.old)
        self.assertEqual(digests(self.old),self.original)
        self.assertFalse((self.old/JOURNAL).exists())


if __name__=="__main__":
    unittest.main()
