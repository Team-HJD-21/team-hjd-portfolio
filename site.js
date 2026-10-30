const filters=[...document.querySelectorAll('[data-filter]')];
const cards=[...document.querySelectorAll('#project-grid [data-category]')];
const search=document.querySelector('#project-search');
let selected='all';
function update(){
 const query=(search?.value??'').trim().toLocaleLowerCase();let count=0;
 for(const card of cards){const visible=(selected==='all'||card.dataset.category===selected)&&card.dataset.title.includes(query);card.hidden=!visible;if(visible)count++;}
 const countNode=document.querySelector('#result-count');if(countNode)countNode.textContent=count;
 const empty=document.querySelector('#empty-search');if(empty)empty.hidden=count>0;
}
for(const button of filters)button.addEventListener('click',()=>{selected=button.dataset.filter;for(const item of filters){const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));}update();});
search?.addEventListener('input',update);
