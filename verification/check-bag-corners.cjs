const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/bag-tag/bag-tag-product.js','utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('function smoothBagContour('),source.indexOf('function bagMaskShapes(')),context);
// Long diagonal and concave bend like the hockey stick must survive exactly.
const stick=[[0,50],[4,50],[24,0],[44,0],[44,-8],[20,-8]];
const result=context.polishBagLogoContour(stick,0.072);
for(const p of stick)assert(result.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<1e-9),'Lost deliberate corner '+p);
// A curved outline stays within one raster pixel of its source radius.
const circle=Array.from({length:512},(_,i)=>[10*Math.cos(i*2*Math.PI/512),10*Math.sin(i*2*Math.PI/512)]);
const curved=context.polishBagLogoContour(circle,0.072);
assert(curved.every(p=>Math.abs(Math.hypot(...p)-10)<0.072),'Curve drift exceeds a pixel');
console.log('Passed: sharp convex/concave corners, straight edges, circle fidelity');
