import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildings, residences } from './data/resort.js';
import { Batches, geometries as G, extrusion, roundedShape, ribbon, tube } from './geometry.js';

const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.78,...extra});
export function createResort(){
  let seed=8921;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const root=new THREE.Group();root.name='Petra Sea Resort · masterplan interpretation';
  const groups={};
  for(const name of ['ground','architecture','landscape','amenities','water']){groups[name]=new THREE.Group();groups[name].name=name;root.add(groups[name]);}
  const M={
    stone:material('#efeae0'),slab:material('#f9f4e5'),glass:material('#355d67',{metalness:.4,roughness:.3}),
    rail:material('#9cbdbc',{metalness:.25,roughness:.3}),frame:material('#adb5aa',{metalness:.35}),
    wood:material('#a67c5b'),roof:material('#c5c9b4'),grass:material('#668352'),hedge:material('#496d50'),
    leaf:material('#476d52'),leaf2:material('#668657'),leaf3:material('#91a371'),trunk:material('#87755b'),
    path:material('#e1d7bb'),road:material('#8b9590'),sand:material('#c8c4aa'),line:material('#eae5d1'),
    pool:material('#30a5b5',{metalness:.32,roughness:.2}),court:material('#668e94'),clay:material('#b37b64'),
    warm:material('#857e64',{emissive:'#ffce85',emissiveIntensity:0}),light:material('#ffecd1',{emissive:'#ffcf86',emissiveIntensity:0}),
    flower:material('#b68b9d'),dark:material('#334945'),boat:material('#f5f2e6'),
  };
  for(const name of ['rail','warm','light','pool'])M[name].userData.castShadow=false;
  const a=new Batches(groups.architecture),land=new Batches(groups.landscape),details=new Batches(groups.amenities),ground=new Batches(groups.ground);
  ground.round(M.sand,0,-4,-13,654,6,378);
  ground.round(M.grass,0,-.12,-23,636,.35,340);
  ground.box(M.path,0,.08,155,634,.3,21);
  ground.box(M.sand,0,-.55,181,640,1,32);
  ground.box(M.clay,0,.29,147,627,.08,2.4);
  // Continuous sea with a subtle procedural wave pattern, no external textures.
  const ocean=material('#378b9f',{metalness:.4,roughness:.32});
  ocean.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWaterPosition = position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterPosition;').replace('#include <color_fragment>',`#include <color_fragment>
      float ripple = sin(vWaterPosition.x*.38 + sin(vWaterPosition.z*.31)*1.6) * sin(vWaterPosition.z*1.8 + vWaterPosition.x*.2);
      float detailWave = pow(max(0.0, sin(vWaterPosition.z*2.8+sin(vWaterPosition.x*.57))), 18.0);
      diffuseColor.rgb *= .94 + .075*ripple + .08*detailWave;
    `);
  };
  const seaGeo=new THREE.PlaneGeometry(6000,6000);seaGeo.rotateX(-Math.PI/2);
  const sea=new THREE.Mesh(seaGeo,ocean);sea.position.set(0,-1.4,0);sea.receiveShadow=true;groups.water.add(sea);
  // Foam ribbons at the pebble shore; deliberately static so idle rendering can stop.
  for(let row=0;row<4;row++){
    const points=[];for(let x=-318;x<=318;x+=12)points.push([x,199+row*3+Math.sin(x*.07+row)*1.2]);
    ribbon(points,.35+row*.11,-1.18+row*.03,M.line,groups.water);
  }
  // Inland terrain and a belt of trees frame the masterplan without inventing a street map.
  const terrain=new THREE.PlaneGeometry(2000,1400,64,44);terrain.rotateX(-Math.PI/2);terrain.translate(0,0,-525);
  for(let i=0;i<terrain.attributes.position.count;i++){
    const x=terrain.attributes.position.getX(i),z=terrain.attributes.position.getZ(i),rise=Math.max(0,-z-220);
    terrain.attributes.position.setY(i,-.45+rise*.1+(Math.sin(x/125)+Math.sin(z/99))*Math.min(15,rise*.035));
  }
  terrain.computeVertexNormals();const hills=new THREE.Mesh(terrain,M.grass);hills.receiveShadow=true;groups.ground.add(hills);
  const roads=[[[ -317,134],[-316,-162],[-250,-180],[270,-180],[323,-136],[326,140]],[[ -9,134],[-10,39],[3,-70],[3,-167]]];
  for(const pts of roads){ribbon(pts,13,.12,M.path,groups.ground);ribbon(pts,9,.18,M.road,groups.ground);}
  // Garden loops reproduce the arrangement of clusters instead of imposing a city grid.
  for(const [x,z,w,d] of [[-166,40,181,142],[153,28,242,161]]){
    const pts=[];for(let i=0;i<=32;i++){const t=i/32*Math.PI*2;pts.push([x+Math.cos(t)*w/2,z+Math.sin(t)*d/2]);}
    ribbon(pts,4.2,.25,M.path,groups.ground);
  }
  for(const z of [-20,59,114])ribbon([[-280,z],[-180,z+7],[-90,z-6],[-14,z],[80,z-8],[170,z+10],[291,z]],3,.26,M.path,groups.ground);
  const picks=[];
  function local(b,fn,x,y,z,...args){
    const c=Math.cos(b.rotation||0),s=Math.sin(b.rotation||0);
    fn(b.x+x*c+z*s,y,b.z-x*s+z*c,...args,b.rotation||0);
  }
  function rect(b,mat,x,y,z,w,h,d){local(b,(x,y,z,w,h,d,r)=>a.box(mat,x,y,z,w,h,d,r),x,y,z,w,h,d);}
  function round(b,mat,x,y,z,w,h,d){local(b,(x,y,z,w,h,d,r)=>a.round(mat,x,y,z,w,h,d,r),x,y,z,w,h,d);}
  function pool(x,z,w,d,y=.4){details.round(M.stone,x,y-.1,z,w+3,.6,d+3);details.round(M.pool,x,y+.25,z,w,.2,d);}
  function windows(b,w,d,levels,floorHeight=3.2){
    for(let f=0;f<levels;f++){
      const y=2+f*floorHeight;
      for(const side of [-1,1]){
        for(let x=-w/2+2;x<w/2-1;x+=3.6){
          rect(b,M.frame,x,y,side*(d/2-.7),.13,2.6,.18);
          if(random()>.7)rect(b,M.warm,x+1.45,y,side*(d/2-.8),2.5,2.15,.12);
        }
        for(let z=-d/2+2;z<d/2-1;z+=3.8){
          rect(b,M.frame,side*(w/2-.7),y,z,.18,2.6,.13);
          if(random()>.73)rect(b,M.warm,side*(w/2-.8),y,z+1.3,.12,2.15,2.3);
        }
      }
    }
  }
  const ellipseShape=new THREE.Shape();ellipseShape.absellipse(0,0,.5,.5,0,Math.PI*2,false,0);
  const ellipse=extrusion(ellipseShape).translate(0,-.5,0);
  for(const b of buildings){
    if(b.kind==='landmark'){
      // A tapering, elliptical body with a split fin and an arched lattice crown.
      for(let i=0;i<45;i++){
        const t=i/45,y=1.7+i*3.16,w=43*(.86+.17*Math.sin(t*5.1))*(t>.9?Math.sqrt(Math.max(.3,1-(t-.9)*5)) : 1),d=34*(1-.19*t);
        a.add(ellipse,M.glass,b.x,y,b.z,w,3.2,d);
        a.add(ellipse,M.slab,b.x,y+1.55,b.z,w+1.7,.38,d+1.7);
        if(i%3===0)a.box(M.warm,b.x-3,y,b.z+d/2+.3,4,2,.15);
      }
      for(let i=0;i<26;i++){
        const t=i/26*Math.PI*2,pts=[];
        for(let f=0;f<=44;f++){
          const v=f/45,w=43*(.86+.17*Math.sin(v*5.1))*(v>.9?Math.sqrt(Math.max(.3,1-(v-.9)*5)):1),d=34*(1-.19*v);
          pts.push([b.x+Math.cos(t)*(w/2+.65),f*3.16+2,b.z+Math.sin(t)*(d/2+.65)]);
        }
        for(let arc=1;arc<=7;arc++){const q=arc/7*Math.PI/2;pts.push([b.x+Math.cos(t)*14*Math.cos(q),142+11*Math.sin(q),b.z+Math.sin(t)*13*Math.cos(q)]);}
        tube(pts,.3,M.slab,groups.architecture);
      }
      const crown=new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2);
      a.add(crown,M.glass,b.x,141.8,b.z,14,11,13);
      for(let arc=1;arc<6;arc++){const q=arc/6*Math.PI/2;a.add(ellipse,M.slab,b.x,142+11*Math.sin(q),b.z,28*Math.cos(q),.28,26*Math.cos(q));}
      for(const offset of [-9,9])tube([[b.x+offset,1,b.z+19],[b.x+offset-3,70,b.z+21],[b.x+offset+2,124,b.z+15],[b.x+offset/2,153,b.z+3]],.85,M.stone,groups.architecture);
      pool(b.x+5,b.z+31,27,15);
    } else if(b.kind==='terraces'){
      for(let f=0;f<5;f++){
        const y=2+f*3.5,w=b.w-f*13,d=b.d-f*5;
        round(b,M.glass,0,y,-f*1.5,w-2,3.3,d-2);
        round(b,M.slab,0,y+1.7,-f*1.5,w,.45,d);
        // Long asymmetric wings and planted roof terraces.
        for(const side of [-1,1]){
          round(b,M.slab,side*(w/2-9),y+1.7,13-f*2,19,.45,24);
          for(let k=-1;k<=1;k++)rect(b,M.hedge,side*(w/2-9)+k*4,y+2.5,20-f*2,2.7,1.1,2.5);
        }
      }
      pool(b.x,b.z+33,39,12);pool(b.x+23,b.z+37,15,13);
    }else{
      const step=b.kind==='pullman'?3.3:b.kind==='pavilion'?4:3.2;
      round(b,M.stone,0,.6,0,b.w+3,1.2,b.d+3);
      round(b,M.glass,0,b.height/2+1,0,b.w-2,b.height,b.d-2);
      for(let f=0;f<=b.floors;f++){
        const taper=b.kind==='pullman'?Math.max(0,f-b.floors+5)*1.15:0;
        round(b,M.slab,0,1+f*step,0,b.w-taper,.46,b.d-taper*.4);
        if(f<b.floors){
          round(b,M.rail,0,1.5+f*step,0,b.w-.6-taper,.45,b.d-.6-taper*.4);
          round(b,M.glass,0,2+f*step,0,b.w-3-taper,1.8,b.d-3-taper*.4);
        }
      }
      windows(b,b.w,b.d,b.floors,step);
      round(b,M.roof,0,b.height+1.3,0,b.w-3,.24,b.d-3);
      round(b,M.stone,0,b.height+2,0,b.w*.31,1.8,b.d*.26);
      if(b.kind==='pullman'){
        round(b,M.pool,0,b.height+1.6,7,b.w*.6,.18,6);
        for(const side of [-1,1])rect(b,M.wood,side*(b.w*.38),b.height/2,0,1.3,b.height,b.d-.9);
      }
      if(b.kind==='tower'){
        rect(b,M.stone,0,b.height/2,-b.d/2,4,b.height,2);
        pool(b.x+26,b.z+5,12,40);
      }
      if(b.kind==='pavilion')round(b,M.hedge,0,b.height+1.6,0,b.w-3,.25,b.d-3);
      if(b.kind==='residence'&&Number(b.id.split('-')[1])%4===0)pool(b.x+15,b.z+4,6,13);
    }
    const proxy=new THREE.Mesh(G.rounded,new THREE.MeshBasicMaterial());
    proxy.position.set(b.x,b.height/2,b.z);proxy.scale.set(b.w,b.height+4,b.d);proxy.rotation.y=b.rotation||0;
    proxy.userData.building=b;proxy.updateMatrixWorld();picks.push(proxy);
  }
  // A lake with a sinuous shore and island.
  const lakeShape=new THREE.Shape();
  lakeShape.moveTo(-58,0);lakeShape.bezierCurveTo(-71,36,-27,38,-15,26);lakeShape.bezierCurveTo(7,15,46,36,55,8);lakeShape.bezierCurveTo(64,-16,25,-20,7,-17);lakeShape.bezierCurveTo(-25,-30,-60,-27,-58,0);
  const lakeGeo=extrusion(lakeShape,.35);const lake=new THREE.Mesh(lakeGeo,M.pool);lake.position.set(-158,.35,-130);groups.amenities.add(lake);
  details.add(G.cylinder,M.path,-183,.8,-133,6,.65,5);details.add(G.cylinder,M.grass,-183,1.2,-133,5,.25,4);
  // Sports courts in the rear corner, including nets and fine line markings.
  for(let i=0;i<3;i++){
    const x=-269+i*22,z=-136;
    ground.box(M.path,x,.3,z,21,.4,43);ground.box(i===2?M.clay:M.court,x,.55,z,19,.12,39);
    for(const sx of [-8,8])details.box(M.line,x+sx,.66,z,.16,.05,34);
    for(const sz of [-17,17,-6,6])details.box(M.line,x,.66,z+sz,16,.05,.16);
    details.box(M.line,x,.66,z,.12,.05,34);details.box(M.dark,x,1.2,z,18,1.2,.12);
    for(const sx of [-9,9])details.box(M.dark,x+sx,1.4,z,.2,2,.2);
  }
  // Beach furniture, promenade lighting and timber marina.
  for(let x=-295;x<310;x+=14){
    if(x> -258&&x< -190)continue;
    for(const z of [177,187]){
      details.add(G.umbrella,M.stone,x,3,z,2.4,1,2.4);details.box(M.wood,x,1.4,z,.12,2.8,.12);
      for(const side of [-1,1])details.box(M.slab,x+side*3,.35,z+.4,1.4,.45,3);
    }
  }
  for(let x=-303;x<316;x+=22){
    details.box(M.dark,x,2.4,153,.16,4.8,.16);details.box(M.light,x,4.9,153,.75,.35,.75);
    details.box(M.wood,x+5,.8,153,3,.35,1);details.box(M.dark,x+5,.38,153,2,.65,.65);
  }
  ground.box(M.wood,-254,.7,223,5,1.6,84);ground.box(M.wood,-217,.7,247,78,1.6,4);
  for(let i=0;i<5;i++){const x=-247+i*16;ground.box(M.wood,x,.65,259,2,1.5,23);}
  function boat(x,z,size,angle=0,sail=false){
    details.round(M.boat,x,.5,z,size*.34,1.1,size,angle);details.round(M.wood,x,1.2,z,size*.26,.25,size*.68,angle);
    details.round(M.stone,x,1.7,z+1,size*.23,1.3,size*.34,angle);
    if(sail){
      details.box(M.frame,x,7,z,.14,13,.14);
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,11,0,5,0,0],3));geo.computeVertexNormals();
      const mat=M.boat.clone();mat.side=THREE.DoubleSide;
      const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,2,z);mesh.rotation.y=angle;groups.amenities.add(mesh);
    }
  }
  for(let i=0;i<4;i++)boat(-239+i*16,263,10,0,i%2===0);
  boat(155,285,13,-.8,true);boat(-72,365,15,.6,true);
  // Palm fronds are curved strips, shared by every palm.
  const leafPositions=[];
  for(let f=0;f<9;f++){
    const angle=f/9*Math.PI*2;
    for(let j=0;j<7;j++){
      const point=(t,side)=>{
        const reach=t*4.8,width=Math.sin(t*Math.PI)*.64*side;
        return [Math.cos(angle)*reach-Math.sin(angle)*width,Math.sin(t*Math.PI*.95)*1.5-t*1.3,Math.sin(angle)*reach+Math.cos(angle)*width];
      };
      const t=j/7,n=(j+1)/7;
      leafPositions.push(...point(t,-1),...point(n,-1),...point(t,1),...point(t,1),...point(n,-1),...point(n,1));
    }
  }
  const palmGeo=new THREE.BufferGeometry();palmGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafPositions,3));palmGeo.computeVertexNormals();
  const palmMat=M.leaf.clone();palmMat.side=THREE.DoubleSide;
  let trees=0;
  function tree(x,z,h=8,palm=false,y=0){
    trees++;land.add(G.cylinder,M.trunk,x,y+h*.45,z,palm?.27:.38,h*.9,palm?.27:.38);
    if(palm){land.add(palmGeo,palmMat,x,y+h,z,h/8,h/8,h/8,random()*6.28);}
    else{
      const color=[M.leaf,M.leaf2,M.leaf3][Math.floor(random()*3)];
      land.add(G.sphere,color,x,y+h*.78,z,h*.38,h*.38,h*.36,random()*6.28);
      land.add(G.sphere,color,x+h*.2,y+h*.88,z-h*.13,h*.24,h*.3,h*.25);
    }
  }
  for(let x=-307;x<318;x+=15){tree(x,139,8+random()*3,true);if(Math.abs(x+230)>34)tree(x,165,7+random()*2,true);}
  const inBuilding=(x,z,padding=6)=>buildings.some(b=>Math.abs(x-b.x)<b.w/2+padding&&Math.abs(z-b.z)<b.d/2+padding);
  for(let i=0;i<2100;i++){
    const x=-307+random()*620,z=-175+random()*306;
    if(inBuilding(x,z)||Math.abs(x+4)<10||Math.abs(z+180)<10)continue;
    if(x< -205&&z< -109||((x+158)/67)**2+((z+130)/38)**2<1.25)continue;
    if([36,128,220].some(tx=>Math.abs(x-tx-26)<10&&Math.abs(z+114)<26))continue;
    tree(x,z,4+random()*6,random()>.73);
    if(random()>.65)land.add(G.sphere,M.flower,x+3,1.3,z+2,1.8,1.3,1.6);
  }
  for(let i=0;i<330;i++){
    const x=-570+random()*1140,z=-212-random()*310,rise=Math.max(0,-z-220),y=-.45+rise*.1+(Math.sin(x/125)+Math.sin(z/99))*Math.min(15,rise*.035);
    tree(x,z,7+random()*10,false,y);
  }
  tree(-183,-133,5.5,true,1);
  // Cars give scale to the entry road.
  for(let i=0;i<19;i++){
    const x=-282+i*30,z=-180+(i%2?2:-2);
    details.round(i%3?M.stone:M.dark,x,1,z,4.8,1.4,2);details.box(M.glass,x,1.9,z,2.3,.6,1.8);
    for(const side of [-1,1])details.box(M.light,x+side*2.35,1,z,.1,.3,1.4);
  }
  for(const batch of [a,land,details,ground])batch.flush();
  // Merge the landmark's individual tubes into a single draw per material.
  const tubes=new Map();
  for(const child of [...groups.architecture.children])if(child.isMesh&&!child.isInstancedMesh){
    if(!tubes.has(child.material))tubes.set(child.material,[]);
    child.updateMatrix();tubes.get(child.material).push(child.geometry.clone().applyMatrix4(child.matrix));groups.architecture.remove(child);child.geometry.dispose();
  }
  for(const [mat,geos] of tubes){const mesh=new THREE.Mesh(mergeGeometries(geos),mat);mesh.castShadow=true;groups.architecture.add(mesh);geos.forEach(g=>g.dispose());}
  const selection=new THREE.Group();root.add(selection);
  const highlight=new THREE.Mesh(G.rounded,new THREE.MeshBasicMaterial({color:'#e3b572',transparent:true,opacity:.15,depthWrite:false}));
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(G.rounded,25),new THREE.LineBasicMaterial({color:'#b98035',transparent:true,opacity:.85}));selection.add(highlight,outline);selection.visible=false;
  function select(b){selection.visible=!!b;if(!b)return;selection.position.set(b.x,b.height/2+1,b.z);selection.scale.set(b.w+.7,b.height+3,b.d+.7);selection.rotation.y=b.rotation||0;}
  function setNight(amount){M.warm.emissiveIntensity=amount*2.8;M.light.emissiveIntensity=amount*3;M.pool.emissive.set('#36bfc8');M.pool.emissiveIntensity=amount*.35;M.glass.emissive.set('#193a4b');M.glass.emissiveIntensity=amount*.18;}
  return {root,groups,buildings,picks,select,setNight,stats:{buildings:buildings.length,residences:residences.length,trees,towers:6,pavilions:9}};
}
