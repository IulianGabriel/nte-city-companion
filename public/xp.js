import {boundary} from './reset.js';
export const XP_POINTS={daily:10,weekly:40,biweekly:90,monthly:160,season:200,once:220};
export function awardXP(ledger,task,settings,now=Date.now()){
 const period=boundary(task.cycle,settings,now),old=ledger[task.id];
 if(period.key==='unconfigured'||old?.once||old?.period===period.key||old?.next>now)return 0;
 const points=XP_POINTS[task.cycle];if(!points)return 0;
 ledger[task.id]={xp:(old?.xp||0)+points,count:(old?.count||0)+1,period:period.key,next:period.next||0,once:task.cycle==='once'};return points;
}
export function levelInfo(ledger){const total=Object.values(ledger).reduce((n,e)=>n+e.xp,0);const level=Math.floor((Math.sqrt(1+total/25)-1)/2)+1;const start=100*(level-1)*level,needed=200*level;return {total,level,current:total-start,needed,percent:(total-start)/needed*100,count:Object.values(ledger).reduce((n,e)=>n+e.count,0)};}
export function cleanLedger(value={}){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>2000)throw Error('Invalid XP backup');const result={};for(const [id,e] of Object.entries(value)){if(!/^nte-[a-f0-9]{24}$/.test(id)||!e||!Number.isSafeInteger(e.xp)||e.xp<0||e.xp>100000000||!Number.isSafeInteger(e.count)||e.count<1||typeof e.once!=='boolean'||!Number.isSafeInteger(e.next)||e.next<0||typeof e.period!=='string'||e.period.length>80)throw Error('Invalid XP backup');result[id]={xp:e.xp,count:e.count,once:e.once,next:e.next,period:e.period};}return result;}
export function cleanProfile(value={}){const name=typeof value.name==='string'?value.name.trim().slice(0,32):'Proxy';const avatar=typeof value.avatar==='string'?value.avatar:'';if(avatar&&(!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(avatar)||avatar.length>65000))throw Error('Invalid profile photo');return {name:name||'Proxy',avatar};}
