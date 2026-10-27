'use strict';

const fish={nerka:'Нерка',paltus:'Палтус',golets:'Голец',forel:'Форель'};
const labels={nerka:'Выбрать нерку',paltus:'Выбрать палтуса',golets:'Выбрать гольца',forel:'Выбрать форель'};
const photos=[
  {id:'coast-hero',caption:'Копчёная красная и белая рыба. Светлый вариант подачи.'},
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
function symbol(name){name='icon-'+name;return '<svg aria-hidden="true"><use href="#'+name+'"/></svg>';}
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

function updateOrder(){
  clearTimeout(copyTimer);
  document.querySelector('#copy-order').innerHTML='Скопировать заказ '+symbol('right');
  copyStatus.classList.remove('is-error');
  document.querySelector('#mobile-order-button').hidden=!selected.length;
  document.querySelectorAll('[data-count]').forEach(el=>el.textContent=String(selected.length));
  document.querySelectorAll('[data-add]').forEach(button=>{
    const active=selected.includes(button.dataset.add);
    button.setAttribute('aria-pressed',String(active));
    button.innerHTML='<span>'+(active?'В заказе':'Добавить')+'</span>'+symbol(active?'check':'plus');
    button.setAttribute('aria-label',(active?'Убрать из заказа: ':'Выбрать: ')+fish[button.dataset.add]);
  });
  const list=document.querySelector('#order-items');
  list.replaceChildren();
  if(!selected.length){
    const empty=document.createElement('p');
    empty.className='empty-order';
    empty.textContent='Пока ничего не выбрано. Добавьте понравившуюся рыбу из каталога.';
    list.append(empty);
  }else{
    selected.forEach(id=>{
      const item=document.createElement('div');
      item.className='order-item';
      const name=document.createElement('span');
      name.textContent=fish[id];
      const remove=document.createElement('button');
      remove.type='button';remove.dataset.remove=id;
      remove.setAttribute('aria-label','Убрать из заказа: '+fish[id]);
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
  if(target.hasAttribute('data-open-order'))openDialog(orderDialog);
  if(target.hasAttribute('data-lightbox')){
    const index=photos.findIndex(photo=>photo.id===target.dataset.lightbox);
    if(index>=0){showPhoto(index);openDialog(photoDialog);}
  }
  if(target.hasAttribute('data-open-video')){
    openDialog(videoDialog);
    video.play()?.catch(()=>{/* Native controls remain available. */});
  }
});
comment.addEventListener('input',()=>{
  persist();
  clearTimeout(copyTimer);
  copyStatus.textContent='';
  document.querySelector('#copy-order').innerHTML='Скопировать заказ '+symbol('right');
});
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
    copyStatus.textContent='Заказ скопирован. Вставьте его в сообщение Роману.';
    button.innerHTML='Заказ скопирован '+symbol('check');
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
    copyTimer=setTimeout(()=>button.innerHTML='Скопировать заказ '+symbol('right'),3500);
  }
});
updateOrder();


const menu=document.querySelector('#menu-dialog');
const menuButton=document.querySelector('#menu-button');
menuButton.addEventListener('click',()=>{
  openDialog(menu);menuButton.setAttribute('aria-expanded','true');
  if(window.gsap&&!reduced.matches)gsap.fromTo(menu.querySelectorAll('nav a'),{y:12,opacity:0},{y:0,opacity:1,stagger:.06,duration:.35,ease:'power3.out',clearProps:'opacity,transform'});
});
menu.addEventListener('close',()=>menuButton.setAttribute('aria-expanded','false'));
menu.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>menu.close()));

const products=[...document.querySelectorAll('.product-card')];
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  let visible=0;
  products.forEach(product=>{
    product.hidden=button.dataset.filter!=='all'&&product.dataset.kind!==button.dataset.filter;
    if(!product.hidden)visible++;
  });
  if(window.gsap){gsap.killTweensOf(products);gsap.set(products,{clearProps:'opacity,transform'});}
  document.querySelector('#filter-status').textContent='Показано видов рыбы: '+visible+'.';
  if(window.ScrollTrigger)ScrollTrigger.refresh();
}));

const navLinks=[...document.querySelectorAll('.desktop-nav a')];
const navObserver=new IntersectionObserver(entries=>{
  const visible=entries.filter(entry=>entry.isIntersecting);
  if(!visible.length)return;
  const id=visible[visible.length-1].target.id;
  navLinks.forEach(link=>{if(link.hash==='#'+id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
},{rootMargin:'-15% 0px -65% 0px',threshold:0});
navLinks.forEach(link=>navObserver.observe(document.querySelector(link.hash)));
navObserver.observe(document.querySelector('#top'));

if(window.gsap){
  if(window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  const mm=gsap.matchMedia();
  mm.add('(prefers-reduced-motion:no-preference)',()=>{
    gsap.timeline({defaults:{duration:.7,ease:'power3.out'}})
      .from('.header-inner>*',{opacity:0,y:6,stagger:.06},0)
      .from('.hero-place',{opacity:0,y:6},.08)
      .from('.hero h1',{opacity:0,y:6},.14)
      .from('.hero-description',{opacity:0,y:6},.2)
      .fromTo('.hero-cta',{opacity:0,y:6},{opacity:1,y:0,clearProps:'opacity,transform'},.26)
      .from('.hero-personal',{opacity:0,y:6},.32)
      .from('.hero-visual',{opacity:0,y:12},.2);
    const units=gsap.utils.toArray('.reveal');
    gsap.set(units,{opacity:0,y:16});
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).map(entry=>entry.target);
      if(!visible.length)return;
      gsap.to(visible,{opacity:1,y:0,duration:.7,stagger:.08,ease:'power3.out',clearProps:'opacity,transform'});
      visible.forEach(unit=>observer.unobserve(unit));
    },{threshold:.12});
    units.forEach(unit=>observer.observe(unit));
    if(window.ScrollTrigger)gsap.fromTo('.word-reveal span',{opacity:.35},{opacity:1,stagger:.13,duration:.45,ease:'power2.out',scrollTrigger:{trigger:'.word-reveal',start:'top 85%',once:true}});
    return()=>observer.disconnect();
  });
  if(window.ScrollTrigger)document.fonts.ready.then(()=>ScrollTrigger.refresh());
}
