import * as THREE from 'three'
import { DoubleSide } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let clock = new THREE.Clock();
let clockTime = clock.getElapsedTime();

/** SCENE */
const scene = new THREE.Scene();

/** CAMERA */
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;

/** RENDERER */
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

/** UNIFORMS */
const uniforms = {
  resolution: {
    type: 'f',
    value: new THREE.Vector2(visualViewport.width, visualViewport.height)
  },
  time: {
    type: 'f',
    value: clock.getElapsedTime(),
  },
}

/** OBJECTS */
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.ShaderMaterial({
    uniforms: uniforms,
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
      uniform float time;
      vec3 col;

      const int MAXSTEPS = 10000;
      const float MINDISTANCE = .00001;
      const float MAXDISTANCE = float(MAXSTEPS);

      float SDFsphere(vec3 ray, vec4 circle) {
        return length(circle.xyz - ray) - circle.w;
      }

      float SDFplane(vec3 ray, float height) {
        return ray.y - height;
      }

      float scene(vec3 p) {
        //SCENE
        //the 4th argument represents the radius
        vec4 circle = vec4(cos(time), 1., sin(time), .5);
        vec4 circle2 = vec4(-cos(time), 1., -sin(time), .5);
        float plane = 0.;
        
        float d = SDFsphere(p, circle);
        float d2 = SDFsphere(p, circle2);
        float d3 = SDFplane(p, plane);

        return min(min(d, d3), d2);
      }

      vec3 calcNormal(vec3 p) {
        const float eps = 0.00001;
        const vec2 h = vec2(eps,0);
        return normalize( vec3(scene(p+h.xyy) - scene(p-h.xyy),
                              scene(p+h.yxy) - scene(p-h.yxy),
                              scene(p+h.yyx) - scene(p-h.yyx)));
      }

      float raymarch(vec3 rayOrigin, vec3 ray) {
        int step = 0;
        vec3 rayPos = rayOrigin;
        float rayLen = 0.;
        while (step < MAXSTEPS) {
          float distance = scene(rayPos);
          if (distance < MINDISTANCE) {
            return rayLen;
          }
          if (distance > MAXDISTANCE) {
            break;
          }
          rayLen += distance;
          rayPos = rayOrigin + ray * rayLen;
          step++;
        }
        return rayLen;
      }

      void main() {
        col = vec3(0.);
        //x: 0. -> 2., y: 0. -> 1.
        vec2 uv = (gl_FragCoord.xy / resolution.y);
        uv.x -= 1.;
        uv.y -= .5;

        vec3 camera = vec3(0., 1., 5.);
        vec3 ray = normalize(vec3(uv, -1.));

        float t = raymarch(camera, ray); //returns distance from camera to obj

        col = vec3(0.);
        if (t<MAXDISTANCE) {
          //should be a direction, not a position
          vec3 light = vec3(5., 5., 0.);

          vec3 rayPos = camera + ray * t;

          vec3 normal = calcNormal(rayPos);

          //normalize light to turn into a direction instead of position
          float dot = dot(normal, normalize(light));

          //soft shadows
          //raymarch from intersecting surface towards a light source
          //need: rayPos, light source vector normal
          float shadow = MAXDISTANCE;
          if (dot > .5) {
            shadow = raymarch(rayPos + normal * 2. * MINDISTANCE, normalize(light - rayPos));
          }
          if (shadow<MAXDISTANCE) {
          }
          else {
            col = vec3((dot + 1.) / 2.);
          }
        }

        gl_FragColor = vec4(col, 1.0);
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
  uniforms.time.value = clock.getElapsedTime();

  render();
};

function render() {
  renderer.render( scene, camera );
}

animate();