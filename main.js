import * as THREE from 'three'
import { DoubleSide } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

/** SCENE */
const scene = new THREE.Scene();

/** CAMERA */
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;

/** RENDERER */
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function render() {
  renderer.render( scene, camera );
}

/** OBJECTS */
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.ShaderMaterial({
    uniforms: {
      resolution: {
        type: 'f',
        value: new THREE.Vector2(visualViewport.width, visualViewport.height)
      },
     },
    vertexShader:
      `

      void main() {
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition; 
      }
    `,
    fragmentShader:
    `
      uniform vec2 resolution;
      vec3 col;

      const int MAXSTEPS = 100;
      const float MINDISTANCE = .01;
      const float MAXDISTANCE = 1000.;

      float SDFsphere(vec3 ray, vec4 circle) {
        return length(circle.xyz - ray) - circle.w;
      }

      float distToScene(vec3 p) {
        //SCENE
        //the 4th argument represents the radius
        vec4 circle = vec4(0., 0., 0., .2);
        return SDFsphere(p, circle);
      }

      vec3 raymarch(vec3 ray) {
        for (int i = 0; i < MAXSTEPS; i++) {
          float distance = distToScene(ray);
          if (distance < MINDISTANCE) {
            return ray;
          }
          ray *= length(distance);
        }
        //return black
        return vec3(0.);
      }

      void main() {
        col = vec3(0.);
        //x: 0. -> 2., y: 0. -> 1.
        vec2 uv = (gl_FragCoord.xy / resolution.y);

        vec3 camera = vec3(1., .5, 5.);
        vec3 ray = vec3(vec2(uv.xy - camera.xy), .01);

        ray = raymarch(ray);

        gl_FragColor = vec4(ray, 1.0);
      }
    `,
  })
);
scene.add(plane);

/** cover with quad */
/** FIX */
const dist = camera.position.z;
const height = 1;
camera.fov = 2*(180/Math.PI)*Math.atan(height/(2*dist));

if (window.innerWidth/window.innerHeight > 1) {
  plane.scale.x = camera.aspect;
}
else {
  plane.scale.y = 1 / camera.aspect;
}

camera.updateProjectionMatrix();

/** CONTROLS */
// const controls = new OrbitControls(camera, renderer.domElement);

/** ANIMATE */
function animate() {
  requestAnimationFrame( animate );

  render();
};

animate();