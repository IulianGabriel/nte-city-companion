import {createRemoteJWKSet,jwtVerify} from 'jose';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const STATE_COOKIE='__Host-nte-oauth',SESSION_COOKIE='__Host-nte-session';
const lifetime=30*86400;
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export async function tokenHash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
function cookie(request,name){return (request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||'';}
function setCookie(name,value,seconds){return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;}
function redirect(path,cookies=[]){const headers=new Headers({Location:path,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});for(const c of cookies)headers.append('Set-Cookie',c);return new Response(null,{status:303,headers});}
export function authReady(env){return !!(env.DB&&env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET);}
export async function authenticatedUser(request,env){if(!env.DB)return null;const token=cookie(request,SESSION_COOKIE);if(!/^[a-f0-9]{64}$/.test(token))return null;const session=await env.DB.prepare('SELECT user_id,email FROM sessions WHERE token_hash=? AND expires_at>?').bind(await tokenHash(token),Date.now()).first();return session?{id:session.user_id,email:session.email}:null;}
export async function verifyGoogleToken(token,clientId,nonce,jwks=keys){const {payload}=await jwtVerify(token,jwks,{issuer:['https://accounts.google.com','accounts.google.com'],audience:clientId,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email','nonce']});if(payload.nonce!==nonce||payload.email_verified!==true||typeof payload.sub!=='string'||typeof payload.email!=='string'||(payload.azp&&payload.azp!==clientId))throw Error('Invalid Google identity');return {id:'google:'+payload.sub,email:payload.email};}
export async function authRoute(request,env){const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/auth/'))return null;
 if(path==='/auth/signout'&&request.method==='POST'){if(request.headers.get('Origin')!==url.origin)return new Response('Same-origin request required',{status:403});const token=cookie(request,SESSION_COOKIE);if(token&&env.DB)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await tokenHash(token)).run();return redirect('/',[setCookie(SESSION_COOKIE,'',0)]);}
 if(!authReady(env))return new Response('Google sign-in is being configured. You can keep using browser saves.',{status:503,headers:{'Cache-Control':'no-store'}});
 if(path==='/auth/google'&&request.method==='GET'){
  if(url.protocol!=='https:')return new Response('HTTPS required',{status:400});
  const state=random(),verifier=random(),nonce=random();const challenge=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  await env.DB.prepare('INSERT INTO oauth_states(state_hash,verifier,nonce,expires_at) VALUES (?,?,?,?)').bind(await tokenHash(state),verifier,nonce,Date.now()+600000).run();
  const auth=new URL('https://accounts.google.com/o/oauth2/v2/auth');auth.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:url.origin+'/auth/google/callback',response_type:'code',scope:'openid email profile',state,nonce,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'}).toString();return redirect(auth.href,[setCookie(STATE_COOKIE,state,600)]);
 }
 if(path==='/auth/google/callback'&&request.method==='GET'){
  const clear=setCookie(STATE_COOKIE,'',0),state=url.searchParams.get('state');
  if(!state||state!==cookie(request,STATE_COOKIE)||!/^[a-f0-9]{64}$/.test(state))return redirect('/?auth=invalid-state',[clear]);
  const stateHash=await tokenHash(state),row=await env.DB.prepare('SELECT verifier,nonce,expires_at FROM oauth_states WHERE state_hash=?').bind(stateHash).first();
  if(!row||row.expires_at<Date.now())return redirect('/?auth=expired',[clear]);
  const used=await env.DB.prepare('DELETE FROM oauth_states WHERE state_hash=?').bind(stateHash).run();if(!used.meta.changes)return redirect('/?auth=expired',[clear]);
  if(url.searchParams.has('error')||!url.searchParams.get('code'))return redirect('/?auth=cancelled',[clear]);
  try{
   const result=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,code:url.searchParams.get('code'),code_verifier:row.verifier,grant_type:'authorization_code',redirect_uri:url.origin+'/auth/google/callback'}),signal:AbortSignal.timeout(15000)});
   if(!result.ok)throw Error('Google exchange failed');const tokens=await result.json();const who=await verifyGoogleToken(tokens.id_token,env.GOOGLE_CLIENT_ID,row.nonce),session=random();
   await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,email,expires_at) VALUES (?,?,?,?)').bind(await tokenHash(session),who.id,who.email,Date.now()+lifetime*1000).run();return redirect('/',[clear,setCookie(SESSION_COOKIE,session,lifetime)]);
  }catch{return redirect('/?auth=failed',[clear]);}
 }
 return new Response('Not found',{status:404});
}
export async function cleanExpiredAuth(db){await db.batch([db.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),db.prepare('DELETE FROM oauth_states WHERE expires_at<?').bind(Date.now())]);}
