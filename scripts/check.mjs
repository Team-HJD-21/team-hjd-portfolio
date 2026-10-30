import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('dist');
async function files(dir){return (await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
const all=await files(root),html=all.filter(p=>p.endsWith('.html'));
assert.equal(html.filter(p=>p.includes(path.sep+'projects'+path.sep)).length,16,'Expected every portfolio project');
let checkedLinks=0;
for(const file of html){
 const text=await fs.readFile(file,'utf8');
 assert(!/X-Amz-|notion-file-block:|file-upload:|undefined|\[사진 필요|\[영상 필요|<unknown\b/.test(text),path.relative(root,file)+' contains unresolved content');
 if(!text.includes('http-equiv="refresh"'))assert.equal((text.match(/<h1[ >]/g)??[]).length,1,path.relative(root,file)+' must have one h1');
 for(const match of text.matchAll(/(?:href|src)="([^"#]+)"/g)){
  const url=match[1].split('?')[0];if(!url.startsWith('/')||url.startsWith('//'))continue;
  const dest=path.join(root,url.endsWith('/')?url+'index.html':url);
  await fs.access(dest);checkedLinks++;
 }
}
const home=await fs.readFile('dist/hyunseok/index.html','utf8');
assert(home.includes('게임 시스템과 UI'),'Notion introduction missing');
assert(!home.includes('### A Waving'),'Markdown marker leaked into summary');
assert(home.includes('1인 개발로 기획부터 구현까지'),'Contribution summary missing');
console.log(`PASS: ${html.length} HTML pages, 16 project details, ${checkedLinks} local links/assets; no temporary credentials or unresolved blocks.`);
