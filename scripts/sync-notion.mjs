// Read-only Notion import. Credentials stay in the build environment; never in dist.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const token=process.env.NOTION_API_KEY;
if(!token){console.error('NOTION_API_KEY is required. Configure a read-only Notion connection and a GitHub Actions secret. The existing snapshot was not changed.');process.exit(1);}
const current=JSON.parse(await fs.readFile('content/notion.json','utf8'));
const cfg=JSON.parse(await fs.readFile('content/presentation.json','utf8'));
const gallery=JSON.parse(await fs.readFile('content/gallery.json','utf8'));
const mediaMap=JSON.parse(await fs.readFile('content/assets.json','utf8'));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function notion(endpoint){
 for(let attempt=0;attempt<4;attempt++){
  await wait(360);
  const response=await fetch('https://api.notion.com/v1/'+endpoint,{headers:{Authorization:'Bearer '+token,'Notion-Version':'2026-03-11'},signal:AbortSignal.timeout(30000)});
  if(response.status===429){await wait(Number(response.headers.get('retry-after')??2)*1000);continue;}
  if(!response.ok)throw Error('Notion API returned HTTP '+response.status+' for '+endpoint.split('?')[0]);
  return response.json();
 }
 throw Error('Notion rate limit exceeded; retained the previous snapshot.');
}
const allowedMediaHost=host=>host.endsWith('.amazonaws.com')||host.endsWith('.notion.so')||host.endsWith('.notion.site')||host==='notion.so';
async function download(url){
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||!allowedMediaHost(parsed.hostname))throw Error('Unreviewed external media host; retained the previous snapshot.');
 const response=await fetch(parsed,{signal:AbortSignal.timeout(40000),redirect:'error'});
 if(!response.ok)throw Error('Notion asset returned HTTP '+response.status);
 const type=(response.headers.get('content-type')??'').split(';')[0];
 const extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','application/pdf':'pdf'};
 const ext=extensions[type];if(!ext)throw Error('Unsupported imported asset format');
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>20*1024*1024)throw Error('Imported asset exceeds 20 MiB');
 const filename='assets/notion/'+createHash('sha256').update(bytes).digest('hex').slice(0,24)+'.'+ext;
 await fs.mkdir(path.dirname(filename),{recursive:true});await fs.writeFile(filename,bytes);return filename;
}
async function importPage(id){
 const page=await notion('pages/'+id);
 if(page.archived||page.in_trash)throw Error('An allowlisted portfolio page is archived; review the allowlist before publishing.');
 const result=await notion('pages/'+id+'/markdown?markdown_version=v2');
 let body=result.markdown;
 if(typeof body!=='string'||body.length<100)throw Error('Incomplete Notion page response');
 // Unknown bookmarks can be recovered using the official block API.
 for(const blockId of result.unknown_block_ids??[]){
  const block=await notion('blocks/'+blockId);
  if(block.type!=='bookmark')throw Error('Unsupported Notion block '+block.type+'; review before publishing.');
  const url=block.bookmark.url;
  body=body.replace(new RegExp('<unknown\\b[^>]*(?:'+blockId+'|'+blockId.replaceAll('-','')+')[^>]*\\/>','g'),'[GitHub / 관련 자료]('+url+')');
 }
 if(/<unknown\b/.test(body))throw Error('Unresolved content block; retained the previous snapshot.');
 const sources=[...body.matchAll(/<(?:image|file)\b[^>]*(?:source|src)="([^"]+)"/g)].map(m=>m[1]);
 for(const source of [...new Set(sources)]){
  let downloadUrl=source;
  const ref=source.match(/^notion-file-block:\/\/([^/]+)\/([^?]+)/);
  if(ref){
   const block=await notion('blocks/'+ref[1]);
   const media=block[block.type];
   downloadUrl=media?.file?.url??media?.external?.url;
   if(!downloadUrl)throw Error('Notion asset is not accessible to this connection');
  }
  const local=await download(downloadUrl);
  // Local paths only: no temporary signed URL is persisted in the content snapshot.
  body=body.split(source).join(local);
  mediaMap[local]=local;
  if(ref){mediaMap[source]=local;gallery[ref[2]]=local;}
 }
 if(/X-Amz-(?:Signature|Security-Token|Credential)/i.test(body))throw Error('Signed URL would enter content snapshot; import aborted');
 const titleProperty=Object.values(page.properties??{}).find(p=>p.type==='title');
 return {body,title:(titleProperty?.title??[]).map(t=>t.plain_text??t.text?.content??'').join(''),lastEdited:page.last_edited_time};
}
try{
 const next=structuredClone(current);
 const main=await importPage(current.main.id);next.main={...next.main,...main};
 for(let i=0;i<next.projects.length;i++){
  const p=next.projects[i];if(!cfg.projects[p.id])throw Error('Page not approved in presentation allowlist');
  const imported=await importPage(p.id);next.projects[i]={...p,...imported,unknownBlockCount:0};
  // Refresh the selected image property; content is still curated by the Notion author.
  const selected=cfg.projects[p.id].imageId;
  if(selected&&gallery[selected])mediaMap[selected]=gallery[selected];
  console.log('Imported '+(i+1)+'/'+next.projects.length+': '+cfg.projects[p.id].label);
 }
 next.exportedAt=new Date().toISOString();
 await fs.mkdir('.local',{recursive:true});
 await fs.writeFile('.local/notion-next.json',JSON.stringify(next,null,2));
 await fs.writeFile('content/assets.json',JSON.stringify(mediaMap,null,2));
 await fs.writeFile('content/gallery.json',JSON.stringify(gallery,null,2));
 await fs.rename('.local/notion-next.json','content/notion.json');
 console.log('Notion snapshot updated. No write was made to Notion.');
}catch(error){console.error('Notion sync stopped: '+error.message);process.exitCode=1;}
