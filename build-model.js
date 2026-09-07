/* Downtown St. Michael. Metric mesh from OpenStreetMap geometry.
 * Map data © OpenStreetMap contributors, ODbL 1.0. See README.md.
 * The same function builds the interactive view and the GLB export.
 */
function buildDowntownModel(THREE, d3, data, palette) {
  const scene = new THREE.Group();
  scene.name = 'Downtown St Michael MN — approximate massing';
  scene.userData = { ...data.model, units: 'metres', axes: '+X east, +Y up, -Z north', bbox: data.bbox };
  const [lon0, lat0] = data.model.center;
  const project = d3.geoMercator().center([lon0, lat0]).translate([0, 0])
    .scale(6378137 * Math.cos(lat0 * Math.PI / 180));
  const a = project([data.bbox[0], data.bbox[3]]), b = project([data.bbox[2], data.bbox[1]]);
  const extent = [a[0], a[1], b[0], b[1]];
  const materials = {};
  for (const [key, color] of Object.entries(palette)) {
    materials[key] = new THREE.MeshStandardMaterial({ color, roughness: 0.93, metalness: 0 });
    materials[key].name = key;
  }
  const groups = {};
  for (const name of ['Base', 'Land cover', 'Parking', 'Streets', 'Buildings', 'Church details']) {
    groups[name] = new THREE.Group(); groups[name].name = name; scene.add(groups[name]);
  }
  const pickables = [], anchors = [], report = { buildings: 0, measuredHeights: 0, taggedLevels: 0, defaultHeights: 0, roads: 0 };
  function addMesh(geo, mat, group, name, userData = {}) {
    const mesh = new THREE.Mesh(geo, materials[mat]);
    mesh.name = name; mesh.userData = userData;
    mesh.castShadow = group === 'Buildings' || group === 'Church details';
    mesh.receiveShadow = true; groups[group].add(mesh); return mesh;
  }
  function clipPolygon(points) {
    let p = points.slice();
    for (const [axis, value, side] of [[0, extent[0], 1], [0, extent[2], -1], [1, extent[1], 1], [1, extent[3], -1]]) {
      const q = [];
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        const ia = (a[axis] - value) * side >= 0, ib = (b[axis] - value) * side >= 0;
        if (ia) q.push(a);
        if (ia !== ib) {
          const t = (value - a[axis]) / (b[axis] - a[axis]);
          q.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      }
      p = q; if (!p.length) return p;
    }
    return p;
  }
  function area(p) { return Math.abs(d3.polygonArea(p)); }
  function shape(p) {
    const s = new THREE.Shape();
    p.forEach((v, i) => i ? s.lineTo(v[0], -v[1]) : s.moveTo(v[0], -v[1]));
    s.closePath(); return s;
  }
  function flat(p, y, mat, group, name, ud = {}) {
    p = clipPolygon(p); if (p.length < 3 || area(p) < 0.1) return null;
    const geo = new THREE.ShapeGeometry(shape(p)); geo.rotateX(-Math.PI / 2); geo.translate(0, y, 0);
    return addMesh(geo, mat, group, name, ud);
  }
  function box(x, z, sx, sy, sz, y, mat, name) {
    const mesh = addMesh(new THREE.BoxGeometry(sx, sy, sz), mat, 'Church details', name, { illustrative: true });
    mesh.position.set(x, y + sy / 2, z); return mesh;
  }
  function roadPolygon(p, width) {
    const left = [], right = [], half = width / 2;
    for (let i = 0; i < p.length; i++) {
      const prev = p[Math.max(0, i - 1)], next = p[Math.min(p.length - 1, i + 1)];
      let d1 = [p[i][0] - prev[0], p[i][1] - prev[1]], d2 = [next[0] - p[i][0], next[1] - p[i][1]];
      if (!i) d1 = d2.slice(); if (i === p.length - 1) d2 = d1.slice();
      const m1 = Math.hypot(...d1) || 1, m2 = Math.hypot(...d2) || 1;
      const n1 = [-d1[1] / m1, d1[0] / m1], n2 = [-d2[1] / m2, d2[0] / m2];
      let nx = n1[0] + n2[0], nz = n1[1] + n2[1], norm = Math.hypot(nx, nz);
      if (norm < 0.01) { nx = n1[0]; nz = n1[1]; norm = 1; }
      nx /= norm; nz /= norm;
      const size = Math.min(half / Math.max(0.3, nx * n1[0] + nz * n1[1]), half * 2);
      left.push([p[i][0] + nx * size, p[i][1] + nz * size]);
      right.push([p[i][0] - nx * size, p[i][1] - nz * size]);
    }
    return left.concat(right.reverse());
  }
  const base = addMesh(new THREE.BoxGeometry(b[0] - a[0], 4, b[1] - a[1]), 'base', 'Base', 'Flat datum and model base');
  base.position.set((a[0] + b[0]) / 2, -2.02, (a[1] + b[1]) / 2);
  flat([[a[0], a[1]], [b[0], a[1]], b, [a[0], b[1]]], 0, 'ground', 'Base', 'Ground — flat terrain assumed');

  for (const f of data.features.filter(f => ['land', 'parking'].includes(f.properties.kind))) {
    const t = f.properties, p = f.geometry.coordinates[0].map(project);
    const isWater = t.natural === 'water' || t.leisure === 'swimming_pool';
    const isGreen = ['grass', 'cemetery', 'farmland'].includes(t.landuse) || ['wood', 'grassland'].includes(t.natural) || ['playground', 'pitch', 'schoolyard'].includes(t.leisure);
    let mat = t.kind === 'parking' ? 'parking' : isWater ? 'water' : isGreen ? 'green' : 'ground';
    if (mat === 'ground') continue;
    const y = t.kind === 'parking' ? 0.10 : isWater ? 0.07 : 0.035;
    flat(p, y, mat, t.kind === 'parking' ? 'Parking' : 'Land cover', t.name || t.landuse || t.natural || t.leisure || 'Parking', { osm_id: f.id });
    if (t.landuse === 'cemetery') anchors.push({ name: 'Cemetery', position: [...d3.polygonCentroid(clipPolygon(p))], type: 'land' });
  }

  const roadWidths = { primary: 13, primary_link: 7, secondary: 11, secondary_link: 6, tertiary: 10, tertiary_link: 6, residential: 7.2, unclassified: 7.2, service: 4.3, living_street: 5.5, track: 3, footway: 1.8, path: 2, cycleway: 2.5, pedestrian: 3, steps: 1.5 };
  const paths = new Set(['footway', 'path', 'cycleway', 'steps']);
  for (const f of data.features.filter(f => f.properties.kind === 'road')) {
    const t = f.properties, p = f.geometry.coordinates.map(project).filter((v, i, arr) => !i || Math.hypot(v[0] - arr[i-1][0], v[1] - arr[i-1][1]) > 0.05);
    if (p.length < 2 || t.highway === 'construction' || t.highway === 'proposed') continue;
    const width = Math.min(25, parseFloat(t.width) || roadWidths[t.highway] || 5), path = paths.has(t.highway);
    const poly = roadPolygon(p, width);
    if (!path) flat(roadPolygon(p, width + 1.1), 0.15, 'curb', 'Streets', `${t.name || t.highway} edge`);
    if (!flat(poly, path ? 0.16 : 0.22, path ? 'path' : 'road', 'Streets', t.name || t.highway, { osm_id: f.id, width_m: width, width_source: t.width ? 'OSM width tag' : 'Estimated from road class' })) continue;
    report.roads++;
    if (/Central Avenue|Main Street/.test(t.name || '') && !path) {
      let travelled = 0;
      const verts = [];
      for (let i = 1; i < p.length; i++) {
        const a = p[i-1], b = p[i], dx = b[0]-a[0], dz = b[1]-a[1], len = Math.hypot(dx,dz);
        const nx = -dz / len * .12, nz = dx / len * .12;
        for (let at = (12 - travelled % 12) % 12; at < len; at += 12) {
          const end = Math.min(at + 5, len), x1=a[0]+dx*at/len, z1=a[1]+dz*at/len, x2=a[0]+dx*end/len, z2=a[1]+dz*end/len;
          const q=clipPolygon([[x1+nx,z1+nz],[x2+nx,z2+nz],[x2-nx,z2-nz],[x1-nx,z1-nz]]);
          for(let j=1;j<q.length-1;j++) for(const v of [q[0],q[j],q[j+1]]) verts.push(v[0],.235,v[1]);
        }
        travelled += len;
      }
      if(verts.length) { const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.computeVertexNormals(); const m=addMesh(g,'marking','Streets',`${t.name} — illustrative centre markings`);m.material.side=THREE.DoubleSide; }
    }
  }

  for (const f of data.features.filter(f => f.properties.kind === 'building')) {
    const t = f.properties, p = f.geometry.coordinates[0].map(project), cent = d3.polygonCentroid(p), footprint = area(p);
    const church = f.id === 'way/552455209';
    let h, basis;
    if (t.height && /^\d/.test(t.height)) {
      h = parseFloat(t.height) * (/ft|feet|\'/.test(t.height) ? 0.3048 : 1); basis='OSM height tag';report.measuredHeights++;
    } else if(t['building:levels']) {
      h=parseFloat(t['building:levels'])*3.1+0.6;basis=`${t['building:levels']} mapped storey(s); 3.1 m/storey + 0.6 m assumed`;report.taggedLevels++;
    } else {
      h=church?12:t.building==='school'?7.5:['garage','garages','shed'].includes(t.building)?3:['house','detached','residential','terrace'].includes(t.building)?6.2:t.building==='apartments'?10:footprint<75?3.5:5.5;
      basis='Estimated from building category / footprint';report.defaultHeights++;
    }
    const mat=church?'landmark':t.building==='school'?'institution':'building';
    const geo=new THREE.ExtrudeGeometry(shape(p),{depth:h,bevelEnabled:false,steps:1,curveSegments:1});
    geo.rotateX(-Math.PI/2);geo.translate(0,.26,0);
    const ud={osm_id:f.id,name:t.name||`${t.building.replaceAll('_',' ')} building`,height_m:h,height_basis:basis,footprint_m2:Math.round(footprint),building_type:t.building,osm_timestamp:t.osm_timestamp};
    if(church){ud.height_m=38;ud.height_basis='Estimated 12 m eaves, 20 m ridge, 38 m total to cross';}
    const mesh=addMesh(geo,mat,'Buildings',ud.name,ud);pickables.push(mesh);report.buildings++;
    if(t.name) anchors.push({name: church?'Historic church':t.name,position:cent,height:church?38:h,id:f.id,type:'building'});
    if(church) {
      // Approximate landmark silhouette; footprint is mapped, roof/tower dimensions are estimates.
      const west=Math.min(...p.map(v=>v[0])),east=Math.max(...p.map(v=>v[0]));
      const north=Math.min(...p.map(v=>v[1])),south=Math.max(...p.map(v=>v[1])), z=(north+south)/2;
      const x1=west+2,x2=east-1,n=north+1.3,s=south-1.3,y=12.26,r=20.26;
      const v=[x1,y,n,x2,y,n,x2,r,z,x1,r,z,x1,y,s,x2,y,s];
      const idx=[0,1,2,0,2,3,3,2,5,3,5,4,0,3,4,1,5,2,0,4,5,0,5,1];
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();
      const roof=addMesh(g,'roof','Church details','Church gable — approximate');roof.material.side=THREE.DoubleSide;
      const towerX=east-4.6;
      box(towerX,z,6.8,23,7.2,.26,'landmark','Church entrance tower — estimated');
      box(towerX,z,7.4,1,7.8,22.5,'trim','Tower cornice');
      const spire=addMesh(new THREE.ConeGeometry(4.5,12.8,8),'roof','Church details','Eight-sided spire — estimated');spire.position.set(towerX,30,z);spire.rotation.y=Math.PI/8;
      box(towerX,z,.3,2,.3,36.4,'trim','Cross vertical');box(towerX,z,.3,.25,1.4,37.5,'trim','Cross horizontal');
      const windowMat=materials.window;
      for(let i=0;i<6;i++) {
        const wx=west+5+i*(east-west-13)/5;
        for(const wz of [north-.05,south+.05]) {
          const ws=new THREE.Shape();ws.moveTo(-.9,0);ws.lineTo(.9,0);ws.lineTo(.9,4);ws.lineTo(0,5.4);ws.lineTo(-.9,4);ws.closePath();
          const wg=new THREE.ShapeGeometry(ws), wm=new THREE.Mesh(wg,windowMat);wm.position.set(wx,4.5,wz);if(wz<north)wm.rotation.y=Math.PI;wm.name='Illustrative lancet window';groups['Church details'].add(wm);
        }
      }
      for(const side of [-1,1]) {
        const clock=addMesh(new THREE.CircleGeometry(1.2,24),'clock','Church details','Illustrative clock face');
        clock.rotation.y=side*Math.PI/2;clock.position.set(towerX+side*3.41,20.9,z);
      }
    }
  }
  scene.updateMatrixWorld(true);
  return {scene,materials,pickables,anchors,project,extent,report};
}
if(typeof module!=='undefined') module.exports=buildDowntownModel;
