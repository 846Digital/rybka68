'use strict';

const fish={nerka:'Нерка',paltus:'Палтус',golets:'Голец',forel:'Форель'};
const labels={nerka:'Выбрать нерку',paltus:'Выбрать палтуса',golets:'Выбрать гольца',forel:'Выбрать форель'};
let photoVersion=0;
const photos=[
  {id:'federation-fish',caption:'Красная и белая копчёная рыба. Стилизованная фотокомпозиция.'},
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
  {id:'roman-original-1',caption:'Рыба на столе. Оригинальный кадр из профиля.',original:true},
  {id:'roman-original-2',caption:'Ассортимент. Оригинальное изображение из профиля.',original:true},
  {id:'roman-original-3',caption:'Рыба в оригинальной съёмке.',original:true},
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

const closingDialogs=new WeakSet();
function motionEnabled(){return Boolean(window.gsap)&&!reduced.matches;}
function finishClose(dialog){
  if(window.gsap)gsap.killTweensOf(dialog);
  closingDialogs.delete(dialog);
  dialog.classList.remove('is-closing');
  if(dialog.open)dialog.close();
  if(window.gsap)gsap.set(dialog,{clearProps:'opacity,transform'});
}
function closeDialog(dialog){
  if(!dialog.open||closingDialogs.has(dialog))return;
  if(dialog===videoDialog)video.pause();
  if(!motionEnabled()){finishClose(dialog);return;}
  closingDialogs.add(dialog);
  dialog.classList.add('is-closing');
  gsap.killTweensOf(dialog);
  gsap.to(dialog,{opacity:0,x:dialog.id==='menu-dialog'?24:0,y:dialog.id==='menu-dialog'?0:12,duration:.24,ease:'power2.in',onComplete:()=>finishClose(dialog)});
}
function openDialog(dialog){
  const opener=document.activeElement;
  document.querySelectorAll('dialog[open]').forEach(other=>{if(other!==dialog)finishClose(other);});
  openers.set(dialog,opener);
  closingDialogs.delete(dialog);dialog.classList.remove('is-closing');
  if(!dialog.open)dialog.showModal();
  document.documentElement.classList.add('has-modal');
  if(motionEnabled()){
    gsap.killTweensOf(dialog);
    const isMenu=dialog.id==='menu-dialog';
    gsap.fromTo(dialog,{opacity:0,x:isMenu?40:0,y:isMenu?0:20},{opacity:1,x:0,y:0,duration:.55,ease:'power3.out',clearProps:'opacity,transform'});
  }
}

document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog(dialog);});
  dialog.addEventListener('close',()=>{
    if(!document.querySelector('dialog[open]'))document.documentElement.classList.remove('has-modal');
    if(dialog===videoDialog)video.pause();
    const opener=openers.get(dialog);
    if(opener?.isConnected&&opener.getClientRects().length&&!opener.closest('dialog:not([open])'))opener.focus({preventScroll:true});
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)closeDialog(dialog);
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
    gsap.fromTo(item,{opacity:0,x:12},{opacity:1,x:0,duration:.45,ease:'power3.out',clearProps:'opacity,transform'});
    gsap.fromTo(document.querySelectorAll('[data-count]'),{scale:1.18},{scale:1,duration:.55,ease:'power3.out',clearProps:'transform'});
    const button=document.querySelector('[data-add="'+id+'"]');
    button.classList.add('motion-managed');
    gsap.fromTo(button,{scale:.96},{scale:1,duration:.45,ease:'power3.out',clearProps:'transform',onComplete:()=>button.classList.remove('motion-managed')});
  }
}

