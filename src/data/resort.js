// Illustrative building positions for the demo3 coastal scene.
// Metres are illustrative. X follows the beachfront; +Z points toward the sea.
// Local residence numbers identify this model only, not sales inventory.
const roofs = [
  [331,285,7],[294,339,6],[359,322,6],[419,311,7],[482,324,7],
  [402,355,6],[473,359,6],[548,348,6],[615,359,6],[314,407,5],
  [379,390,5],[445,408,5],[538,394,5],[596,400,6],[331,445,4],
  [393,452,4],[455,440,4],[722,379,6],[697,425,5],[792,396,6],
  [862,397,7],[923,408,6],[1030,420,7],[1074,454,5],[980,442,6],
  [908,456,5],[835,437,5],[764,443,5],[822,477,5],[893,494,5],
  [781,513,4],[819,548,4],[892,562,4],[941,532,5],
];
function unproject(px, py, height) {
  // Projected ground corners: (113,490), (1095,695), (311,143).
  const dx = px - 113, dy = py + height * 1.7 - 490;
  const u = (347 * dx + 198 * dy) / 381364;
  const v = (205 * dx - 982 * dy) / 381364;
  return [Math.round(-300 + 600 * u), Math.round(150 - 310 * v)];
}
export const residences = roofs.map(([px,py,floors], i) => {
  const [x,tracedZ] = unproject(px,py,floors*3.2);
  // Separate nearby podiums obscured by perspective/estimated roof heights.
  const z=tracedZ+({6:6,14:5,16:15,24:5}[i]||0);
  return {id:`residence-${i+1}`,name:`Garden residence ${String(i+1).padStart(2,'0')}`,category:'residences',kind:'residence',x,z,w:21,d:23,floors,height:floors*3.2,rotation:(i%3-1)*.12};
});
export const pavilions = [[391,232],[412,261],[414,284],[448,297],[484,302],[532,311],[579,327],[618,315],[650,296]].map(([px,py],i)=>{
  const [x,z]=unproject(px,py,4);
  return {id:`pavilion-${i+1}`,name:`Lakeside pavilion ${i+1}`,category:'gardens',kind:'pavilion',x,z,w:14,d:13,floors:1,height:4,rotation:.12};
});
export const buildings = [
  {id:'landmark',name:'Sculptural landmark',category:'landmark',kind:'landmark',x:-258,z:82,w:47,d:36,floors:45,height:151,rotation:0},
  ...['A','B','C'].map((name,i)=>({id:`tower-${name.toLowerCase()}`,name:`Apartment tower ${name}`,category:'towers',kind:'tower',x:36+i*92,z:-119,w:29,d:47,floors:29,height:94,rotation:0})),
  {id:'beachfront-a',name:'Beachfront Residences · A',category:'beachfront',kind:'beachfront',x:249,z:74,w:43,d:28,floors:25,height:83,rotation:-.15},
  {id:'beachfront-b',name:'Beachfront Living · B',category:'beachfront',kind:'beachfront',x:291,z:111,w:22,d:34,floors:23,height:76.4,rotation:-.15},
  {id:'terraces',name:'Seafront terraces',category:'terraces',kind:'terraces',x:-20,z:110,w:108,d:43,floors:5,height:19,rotation:0},
  ...residences,...pavilions,
];
export const districts = [
  {id:'all',name:'The whole resort',short:'Entire resort',eyebrow:'A PLACE OF YOUR OWN',description:'Follow the coast, wander through the gardens, and discover the architecture of demo3.',target:[0,20,0],position:[400,416,705]},
  {id:'residences',name:'Life in the gardens',short:'Garden residences',eyebrow:'LOW-RISE LIVING',description:'Rounded balconies and sheltered courtyards. A collection of residences woven through the resort’s green heart.',target:[-124,14,44],position:[-8,130,250]},
  {id:'towers',name:'Above the coastline',short:'Apartment towers',eyebrow:'THREE TOWERS · A / B / C',description:'The three rear towers rise above the gardens, with long balcony façades and pools at their feet.',target:[127,42,-116],position:[290,181,155]},
  {id:'beachfront',name:'A new horizon',short:'Beachfront residences',eyebrow:'BEACHFRONT LIVING & RESIDENCES',description:'Two curved towers mark the beachfront, with layered terraces, rooftop pools and open views toward the sea.',target:[263,36,85],position:[415,136,304]},
  {id:'landmark',name:'A sculpted skyline',short:'Sculptural landmark',eyebrow:'THE MASTERPLAN’S LANDMARK',description:'The flowing silhouette and arched crown form an illustrative landmark building.',target:[-258,69,82],position:[-100,167,315]},
  {id:'gardens',name:'Room to slow down',short:'Lake & gardens',eyebrow:'THE GREEN HEART',description:'A lake, intimate pavilions and shaded paths form a quiet counterpoint to the beachfront. Explore the sports courts nearby.',target:[-153,3,-121],position:[-38,186,100]},
  {id:'terraces',name:'At the water’s edge',short:'Beach & marina',eyebrow:'THE COAST',description:'A palm-lined promenade connects the terraced seafront building, beach gardens and the small marina.',target:[-45,10,160],position:[95,135,425]},
];
