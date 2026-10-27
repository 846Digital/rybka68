'use strict';

const fish={nerka:'Нерка',paltus:'Палтус',golets:'Голец',forel:'Форель'};
const labels={nerka:'Выбрать нерку',paltus:'Выбрать палтуса',golets:'Выбрать гольца',forel:'Выбрать форель'};
const photos=[
  {id:'smoke-hero',caption:'Красная и белая рыба. Идея подачи ассорти.'},
  {id:'nerka-main',caption:'Нерка. Вариант подачи на деревянной доске.'},
  {id:'nerka-detail',caption:'Нерка. Фактура крупным планом.'},
  {id:'paltus-main',caption:'Палтус. Вариант подачи.'},
  {id:'paltus-detail',caption:'Палтус. Нежная фактура белого мяса.'},
  {id:'golets-main',caption:'Голец. Рыба с золотистой кожицей.'},
  {id:'golets-detail',caption:'Голец. Срез крупным планом.'},
  {id:'forel-main',caption:'Форель. Вариант подачи.'},
  {id:'forel-detail',caption:'Форель. Тонкие ломтики крупным планом.'},
  {id:'roman-original-1',caption:'Роман за своим рыбным столом.',original:true},
  {id:'roman-original-2',caption:'Роман. Оригинальное изображение из профиля.',original:true},
  {id:'roman-original-3',caption:'Роман и его рыба. Оригинальная съёмка.',original:true},
  {id:'table-friends',caption:'Идея подачи: рыбная доска для общего стола.'},
  {id:'breakfast',caption:'Идея подачи: ржаной тост с форелью.'},
  {id:'sharing-board',caption:'Идея подачи: белая рыба, хлеб и лимон.'}
];
const storageKey='vkusnaya-rybka-order-v1';
const panel=document.querySelector('#order-panel');
const orderDialog=document.querySelector('#order-dialog');
const photoDialog=document.querySelector('#lightbox-dialog');
const videoDialog=document.querySelector('#video-dialog');
const video=document.querySelector('#roman-video');
const comment=document.querySelector('#order-comment');
const copyStatus=document.querySelector('#copy-status');
const desktop=matchMedia('(min-width:1200px)');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const openers=new WeakMap();
let selected=[];
let activePhoto=0;
let copyTimer;

try{
  const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');
  selected=Array.isArray(saved.items)?[...new Set(saved.items.filter(id=>Object.hasOwn(fish,id)))]:[];
  comment.value=typeof saved.comment==='string'?saved.comment.slice(0,1000):'';
}catch{/* Browser storage is optional. */}

function persist(){
  try{localStorage.setItem(storageKey,JSON.stringify({items:selected,comment:comment.value}));}catch{/* The current list stays usable. */}
}
function symbol(name){return '<svg aria-hidden="true"><use href="#'+name+'"/></svg>';}
function openDialog(dialog){
  const opener=document.activeElement;
  document.querySelectorAll('dialog[open]').forEach(other=>{if(other!==dialog)other.close();});
  openers.set(dialog,opener);
  if(!dialog.open)dialog.showModal();
  document.documentElement.classList.add('has-modal');
}
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{
    if(!document.querySelector('dialog[open]'))document.documentElement.classList.remove('has-modal');
    if(dialog===videoDialog)video.pause();
    const opener=openers.get(dialog);
    if(opener?.isConnected&&opener.getClientRects().length&&!opener.closest('dialog:not([open])'))opener.focus({preventScroll:true});
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
  });
});
videoDialog.addEventListener('cancel',()=>video.pause());

function placeOrder(){
  if(desktop.matches){
    if(orderDialog.open)orderDialog.close();
    document.querySelector('#order-desk').append(panel);
  }else{
    document.querySelector('#mobile-order-slot').append(panel);
  }
}
desktop.addEventListener('change',placeOrder);
placeOrder();
document.querySelector('#mobile-order-button').hidden=false;

