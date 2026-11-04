import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import MarkdownIt from 'markdown-it';
import sanitize from 'sanitize-html';
import {header as renderHeader,footer as renderFooter,homePage,documentTile} from './templates.mjs';

const root = process.cwd();
const read = async p => JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const source = await read('content/notion.json');
const design = await read('content/presentation.json');
const gallery = await read('content/gallery.json');
const documents = await read('content/documents.json');
const rawAssets = {...await read('content/assets.json'), ...gallery};
const assets = Object.fromEntries((await Promise.all(Object.entries(rawAssets).map(async ([ref,p])=>{
 try{await fs.access(p);return [ref,p];}catch{return null;}
}))).filter(Boolean));
const base = process.env.BASE_PATH ?? design.basePath;
const origin = process.env.SITE_URL ?? design.siteUrl;
const out = path.join(root,'dist');
const md = new MarkdownIt({html:true,linkify:true,typographer:false});
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain = s=>String(s??'').replace(/<[^>]*>/g,'').replace(/\\([|~*])/g,'$1').replace(/\*\*/g,'').replace(/`/g,'').replace(/&amp;/g,'&').trim();
const categories={games:'게임',tools:'엔진 & 도구',graphics:'그래픽스',early:'초기 작품'};
const imageId=ref=>String(ref).match(/notion-file-block:\/\/[^/]+\/([^?]+)/)?.[1];
const imagePath = ref=>assets[imageId(ref)] || assets[ref];
const localImage = p=>`${base}/${p}`;
const section = (body,name)=>body.match(new RegExp(`### [^\\n]*${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n### |$)`))?.[1]??'';
const quote = s=>plain(s.match(/^\s*>\s?(.+)$/m)?.[1]??s.match(/<quote>\s*([^\n]+)/)?.[1]??'');
const projects=source.projects.map(p=>{
 const cfg=design.projects[p.id];if(!cfg)throw Error('Unreviewed Notion page '+p.id);
 const contribution=section(p.body,'Contribution');
 const overview=section(p.body,'Overview');
 const firstMedia=p.body.match(/<image\b[^>]*(?:source|src)="([^"]+)"/)?.[1];
 return {...p,...cfg,image:imagePath(firstMedia)||gallery[cfg.imageId],summary:quote(contribution)||quote(overview)||quote(p.body),href:`${base}/projects/${cfg.slug}/`,overview};
});
for(const p of projects)if(!p.image)throw Error('Missing project image '+p.id);
const featured=design.featured.map(id=>projects.find(p=>p.id===id));
const aboutBlock=source.main.body.match(/## [^\n]*About me[^\n]*\n([\s\S]*?)(?=\n### [^\n]*Strength)/)?.[1]??'';
const about=aboutBlock.replace(/---/g,'').replace(/^#{1,6}.*$/gm,'').replace(/<p\s*\/>/g,'').split(/\n\s*\n/).map(plain).filter(Boolean);
if(about.length<2)throw Error('Notion About section could not be parsed');
const mainLines=source.main.body.split('\n').map(plain).filter(Boolean);
const educationLine=mainLines.find(s=>/^20\d{2}\.\d{2}\s*-/.test(s)&&s.includes('대학교'));
const labLine=mainLines.find(s=>/^20\d{2}\.\d{2}\s*-/.test(s)&&s.includes('GameTech'));
const awardLine=mainLines.find(s=>/^20\d{2}\.\d{2}\s/.test(s)&&s.includes('경시대회'));
if(!educationLine||!labLine||!awardLine)throw Error('Notion education or award section could not be parsed');
const email=source.main.body.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];
if(!email)throw Error('Missing Notion contact email');
const initial=featured[0];
const contact=()=>`<a href="mailto:${esc(email)}">${esc(email)} <span aria-hidden="true">↗</span></a>`;
const header=()=>renderHeader(base);
const footer=()=>renderFooter(base,source);
const shell=(title,description,body,canonical,image)=>`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#191919"><link rel="canonical" href="${esc(origin+canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(origin+canonical)}"><meta property="og:image" content="${esc(origin+localImage(image??initial.image))}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${base}/assets/favicons/v1/portfolio/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" type="image/png" sizes="32x32" href="${base}/assets/favicons/v1/portfolio/favicon-32.png"><link rel="icon" type="image/svg+xml" sizes="any" href="${base}/assets/favicons/v1/portfolio/favicon.svg"><link rel="apple-touch-icon" sizes="180x180" href="${base}/assets/favicons/v1/portfolio/apple-touch-icon.png"><link rel="stylesheet" href="${base}/styles.css?v=${cssHash}"><script src="${base}/site.js?v=${jsHash}" defer></script></head><body>${header()}${body}${footer()}</body></html>`;

function videoBlock(url,label='플레이 영상'){
 let parsed;try{parsed=new URL(url.replaceAll('&amp;','&'));}catch{return '';}
 let id=parsed.hostname==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v');
 if(!/^[\w-]{11}$/.test(id??''))return `<p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a></p>`;
 return `<div class="video"><iframe title="${esc(label)}" src="https://www.youtube-nocookie.com/embed/${id}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}
function renderBody(p){
 let body=p.body.replace(/^<image[^>]*\/>\s*/,'');
 body=body.replace(/<quote>/g,'<blockquote>').replace(/<\/quote>/g,'</blockquote>');
 body=body.replace(/<unknown\b[^>]*\/>/g,'').replace(/<unknown_mention\b[^>]*\/>/g,'');
 body=body.replace(/<image\b[^>]*(?:source|src)="([^"]+)"[^>]*\/>/g,(_,ref)=>{let img=imagePath(ref);return img?`<figure><img src="${localImage(img)}" loading="lazy" alt="${esc(p.label)} 프로젝트 화면"></figure>`:'';});
 body=body.replace(/<video\b[^>]*(?:source|src)="([^"]+)"[^>]*>([\s\S]*?)<\/video>/g,(_,url,label)=>videoBlock(url,plain(label)||p.label+' 영상'));
 body=body.replace(/<video\b[^>]*(?:source|src)="([^"]+)"[^>]*\/>/g,(_,url)=>videoBlock(url,p.label+' 영상'));
 body=body.replace(/<bookmark\b[^>]*(?:source|src)="([^"]+)"[^>]*\/>/g,(_,url)=>`\n[관련 자료 열기 ↗](${url})\n`);
 body=body.replace(/<file\b[^>]*(?:source|src)="([^"]+)"[^>]*\/>/g,(_,ref)=>{
  const doc=documents[imageId(ref)]||(ref.startsWith('assets/')&&ref.endsWith('.pdf')?{title:'첨부 문서 (PDF)',file:ref,preview:ref.slice(0,-4)+'-preview.png'}:null);
  return doc?`\n${documentTile(base,doc,true)}\n`:`\n[첨부 자료 · Notion에서 보기 ↗](${p.sourceUrl})\n`;
 });
 body=body.replace(/<\/?(?:columns?|span)(?:\s[^>]*)?>/g,'').replace(/<p\s*\/>/g,'\n').replace(/<\/?p>/g,'\n');
 body=body.replace(/<toggle>\s*([^\n]+)\n([\s\S]*?)<\/toggle>/g,'<details><summary>$1</summary>\n\n$2\n\n</details>');
 body=body.replace(/<empty-block\/>/g,'\n').replace(/^\s*- GitHub\s*$(?!\n\s+\S)/gm,'');
 const rendered=md.render(body);
 return sanitize(rendered,{allowedTags:[...sanitize.defaults.allowedTags,'img','figure','figcaption','iframe','details','summary'],allowedAttributes:{a:['href','title','target','rel','class','data-preview','data-document-title','aria-label','aria-haspopup'],span:['class','aria-hidden'],div:['class'],img:['src','alt','loading','width','height'],iframe:['src','title','loading','allow','allowfullscreen','referrerpolicy'],details:['open'], '*':['id']},allowedClasses:{a:['document-tile','report-tile'],span:['document-format'],div:['video']},allowedIframeHostnames:['www.youtube-nocookie.com'],allowedSchemes:['http','https','mailto'],allowProtocolRelative:false,transformTags:{a:(tag,attrs)=>({tagName:tag,attribs:{...attrs,...(/^https?:/.test(attrs.href??'')?{target:'_blank',rel:'noopener noreferrer'}:{})}})}});
}
function card(p){return `<article class="project-card" data-category="${p.category}"><a class="project-open" href="${p.href}" data-project-label="${esc(p.label)}" aria-label="${esc(p.label)} 상세 보기" aria-haspopup="dialog"><div class="project-image"><img src="${localImage(p.image)}" alt="${esc(p.label)} 실제 프로젝트 화면" loading="lazy" width="960" height="540"></div><div class="card-copy"><p class="card-meta">${esc(p.stack)}</p><h4 class="card-title">${esc(p.label)} <span aria-hidden="true">↗</span></h4><p class="card-description">${esc(p.summary)}</p></div></a></article>`;}


const css=await fs.readFile('dark.css','utf8'), js=await fs.readFile('site.js','utf8');
const cssHash=createHash('sha256').update(css).digest('hex').slice(0,10),jsHash=createHash('sha256').update(js).digest('hex').slice(0,10);
if(path.dirname(out)!==root||path.basename(out)!=='dist')throw Error('Refusing to clear an unexpected output directory');
await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(out,{recursive:true});
const write=async(file,value)=>{let dest=path.join(out,file);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,value,'utf8');};
await fs.cp('assets',path.join(out,base,'assets'),{recursive:true});
await write(base+'/styles.css',css);await write(base+'/site.js',js);

const home=homePage({base,source,projects,featured,about,email,educationLine,labLine,awardLine,gallery,documents,card});
await write(base+'/index.html',shell('양현석 — 게임 클라이언트 개발자',about[0],home,base+'/'));
for(const p of projects){
 const toc=[...p.body.matchAll(/^### (.+)$/gm)].map(m=>plain(m[1]));
 const detail=`<main id="main" class="project-page"><div class="shell"><a class="back-link" href="${base}/#projects">← 전체 프로젝트</a><div class="project-heading"><p class="eyebrow">${categories[p.category]} / ${esc(p.stack)}</p><h1>${esc(p.label)}</h1><p>${esc(p.summary)}</p><a class="text-link" href="${p.sourceUrl}" target="_blank" rel="noopener noreferrer">Notion 원본 보기 ↗</a></div><figure class="project-cover"><img src="${localImage(p.image)}" alt="${esc(p.label)} 프로젝트 화면" width="1280" height="720" fetchpriority="high"></figure><div class="project-layout"><aside class="project-aside"><p class="eyebrow">프로젝트 정보</p><p>${esc(p.stack)}</p><span>${categories[p.category]}</span><a href="${p.sourceUrl}" target="_blank" rel="noopener noreferrer">원본 문서 ↗</a><a href="mailto:${esc(email)}">연락하기 ↗</a></aside><article class="prose">${renderBody(p)}</article></div><div class="next-project"><span>계속 둘러보기</span><a href="${projects[(projects.indexOf(p)+1)%projects.length].href}">${esc(projects[(projects.indexOf(p)+1)%projects.length].label)} ↗</a></div></div></main>`;
 await write(base+'/projects/'+p.slug+'/index.html',shell(p.label+' — 양현석',p.summary,detail,p.href,p.image));
}
const redirectPage=target=>`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${esc(target)}"><link rel="canonical" href="${esc(origin+target)}"><title>양현석 포트폴리오</title></head><body><a href="${esc(target)}">양현석 포트폴리오로 이동</a></body></html>`;
if(base)await write('index.html',redirectPage(base+'/'));
for(const legacy of design.legacyBasePaths??[]){
 if(legacy===base)continue;
 if(!/^\/[a-z0-9-]+$/.test(legacy))throw Error('Invalid legacy path');
 await write(legacy+'/index.html',redirectPage(base+'/'));
 for(const p of projects)await write(legacy+'/projects/'+p.slug+'/index.html',redirectPage(p.href));
}

await write('404.html',shell('페이지를 찾을 수 없습니다 — 양현석','양현석 포트폴리오',`<main id="main" class="shell section"><p class="eyebrow">404</p><h1>페이지를 찾을 수 없습니다.</h1><p>주소가 변경되었거나 존재하지 않는 페이지입니다.</p><a class="button button-dark" href="${base}/">포트폴리오로 돌아가기 →</a></main>`,'/404.html'));
await write('.nojekyll','');await write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[base+'/',...projects.map(p=>p.href)].map(p=>`<url><loc>${origin+p}</loc></url>`).join('')}</urlset>`);
await write('build-info.json',JSON.stringify({source:'Notion',exportedAt:source.exportedAt,projects:projects.length,basePath:base},null,2));
console.log(`Built ${projects.length} project pages + portfolio at ${base}/`);
