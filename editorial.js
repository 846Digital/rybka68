'use strict';

const fish = {
  nerka:{name:'Нерка',kind:'Красная рыба',description:'Выразительный вкус красной рыбы и плотное мясо. Попробуйте с бородинским хлебом и долькой лимона.'},
  paltus:{name:'Палтус',kind:'Белая рыба',description:'Нежное белое мясо, которое хочется пробовать неспешно. Хорошо с тёплым хлебом, зеленью и каплей лимонного сока.'},
  golets:{name:'Голец',kind:'Красная рыба',description:'Золотистая кожица, деликатное мясо и характер лососёвой рыбы. Для домашнего ужина и большой общей доски.'},
  forel:{name:'Форель',kind:'Красная рыба',description:'Мягкий знакомый вкус и нежные ломтики. К утреннему тосту, закускам или тарелке, которую поставят в центр стола.'}
};

const photos = [
  {id:'smoke-hero',caption:'Копчёная рыба. С дымком, от Романа.'},
  {id:'nerka-main',caption:'Нерка. Плотное красное филе.'},
  {id:'nerka-detail',caption:'Нерка. Каждый срез крупным планом.'},
  {id:'paltus-main',caption:'Палтус. Нежное белое мясо.'},
  {id:'paltus-detail',caption:'Палтус. Деликатная фактура.'},
  {id:'golets-main',caption:'Голец. Под золотистой кожицей.'},
  {id:'golets-detail',caption:'Голец. Кожица и срез.'},
  {id:'forel-main',caption:'Форель. На тёмной керамике.'},
  {id:'forel-detail',caption:'Форель. Тонкие нежные ломтики.'},
  {id:'roman-original-1',caption:'Роман за своим рыбным столом.',original:true},
  {id:'roman-original-2',caption:'Кадр из оригинального видео Романа.',original:true},
  {id:'roman-original-3',caption:'Рыба и её человек. Оригинальная съёмка.',original:true},
  {id:'table-friends',caption:'Идея подачи: большая рыбная доска для своих.'},
  {id:'breakfast',caption:'Идея подачи: неспешный завтрак с красной рыбой.'},
  {id:'sharing-board',caption:'Идея подачи: белая рыба, лимон и хлеб.'}
];

const storageKey='vkusnaya-rybka-order-v1';
const orderDialog=document.querySelector('#order-dialog');
const menuDialog=document.querySelector('#menu-dialog');
const photoDialog=document.querySelector('#lightbox-dialog');
const videoDialog=document.querySelector('#video-dialog');
const commentField=document.querySelector('#order-comment');
const copyStatus=document.querySelector('#copy-status');
const openers=new WeakMap();
let selected=[];
let activeFish='nerka';
let activePhoto=0;
let copyFeedback;

try{
  const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');
  selected=Array.isArray(saved.items)?[...new Set(saved.items.filter(id=>Object.hasOwn(fish,id)))]:[];
  commentField.value=typeof saved.comment==='string'?saved.comment.slice(0,1000):'';
}catch{ /* The order remains usable without browser storage. */ }

function persist(){
  try{localStorage.setItem(storageKey,JSON.stringify({items:selected,comment:commentField.value}));}catch{ /* Storage is optional. */ }
}

function openDialog(dialog){
  const opener=document.activeElement;
  document.querySelectorAll('dialog[open]').forEach(other=>{if(other!==dialog)other.close();});
  openers.set(dialog,opener);
  if(!dialog.open)dialog.showModal();
  document.documentElement.classList.add('has-modal');
}

document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{
    if(!document.querySelector('dialog[open]'))document.documentElement.classList.remove('has-modal');
    if(dialog===videoDialog){const video=document.querySelector('#roman-video');video.pause();}
    if(dialog===menuDialog)document.querySelector('#menu-button').setAttribute('aria-expanded','false');
    const opener=openers.get(dialog);
    if(opener?.isConnected&&!opener.closest('dialog:not([open])'))opener.focus({preventScroll:true});
  });
});
videoDialog.addEventListener('cancel',()=>document.querySelector('#roman-video').pause());

