(async()=>{
 await initializeStudioApp();hideAppLoading();closeOnboarding();showProductSelectionMenu();await new Promise(r=>setTimeout(r,150));
 const cards=[...document.querySelectorAll('[data-product-selection]')].map(el=>({key:el.dataset.productSelection,disabled:el.disabled,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom}));
 const out={width:innerWidth,height:innerHeight,cards,products:[]};
 for(const key of ['led','classic-hype','spinner-hype','plaque','bag']){
  selectProductSelection(key);closeOnboarding();await new Promise(r=>setTimeout(r,550));openMobileControlSheet();await new Promise(r=>setTimeout(r,250));
  const sheet=document.querySelector('#mobileControlSheet');const overflow=[...sheet.querySelectorAll('input,select,button')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.left<-.5||r.right>innerWidth+.5)}).map(el=>el.id||el.getAttribute('aria-label')||el.textContent.trim().slice(0,30));
  out.products.push({key,type:state.productType,variant:state.hype.variant,overflow,sheetOverflow:sheet.scrollWidth>sheet.clientWidth+1,orderDisabled:document.querySelector('#mobilePlaceOrder').disabled,reason:getMobilePlaceOrderDisabledReason()});
  closeMobileControlSheet();
 }
 return out;
})()
