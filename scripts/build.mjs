import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import MarkdownIt from 'markdown-it';
import sanitize from 'sanitize-html';

const root = process.cwd();
const read = async p => JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const source = await read('content/notion.json');
const design = await read('content/presentation.json');
const gallery = await read('content/gallery.json');
const rawAssets = {...await read('content/assets.json'), ...gallery};
const assets = Object.fromEntries((await Promise.all(Object.entries(rawAssets).map(async ([ref,p])=>{
 try{await fs.access(p);return [ref,p];}catch{return null;}
}))).filter(Boolean));
const base = process.env.BASE_PATH ?? design.basePath;
const origin = process.env.SITE_URL ?? design.siteUrl;
const out = path.join(root,'dist');
const md = new MarkdownIt({html:true,linkify:true,typographer:false});
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain = s=>String(s??'').replace(/<[^>]*>/g,'').replace(/\\([|~*])/g,'$1').replace(/[*`]/g,'').replace(/&amp;/g,'&').trim();
const categories={games:'게임',tools:'엔진 & 도구',graphics:'그래픽스',early:'초기 작품'};
const imageId=ref=>String(ref).match(/notion-file-block:\/\/[^/]+\/([^?]+)/)?.[1];
const imagePath = ref=>assets[imageId(ref)] || assets[ref];
const localImage = p=>`${base}/${p}`;
const section = (body,name)=>body.match(new RegExp(`### [^\\n]*${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n### |$)`))?.[1]??'';
const quote = s=>plain(s.match(/^\s*>\s?(.+)$/m)?.[1]??'');
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
const header=()=>`<a class="skip" href="#main">본문으로 건너뛰기</a><header class="site-header"><div class="shell header-inner"><a class="brand" href="${base}/" aria-label="양현석 포트폴리오 홈"><span class="brand-mark">hy.</span><span>양현석<span class="brand-role">GAME CLIENT DEVELOPER</span></span></a><nav aria-label="주요 메뉴"><a href="${base}/#work">작품</a><a href="${base}/#about">소개</a><a href="${base}/#contact" class="nav-contact">연락하기 <span aria-hidden="true">↗</span></a></nav></div></header>`;
const footer=()=>`<footer class="shell site-footer"><a class="brand-mark" href="${base}/">hy.</a><p>© ${new Date().getFullYear()} YANG HYUNSEOK</p><a href="${source.main.sourceUrl??'https://anyanyang.notion.site/'+source.main.id}" target="_blank" rel="noopener noreferrer">Notion 원본 <span aria-hidden="true">↗</span></a></footer>`;
const shell=(title,description,body,canonical,image)=>`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#f6f5f1"><link rel="canonical" href="${esc(origin+canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(origin+canonical)}"><meta property="og:image" content="${esc(origin+localImage(image??initial.image))}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${base}/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${base}/styles.css?v=${cssHash}"><script src="${base}/site.js?v=${jsHash}" defer></script></head><body>${header()}${body}${footer()}</body></html>`;

function videoBlock(url,label='플레이 영상'){
 let parsed;try{parsed=new URL(url.replaceAll('&amp;','&'));}catch{return '';}
 let id=parsed.hostname==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v');
 if(!/^[\w-]{11}$/.test(id??''))return `<p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a></p>`;
 return `<div class="video"><iframe title="${esc(label)}" src="https://www.youtube-nocookie.com/embed/${id}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}
function renderBody(p){
 let body=p.body.replace(/^<image[^>]*\/>\s*/,'');
 body=body.replace(/<unknown\b[^>]*\/>/g,'').replace(/<unknown_mention\b[^>]*\/>/g,'');
 body=body.replace(/<image\b[^>]*(?:source|src)="([^"]+)"[^>]*\/>/g,(_,ref)=>{let img=imagePath(ref);return img?`<figure><img src="${localImage(img)}" loading="lazy" alt="${esc(p.label)} 프로젝트 화면"></figure>`:'';});
 body=body.replace(/<video\b[^>]*(?:source|src)="([^"]+)"[^>]*>([\s\S]*?)<\/video>/g,(_,url,label)=>videoBlock(url,plain(label)||p.label+' 영상'));
 body=body.replace(/<video\b[^>]*(?:source|src)="([^"]+)"[^>]*\/>/g,(_,url)=>videoBlock(url,p.label+' 영상'));
 body=body.replace(/<bookmark\b[^>]*(?:source|src)="([^"]+)"[^>]*\/>/g,(_,url)=>`\n[관련 자료 열기 ↗](${url})\n`);
 body=body.replace(/<file\b[^>]*\/>/g,`\n[첨부 자료 · Notion에서 보기 ↗](${p.sourceUrl})\n`);
 body=body.replace(/<\/?(?:columns?|span)(?:\s[^>]*)?>/g,'').replace(/<p\s*\/>/g,'\n').replace(/<\/?p>/g,'\n');
 body=body.replace(/<toggle>\s*([^\n]+)\n([\s\S]*?)<\/toggle>/g,'<details><summary>$1</summary>\n\n$2\n\n</details>');
 body=body.replace(/<empty-block\/>/g,'\n').replace(/^\s*- GitHub\s*$(?!\n\s+\S)/gm,'');
 const rendered=md.render(body);
 return sanitize(rendered,{allowedTags:[...sanitize.defaults.allowedTags,'img','figure','figcaption','iframe','details','summary'],allowedAttributes:{a:['href','title','target','rel'],img:['src','alt','loading','width','height'],iframe:['src','title','loading','allow','allowfullscreen','referrerpolicy'],details:['open'], '*':['id']},allowedIframeHostnames:['www.youtube-nocookie.com'],allowedSchemes:['http','https','mailto'],allowProtocolRelative:false,transformTags:{a:(tag,attrs)=>({tagName:tag,attribs:{...attrs,...(/^https?:/.test(attrs.href??'')?{target:'_blank',rel:'noopener noreferrer'}:{})}})}});
}
function card(p,index=0,selected=false){return `<article class="project-card${selected?' featured-card':''}" data-category="${p.category}" data-title="${esc(p.label.toLowerCase())}"><a class="project-image" href="${p.href}" aria-label="${esc(p.label)} 상세 보기"><img src="${localImage(p.image)}" alt="${esc(p.label)} 실제 프로젝트 화면" loading="lazy" width="960" height="540"><span class="image-shade"></span><span class="image-index">${String(index+1).padStart(2,'0')}</span><span class="image-arrow" aria-hidden="true">↗</span>${selected?'<span class="image-caption">SELECTED PROJECT</span>':''}</a><div class="card-meta"><span>${esc(p.stack)}</span><span>${categories[p.category]}</span></div><a href="${p.href}" class="card-title">${esc(p.label)} <span aria-hidden="true">↗</span></a><p class="card-description">${esc(p.summary)}</p></article>`;}

const css=await fs.readFile('styles.css','utf8'), js=await fs.readFile('site.js','utf8');
const cssHash=createHash('sha256').update(css).digest('hex').slice(0,10),jsHash=createHash('sha256').update(js).digest('hex').slice(0,10);
await fs.mkdir(out,{recursive:true});
const write=async(file,value)=>{let dest=path.join(out,file);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,value,'utf8');};
await fs.cp('assets',path.join(out,base,'assets'),{recursive:true});
await write(base+'/styles.css',css);await write(base+'/site.js',js);
await write(base+'/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#203c34"/><text x="9" y="43" fill="#edf3d6" font-family="sans-serif" font-size="37" font-weight="700">hy.</text></svg>');

const home=`<main id="main"><section class="shell hero"><div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span> GAME CLIENT DEVELOPER</p><h1>게임을 설계하는<br>개발자, <span>양현석.</span></h1><p class="hero-description">${esc(about[0])}</p><div class="hero-actions"><a class="button button-dark" href="#work">작품 살펴보기 <span aria-hidden="true">↓</span></a><a class="text-link" href="https://github.com/yanggogi1423" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a></div><div class="hero-tools"><span>C++</span><span>Unity</span><span>Unreal Engine</span><span>Direct3D 11</span></div></div><a class="hero-visual" href="${initial.href}" aria-label="${initial.label} 프로젝트 보기"><div class="hero-screen"><span class="screen-top"><i></i><i></i><i></i><span>PROJECT / RUNSTER</span></span><img src="${localImage(initial.image)}" alt="Runster 게임 타이틀 화면" width="960" height="540" fetchpriority="high"><div class="hero-screen-caption"><span>Runster</span><span>이동이 재미가 되는 순간 <b>↗</b></span></div></div><span class="visual-label"><span>01 / IN PLAY</span><span>DESIGNED. BUILT. PLAYED.</span></span></a></section><div class="shell focus-strip"><span>GAMEPLAY SYSTEMS</span><i>+</i><span>REAL-TIME GRAPHICS</span><i>+</i><span>TOOLS & UX</span><a href="#about">개발자로서의 이야기 ↗</a></div><section class="shell section" id="work"><div class="section-heading"><div><p class="eyebrow">01 — SELECTED WORK</p><h2>직접 만들고,<br>플레이로 이어온 작업.</h2></div><p>게임의 조작부터 이를 만드는 도구까지.<br>각 프로젝트에서 맡은 구현과 문제 해결을 담았습니다.</p></div><div class="featured-grid">${featured.map((p,i)=>card(p,i,true)).join('')}</div></section><section class="archive-section" id="all-work"><div class="shell section"><div class="section-heading compact"><div><p class="eyebrow">02 — PROJECT ARCHIVE</p><h2>모든 작업</h2></div><p>게임, 엔진, 그래픽스와 첫 프로젝트들.</p></div><div class="archive-toolbar"><div class="filters" role="group" aria-label="프로젝트 분류"><button class="filter active" data-filter="all" aria-pressed="true">전체 <span>${projects.length}</span></button>${Object.entries(categories).map(([id,label])=>`<button class="filter" data-filter="${id}" aria-pressed="false">${label}</button>`).join('')}</div><label class="search"><span aria-hidden="true">⌕</span><input type="search" id="project-search" placeholder="프로젝트 찾기" aria-label="프로젝트 이름 검색"></label></div><p class="result-count" aria-live="polite"><span id="result-count">${projects.length}</span> PROJECTS</p><div class="archive-grid" id="project-grid">${projects.map((p,i)=>card(p,i)).join('')}</div><p id="empty-search" hidden>일치하는 프로젝트가 없습니다. 다른 이름으로 검색해 주세요.</p></div></section><section class="shell section about-section" id="about"><div class="about-title"><p class="eyebrow">03 — ABOUT</p><h2>화면 뒤의 구조까지<br>고민합니다.</h2><div class="portrait"><img src="${localImage(gallery['896bc835-df65-4d18-a5bb-3b739523532b'])}" alt="양현석 프로필" width="360" height="360" loading="lazy"><span>YANG<br>HYUNSEOK</span></div></div><div class="about-body"><p class="about-lead">게임이라는 예술 작품을<br>설계하고 만듭니다.</p>${about.map(p=>`<p>${esc(p)}</p>`).join('')}<div class="about-credentials"><div><span>EDUCATION</span><p>${esc(educationLine)}</p></div><div><span>GAME TECH LAB</span><p>${esc(labLine)}</p></div><div><span>AWARD</span><p>${esc(awardLine)}</p></div></div><div class="about-links"><a href="https://github.com/yanggogi1423" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="https://velog.io/@yanggogi1423/posts" target="_blank" rel="noopener noreferrer">Blog ↗</a><a href="https://teamhjd.com/team/yang-hyunseok/" target="_blank" rel="noopener noreferrer">TeamHJD ↗</a></div></div></section><section class="contact-section" id="contact"><div class="shell"><p class="eyebrow">LET’S MAKE SOMETHING PLAYABLE</p><h2>다음 플레이를<br>함께 만들어 갈 곳을 찾습니다.</h2><div class="contact-link">${contact()}</div><p>게임 클라이언트 개발 · 게임플레이 시스템 · 실시간 그래픽스</p></div></section></main>`;
await write(base+'/index.html',shell('양현석 — 게임 클라이언트 개발자',about[0],home,base+'/'));
for(const p of projects){
 const toc=[...p.body.matchAll(/^### (.+)$/gm)].map(m=>plain(m[1]));
 const detail=`<main id="main" class="project-page"><div class="shell"><a class="back-link" href="${base}/#all-work">← 전체 프로젝트</a><div class="project-heading"><p class="eyebrow">${categories[p.category]} / ${esc(p.stack)}</p><h1>${esc(p.label)}</h1><p>${esc(p.summary)}</p><a class="text-link" href="${p.sourceUrl}" target="_blank" rel="noopener noreferrer">Notion 원본 보기 ↗</a></div><figure class="project-cover"><img src="${localImage(p.image)}" alt="${esc(p.label)} 프로젝트 화면" width="1280" height="720" fetchpriority="high"></figure><div class="project-layout"><aside class="project-aside"><p class="eyebrow">PROJECT NOTES</p><p>${esc(p.stack)}</p><span>${categories[p.category]}</span><a href="${p.sourceUrl}" target="_blank" rel="noopener noreferrer">원본 문서 ↗</a><a href="${base}/#contact">연락하기 ↗</a></aside><article class="prose">${renderBody(p)}</article></div><div class="next-project"><span>계속 둘러보기</span><a href="${projects[(projects.indexOf(p)+1)%projects.length].href}">${esc(projects[(projects.indexOf(p)+1)%projects.length].label)} ↗</a></div></div></main>`;
 await write(base+'/projects/'+p.slug+'/index.html',shell(p.label+' — 양현석',p.summary,detail,p.href,p.image));
}
await write('index.html',`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${base}/"><link rel="canonical" href="${origin+base}/"><title>양현석 포트폴리오</title></head><body><a href="${base}/">양현석 포트폴리오로 이동</a></body></html>`);
await write('404.html',shell('페이지를 찾을 수 없습니다 — 양현석','양현석 포트폴리오',`<main id="main" class="shell section"><p class="eyebrow">404</p><h1>페이지를 찾을 수 없습니다.</h1><p>주소가 변경되었거나 존재하지 않는 페이지입니다.</p><a class="button button-dark" href="${base}/">포트폴리오로 돌아가기 →</a></main>`,'/404.html'));
await write('.nojekyll','');await write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[base+'/',...projects.map(p=>p.href)].map(p=>`<url><loc>${origin+p}</loc></url>`).join('')}</urlset>`);
await write('build-info.json',JSON.stringify({source:'Notion',exportedAt:source.exportedAt,projects:projects.length,basePath:base},null,2));
console.log(`Built ${projects.length} project pages + portfolio at ${base}/`);
