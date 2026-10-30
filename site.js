const cards=[...document.querySelectorAll('#project-grid [data-category]')];
const search=document.querySelector('#project-search');
function update(){
 const query=(search?.value??'').trim().toLocaleLowerCase();let count=0;
 for(const card of cards){const visible=card.dataset.title.includes(query);card.hidden=!visible;if(visible)count++;}
 for(const group of document.querySelectorAll('[data-project-group]'))group.hidden=![...group.querySelectorAll('article')].some(card=>!card.hidden);
 const countNode=document.querySelector('#result-count');if(countNode)countNode.textContent=count;
 const empty=document.querySelector('#empty-search');if(empty)empty.hidden=count>0;
}
search?.addEventListener('input',update);
const viewer=document.querySelector('#document-viewer');
for(const link of document.querySelectorAll('[data-preview]'))link.addEventListener('click',event=>{
 if(event.ctrlKey||event.metaKey||event.shiftKey||!viewer)return;
 event.preventDefault();
 document.querySelector('#document-title').textContent=link.dataset.documentTitle;
 const image=document.querySelector('#document-image');image.src=link.dataset.preview;image.alt=link.dataset.documentTitle;
 document.querySelector('#document-original').href=link.href;
 viewer.showModal();
});
document.querySelector('#document-close')?.addEventListener('click',()=>viewer.close());
viewer?.addEventListener('click',event=>{if(event.target===viewer)viewer.close();});
