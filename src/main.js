import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createResort } from './scene.js';
import { districts } from './data/resort.js';

const $=selector=>document.querySelector(selector);
const viewport=$('#viewport'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch{
  $('#loading').replaceChildren(Object.assign(document.createElement('p'),{textContent:'The 3D resort needs WebGL 2. You can still explore the reference renders.'}));
}
// The reference gallery remains available even without WebGL.
$('#sources-open').onclick=()=>{$('#sources-dialog').showModal();window.petraResort?.stopMotion();};
$('#sources-close').onclick=()=>$('#sources-dialog').close();
$('#sources-dialog').addEventListener('click',e=>{if(e.target===$('#sources-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
if(renderer)start();

function start(){
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.4:1.65));
  renderer.setSize(viewport.clientWidth,viewport.clientHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  viewport.prepend(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#dce7df');scene.fog=new THREE.Fog('#dce7df',900,2150);
  const camera=new THREE.PerspectiveCamera(37,viewport.clientWidth/viewport.clientHeight,1,6500);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=40;controls.maxDistance=2300;
  controls.minPolarAngle=.025;controls.maxPolarAngle=Math.PI/2-.045;controls.maxTargetRadius=460;
  controls.screenSpacePanning=false;controls.autoRotateSpeed=.35;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);
  scene.environment=environment.texture;scene.environmentIntensity=.45;room.dispose();pmrem.dispose();
  const ambient=new THREE.HemisphereLight('#eef5ef','#9b9d79',1.45);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff3d5',2.5);sun.position.set(-240,430,220);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-500,right:500,top:450,bottom:-450,near:1,far:1600});
  sun.shadow.bias=-.001;sun.shadow.normalBias=1.2;sun.shadow.camera.updateProjectionMatrix();scene.add(sun);
  const fill=new THREE.DirectionalLight('#b2d4e4',.65);fill.position.set(250,190,-100);scene.add(fill);
  const resort=createResort();scene.add(resort.root);
  const state={district:'all',selected:null,view:'overview',light:'day',tour:false,transitioning:false,layers:{landscape:true,amenities:true,labels:true}};
  let dirty=true,tween=null,lightTween=null,lastTime=0,nightAmount=0,tourIndex=0,tourDeadline=0,focusedBuilding=null;
  const districtButtons=districts.map((d,i)=>{
    const el=document.createElement('button');el.className=`district-button${i===0?' active':''}`;el.dataset.district=d.id;el.setAttribute('aria-pressed',String(i===0));
    const num=document.createElement('span');num.className='district-number';num.textContent=String(i+1).padStart(2,'0');
    const text=document.createElement('span');text.textContent=d.short;
    const arrow=document.createElement('span');arrow.className='district-arrow';arrow.textContent='↗';
    el.append(num,text,arrow);el.onclick=()=>{stopTour();selectDistrict(d);};$('#district-buttons').append(el);return el;
  });
  for(const d of districts.slice(1)){
    const group=document.createElement('optgroup');group.label=d.short;
    for(const b of resort.buildings.filter(b=>b.category===d.id))group.append(Object.assign(document.createElement('option'),{value:b.id,textContent:b.name}));
    $('#building-select').append(group);
  }
  $('#building-select').onchange=e=>{const b=resort.buildings.find(b=>b.id===e.target.value);if(b)selectBuilding(b,true);};
  const labelData=[
    {district:'landmark',text:'SCULPTURAL LANDMARK',at:[-258,154,82]},
    {district:'towers',text:'APARTMENT TOWERS',at:[128,103,-119]},
    {district:'pullman',text:'PULLMAN RESIDENCES',at:[273,91,88]},
    {district:'gardens',text:'LAKE & GARDENS',at:[-150,5,-125]},
    {district:'residences',text:'GARDEN RESIDENCES',at:[-124,30,28]},
    {district:'terraces',text:'BEACH & MARINA',at:[-228,3,235]},
  ];
  const labelNodes=labelData.map(d=>{
    const el=document.createElement('button');el.className='map-label';el.textContent=d.text;el.dataset.place=d.district;
    el.setAttribute('aria-label',`Explore ${districts.find(p=>p.id===d.district).short}`);
    el.onclick=()=>{stopTour();selectDistrict(districts.find(p=>p.id===d.district));};$('#labels').append(el);return{el,...d};
  });
  const isCompact=()=>innerWidth<761||innerHeight<531;
  function disclosure(open){$('#place-toggle').setAttribute('aria-expanded',String(open));$('#place-content').hidden=!open;$('#place-chevron').textContent=open?'−':'+';}
  $('#place-toggle').onclick=()=>disclosure($('#place-content').hidden);
  disclosure(!isCompact());
  function updatePlace(d,b=null){
    $('#place-eyebrow').textContent=b?`${d.short.toUpperCase()} · MODEL DETAIL`:d.eyebrow;
    $('#place-title').textContent=b?b.name:d.name;
    const verified=b&&['tower','pullman'].includes(b.kind);
    $('#place-description').textContent=b?`${b.floors} ${verified?'floors in the developer’s selector':'illustrative levels'}. ${b.kind==='residence'?'A garden residence traced from the resort render. This number identifies the model only.':d.description}`:d.description;
    $('#place-index').textContent=String(districts.indexOf(d)+1).padStart(2,'0');
    $('#focus-place').firstChild.textContent=b?'Look closer ':'Explore this view ';
    if(isCompact()){$('#place-eyebrow').textContent=b?b.name.toUpperCase():d.short.toUpperCase();}
    $('#announcement').textContent=b?`Selected ${b.name}`:`${d.short} view`;
  }
  function updateDistrictUI(d){
    state.district=d.id;
    districtButtons.forEach(b=>{const active=b.dataset.district===d.id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    labelNodes.forEach(({el,district})=>el.classList.toggle('selected',district===d.id));
    $('#current-view').textContent=d.short.toUpperCase();
  }
  function stopTour(){state.tour=false;$('#tour').setAttribute('aria-pressed','false');$('#tour-icon').textContent='▷';$('#tour-text').textContent='Take a scenic tour';}
  function stopOrbit(){controls.autoRotate=false;$('#rotate').setAttribute('aria-pressed','false');}
  function moveCamera(position,target,instant=false,fit=false){
    stopOrbit();
    const to=new THREE.Vector3(...position),aim=new THREE.Vector3(...target);
    if(fit){const factor=Math.max(1,1.34/camera.aspect);to.sub(aim).multiplyScalar(factor).add(aim);}
    if(instant||reducedMotion){camera.position.copy(to);controls.target.copy(aim);tween=null;state.transitioning=false;controls.update();}
    else{tween={from:camera.position.clone(),fromTarget:controls.target.clone(),to,target:aim,start:performance.now()};state.transitioning=true;}
    dirty=true;
  }
  function markView(name){state.view=name;document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
  function selectDistrict(d,instant=false){
    focusedBuilding=null;state.selected=null;resort.select(null);$('#building-select').value='';updateDistrictUI(d);updatePlace(d);
    markView(d.id==='all'?'overview':'district');moveCamera(d.position,d.target,instant,true);
    if(isCompact())disclosure(false);
  }
  function selectBuilding(b,focus=false){
    stopTour();stopOrbit();focusedBuilding=b;state.selected=b.id;resort.select(b);$('#building-select').value=b.id;
    const district=districts.find(d=>d.id===b.category);updateDistrictUI(district);updatePlace(district,b);disclosure(true);
    if(focus)focusBuilding(b);dirty=true;
  }
  function focusBuilding(b){
    markView('building');const size=Math.max(b.height,b.w,b.d),distance=Math.max(63,size*1.5);
    moveCamera([b.x+distance*.7,b.height*.55+distance*.65,b.z+distance],[b.x,b.height*.42,b.z],false,true);
  }
  $('#focus-place').onclick=()=>{stopTour();if(focusedBuilding)focusBuilding(focusedBuilding);else{const d=districts.find(d=>d.id===state.district);moveCamera(d.position,d.target,false,true);}if(isCompact())disclosure(false);};
  function setView(name,instant=false){
    stopTour();markView(name);
    const views={overview:{position:districts[0].position,target:districts[0].target},aerial:{position:[0,910,11],target:[0,0,10]},coast:{position:[105,145,845],target:[0,36,0]}};
    const v=views[name];moveCamera(v.position,v.target,instant,true);$('#current-view').textContent={overview:'RESORT OVERVIEW',aerial:'THE MASTERPLAN',coast:'FROM THE BLACK SEA'}[name];
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  const lights={
    day:{background:'#dce7df',sun:'#fff3d5',sunIntensity:2.5,ambient:1.45,exposure:.95,position:[-240,430,220],environment:.45,fill:.65,night:0},
    sunset:{background:'#e5cbb0',sun:'#ffc086',sunIntensity:3.9,ambient:1.2,exposure:1.05,position:[-410,180,230],environment:.36,fill:.44,night:.16},
    night:{background:'#142e3a',sun:'#a3c6e3',sunIntensity:.85,ambient:.55,exposure:.93,position:[-240,430,220],environment:.19,fill:.2,night:1},
  };
  function setLight(name){
    state.light=name;document.body.dataset.light=name;
    document.querySelectorAll('button[data-light]').forEach(b=>{const active=b.dataset.light===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    const next=lights[name];lightTween={start:performance.now(),from:{background:scene.background.clone(),sun:sun.color.clone(),sunIntensity:sun.intensity,ambient:ambient.intensity,exposure:renderer.toneMappingExposure,position:sun.position.clone(),environment:scene.environmentIntensity,fill:fill.intensity,night:nightAmount},to:next};
    dirty=true;
  }
  document.querySelectorAll('button[data-light]').forEach(b=>b.onclick=()=>setLight(b.dataset.light));
  $('#layers-toggle').onclick=()=>{const open=$('#layers-panel').hidden;$('#layers-panel').hidden=!open;$('#layers-toggle').setAttribute('aria-expanded',String(open));};
  document.querySelectorAll('[data-layer]').forEach(input=>input.onchange=()=>{
    const layer=input.dataset.layer;state.layers[layer]=input.checked;
    if(layer==='labels')$('#labels').hidden=!input.checked;else resort.groups[layer].visible=input.checked;
    renderer.shadowMap.needsUpdate=true;dirty=true;
  });
  function zoom(factor){stopTour();tween=null;state.transitioning=false;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);dirty=true;}
  $('#zoom-in').onclick=()=>zoom(.81);$('#zoom-out').onclick=()=>zoom(1.23);
  $('#reset').onclick=()=>{stopTour();selectDistrict(districts[0]);disclosure(!isCompact());};
  $('#rotate').onclick=()=>{stopTour();tween=null;state.transitioning=false;controls.autoRotate=!controls.autoRotate;$('#rotate').setAttribute('aria-pressed',String(controls.autoRotate));dirty=true;};
  const tourStops=['all','landmark','residences','gardens','towers','pullman','terraces'];
  function tourStop(){
    const d=districts.find(d=>d.id===tourStops[tourIndex]);selectDistrict(d);$('#tour-text').textContent=`Stop ${tourIndex+1} of ${tourStops.length} · Pause`;tourDeadline=performance.now()+7000;
  }
  $('#tour').onclick=()=>{
    if(state.tour){stopTour();return;}state.tour=true;tourIndex=0;$('#tour').setAttribute('aria-pressed','true');$('#tour-icon').textContent='Ⅱ';tourStop();
  };
  controls.addEventListener('start',()=>{stopTour();stopOrbit();tween=null;state.transitioning=false;});
  controls.addEventListener('change',()=>{dirty=true;});
  // A click and a drag have separate paths; multi-touch can never select a building.
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),activePointers=new Set();let pointerStart=null,hovered=null;
  function hitAt(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(resort.picks,false)[0]?.object.userData.building;}
  renderer.domElement.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);pointerStart=activePointers.size===1&&e.isPrimary&&e.button===0?{x:e.clientX,y:e.clientY,time:performance.now()}:null;$('#hover-name').hidden=true;});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6)pointerStart=null;
    if(e.pointerType!=='mouse'||activePointers.size)return;
    const b=hitAt(e);hovered=b?.id||null;renderer.domElement.style.cursor=b?'pointer':'grab';
    if(!b){$('#hover-name').hidden=true;return;}
    const r=viewport.getBoundingClientRect();$('#hover-name').textContent=b.name;$('#hover-name').hidden=false;
    $('#hover-name').style.left=`${Math.max(8,Math.min(r.width-210,e.clientX-r.left+14))}px`;$('#hover-name').style.top=`${Math.max(8,e.clientY-r.top-34)}px`;
  });
  renderer.domElement.addEventListener('pointerup',e=>{activePointers.delete(e.pointerId);if(!pointerStart||performance.now()-pointerStart.time>800){pointerStart=null;return;}pointerStart=null;const b=hitAt(e);if(b)selectBuilding(b);});
  renderer.domElement.addEventListener('pointercancel',e=>{activePointers.delete(e.pointerId);pointerStart=null;});
  renderer.domElement.addEventListener('pointerleave',()=>{$('#hover-name').hidden=true;hovered=null;});
  viewport.addEventListener('keydown',e=>{
    if(e.target!==viewport&&e.target!==renderer.domElement)return;
    if(!['+','=','-','_','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key))return;
    e.preventDefault();stopTour();stopOrbit();
    if(e.key==='Home'||e.key==='Escape'){selectDistrict(districts[0]);return;}
    if(['+','='].includes(e.key)){zoom(.85);return;}if(['-','_'].includes(e.key)){zoom(1.18);return;}
    tween=null;state.transitioning=false;const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(e.key==='ArrowLeft')s.theta-=.13;if(e.key==='ArrowRight')s.theta+=.13;if(e.key==='ArrowUp')s.phi-=.1;if(e.key==='ArrowDown')s.phi+=.1;
    s.phi=THREE.MathUtils.clamp(s.phi,controls.minPolarAngle,controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));dirty=true;
  });
  const projected=new THREE.Vector3();
  function updateLabels(){
    const w=viewport.clientWidth,h=viewport.clientHeight,occupied=[];
    for(const {el,at} of labelNodes){
      projected.set(...at).project(camera);const x=(projected.x+1)*w/2,y=(1-projected.y)*h/2;
      const collision=occupied.some(p=>Math.abs(x-p.x)<135&&Math.abs(y-p.y)<36);
      const compact=innerWidth<761;
      el.hidden=projected.z>1||projected.z< -1||x<78||x>w-80||y<(compact?175:75)||y>h-45||collision;
      if(!el.hidden){el.style.left=`${x}px`;el.style.top=`${y}px`;occupied.push({x,y});}
    }
    $('#compass-needle').style.transform=`rotate(${Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z)*180/Math.PI+180}deg)`;
  }
  let previousCompact=isCompact(),lastWidth=viewport.clientWidth,lastHeight=viewport.clientHeight;
  const observer=new ResizeObserver(()=>{
    const w=viewport.clientWidth,h=viewport.clientHeight;
    if(w===lastWidth&&h===lastHeight)return;
    lastWidth=w;lastHeight=h;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.4:1.65));
    const compact=isCompact();if(compact!==previousCompact){disclosure(!compact);previousCompact=compact;}
    // Refit the selected view after orientation changes, preserving lighting and layers.
    if(state.view==='building'&&focusedBuilding)focusBuilding(focusedBuilding);
    else if(['aerial','coast','overview'].includes(state.view))setView(state.view,true);
    else{const d=districts.find(d=>d.id===state.district);moveCamera(d.position,d.target,true,true);}
    dirty=true;
  });observer.observe(viewport);
  document.addEventListener('visibilitychange',()=>{lastTime=0;dirty=true;if(document.hidden){stopTour();stopOrbit();}});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#loading').classList.remove('loaded');$('#loading p').textContent='Restoring your view of the resort…';});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{renderer.shadowMap.needsUpdate=true;dirty=true;$('#loading').classList.add('loaded');});
  selectDistrict(districts[0],true);
  function animate(now){
    requestAnimationFrame(animate);if(document.hidden)return;
    const delta=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;
    if(tween){const t=Math.min((now-tween.start)/1350,1),ease=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,ease);controls.target.lerpVectors(tween.fromTarget,tween.target,ease);dirty=true;if(t===1){tween=null;state.transitioning=false;}}
    if(lightTween){
      const t=reducedMotion?1:Math.min((now-lightTween.start)/1100,1),ease=t*t*(3-2*t),{from,to}=lightTween;
      scene.background.copy(from.background).lerp(new THREE.Color(to.background),ease);scene.fog.color.copy(scene.background);
      sun.color.copy(from.sun).lerp(new THREE.Color(to.sun),ease);sun.intensity=THREE.MathUtils.lerp(from.sunIntensity,to.sunIntensity,ease);
      ambient.intensity=THREE.MathUtils.lerp(from.ambient,to.ambient,ease);renderer.toneMappingExposure=THREE.MathUtils.lerp(from.exposure,to.exposure,ease);
      scene.environmentIntensity=THREE.MathUtils.lerp(from.environment,to.environment,ease);fill.intensity=THREE.MathUtils.lerp(from.fill,to.fill,ease);
      sun.position.lerpVectors(from.position,new THREE.Vector3(...to.position),ease);nightAmount=THREE.MathUtils.lerp(from.night,to.night,ease);resort.setNight(nightAmount);
      renderer.shadowMap.needsUpdate=true;dirty=true;if(t===1)lightTween=null;
    }
    if(state.tour&&now>tourDeadline){tourIndex++;if(tourIndex>=tourStops.length){stopTour();selectDistrict(districts[0]);}else tourStop();}
    controls.update(delta);if(camera.position.y<5){camera.position.y=5;dirty=true;}
    if(dirty||controls.autoRotate){scene.fog.near=Math.max(900,camera.position.distanceTo(controls.target)+200);scene.fog.far=scene.fog.near+1300;renderer.render(scene,camera);updateLabels();dirty=false;renderer.domElement.dataset.rendered='true';}
  }
  requestAnimationFrame(animate);$('#loading').classList.add('loaded');
  window.petraResort={scene,camera,controls,renderer,state,stats:resort.stats,groups:resort.groups,buildings:resort.buildings,picks:resort.picks,stopMotion(){stopTour();stopOrbit();},get hovered(){return hovered;},get lightingTransition(){return !!lightTween;}};
}
