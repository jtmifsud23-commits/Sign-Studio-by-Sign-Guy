// Browser integration checks. Requires a loaded Bag Tag logo; never navigates to checkout.
(async()=>{
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 document.querySelectorAll('.bag-team-dialog').forEach(d=>d.close());
 const b=bagState();b.error='';b.orderMode='team';b.roster=[{name:'BARRETT',quantity:1},{name:'MISFUD #23',quantity:1},{name:'COACH JOHN',quantity:2}];b.activeRoster=1;renderBagTeam();buildBagTag();
 assert(bagReady()&&bagTotalQuantity()===4,'Team validation/total');
 assert(bagPreviewName()==='MISFUD #23','Selected preview');
 const input=document.querySelectorAll('.bag-roster-row input[type=text]')[1];input.focus();input.setSelectionRange(3,3);input.dispatchEvent(new Event('input'));buildBagTag();assert(document.activeElement===input&&input.selectionStart===3,'Typing caret lost');
 const project=JSON.parse(JSON.stringify(await buildBagProject()));
 b.roster[0].name='CHANGED';await restoreBagProject(project);
 assert(bagState().roster[0].name==='BARRETT'&&bagState().activeRoster===1&&bagTotalQuantity()===4,'Project round trip');
 const oldNavigate=navigateToCheckoutUrl;let checkout='';
 try{navigateToCheckoutUrl=url=>checkout=url;redirectToShopifyCheckout(project);}finally{navigateToCheckoutUrl=oldNavigate;}
 const params=new URL(checkout).searchParams;
 assert(params.get('quantity')==='4','Checkout total');
 assert(params.get('properties[Tag 2]')==='MISFUD #23 · Qty 1'&&params.get('properties[Tag 3]')==='COACH JOHN · Qty 2','Checkout names/quantities');
 assert(getAnalyticsProductItem(project).quantity===4,'Analytics total');
 for(const bad of ['', ' ']){bagState().roster[0].name=bad;assert(!bagReady(),'Blank allowed');}bagState().roster[0].name='BARRETT';
 for(const bad of [0,1.5,-1,1000,null]){bagState().roster[0].quantity=bad;assert(!bagReady(),'Invalid quantity allowed');}bagState().roster[0].quantity=1;
 await reviewBagTeam();const cards=[...document.querySelectorAll('.bag-team-review-card')];assert(cards.length===3,'Missing review cards');assert(new Set(cards.map(c=>c.querySelector('img').src)).size===3,'Repeated thumbnail');cards[2].click();assert(bagState().activeRoster===2,'Review selection');
 document.querySelector('[data-bag-mode=single]').click();buildBagTag();assert(bagState().orderMode==='single'&&bagPreviewName()===bagState().text,'Single mode');
 document.querySelector('[data-bag-mode=team]').click();assert(bagState().roster.length===3,'Mode lost roster');
 openBagRosterPaste();let dialog=document.querySelector('.bag-team-dialog[open]');dialog.querySelector('textarea').value='ONE\nTWO';dialog.querySelector('.bag-alignment-actions').lastChild.click();assert(bagState().roster.length===5,'Paste failed');
 document.querySelectorAll('.bag-roster-row')[4].lastChild.click();assert(bagState().roster.length===4,'Remove failed');
 await restoreBagProject(project);buildBagTag();
 const legacy=JSON.parse(JSON.stringify(project));delete legacy.config.bag.orderMode;delete legacy.config.bag.roster;delete legacy.config.bag.activeRoster;await restoreBagProject(legacy);assert(bagState().orderMode==='single','Legacy order mode');
 await restoreBagProject(project);buildBagTag();
 return {roster:'passed',caret:'preserved',review:'3 distinct previews',saveRestore:'passed',legacy:'passed',checkoutPayload:'4 tags with all names; navigation intercepted'};
})()
