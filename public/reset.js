export const DAY=86400000;
export const SERVERS={europe:{name:'Europe',offset:1},america:{name:'America',offset:-5},asia:{name:'Asia / HKTWMO',offset:8}};
export function detectServer(zone=Intl.DateTimeFormat().resolvedOptions().timeZone,offset=-new Date().getTimezoneOffset()/60){if(/^(America|US|Canada)\//.test(zone))return 'america';if(/^(Asia|Australia|Pacific)\//.test(zone))return 'asia';if(/^(Europe|Africa)\//.test(zone))return 'europe';return offset<-2?'america':offset>=5?'asia':'europe';}
export function serverOf(settings){return settings.server==='auto'?detectServer():settings.server;}
export function boundary(cycle,settings,now=Date.now()){
 if(cycle==='once')return {key:'once',next:null};
 const server=SERVERS[serverOf(settings)]||SERVERS.europe;
 const [h,m]=settings.resetTime.split(':').map(Number);const shift=server.offset*3600000-(h*60+m)*60000;const shifted=new Date(now+shift);let start,next;
 if(cycle==='daily'){start=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate());next=start+DAY;}
 else if(cycle==='weekly'){start=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate())-((shifted.getUTCDay()-Number(settings.weekDay)+7)%7)*DAY;next=start+7*DAY;}
 else if(cycle==='monthly'){start=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),1);next=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth()+1,1);}
 else {const anchor=cycle==='biweekly'?settings.biAnchor:settings.seasonAnchor;if(!/^\d{4}-\d{2}-\d{2}$/.test(anchor||''))return {key:'unconfigured',next:null};const length=(cycle==='biweekly'?14:60)*DAY;const epoch=Date.parse(anchor+'T00:00:00Z');start=epoch+Math.floor((now+shift-epoch)/length)*length;next=start+length;}
 return {key:cycle+':'+(start-shift),next:next-shift};
}
export function isDone(task,entry,settings,now=Date.now()){return !!entry?.done&&entry.period===boundary(task.cycle,settings,now).key;}
export function countdown(next,now=Date.now()){if(next===null)return 'Set reset date';const sec=Math.max(0,Math.ceil((next-now)/1000));const d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),s=sec%60;return (d?d+'d ':'')+[h,m,s].map(n=>String(n).padStart(2,'0')).join(':');}