function showPhoto(index){
  activePhoto=(index+photos.length)%photos.length;
  const photo=photos[activePhoto];
  const img=document.querySelector('#lightbox-image');
  document.querySelector('#photo-error').hidden=true;
  img.alt=photo.caption;
  img.src=''+photo.id+'.webp';
  const version=++photoVersion;
  if(motionEnabled()){
    gsap.killTweensOf(img);
    gsap.set(img,{opacity:0,scale:1.025});
    img.setAttribute('aria-busy','true');
    (img.decode?img.decode():Promise.resolve()).catch(()=>{}).then(()=>{
      if(version!==photoVersion)return;
      img.removeAttribute('aria-busy');
      if(!img.naturalWidth)return;
      if(motionEnabled())gsap.to(img,{opacity:1,scale:1,duration:.5,ease:'power2.out',clearProps:'opacity,transform'});
      else if(window.gsap)gsap.set(img,{clearProps:'opacity,transform'});
    });
  }
  document.querySelector('#lightbox-caption').textContent=photo.caption;
  document.querySelector('#lightbox-position').textContent=(activePhoto+1)+' / '+photos.length;
  document.querySelector('#lightbox-origin').textContent=photo.original?'Оригинальный кадр из профиля':'Стилизованный вариант подачи';
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
  if(target.hasAttribute('data-close'))closeDialog(target.closest('dialog'));
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
  return 'Здравствуйте! Хочу заказать рыбку:\n'+selected.map(id=>'— '+fish[id]).join('\n')+(comment.value.trim()?'\n\nПожелания: '+comment.value.trim():'')+'\n\nПодскажите, пожалуйста, наличие, доступный вес и условия доставки.';
}
document.querySelector('#copy-order').addEventListener('click',async()=>{
  if(!selected.length)return;
  const button=document.querySelector('#copy-order');
  button.disabled=true;button.setAttribute('aria-busy','true');
  copyStatus.textContent='';copyStatus.classList.remove('is-error');
  try{
    await navigator.clipboard.writeText(orderText());
    copyStatus.textContent='Заказ скопирован. Вставьте его в сообщение магазину.';
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
menu.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>closeDialog(menu)));


const catalog=[{"id": "nerka", "name": "Нерка", "kind": "red", "category": "Красная рыба", "description": "Насыщенный вкус и плотное красное филе.", "pairing": "Подайте с бородинским хлебом и долькой лимона.", "detail": "Тонкие ломтики для закуски или несколько кусочков к ужину. Желаемый вес можно указать в пожеланиях к заказу."}, {"id": "paltus", "name": "Палтус", "kind": "white", "category": "Белая рыба", "description": "Нежное белое мясо с мягкой текстурой.", "pairing": "Попробуйте со свежим хлебом, зеленью и лимоном.", "detail": "К общей рыбной доске или отдельной закуске. Укажите в заказе, сколько рыбы хотите взять; наличие и доступный вес подтвердят лично."}, {"id": "golets", "name": "Голец", "kind": "red", "category": "Красная рыба", "description": "Золотистая кожица и деликатное мясо.", "pairing": "К домашнему ужину или на рыбную доску для компании.", "detail": "Можно выбрать один вид или собрать ассорти из нескольких рыб. Вид копчения и доступные кусочки уточняются при заказе."}, {"id": "forel", "name": "Форель", "kind": "red", "category": "Красная рыба", "description": "Мягкий вкус и нежные красные ломтики.", "pairing": "Хороша на ржаных тостах со сливочным сыром.", "detail": "Для завтраков, небольших закусок и любимого хлеба. В пожеланиях можно указать вес и предпочтения по нарезке; возможность подтвердят при заказе."}];
// Anchor clicks use one cancellable tween; wheel and touch scrolling stay native.
let anchorTween;
let stopAnchor=()=>{};
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link||link.classList.contains('skip-link'))return;
  const hash=link.getAttribute('href');
  const target=hash.length>1?document.getElementById(hash.slice(1)):null;
  if(!target)return;
  event.preventDefault();stopAnchor();
  const headerHeight=document.querySelector('.site-header').getBoundingClientRect().height;
  const destination=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,target.getBoundingClientRect().top+scrollY-headerHeight-24));
  if(location.hash!==hash)history.pushState(null,'',hash);
  const focusTarget=()=>{
    const heading=target.querySelector('h1,h2')||target;
    const hadTabindex=heading.hasAttribute('tabindex');
    if(!hadTabindex)heading.tabIndex=-1;
    heading.focus({preventScroll:true});
    if(!hadTabindex)heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true});
  };
  if(!motionEnabled()){scrollTo({top:destination,behavior:'instant'});focusTarget();return;}
  const position={y:scrollY};
  let finished=false;
  const cleanup=()=>{
    removeEventListener('wheel',cancel);
    removeEventListener('touchstart',cancel);
    removeEventListener('keydown',cancelKey);
    stopAnchor=()=>{};
  };
  const cancel=()=>{if(finished)return;finished=true;anchorTween?.kill();cleanup();};
  const cancelKey=event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))cancel();};
  stopAnchor=cancel;
  addEventListener('wheel',cancel,{passive:true});
  addEventListener('touchstart',cancel,{passive:true});
  addEventListener('keydown',cancelKey);
  anchorTween=gsap.to(position,{id:'smoke-anchor',y:destination,duration:Math.min(1.25,Math.max(.75,Math.abs(destination-scrollY)/2200)),ease:'power3.inOut',onUpdate:()=>scrollTo({top:position.y,behavior:'instant'}),onComplete:()=>{finished=true;cleanup();focusTarget();}});
});

const productDialog=document.querySelector('#product-dialog');
const products=[...document.querySelectorAll('.product-card')];
let detailProduct='nerka';

function showProduct(id){
  const product=catalog.find(item=>item.id===id);
  if(!product)return;
  detailProduct=id;
  document.querySelector('#product-detail-title').textContent=product.name;
  document.querySelector('#product-detail-category').textContent=product.category;
  document.querySelector('#product-detail-description').textContent=product.description;
  document.querySelector('#product-detail-pairing').textContent=product.pairing;
  document.querySelector('#product-detail-text').textContent=product.detail;
  ['main','detail'].forEach(type=>{
    const image=document.querySelector('#product-detail-'+type);
    image.src=''+id+'-'+type+'.webp';
    image.alt=product.name+(type==='detail'?', фактура крупным планом':', стилизованный вариант подачи');
  });
  document.querySelector('#product-detail-add').dataset.add=id;
  updateOrder();
  openDialog(productDialog);
}