function updateOrder(){
  document.querySelectorAll('[data-count]').forEach(el=>el.textContent=String(selected.length));
  document.querySelectorAll('[data-add]').forEach(button=>{
    const active=selected.includes(button.dataset.add);
    button.setAttribute('aria-pressed',String(active));
    button.innerHTML='<span>'+(active?'Выбрано к столу':labels[button.dataset.add])+'</span>'+symbol(active?'check':'plus');
    button.setAttribute('aria-label',(active?'Убрать из списка: ':'Выбрать: ')+fish[button.dataset.add]);
  });
  const list=document.querySelector('#order-items');
  list.replaceChildren();
  if(!selected.length){
    const empty=document.createElement('p');
    empty.className='empty-order';
    empty.textContent='Выберите рыбку на прилавке — она появится здесь.';
    list.append(empty);
  }else{
    selected.forEach(id=>{
      const item=document.createElement('div');
      item.className='order-item';
      const name=document.createElement('span');
      name.textContent=fish[id];
      const remove=document.createElement('button');
      remove.type='button';remove.dataset.remove=id;
      remove.setAttribute('aria-label','Убрать из списка: '+fish[id]);
      remove.innerHTML=symbol('close');
      item.append(name,remove);list.append(item);
    });
  }
  document.querySelector('#copy-order').disabled=!selected.length;
  copyStatus.textContent='';
  document.querySelector('#order-text').hidden=true;
  document.querySelector('#order-text-label').hidden=true;
  persist();
}

function toggleFish(id){
  if(!Object.hasOwn(fish,id))return;
  const added=!selected.includes(id);
  selected=added?[...selected,id]:selected.filter(value=>value!==id);
  updateOrder();
  document.querySelector('#cart-status').textContent=fish[id]+(added?' добавлена в список.':' убрана из списка.')+' Выбрано видов: '+selected.length+'.';
  if(added&&window.gsap&&!reduced.matches){
    const item=document.querySelector('#order-items .order-item:last-child');
    gsap.fromTo(item,{opacity:.3,x:8},{opacity:1,x:0,duration:.3,ease:'power3.out',clearProps:'opacity,transform'});
  }
}

