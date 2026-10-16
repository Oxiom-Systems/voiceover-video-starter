"""Contract for the fixed per-repository scanner leaf; no live acceptance claim."""
import ast
from pathlib import Path
import re
import unittest
ROOT=Path(__file__).resolve().parents[1]
REPOSITORY='Oxiom-Systems/voiceover-video-starter'
REPOSITORY_ID=1304972867
LANGUAGES=['actions', 'javascript-typescript']
GROUP='ci-build-public-ephemeral'
class CodeQLContract(unittest.TestCase):
 def source(self):return (ROOT/'.github/workflows/ci-codeql-recipe.yml').read_text()
 def test_exact_owned_event_guard_including_protected_default_schedule(self):
  text=self.source();match=re.search(r'(?m)^    if: >-\n((?:      .*\n)+)',text);self.assertIsNotNone(match)
  guard=' '.join(x.strip() for x in match[1].splitlines())
  base={'github.repository':REPOSITORY,'github.repository_id':str(REPOSITORY_ID),'github.event_name':'push','github.ref_protected':True,'github.ref':'refs/heads/dev','github.event.repository.default_branch':'main','github.event.pull_request.head.repo.id':REPOSITORY_ID,'github.base_ref':'dev'}
  cases=[({},True),({'github.event_name':'workflow_dispatch'},True),({'github.event_name':'pull_request','github.ref':'refs/pull/1/merge'},True),({'github.event_name':'schedule','github.ref':'refs/heads/main'},True),({'github.event_name':'schedule'},False),({'github.event_name':'schedule','github.ref':'refs/heads/main','github.ref_protected':False},False),({'github.event_name':'schedule','github.ref':'refs/heads/main','github.event.repository.default_branch':'dev'},False),({'github.repository_id':'1'},False),({'github.repository':'fork/repo'},False),({'github.ref_protected':False},False),({'github.ref':'refs/heads/feature'},False),({'github.event_name':'pull_request','github.event.pull_request.head.repo.id':1},False),({'github.event_name':'pull_request','github.base_ref':'feature'},False),({'github.event_name':'pull_request_target'},False),({'github.event_name':'repository_dispatch'},False)]
  for changes,want in cases:
   with self.subTest(changes=changes):
    expression=guard
    for key,value in sorted({**base,**changes}.items(),key=lambda x:-len(x[0])):expression=expression.replace(key,repr(value))
    expression=expression.replace('&&',' and ').replace('||',' or ');expression=re.sub(r'\btrue\b','True',expression);expression=re.sub(r'\bfalse\b','False',expression)
    tree=ast.parse(expression.strip(),mode='eval')
    self.assertTrue(all(isinstance(n,(ast.Expression,ast.BoolOp,ast.And,ast.Or,ast.Compare,ast.Eq,ast.Constant,ast.Load)) for n in ast.walk(tree)))
    self.assertEqual(eval(compile(tree,'<actual-codeql-guard>','eval'),{'__builtins__':{}}),want)
 def test_canonical_language_inventory_default_queries_and_remote_model(self):
  text=self.source();match=re.search(r'(?m)^        language: (\[.*\])$',text);self.assertIsNotNone(match)
  self.assertEqual(ast.literal_eval(match[1]),LANGUAGES)
  self.assertIn('disable-default-queries: false',text);self.assertIn('threat-models: remote',text)
  self.assertNotIn('security-extended',text);self.assertNotIn('skip-queries:',text)
  self.assertIn('build-mode: '+('manual' if 'java-kotlin' in LANGUAGES else 'none'),text)
  if 'java-kotlin' in LANGUAGES:
   for value in ['python3 .github/ci/setup_android_toolchain.py','--max-workers=2','-Xmx1536m','MaxMetaspaceSize=512m',':phone:assembleRelease',':wear:assembleRelease',':phone:bundleRelease',':wear:bundleRelease']:self.assertIn(value,text)
 def test_static_route_pinned_actions_permissions_and_canary_default(self):
  text=self.source()
  self.assertIn('group: '+GROUP,text);self.assertIn('labels: [ci-linux-cpu-v1-r'+str(REPOSITORY_ID)+']',text)
  self.assertIn('persist-credentials: false',text);self.assertIn('ref: ${{ github.sha }}',text)
  for value in ['contents: read','actions: read','security-events: write','threads: 2','ram: 2048','type: boolean','default: false',"upload: ${{ inputs.upload_results && 'always' || 'never' }}",'upload-database: false']:self.assertIn(value,text)
  for forbidden in ['secrets:', 'secrets.', 'inherit','pull_request_target','repository_dispatch','packages:','id-token:','--privileged','docker.sock','ubuntu-latest']:self.assertNotIn(forbidden,text)
  for action in re.findall(r'uses: (\S+)',text):self.assertRegex(action,r'@[0-9a-f]{40}$')
  self.assertEqual(len(re.findall(r'uses: github/codeql-action/',text)),2)

 def test_thin_caller_immutable_pin_and_weekly_default_branch_contract(self):
  text=(ROOT/'.github/workflows/codeql.yml').read_text()
  self.assertIn('uses: Oxiom-Systems/voiceover-video-starter/.github/workflows/ci-codeql-recipe.yml@82be284bfcdf5c14a435c1e307d6c079fffe143b',text)
  self.assertIn('cron:',text);self.assertIn("branches: [main, dev]",text)
  self.assertIn('workflow_dispatch:',text);self.assertIn('pull_request:',text);self.assertIn('push:',text)
  self.assertIn('upload_results: false',text)
  for forbidden in ['secrets:', 'secrets.', 'inherit','pull_request_target','repository_dispatch','runs-on:','steps:']:self.assertNotIn(forbidden,text)
  pin=re.search(r'uses: (\S+)',text)[1]
  self.assertEqual(pin,'Oxiom-Systems/voiceover-video-starter/.github/workflows/ci-codeql-recipe.yml@82be284bfcdf5c14a435c1e307d6c079fffe143b')

if __name__=='__main__':unittest.main()
