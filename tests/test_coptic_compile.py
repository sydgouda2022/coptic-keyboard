import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from compile_lexica import build_coptic
from publish_compiled_coptic import publish


class SourceBuildTests(unittest.TestCase):
    def fixtures(self, base):
        tei=base/'coptic.xml'
        tei.write_text('''<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body>
          <entry xml:id="L1"><form xml:id="F1"><usg type="geo">S</usg>
            <orth>ⲡⲉ</orth></form><form xml:id="F2"><usg type="geo">B</usg>
            <orth>ⲡⲉ</orth></form></entry>
          <entry xml:id="L2"><form xml:id="F3"><usg type="geo">S</usg>
            <orth>ⲡⲉ</orth></form></entry>
          <entry xml:id="L3"><form xml:id="F4"><usg type="geo">A</usg>
            <orth>*ⲟⲩ</orth></form></entry>
          </body></text></TEI>''',encoding='utf8')
        forms=base/'forms.json'
        forms.write_text(json.dumps({'schema':1,'dialects':['Sahidic','Bohairic'],
          'rows':[['ⲡⲉ',3],['ϭⲱ',2]]},ensure_ascii=False))
        popular=base/'popular.json'
        popular.write_text(json.dumps({'schema':1,'rows':[['ⲡⲉ',15],['ⲫⲱ',7]]},ensure_ascii=False))
        return tei,forms,popular

    def test_compiler_preserves_homographs_without_spurious_unlinked_lemmas(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);inputs=self.fixtures(base);out=base/'release'
            report=build_coptic(*inputs,out)
            manifest=publish(out)
            self.assertEqual(report['unique_written_forms'],4)
            self.assertEqual(manifest['spelling_records'],4)
            payload=json.loads((out/'lexicon.json').read_text())
            self.assertEqual(dict(payload['rows'])['ⲡⲉ'],3)
            with sqlite3.connect(out/'lexicon.sqlite3') as db:
                self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0],'ok')
                self.assertEqual(db.execute("SELECT COUNT(*) FROM spelling WHERE native_form='ⲡⲉ'").fetchone()[0],2)
                self.assertEqual(db.execute("SELECT COUNT(*) FROM spelling WHERE lemma_id LIKE 'unlinked:%' AND native_form='ⲡⲉ'").fetchone()[0],0)
                self.assertEqual(db.execute("SELECT COUNT(*) FROM prediction_surface").fetchone()[0],4)
                self.assertEqual(db.execute("SELECT editorial_notation FROM prediction_surface WHERE native_form='*ⲟⲩ'").fetchone()[0],1)
                self.assertEqual(db.execute('PRAGMA foreign_key_check').fetchall(),[])
            self.assertIn('sqlite_sha256',manifest)

    def test_bad_source_mask_fails_instead_of_silently_dropping_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);tei,forms,popular=self.fixtures(base)
            j=json.loads(forms.read_text());j['rows'][0][1]=9
            forms.write_text(json.dumps(j,ensure_ascii=False))
            with self.assertRaisesRegex(ValueError,'dialect mask'):
                build_coptic(tei,forms,popular,base/'release')

    def test_sqlite_json_drift_is_rejected_by_publisher(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);inputs=self.fixtures(base);out=base/'release'
            build_coptic(*inputs,out)
            j=json.loads((out/'lexicon.json').read_text());j['rows'][0][1]=0
            (out/'lexicon.json').write_text(json.dumps(j,ensure_ascii=False))
            with self.assertRaisesRegex(ValueError,'differs'):
                publish(out)


if __name__=='__main__':
    unittest.main()