function showPhoto(index){
  activePhoto=(index+photos.length)%photos.length;
  const photo=photos[activePhoto];
  const img=document.querySelector('#lightbox-image');
  document.querySelector('#photo-error').hidden=true;
  img.alt=photo.caption;
  img.src=''+photo.id+'.webp';
  document.querySelector('#lightbox-caption').textContent=photo.caption;
  document.querySelector('#lightbox-position').textContent=(activePhoto+1)+' / '+photos.length;
  document.querySelector('#lightbox-origin').textContent=photo.original?'Оригинальный кадр из профиля':'Стилизованная композиция · Вариант подачи';
}
document.querySelector('#lightbox-image').addEventListener('error',()=>document.querySelector('#photo-error').hidden=false);
document.querySelector('#lightbox-prev').addEventListener('click',()=>showPhoto(activePhoto-1));
document.querySelector('#lightbox-next').addEventListener('click',()=>showPhoto(activePhoto+1));
photoDialog.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
    event.preventDefault();showPhoto(activePhoto+(event.key==='ArrowRight'?1:-1));
  }
});
document.addEventListener('click',event=>{
  const target=event.target.closest('button');
  if(!target)return;
  if(target.hasAttribute('data-close'))target.closest('dialog').close();
  if(target.hasAttribute('data-add'))toggleFish(target.dataset.add);
  if(target.hasAttribute('data-remove')){
    toggleFish(target.dataset.remove);
    document.querySelector('#order-items [data-remove],#order-comment')?.focus({preventScroll:true});
  }
  if(target.hasAttribute('data-open-order')){
    if(desktop.matches){panel.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest'});comment.focus({preventScroll:true});}
    else openDialog(orderDialog);
  }
  if(target.hasAttribute('data-lightbox')){
    const index=photos.findIndex(photo=>photo.id===target.dataset.lightbox);
    if(index>=0){showPhoto(index);openDialog(photoDialog);}
  }
  if(target.hasAttribute('data-open-video')){
    openDialog(videoDialog);
    video.play()?.catch(()=>{/* Native controls remain available. */});
  }
});
comment.addEventListener('input',persist);
function orderText(){
  return 'Здравствуйте, Роман! Хочу заказать рыбку:\n'+selected.map(id=>'— '+fish[id]).join('\n')+(comment.value.trim()?'\n\nПожелания: '+comment.value.trim():'')+'\n\nПодскажите, пожалуйста, наличие, доступный вес и условия доставки.';
}
document.querySelector('#copy-order').addEventListener('click',async()=>{
  if(!selected.length)return;
  const button=document.querySelector('#copy-order');
  button.disabled=true;button.setAttribute('aria-busy','true');
  copyStatus.textContent='';copyStatus.classList.remove('is-error');
  try{
    await navigator.clipboard.writeText(orderText());
    copyStatus.textContent='Список скопирован. Вставьте его в сообщение Роману.';
    button.innerHTML='Список скопирован '+symbol('check');
  }catch{
    const field=document.querySelector('#order-text');
    field.value=orderText();field.hidden=false;
    document.querySelector('#order-text-label').hidden=false;
    field.focus();field.select();
    copyStatus.textContent='Автокопирование недоступно. Скопируйте выделенный список ниже.';
    copyStatus.classList.add('is-error');
  }finally{
    button.disabled=!selected.length;button.removeAttribute('aria-busy');
    clearTimeout(copyTimer);
    copyTimer=setTimeout(()=>button.innerHTML='Скопировать список '+symbol('right'),3500);
  }
});
updateOrder();

const track=document.querySelector('#serving-track');
const previous=document.querySelector('#scenes-prev');
const next=document.querySelector('#scenes-next');
function scrollScenes(direction){
  const scene=track.querySelector('.serving-scene');
  const step=scene.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap);
  track.scrollBy({left:direction*step,behavior:reduced.matches?'instant':'smooth'});
}
function sceneControls(){
  previous.disabled=track.scrollLeft<2;
  next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;
}
previous.addEventListener('click',()=>scrollScenes(-1));
next.addEventListener('click',()=>scrollScenes(1));
let sceneFrame;
track.addEventListener('scroll',()=>{cancelAnimationFrame(sceneFrame);sceneFrame=requestAnimationFrame(sceneControls);},{passive:true});
new ResizeObserver(sceneControls).observe(track);
sceneControls();

const navLinks=[...document.querySelectorAll('.rail-nav a')];
const navObserver=new IntersectionObserver(entries=>{
  const visible=entries.filter(entry=>entry.isIntersecting);
  if(!visible.length)return;
  const id=visible[visible.length-1].target.id;
  navLinks.forEach(link=>{if(link.hash==='#'+id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
},{rootMargin:'-10% 0px -65% 0px',threshold:0});
navLinks.forEach(link=>navObserver.observe(document.querySelector(link.hash)));

if(window.gsap){
  if(window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  const mm=gsap.matchMedia();
  mm.add('(prefers-reduced-motion:no-preference)',()=>{
    gsap.timeline({defaults:{duration:.65,ease:'power3.out'}})
      .from('.topline>*',{opacity:0,y:6,stagger:.06},0)
      .from('.masthead h1>span',{opacity:0,y:6,stagger:.06},.12)
      .from('.masthead-copy',{opacity:0,y:6},.28);
    const images=gsap.utils.toArray('.photo-enter');
    gsap.set(images,{opacity:0,x:-24});
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        gsap.to(entry.target,{opacity:1,x:0,duration:.75,ease:'power3.out',clearProps:'opacity,transform'});
        observer.unobserve(entry.target);
      });
    },{threshold:.15});
    images.forEach(image=>observer.observe(image));
    let words;
    if(window.ScrollTrigger){
      words=gsap.fromTo('.word-reveal span',{opacity:.3},{opacity:1,duration:.4,stagger:.18,ease:'power3.out',scrollTrigger:{trigger:'.word-reveal',start:'top 90%',end:'bottom 66%',scrub:.5}});
    }
    return()=>{observer.disconnect();words?.kill();};
  });
  if(window.ScrollTrigger)document.fonts.ready.then(()=>ScrollTrigger.refresh());
}
