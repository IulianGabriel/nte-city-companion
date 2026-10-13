import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {boundary,CHINA_PRESET,detectServer,DAY} from '../public/reset.js';
import {translate,preferredLanguage} from '../public/i18n.js';
import {parseSheet} from '../public/feed.js';
import {awardXP} from '../public/xp.js';

test('China daily, Beyond the Rails, and midnight racing use distinct exact UTC boundaries',()=>{
 const s={...CHINA_PRESET,server:'china'},now=Date.parse('2026-10-13T12:00:00Z');
 assert.equal(boundary('daily',s,now).next,Date.parse('2026-10-13T21:00:00Z'));
 assert.equal(boundary('biweekly',s,now).next,Date.parse('2026-10-15T21:00:00Z'));
 const season=boundary('season',s,now),next=Date.parse('2026-10-31T16:00:00Z');
 assert.equal(season.next,next);assert.equal(boundary('season',s,next).next,next+60*DAY);
 const ledger={},task={id:'nte-012345678901234567890123',cycle:'season'};
 assert.equal(awardXP(ledger,task,s,now),200);assert.equal(awardXP(ledger,task,s,next-1),0);
 assert.equal(awardXP(ledger,task,s,next),200);
 assert.equal(boundary('once',s,now).next,null);
});

test('legacy racing schedules keep the daily reset time and location does not force China',()=>{
 const s={server:'asia',resetTime:'05:00',weekDay:1,biAnchor:'2026-10-08',seasonAnchor:'2026-11-01'};
 assert.deepEqual(boundary('season',s,Date.parse('2026-10-13')),boundary('season',{...s,seasonResetTime:''},Date.parse('2026-10-13')));
 assert.equal(boundary('season',s,Date.parse('2026-10-13')).next,Date.parse('2026-10-31T21:00:00Z'));
 assert.equal(detectServer('Asia/Shanghai',8),'asia');
});

test('language preference is independent of server, reversible, and preserves unknown new content',()=>{
 assert.equal(preferredLanguage(null,['zh-CN','en']),'zh-CN');
 assert.equal(preferredLanguage('en',['zh-CN']),'en');
 assert.equal(preferredLanguage('zh-CN',['en-US']),'zh-CN');
 assert.equal(translate('Daily','zh-CN'),'每日');assert.equal(translate('Daily','en'),'Daily');
 assert.equal(translate(' A new future activity ','zh-CN'),' A new future activity ');
 assert.equal(translate('Complete Beyond The Rails','zh-CN'),'完成：轨外之境');
 assert.equal(translate('Hit Citizens For Wallets (4x times per day)','zh-CN'),'击打市民拾取钱包（每天4次）');
 assert.equal(translate('24d 12:30:00','zh-CN'),'24天 12:30:00');
});

test('every current activity has Chinese presentation copy without modifying sheet identities',async()=>{
 const seed=JSON.parse(fs.readFileSync('public/tasks.json','utf8'));
 const tasks=await parseSheet(fs.readFileSync('tests/fixtures/current.csv','utf8'),seed),original=structuredClone(tasks);
 for(const task of tasks)assert.notEqual(translate(task.title,'zh-CN'),task.title,task.title);
 assert.deepEqual(tasks,original);
});
