import {ZH} from './locales/zh-CN.js';

export const LANGUAGE_KEY='nte-language:v1';
export function preferredLanguage(saved,languages=[]){
 if(['en','zh-CN'].includes(saved))return saved;
 return /^zh(?:-|$)/i.test(languages[0]||'')?'zh-CN':'en';
}
let language='en';
export const locale=()=>language==='zh-CN'?'zh-CN':'en-GB';

// Only presentation is translated. Activity identity, saved settings, profile
// names, URLs, and XP records always keep their original values.
export function translate(value,lang=language){
 if(lang!=='zh-CN'||typeof value!=='string')return value;
 const text=value.trim();if(!text)return value;
 let translated=ZH[text];
 if(translated===undefined){
  const rules=[
   [/^Complete (.+)$/,m=>'完成：'+translate(m[1],lang)],
   [/^View guide: (.+)$/,m=>'查看攻略：'+translate(m[1],lang)],
   [/^Preview (.+)$/,m=>'预览：'+translate(m[1],lang)],
   [/^(.+) — screenshot (\d+)$/,m=>translate(m[1],lang)+' — 截图 '+m[2]],
   [/^(.+) guide$/,m=>translate(m[1],lang)+'攻略'],
   [/^Show image (\d+)$/,m=>'显示第 '+m[1]+' 张图片'],
   [/^(\d+) of (\d+) completed$/,m=>'已完成 '+m[1]+' / '+m[2]],
   [/^(\d+) recurring · (\d+) one-time$/,m=>m[1]+' 项定期活动 · '+m[2]+' 项一次性活动'],
   [/^(.+) reset$/,m=>translate(m[1],lang)+'重置'],
   [/^Season reset: (.+)$/,m=>'赛季重置：'+translate(m[1],lang)],
   [/^Sheet checked (.+)$/,m=>'表格检查时间：'+m[1]],
   [/^Activity complete · \+(\d+) XP$/,m=>'活动已完成 · +'+m[1]+' 经验'],
   [/^(\d+) activities loaded(?: · (\d+) added)?$/,m=>'已加载 '+m[1]+' 项活动'+(m[2]?' · 新增 '+m[2]+' 项':'')],
   [/^LV (\d+)$/,m=>'等级 '+m[1]],
   [/^LEVEL (\d+)$/,m=>'等级 '+m[1]],
   [/^Progress to level (\d+)$/,m=>'升至 '+m[1]+' 级的进度'],
   [/^([\d,]+) XP to level (\d+)$/,m=>'距离 '+m[2]+' 级还需 '+m[1]+' 经验'],
   [/^(\d+)d (\d{2}:\d{2}:\d{2})$/,m=>m[1]+'天 '+m[2]],
   [/^(.+) · local$/,m=>m[1]+' · 本地时间'],
   [/^(.+) · Auto$/,m=>translate(m[1],lang)+' · 自动'],
   [/^IMAGE (\d+)$/,m=>'图片 '+m[1]],
   [/^Signed in as$/,()=> '已登录账号：'],
  ];
  for(const [pattern,render] of rules){const match=text.match(pattern);if(match){translated=render(match);break;}}
 }
 return translated===undefined?value:value.slice(0,value.indexOf(text))+translated+value.slice(value.indexOf(text)+text.length);
}

export function installI18n({onChange=()=>{},page='app'}={}){
 let saved;try{saved=localStorage.getItem(LANGUAGE_KEY);}catch{}
 language=preferredLanguage(saved,navigator.languages||[navigator.language]);
 const originals=new WeakMap(),attributes=new WeakMap();
 const skipped=element=>!!element?.closest('script,style,textarea,[data-i18n-skip]');
 function textNode(node){
  if(skipped(node.parentElement))return;
  const previous=originals.get(node),current=node.nodeValue;
  const source=previous&&current===previous.last?previous.source:current;
  const last=translate(source);originals.set(node,{source,last});
  if(current!==last)node.nodeValue=last;
 }
 function elementAttributes(element){
  if(skipped(element))return;
  const records=attributes.get(element)||{};
  for(const name of ['aria-label','title','placeholder','alt']){
   const current=element.getAttribute(name);if(current===null)continue;
   const previous=records[name],source=previous&&previous.last===current?previous.source:current;
   const last=translate(source);records[name]={source,last};
   if(current!==last)element.setAttribute(name,last);
  }
  attributes.set(element,records);
 }
 function subtree(node){
  if(node.nodeType===3){textNode(node);return;}
  if(node.nodeType!==1||skipped(node))return;
  elementAttributes(node);for(const child of node.childNodes)subtree(child);
 }
 const options={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']};
 const observer=new MutationObserver(records=>{
  observer.disconnect();
  for(const record of records){
   if(record.type==='characterData')textNode(record.target);
   else if(record.type==='attributes')elementAttributes(record.target);
   else for(const node of record.addedNodes)subtree(node);
  }
  observer.observe(document.body,options);
 });
 const selector=document.getElementById('language-select');
 function apply(next,persist){
  language=['en','zh-CN'].includes(next)?next:'en';
  document.documentElement.lang=language;
  if(selector){selector.value=language;selector.setAttribute('aria-label',language==='zh-CN'?'语言':'Language');}
  if(persist)try{localStorage.setItem(LANGUAGE_KEY,language);}catch{}
  observer.disconnect();subtree(document.body);document.title=page==='privacy'?(language==='zh-CN'?'隐私说明 · 异环都市助手':'Privacy · NTE City Companion'):(language==='zh-CN'?'NTE · 异环都市助手':'NTE · City Companion');
  observer.observe(document.body,options);onChange(language);
 }
 selector?.addEventListener('change',event=>apply(event.target.value,true));
 addEventListener('storage',event=>{if(event.key===LANGUAGE_KEY)apply(preferredLanguage(event.newValue,navigator.languages),false);});
 apply(language,false);
 return {apply,get language(){return language;}};
}
