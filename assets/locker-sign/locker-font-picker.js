// Keep the original select as the value source; render previews as HTML so
// native OS menus cannot replace every option with the selected typeface.
let lockerOpenFontPicker=null;
function syncLockerFontPicker(select){
 const button=select?.lockerFontButton;if(!button)return;
 button.firstChild.textContent=select.options[select.selectedIndex]?.textContent||select.value;
 button.firstChild.style.fontFamily=getHypeSpinnerFontStack(select.value);
}
function closeLockerFontPicker(restoreFocus=false){
 const picker=lockerOpenFontPicker;if(!picker)return;lockerOpenFontPicker=null;
 picker.button.setAttribute('aria-expanded','false');picker.button.removeAttribute('aria-controls');picker.menu.remove();
 if(restoreFocus&&picker.button.isConnected)picker.button.focus();
}
function attachLockerFontPicker(select){
 if(select.lockerFontButton)return;
 const button=document.createElement('button'),label=document.createElement('span');button.type='button';button.className='locker-font-button';button.append(label);
 button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',['lockerBoxFont','coasterBoxFont'].includes(select.id)?'Text font':'Stick font');
 select.classList.add('hidden');select.setAttribute('aria-hidden','true');select.tabIndex=-1;select.after(button);select.lockerFontButton=button;
 select.addEventListener('input',()=>syncLockerFontPicker(select));select.addEventListener('change',()=>syncLockerFontPicker(select));
 button.addEventListener('click',()=>{if(lockerOpenFontPicker?.button===button)closeLockerFontPicker();else openLockerFontPicker(select);});
 button.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();openLockerFontPicker(select);}});
 syncLockerFontPicker(select);
}
function openLockerFontPicker(select){
 closeLockerFontPicker();const button=select.lockerFontButton,menu=document.createElement('div'),dialog=select.closest('[role=dialog]');
 menu.className='locker-font-menu'+(dialog?' locker-font-menu-light':'');menu.id='lockerFontMenu';menu.setAttribute('role','listbox');menu.setAttribute('aria-label',button.getAttribute('aria-label'));
 const items=[...select.options].map(option=>{
  const item=document.createElement('button');item.type='button';item.className='locker-font-option';item.dataset.lockerFont=option.value;item.textContent=option.textContent;item.style.fontFamily=getHypeSpinnerFontStack(option.value);
  item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.value===select.value));item.tabIndex=option.value===select.value?0:-1;
  item.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));syncLockerFontPicker(select);closeLockerFontPicker(true);});menu.append(item);return item;
 });
 (dialog||document.body).append(menu);const supportsPopover=typeof menu.showPopover==='function';if(supportsPopover){menu.setAttribute('popover','manual');menu.showPopover();}
 lockerOpenFontPicker={button,menu};button.setAttribute('aria-expanded','true');button.setAttribute('aria-controls',menu.id);
 positionLockerFontMenu(menu,button);
 const selected=items.find(item=>item.getAttribute('aria-selected')==='true')||items[0];selected?.focus({preventScroll:true});if(selected)menu.scrollTop=Math.max(0,selected.offsetTop-menu.clientHeight/2);
 let search='',searchTimer;
 menu.addEventListener('keydown',event=>{
  const index=items.indexOf(document.activeElement);let next;
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeLockerFontPicker(true);return;}
  if(event.key==='Tab'){closeLockerFontPicker(true);return;}
  if(event.key==='ArrowDown')next=(index+1)%items.length;else if(event.key==='ArrowUp')next=(index-1+items.length)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;
  else if(event.key.length===1&&event.key!==' '&&!event.ctrlKey&&!event.metaKey){clearTimeout(searchTimer);search+=event.key.toLowerCase();searchTimer=setTimeout(()=>search='',700);next=items.findIndex(item=>item.textContent.toLowerCase().startsWith(search));}
  if(next!==undefined&&next>=0){event.preventDefault();items[next].focus();}
 });
}
function positionLockerFontMenu(menu,button){
 const r=button.getBoundingClientRect(),width=Math.min(Math.max(r.width,280),innerWidth-24),below=innerHeight-r.bottom-12,above=r.top-12,up=below<180&&above>below,height=Math.min(320,up?above:below);
 Object.assign(menu.style,{width:width+'px',maxHeight:Math.max(80,height)+'px',left:Math.max(12,Math.min(r.left,innerWidth-width-12))+'px',top:(up?Math.max(12,r.top-height-4):r.bottom+4)+'px'});
}
document.addEventListener('pointerdown',event=>{const picker=lockerOpenFontPicker;if(picker&&!picker.menu.contains(event.target)&&!picker.button.contains(event.target))closeLockerFontPicker();},true);
window.addEventListener('resize',()=>closeLockerFontPicker());
document.addEventListener('scroll',event=>{const picker=lockerOpenFontPicker;if(picker&&!picker.menu.contains(event.target))positionLockerFontMenu(picker.menu,picker.button);},true);