function updateCart(){
  document.querySelectorAll('[data-count]').forEach(el=>el.textContent=String(selected.length));
  document.querySelector('#floating-order').hidden=!selected.length;
  const add=document.querySelector('#add-fish');
  const inOrder=selected.includes(activeFish);
  add.innerHTML=(inOrder?'Уже в заказе':'В мой заказ')+' <svg aria-hidden="true"><use href="#'+(inOrder?'check':'plus')+'"/></svg>';
  add.setAttribute('aria-label',(inOrder?'Открыть заказ с рыбой: ':'Добавить в заказ: ')+fish[activeFish].name);
  document.querySelector('#order-options').hidden=!selected.length;
  const list=document.querySelector('#order-items');
  list.replaceChildren();
  if(!selected.length){
    const empty=document.createElement('div');
    empty.className='empty-order';
    empty.innerHTML='<p>Пока ни одной рыбки.<br>Давайте найдём вашу.</p><button type="button" class="button button-ink" id="choose-fish">К рыбке <svg aria-hidden="true"><use href="#right"/></svg></button>';
    list.append(empty);
    empty.querySelector('button').addEventListener('click',()=>{
      orderDialog.close();
      document.querySelector('#fish').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      document.querySelector('[data-fish][aria-selected=true]').focus({preventScroll:true});
    });
  }else{
    selected.forEach(id=>{
      const item=document.createElement('div');
      item.className='order-item';
      item.innerHTML=`<img src="${id}-main.webp" width="64" height="72" alt=""><div><h3>${fish[id].name}</h3><span>Вес согласуем лично</span></div><button type="button" data-remove="${id}" aria-label="Убрать из заказа: ${fish[id].name}"><svg aria-hidden="true"><use href="#close"/></svg></button>`;
      list.append(item);
    });
  }
  persist();
}

function addFish(id){
  if(!Object.hasOwn(fish,id))return;
  if(selected.includes(id)){openDialog(orderDialog);return;}
  selected.push(id);
  updateCart();
  document.querySelector('#cart-status').textContent='В заказ добавлена рыба: '+fish[id].name+'. В списке '+selected.length+'.';
}

function selectFish(id,{focus=false}={}){
  if(!Object.hasOwn(fish,id))return;
  activeFish=id;
  document.querySelectorAll('[data-fish]').forEach(button=>{
    const active=button.dataset.fish===id;
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
    if(active&&focus)button.focus({preventScroll:true});
  });
  const main=document.querySelector('#fish-image');
  const detail=document.querySelector('#fish-detail-image');
  main.src=`${id}-main.webp`;
  main.alt=fish[id].name+' — стилизованный вариант подачи';
  detail.src=`${id}-detail.webp`;
  detail.alt=fish[id].name+' крупным планом';
  const enlarge=document.querySelector('#fish-enlarge');
  enlarge.dataset.lightbox=id+'-main';
  enlarge.setAttribute('aria-label','Открыть фото на весь экран: '+fish[id].name);
  const detailEnlarge=document.querySelector('#fish-detail-enlarge');
  detailEnlarge.dataset.lightbox=id+'-detail';
  detailEnlarge.setAttribute('aria-label','Рассмотреть фактуру: '+fish[id].name);
  document.querySelector('#fish-panel').setAttribute('aria-labelledby','tab-'+id);
  document.querySelector('#fish-description').textContent=fish[id].description;
  document.querySelector('#fish-kind').textContent=fish[id].name+' · '+fish[id].kind;
  document.querySelector('#add-fish').dataset.add=id;
  document.querySelector('#fish-status').textContent='Выбрана рыба: '+fish[id].name;
  if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    gsap.killTweensOf([main,detail]);
    gsap.fromTo([main,detail],{opacity:.25},{opacity:1,duration:.35,ease:'power2.out',clearProps:'opacity'});
  }
  updateCart();
}

const fishIds=Object.keys(fish);
document.querySelector('.fish-tabs').addEventListener('keydown',event=>{
  const movement={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
  let next;
  if(event.key==='Home')next=0;
  else if(event.key==='End')next=fishIds.length-1;
  else if(Object.hasOwn(movement,event.key))next=(fishIds.indexOf(activeFish)+movement[event.key]+fishIds.length)%fishIds.length;
  else return;
  event.preventDefault();
  selectFish(fishIds[next],{focus:true});
});

function displayPhoto(index){
  activePhoto=(index+photos.length)%photos.length;
  const photo=photos[activePhoto];
  const img=document.querySelector('#lightbox-image');
  img.src=`${photo.id}.webp`;
  img.alt=photo.caption;
  document.querySelector('#lightbox-caption').textContent=photo.caption;
  document.querySelector('#lightbox-position').textContent=String(activePhoto+1).padStart(2,'0')+' / '+photos.length;
  document.querySelector('#lightbox-origin').textContent=photo.original?'Оригинальный кадр из профиля':'Стилизованная композиция · Вариант подачи';
}

document.querySelector('#lightbox-prev').addEventListener('click',()=>displayPhoto(activePhoto-1));
document.querySelector('#lightbox-next').addEventListener('click',()=>displayPhoto(activePhoto+1));
photoDialog.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
    event.preventDefault();displayPhoto(activePhoto+(event.key==='ArrowRight'?1:-1));
  }
});

