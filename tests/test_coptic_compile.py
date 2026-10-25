import json,sqlite3,tempfile,unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"src"))
from compile_lexica import build_coptic

class Tests(unittest.TestCase):
    def test_coptic_dialects_and_homographs(self):
      with tempfile.TemporaryDirectory() as tmp:
       t=Path(tmp);tei=t/'lex.xml';tei.write_text('''<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body>
    <entry xml:id="C1"><form xml:id="F1"><usg type="geo">S</usg><orth>ⲡⲉ</orth></form><form xml:id="F2"><usg type="geo">B</usg><orth>ⲡⲉ</orth></form></entry>
    <entry xml:id="C2"><form xml:id="F3"><usg type="geo">A</usg><orth>ⲟⲩ</orth></form></entry>
    </body></text></TEI>''')
       original=t/'orig.json';original.write_text(json.dumps({'dialects':['Sahidic','Bohairic'],'rows':[['ⲁⲛ',1],['ⲡⲉ',1],['ϭⲱ',2]]},ensure_ascii=False))
       extra=t/'pop.json';extra.write_text(json.dumps({'rows':[['ⲡⲉ',15],['ⲫⲱ',7]]},ensure_ascii=False))
       r=build_coptic(tei,original,extra,t/'result')
       self.assertEqual(r['tei_lemmas'],2)
       p=json.loads((t/'result/lexicon.json').read_text())
       got=dict(p['rows']);self.assertEqual(got['ⲡⲉ'],3)
       self.assertEqual(got['ⲟⲩ'],0)
       self.assertEqual(got['ⲫⲱ'],0)
       self.assertEqual(p['popularity']['ⲡⲉ'],15)
       db=sqlite3.connect(t/'result/lexicon.sqlite3')
       self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0],'ok')

if __name__=="__main__":unittest.main()
