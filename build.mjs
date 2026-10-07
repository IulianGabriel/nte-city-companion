import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();const output=path.resolve('dist'),client=path.resolve('dist/client'),server=path.resolve('dist/server');
if(output!==path.join(root,'dist')||!fs.existsSync(path.join(root,'public/index.html')))throw Error('Output must be this checkout’s dist folder, with source preserved in public.');
fs.rmSync(output,{recursive:true,force:true});
// Build targets are fixed children of this checkout; the source lives in public/.
for(const dir of [client,server]){if(!dir.startsWith(root+path.sep))throw Error('Invalid build target');fs.mkdirSync(dir,{recursive:true});}
fs.cpSync('public',client,{recursive:true});
let worker=fs.readFileSync('server/worker.js','utf8').replaceAll("../public/","./").replace("import seed from './tasks.json' with {type:'json'};",'const seed='+fs.readFileSync('public/tasks.json','utf8')+';');fs.writeFileSync(path.join(server,'index.js'),worker);fs.copyFileSync('public/feed.js',path.join(server,'feed.js'));
fs.mkdirSync('dist/.openai',{recursive:true});fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Worker, client assets, and database migrations built.');

for(const name of ['xp.js','reset.js'])fs.copyFileSync('public/'+name,path.join(server,name));

for(const name of ['auth.js','avatars.js'])fs.copyFileSync('server/'+name,path.join(server,name));