document.addEventListener('click',event=>{
  const target=event.target.closest('button,a[data-open-video]');
  if(!target)return;
  if(target.hasAttribute('data-close'))target.closest('dialog').close();
  if(target.hasAttribute('data-open-order'))openDialog(orderDialog);
  if(target.hasAttribute('data-fish'))selectFish(target.dataset.fish);
  if(target.hasAttribute('data-add'))addFish(target.dataset.add);
  if(target.hasAttribute('data-remove')){
    const id=target.dataset.remove;
    selected=selected.filter(value=>value!==id);
    updateCart();
    document.querySelector('#cart-status').textContent=fish[id].name+' убрана из заказа.';
    orderDialog.querySelector('[data-remove],#choose-fish')?.focus({preventScroll:true});
  }
  if(target.hasAttribute('data-lightbox')){
    const index=photos.findIndex(photo=>photo.id===target.dataset.lightbox);
    if(index>=0){displayPhoto(index);openDialog(photoDialog);}
  }
  if(target.hasAttribute('data-open-video')){
    event.preventDefault();
    openDialog(videoDialog);
    const promise=document.querySelector('#roman-video').play();
    if(promise)promise.catch(()=>{ /* Native controls remain available. */ });
  }
});

document.querySelector('#menu-button').addEventListener('click',()=>{
  openDialog(menuDialog);
  document.querySelector('#menu-button').setAttribute('aria-expanded','true');
  if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    gsap.fromTo(menuDialog.querySelectorAll('nav a'),{y:24,opacity:0},{y:0,opacity:1,duration:.24,stagger:.04,ease:'power3.out',clearProps:'all'});
  }
});
menuDialog.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>menuDialog.close()));

commentField.addEventListener('input',persist);
function orderText(){
  return 'Здравствуйте, Роман! Хочу заказать рыбку:\n'+selected.map(id=>'— '+fish[id].name).join('\n')+(commentField.value.trim()?'\n\nПожелания: '+commentField.value.trim():'')+'\n\nПодскажите, пожалуйста, наличие, доступный вес и условия доставки.';
}
document.querySelector('#copy-order').addEventListener('click',async()=>{
  if(!selected.length)return;
  const button=document.querySelector('#copy-order');
  button.disabled=true;
  button.setAttribute('aria-busy','true');
  copyStatus.textContent='';
  copyStatus.classList.remove('is-error');
  try{
    await navigator.clipboard.writeText(orderText());
    document.querySelector('#order-text').hidden=true;
    document.querySelector('#order-text-label').hidden=true;
    copyStatus.textContent='Скопировано. Вставьте список в сообщение Роману.';
    button.innerHTML='Заказ скопирован <svg aria-hidden="true"><use href="#check"/></svg>';
  }catch{
    const field=document.querySelector('#order-text');
    field.value=orderText();
    field.hidden=false;
    document.querySelector('#order-text-label').hidden=false;
    field.focus();field.select();
    copyStatus.textContent='Автокопирование недоступно. Скопируйте выделенный текст ниже.';
    copyStatus.classList.add('is-error');
  }finally{
    button.disabled=false;button.removeAttribute('aria-busy');
    clearTimeout(copyFeedback);
    copyFeedback=setTimeout(()=>button.innerHTML='Скопировать заказ <svg aria-hidden="true"><use href="#right"/></svg>',3500);
  }
});

updateCart();

if(window.gsap){
  if(window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  const mm=gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)',()=>{
    const intro=gsap.timeline({defaults:{duration:.7,ease:'power3.out'}});
    intro.from('.site-header>*',{opacity:0,y:6,stagger:.06},0)
      .from('#cover-title span',{opacity:0,y:6,stagger:.06},.12)
      .from('.cover-description',{opacity:0,y:6},.26)
      .fromTo('.cover .button',{opacity:0,y:6},{opacity:1,y:0,clearProps:'opacity,transform'},.32)
      .from('.cover-side,.cover-bottom',{opacity:0,y:6,stagger:.06},.38);

    const units=gsap.utils.toArray('.reveal-unit');
    gsap.set(units,{opacity:0,y:24});
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).map(entry=>entry.target);
      if(visible.length){
        gsap.to(visible,{opacity:1,y:0,duration:.8,stagger:.06,ease:'power3.out',clearProps:'opacity,transform'});
        visible.forEach(el=>observer.unobserve(el));
      }
    },{threshold:.15});
    units.forEach(el=>observer.observe(el));
    return()=>observer.disconnect();
  });

  if(window.ScrollTrigger){
    mm.add('(min-width:801px) and (prefers-reduced-motion: no-preference)',()=>{
      gsap.fromTo('.word-reveal span',{opacity:.28},{opacity:1,duration:.4,stagger:.12,ease:'power2.out',scrollTrigger:{trigger:'.word-reveal',start:'top 82%',end:'bottom 48%',scrub:.6}});
    });
    document.fonts.ready.then(()=>ScrollTrigger.refresh());
    window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
  }
  mm.add('(max-width:800px) and (prefers-reduced-motion: no-preference)',()=>{
    const words=document.querySelectorAll('.word-reveal span');
    gsap.set(words,{opacity:.28});
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        gsap.to(words,{opacity:1,duration:.3,stagger:.09,ease:'power2.out'});
        observer.disconnect();
      }
    },{threshold:.5});
    observer.observe(document.querySelector('.word-reveal'));
    return()=>observer.disconnect();
  });
}