document.querySelectorAll('[data-detail]').forEach(button=>button.addEventListener('click',()=>showProduct(button.dataset.detail)));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  const kind=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  let count=0;
  products.forEach(product=>{product.hidden=kind!=='all'&&product.dataset.kind!==kind;if(!product.hidden)count++;});
  document.querySelector('#filter-status').textContent='Показано товаров: '+count;
  if(motionEnabled()){
    const shown=products.filter(item=>!item.hidden);
    gsap.killTweensOf(products);
    shown.forEach(item=>item.dataset.revealed='true');
    gsap.fromTo(shown,{opacity:0,y:12},{opacity:1,y:0,duration:.6,stagger:.06,ease:'power3.out',clearProps:'opacity,transform'});
  }
  if(window.ScrollTrigger)ScrollTrigger.refresh();
}));

const rail=document.querySelector('#serving-rail');
function updateRailControls(){
  const max=rail.scrollWidth-rail.clientWidth;
  document.querySelector('.rail-controls').hidden=max<2;
  document.querySelector('[data-rail="prev"]').disabled=rail.scrollLeft<=2;
  document.querySelector('[data-rail="next"]').disabled=rail.scrollLeft>=max-2;
}
rail.addEventListener('scroll',updateRailControls,{passive:true});
new ResizeObserver(updateRailControls).observe(rail);
updateRailControls();
document.querySelectorAll('[data-rail]').forEach(button=>button.addEventListener('click',()=>{
  const direction=button.dataset.rail==='next'?1:-1;
  rail.scrollBy({left:direction*(rail.querySelector('figure').getBoundingClientRect().width+32),behavior:reduced.matches?'instant':'smooth'});
}));

document.querySelectorAll('.faq details').forEach(detail=>detail.addEventListener('toggle',()=>{
  if(detail.open&&motionEnabled())gsap.fromTo(detail.querySelector('p'),{opacity:0,y:8},{opacity:1,y:0,duration:.4,ease:'power2.out',clearProps:'opacity,transform'});
}));

if(window.gsap){
  if(window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  const mm=gsap.matchMedia();
  mm.add('(prefers-reduced-motion:no-preference)',()=>{
    const intro=gsap.timeline({id:'federation-intro',defaults:{ease:'power3.out'}});
    intro.from('.poster-top,.poster-word',{opacity:0,y:18,duration:.75,stagger:.08},0)
      .from('.poster-visual>img',{opacity:0,y:32,rotation:-3,duration:1.1},.15)
      .from('.poster-place',{opacity:0,y:12,duration:.7},.5)
      .from('.poster-bottom',{opacity:0,y:12,duration:.7},.65);
    const pending=products.filter(item=>item.dataset.revealed!=='true');
    gsap.set(pending,{opacity:0,y:20});
    const observer=new IntersectionObserver(entries=>{
      const shown=[];
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        observer.unobserve(entry.target);
        if(entry.target.dataset.revealed==='true')return;
        entry.target.dataset.revealed='true';shown.push(entry.target);
      });
      if(shown.length)gsap.to(shown,{opacity:1,y:0,duration:.75,stagger:.08,ease:'power3.out',clearProps:'opacity,transform'});
    },{threshold:.12});
    pending.forEach(item=>observer.observe(item));
    return()=>observer.disconnect();
  });
  mm.add('(min-width:961px) and (prefers-reduced-motion:no-preference)',()=>{
    if(!window.ScrollTrigger)return;
    gsap.to('.poster-visual',{yPercent:12,rotation:2,ease:'none',scrollTrigger:{id:'federation-poster',trigger:'.poster',start:'top top',end:'bottom top',scrub:1.2}});
  });
  if(window.ScrollTrigger){document.fonts.ready.then(()=>ScrollTrigger.refresh());addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});}
}

reduced.addEventListener('change',event=>{
  if(!event.matches)return;
  stopAnchor();
  document.querySelectorAll('dialog[open]').forEach(dialog=>{
    if(closingDialogs.has(dialog))finishClose(dialog);
    else if(window.gsap){gsap.killTweensOf(dialog);gsap.set(dialog,{clearProps:'opacity,transform'});}
  });
  if(window.gsap){
    gsap.killTweensOf(products);
    gsap.set(products,{clearProps:'opacity,transform'});
    const image=document.querySelector('#lightbox-image');gsap.killTweensOf(image);gsap.set(image,{clearProps:'opacity,transform'});
    document.querySelectorAll('.motion-managed').forEach(el=>{gsap.killTweensOf(el);gsap.set(el,{clearProps:'opacity,transform'});el.classList.remove('motion-managed');});
  }
});
