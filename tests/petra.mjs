import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base=process.env.SITE_URL||'http://localhost:5183/demo-v3';
const output=process.env.ARTIFACT_DIR||'artifacts';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
await mkdir(output,{recursive:true});
const errors=[],external=[];
async function collect(page){
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.route('**/*',route=>{
    if(new URL(route.request().url()).origin===new URL(base).origin)return route.continue();
    external.push(route.request().url());return route.abort();
  });
}
async function ready(page){await page.waitForFunction(()=>window.petraResort&&document.querySelector('canvas').dataset.rendered==='true');}
async function settled(page){await page.waitForFunction(()=>!petraResort.state.transitioning&&!petraResort.lightingTransition);await page.waitForTimeout(150);}
const distance=page=>page.evaluate(()=>petraResort.camera.position.distanceTo(petraResort.controls.target));
async function roof(page,id){return page.evaluate(id=>{
  const {camera,buildings}=petraResort,b=buildings.find(b=>b.id===id),r=document.querySelector('canvas').getBoundingClientRect();
  const p=camera.position.clone().set(b.x,b.height+3,b.z).project(camera);
  return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};
},id);}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});await collect(page);
  await page.goto(`${base}/?source=validation`);await expect(page).toHaveURL(`${base}/?source=validation`);await ready(page);await settled(page);
  await expect(page).toHaveTitle('Petra Sea Resort — A world by the sea');
  const stats=await page.evaluate(()=>({...petraResort.stats,calls:petraResort.renderer.info.render.calls,triangles:petraResort.renderer.info.render.triangles}));
  assert.equal(stats.buildings,50);assert.equal(stats.residences,34);assert.equal(stats.towers,6);assert(stats.trees>900);assert(stats.calls<100);assert(stats.triangles>300000);
  const ids=await page.evaluate(()=>petraResort.buildings.map(b=>b.id));
  assert.equal(new Set(ids).size,50);assert.deepEqual(await page.locator('#building-select option[value]:not([value=""])').evaluateAll(nodes=>nodes.map(n=>n.value).sort()),[...ids].sort());
  assert.deepEqual(await page.evaluate(()=>petraResort.picks.map(p=>p.userData.building.id).sort()),[...ids].sort());
  assert(await page.evaluate(()=>document.fonts.check('12px Manrope')));
  await page.screenshot({path:`${output}/petra-desktop.png`});
  const initial=await distance(page);await page.locator('#zoom-in').click();assert(await distance(page)<initial*.9);await page.locator('#zoom-out').click();
  await page.locator('#layers-toggle').click();
  for(const name of ['landscape','amenities']){
    await page.locator(`[data-layer=${name}]`).uncheck();assert.equal(await page.evaluate(n=>petraResort.groups[n].visible,name),false);
    await page.locator(`[data-layer=${name}]`).check();
  }
  await page.locator('[data-layer=labels]').uncheck();await expect(page.locator('#labels')).toBeHidden();await page.locator('#layers-toggle').click();
  await page.locator('[data-view=aerial]').click();await settled(page);assert(await page.evaluate(()=>petraResort.controls.getPolarAngle())<.05);
  const point=await roof(page,'tower-b');await page.mouse.move(point.x,point.y);await expect(page.locator('#hover-name')).toContainText('Apartment tower B');
  await page.mouse.click(point.x,point.y);assert.equal(await page.evaluate(()=>petraResort.state.selected),'tower-b');await expect(page.locator('#place-title')).toHaveText('Apartment tower B');
  await page.locator('#focus-place').click();await settled(page);assert.equal(await page.evaluate(()=>petraResort.state.view),'building');
  for(const id of ['residence-17','pavilion-5','pullman-a','pullman-b','terraces','landmark']){
    await page.locator('#building-select').selectOption(id);await settled(page);assert.equal(await page.evaluate(()=>petraResort.state.selected),id);
    assert.equal(await page.locator('#building-select').inputValue(),id);
  }
  await page.screenshot({path:`${output}/petra-landmark.png`});
  await page.locator('#reset').click();await settled(page);
  for(const district of ['residences','towers','pullman','gardens','terraces','all']){
    await page.locator(`[data-district=${district}]`).click();await settled(page);assert.equal(await page.evaluate(()=>petraResort.state.district),district);
    if(district==='residences')await page.screenshot({path:`${output}/petra-residences.png`});
  }
  await page.locator('#layers-toggle').click();await page.locator('[data-layer=labels]').check();await page.locator('#layers-toggle').click();
  await page.locator('[data-view=aerial]').click();await settled(page);await page.locator('#place-toggle').click();await page.screenshot({path:`${output}/petra-masterplan.png`});
  await page.locator('[data-view=coast]').click();await settled(page);await page.screenshot({path:`${output}/petra-coast.png`});
  await page.locator('#reset').click();await settled(page);
  const before=await page.evaluate(()=>petraResort.camera.position.toArray());
  await page.mouse.move(980,690);await page.mouse.down();await page.mouse.move(1120,710,{steps:10});await page.mouse.up();await page.waitForTimeout(400);
  assert.notDeepEqual(await page.evaluate(()=>petraResort.camera.position.toArray()),before);assert.equal(await page.evaluate(()=>petraResort.state.selected),null);
  const panBefore=await page.evaluate(()=>petraResort.controls.target.toArray());
  await page.mouse.move(980,650);await page.mouse.down({button:'right'});await page.mouse.move(1030,665,{steps:5});await page.mouse.up({button:'right'});
  await expect.poll(()=>page.evaluate(()=>petraResort.controls.target.toArray())).not.toEqual(panBefore);
  await page.locator('#viewport').focus();await page.keyboard.press('Home');await settled(page);
  const angle=await page.evaluate(()=>petraResort.controls.getAzimuthalAngle());await page.keyboard.press('ArrowLeft');await expect.poll(()=>page.evaluate(()=>petraResort.controls.getAzimuthalAngle())).not.toBe(angle);
  await page.locator('#rotate').click();assert(await page.evaluate(()=>petraResort.controls.autoRotate));await page.locator('#rotate').click();
  await page.locator('#tour').click();assert(await page.evaluate(()=>petraResort.state.tour));await expect(page.locator('#tour-text')).toContainText('Stop 1');
  await expect(page.locator('#tour-text')).toContainText('Stop 2',{timeout:12000});
  await page.locator('#zoom-in').click();assert.equal(await page.evaluate(()=>petraResort.state.tour),false);await expect(page.locator('#tour')).toHaveAttribute('aria-pressed','false');
  console.log('Checked geometry, selection, presets, camera controls, layers and guided tour');
  await page.locator('#reset').click();await settled(page);
  for(const light of ['sunset','night','day']){
    await page.locator(`button[data-light=${light}]`).click();await settled(page);assert.equal(await page.evaluate(()=>petraResort.state.light),light);
    if(light!=='day')await page.screenshot({path:`${output}/petra-${light}.png`});
  }
  await page.locator('#sources-open').click();await expect(page.locator('#sources-dialog')).toBeVisible();
  for(const img of await page.locator('.gallery img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);}
  await page.locator('.dialog-header').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/petra-references.png`});
  const notes=await page.request.get(`${base}/SOURCES.md`);assert.equal(notes.status(),200);assert((await notes.text()).includes('50 individually selectable'));
  await page.keyboard.press('Escape');await expect(page.locator('#sources-dialog')).toBeHidden();await expect(page.locator('#sources-open')).toBeFocused();
  // Damping convergence depends on frame rate; wait for an actually idle interval.
  await expect.poll(async()=>{const frame=await page.evaluate(()=>petraResort.renderer.info.render.frame);await page.waitForTimeout(400);return (await page.evaluate(()=>petraResort.renderer.info.render.frame))===frame;},{timeout:30000}).toBe(true);
  await page.close();
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const mobile=await context.newPage();await collect(mobile);await mobile.goto(`${base}/`);await ready(mobile);
  await expect(mobile.locator('#place-content')).toBeHidden();assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth),390);
  await mobile.screenshot({path:`${output}/petra-mobile.png`});
  await mobile.locator('#place-toggle').tap();await expect(mobile.locator('#place-content')).toBeVisible();await mobile.locator('#place-toggle').tap();
  await mobile.locator('[data-district=pullman]').tap();assert.equal(await mobile.evaluate(()=>petraResort.state.district),'pullman');assert.equal(await mobile.evaluate(()=>petraResort.state.transitioning),false);
  await mobile.locator('#reset').tap();
  const cdp=await context.newCDPSession(mobile),touchBefore=await mobile.evaluate(()=>petraResort.controls.getAzimuthalAngle());
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:140,y:475}]});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:140+i*13,y:475+i*2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(400);
  assert.notEqual(await mobile.evaluate(()=>petraResort.controls.getAzimuthalAngle()),touchBefore);
  const pinchBefore=await distance(mobile);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:130,y:465},{x:215,y:465}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:95,y:465},{x:270,y:465}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(400);assert(await distance(mobile)<pinchBefore);assert.equal(await mobile.evaluate(()=>petraResort.state.selected),null);
  await mobile.locator('[data-view=aerial]').tap();await settled(mobile);
  await mobile.locator('#layers-toggle').tap();await mobile.locator('[data-layer=labels]').uncheck();await mobile.locator('#layers-toggle').tap();
  const mobilePoint=await roof(mobile,'tower-b');await mobile.touchscreen.tap(mobilePoint.x,mobilePoint.y);
  assert.equal(await mobile.evaluate(()=>petraResort.state.selected),'tower-b');await expect(mobile.locator('#place-content')).toBeVisible();
  // A selected building must not override a later camera preset on rotation.
  await mobile.locator('[data-view=aerial]').tap();
  await mobile.setViewportSize({width:844,height:390});await settled(mobile);
  assert.equal(await mobile.evaluate(()=>petraResort.state.view),'aerial');
  assert(await mobile.evaluate(()=>petraResort.controls.getPolarAngle())<.05);
  await mobile.locator('#reset').tap();
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollHeight),390);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth),844);
  await expect(mobile.locator('#reset')).toBeInViewport();
  await mobile.locator('[data-district=terraces]').tap();assert.equal(await mobile.evaluate(()=>petraResort.state.district),'terraces');
  await mobile.locator('#reset').tap();await mobile.locator('[data-district=all]').scrollIntoViewIfNeeded();
  await mobile.locator('#layers-toggle').tap();await mobile.locator('[data-layer=landscape]').uncheck();assert.equal(await mobile.evaluate(()=>petraResort.groups.landscape.visible),false);await mobile.locator('[data-layer=landscape]').check();await mobile.locator('[data-layer=labels]').check();await mobile.locator('#layers-toggle').tap();
  await mobile.locator('button[data-light=night]').tap();await settled(mobile);assert.equal(await mobile.evaluate(()=>petraResort.state.light),'night');
  await mobile.locator('button[data-light=day]').tap();await settled(mobile);await mobile.screenshot({path:`${output}/petra-mobile-horizontal.png`});
  await mobile.locator('#sources-open').tap();await expect(mobile.locator('#sources-dialog')).toBeVisible();await mobile.locator('#sources-close').tap();await context.close();
  console.log('Checked lighting, local references, idle rendering, reduced motion, mobile orbit/pinch/tap and landscape orientation');
  const fallback=await browser.newPage();await collect(fallback);await fallback.addInitScript(()=>{const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2'||type==='webgl')return null;return getContext.call(this,type,...args);};});
  await fallback.goto(`${base}/`);await expect(fallback.locator('#loading')).toContainText('needs WebGL 2');await fallback.locator('#sources-open').click();await expect(fallback.locator('#sources-dialog')).toBeVisible();await fallback.close();
  assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  await writeFile(`${output}/petra-validation.json`,JSON.stringify({result:'PASS',stats,errors,externalRequests:external,checks:['production entry point and query string','50 building records/pick targets/select options','real geometry picking','district and building focus','overhead and coast presets','zoom/orbit/pan controls','keyboard navigation','guided tour progression and cancellation','day/sunset/night transitions','layer visibility','local reference gallery','idle rendering','mobile disclosure','touch orbit/pinch/tap','responsive orientation','reduced motion','WebGL fallback']},null,2));
  console.log('PASS: Petra Sea Resort',stats);
}finally{await browser.close();}
