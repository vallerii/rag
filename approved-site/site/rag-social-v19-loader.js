(()=>{
let template=null,loading=false,initialized=false,mounting=false;
function findOldSection(){
 const heading=[...document.querySelectorAll('h1,h2,h3,h4')].find(el=>/Ihr Betrieb hat ein Gesicht/i.test(el.textContent||'')&&!el.closest('.rag-story'));
 if(!heading)return null;
 const section=heading.closest('section');
 if(section){const txt=section.textContent||'';if(txt.includes('Social Media entdecken')&&!txt.includes('Alle Kanäle sollten')&&txt.length<9000)return section;}
 const candidates=[];
 for(let node=heading.parentElement;node&&node!==document.body;node=node.parentElement){
   const txt=node.textContent||'';if(txt.includes('Social Media entdecken'))candidates.push(node);if(txt.length>15000)break;
 }
 const target=candidates[0]||section;if(!target)return null;
 const txt=target.textContent||'';if(txt.includes('Alle Kanäle sollten')||txt.length>13000)return null;
 return target;
}
async function getTemplate(){
 if(template)return template;if(loading)return null;loading=true;
 try{const res=await fetch('/rag-social-v19.html',{cache:'no-cache'});if(!res.ok)throw new Error('Social template returned '+res.status);template=new DOMParser().parseFromString(await res.text(),'text/html');return template;}
 catch(err){console.warn('[RAG Social]',err);return null;}finally{loading=false}
}
async function mount(){
 if(mounting||document.querySelector('#rag-story[data-rag-live-v19]'))return;
 const target=findOldSection();if(!target)return;mounting=true;
 try{
  const doc=await getTemplate();if(!doc||!target.isConnected)return;
  const next=doc.querySelector('#rag-story');if(!next)return;next.dataset.ragLiveV19='1';
  if(!document.getElementById('rag-social-v19-styles')){
   const style=document.createElement('style');style.id='rag-social-v19-styles';style.textContent=doc.querySelector('style')?.textContent||'';document.head.appendChild(style);
   const font=document.createElement('link');font.rel='stylesheet';font.dataset.ragSocialFonts='1';font.href='https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap';document.head.appendChild(font);
  }
  target.replaceWith(next);
  const dialog=doc.querySelector('#rag-article-dialog');if(dialog&&!document.getElementById('rag-article-dialog'))document.body.appendChild(dialog);
  if(!initialized){initialized=true;for(const old of doc.querySelectorAll('script')){if(!old.textContent?.trim())continue;const script=document.createElement('script');script.textContent=old.textContent;document.body.appendChild(script);}}
 }finally{mounting=false}
}
const observer=new MutationObserver(()=>{if(!document.querySelector('#rag-story[data-rag-live-v19]'))mount()});
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.addEventListener('load',mount,{once:true});
})();