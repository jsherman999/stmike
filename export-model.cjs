const fs=require('fs');
global.THREE=require('./three.min.js');
const d3=require('./d3.min.js');
require('./GLTFExporter.js');
global.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.({target:this});});}
  readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:'+blob.type+';base64,'+Buffer.from(result).toString('base64');this.onloadend?.({target:this});});}
};
global.window={FileReader:global.FileReader,TextEncoder:global.TextEncoder};
const build=require('./build-model.js'),data=JSON.parse(fs.readFileSync('./downtown.geojson','utf8'));
const palette={base:'#7c827b',ground:'#d9dece',building:'#b5b6af',institution:'#d4c9b5',landmark:'#dfc689',roof:'#626b6f',trim:'#acaa98',window:'#45535a',clock:'#eeede1',green:'#b6c7a1',water:'#86afbd',parking:'#c8c9c1',curb:'#e0dfd1',road:'#969d99',path:'#bdb9a8',marking:'#dfd4ad'};
const world=build(THREE,d3,data,palette);
let vertices=0,triangles=0;
world.scene.traverse(o=>{if(o.isMesh){const p=o.geometry.getAttribute('position');vertices+=p.count;triangles+=(o.geometry.index?o.geometry.index.count:p.count)/3;for(const v of p.array)if(!Number.isFinite(v))throw new Error('Nonfinite geometry: '+o.name);}});
console.log(JSON.stringify({...world.report,vertices,triangles,bounds:new THREE.Box3().setFromObject(world.scene)},null,2));
new THREE.GLTFExporter().parse(world.scene,result=>{
 if(!(result instanceof ArrayBuffer))throw new Error('Expected binary GLB');
 fs.writeFileSync('./downtown-st-michael.glb',Buffer.from(result));
 console.log('Wrote downtown-st-michael.glb: '+result.byteLength+' bytes');
},{binary:true,onlyVisible:true});
