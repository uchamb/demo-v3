import * as THREE from 'three';

export function roundedShape(width=1,depth=1,radius=.12) {
  const x=-width/2,y=-depth/2,w=width,d=depth,r=Math.min(radius,width/2,depth/2),s=new THREE.Shape();
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);
  s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
export function extrusion(shape,depth=1) {
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:5});
  g.rotateX(-Math.PI/2);return g;
}
export const geometries={
  box:new THREE.BoxGeometry(1,1,1),
  rounded:extrusion(roundedShape()).translate(0,-.5,0),
  sphere:new THREE.IcosahedronGeometry(1,1),
  cylinder:new THREE.CylinderGeometry(1,1,1,8),
  umbrella:new THREE.ConeGeometry(1,.28,10),
};
// One draw call per shared geometry/material; details remain inexpensive on phones.
export class Batches {
  constructor(group){this.group=group;this.entries=new Map();}
  add(g,m,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0){
    const key=g.uuid+m.uuid;
    if(!this.entries.has(key))this.entries.set(key,{g,m,transforms:[]});
    this.entries.get(key).transforms.push([x,y,z,sx,sy,sz,rx,ry,rz]);
  }
  box(m,x,y,z,sx,sy,sz,ry=0){this.add(geometries.box,m,x,y,z,sx,sy,sz,ry);}
  round(m,x,y,z,w,h,d,ry=0){this.add(geometries.rounded,m,x,y,z,w,h,d,ry);}
  flush(){
    const dummy=new THREE.Object3D();
    for(const {g,m,transforms} of this.entries.values()){
      const mesh=new THREE.InstancedMesh(g,m,transforms.length);
      transforms.forEach(([x,y,z,sx,sy,sz,rx,ry,rz],i)=>{
        dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.castShadow=m.userData.castShadow!==false;mesh.receiveShadow=true;mesh.computeBoundingSphere();this.group.add(mesh);
    }
    this.entries.clear();
  }
}
export function tube(points,radius,material,group){
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const geo=new THREE.TubeGeometry(path,Math.max(12,points.length*4),radius,5,false);
  const mesh=new THREE.Mesh(geo,material);group.add(mesh);return mesh;
}
export function ribbon(points,width,y,material,group){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,y,z)));
  const ps=curve.getPoints(Math.max(25,points.length*8)),positions=[],indices=[];
  ps.forEach((p,i)=>{
    const t=curve.getTangent(i/(ps.length-1)),nx=-t.z*width/2,nz=t.x*width/2;
    positions.push(p.x+nx,y,p.z+nz,p.x-nx,y,p.z-nz);
    if(i<ps.length-1){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
  });
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
  const m=new THREE.Mesh(g,material);m.receiveShadow=true;group.add(m);return m;
}
