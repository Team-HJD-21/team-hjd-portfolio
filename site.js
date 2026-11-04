const documentViewer=document.querySelector('#document-viewer');
const projectViewer=document.querySelector('#project-viewer');
const projectContent=document.querySelector('#project-content');
const cache=new Map();
let request,projectOrigin,documentOrigin,pointerOrigin;
const captureOrigin=link=>({link,url:location.href,x:scrollX,y:scrollY,panel:projectContent?.scrollTop??0});
function rememberOrigin(link){const origin=pointerOrigin?.link===link?pointerOrigin:captureOrigin(link);pointerOrigin=null;return origin;}
function restoreOrigin(origin){if(!origin||origin.url!==location.href)return;origin.link?.focus({preventScroll:true});if(projectViewer?.open)projectContent.scrollTop=origin.panel;window.scrollTo(origin.x,origin.y);}
document.addEventListener('pointerdown',event=>{const link=event.target.closest('a.project-open,a[data-preview]');pointerOrigin=link&&event.button===0?captureOrigin(link):null;});
function syncScrollLock(){document.body.classList.toggle('modal-open',[documentViewer,projectViewer].some(dialog=>dialog?.open));}
function openDocument(link){
 documentOrigin=rememberOrigin(link);
 documentViewer.classList.toggle('portrait-preview',link.classList.contains('profile-portrait'));
 document.querySelector('#document-title').textContent=link.dataset.documentTitle;
 const image=document.querySelector('#document-image');image.src=link.dataset.preview;image.alt=link.dataset.documentTitle;
 document.querySelector('#document-original').href=link.href;
 documentViewer.showModal();syncScrollLock();
}
async function openProject(link){
 projectOrigin=rememberOrigin(link);
 request?.abort();const controller=new AbortController();request=controller;
 document.querySelector('#project-title').textContent=link.dataset.projectLabel;
 projectContent.replaceChildren();
 const loading=document.createElement('p');loading.className='preview-status';loading.textContent='프로젝트를 불러오는 중…';projectContent.append(loading);
 projectViewer.showModal();projectContent.scrollTop=0;syncScrollLock();
 try{
  let markup=cache.get(link.href);
  if(!markup){
   const response=await fetch(link.href,{signal:controller.signal});
   if(!response.ok)throw Error('Project unavailable');
   const page=new DOMParser().parseFromString(await response.text(),'text/html');
   const content=page.querySelector('.project-page>.shell');
   if(!content)throw Error('Missing project content');
   content.querySelectorAll('.back-link,.next-project,.project-aside,.project-heading h1,.project-heading>p:not(.eyebrow)').forEach(node=>node.remove());
   markup=content.innerHTML;cache.set(link.href,markup);
  }
  if(controller.signal.aborted||!projectViewer.open)return;
  projectContent.innerHTML=markup;projectContent.scrollTop=0;
 }catch(error){
  if(error.name==='AbortError'||!projectViewer.open)return;
  const paragraph=document.createElement('p');paragraph.className='preview-status';paragraph.textContent='자료를 불러오지 못했습니다. ';
  const fallback=document.createElement('a');fallback.href=link.href;fallback.textContent='프로젝트 페이지 열기 ↗';paragraph.append(fallback);projectContent.replaceChildren(paragraph);
 }
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a');
 if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey){pointerOrigin=null;return;}
 if(link.dataset.preview&&documentViewer){event.preventDefault();openDocument(link);}
 else if(link.classList.contains('project-open')&&projectViewer){event.preventDefault();openProject(link);}
});
document.querySelector('#document-close')?.addEventListener('click',()=>documentViewer.close());
document.querySelector('#project-close')?.addEventListener('click',()=>projectViewer.close());
for(const dialog of [documentViewer,projectViewer]){
 dialog?.addEventListener('close',()=>{if(dialog===projectViewer){request?.abort();projectContent.replaceChildren();}syncScrollLock();restoreOrigin(dialog===projectViewer?projectOrigin:documentOrigin);});
 dialog?.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const box=dialog.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
 });
}
