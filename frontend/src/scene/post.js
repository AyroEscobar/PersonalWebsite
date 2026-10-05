/*
  Post: EffectComposer with UnrealBloomPass (threshold-selective: only HDR emissives
  bloom), then OutputPass (tone mapping + sRGB), then one grade pass in sRGB:
  a vignette and a lift/gain grade (the radial colour split is kept in the shader at 0:
  the rock's dispersion is the only colour split the frame needs).

    makePost(renderer, scene, camera, { tier })  -> { render(), setSize(w,h), passes }
*/
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

export const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uCA: { value: 0 }, uVig: { value: 0.34 }, uLift: { value: 0.012 }, uGain: { value: 1.04 }, uSat: { value: 1.05 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uCA, uVig, uLift, uGain, uSat; uniform vec2 uRes; varying vec2 vUv;
  void main(){
    vec2 c = vUv - 0.5; float r2 = dot(c, c);
    // the radial colour split: quadratic, only toward the edges (the centre stays sharp); 0 on this page
    vec2 d = c * r2 * uCA * 8.0;
    vec3 col = vec3(texture2D(tDiffuse, vUv + d).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d).b);
    // grade
    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(l), col, uSat);
    col = col * uGain + uLift;
    // vignette, aspect-aware
    float v = 1.0 - smoothstep(0.35, 1.25, length(c * vec2(uRes.x / uRes.y, 1.0)) * 1.1) * uVig;
    gl_FragColor = vec4(col * v, 1.0);
  }`,
}

export function makePost(r, scene, cam, { tier = 'full', bloom = true, grade = true } = {}) {
  const size = r.getSize(new THREE.Vector2()).multiplyScalar(r.getPixelRatio())
  const comp = new EffectComposer(r, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: tier === 'full' ? 4 : 0 }))
  const passes = { render: new RenderPass(scene, cam) }
  comp.addPass(passes.render)
  if (bloom) { passes.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), tier === 'full' ? 0.55 : 0.4, 0.55, 0.92); comp.addPass(passes.bloom) }
  passes.output = new OutputPass(); comp.addPass(passes.output)
  if (grade) { passes.grade = new ShaderPass(GradeShader); passes.grade.uniforms.uRes.value.set(size.x, size.y); if (tier !== 'full') passes.grade.uniforms.uCA.value = 0; comp.addPass(passes.grade) }
  return {
    passes, composer: comp,
    render: () => comp.render(),
    setSize: (w, h) => { comp.setSize(w, h); passes.grade?.uniforms.uRes.value.set(w, h) },
  }
}
