import * as THREE from 'three'
import { BEAT_VERTEX } from './glsl'

/** TubeGeometry whose radius follows `profile(u)` along its length */
export function taperedTube(curve: THREE.Curve<THREE.Vector3>, segments: number, radius: number, radial: number, profile?: (u: number) => number) {
  const geo = new THREE.TubeGeometry(curve, segments, radius, radial, false)
  if (profile) {
    const pos = geo.attributes.position as THREE.BufferAttribute
    const P = new THREE.Vector3()
    const v = new THREE.Vector3()
    for (let i = 0; i <= segments; i++) {
      curve.getPointAt(i / segments, P)
      const f = profile(i / segments)
      for (let j = 0; j <= radial; j++) {
        const idx = i * (radial + 1) + j
        v.fromBufferAttribute(pos, idx).sub(P).multiplyScalar(f).add(P)
        pos.setXYZ(idx, v.x, v.y, v.z)
      }
    }
  }
  return geo
}

/** Adds the attributes the glow shader animates along: distance from the source and a stagger */
export function withGlow(geo: THREE.BufferGeometry, length: number, seq: number, distOffset = 0) {
  const uv = geo.attributes.uv as THREE.BufferAttribute
  const n = uv.count
  const dist = new Float32Array(n)
  const s = new Float32Array(n).fill(seq)
  for (let i = 0; i < n; i++) dist[i] = distOffset + uv.getX(i) * length
  geo.setAttribute('aDist', new THREE.BufferAttribute(dist, 1))
  geo.setAttribute('aSeq', new THREE.BufferAttribute(s, 1))
  return geo
}

export type GlowUniforms = {
  uTime: { value: number }
  uReveal: { value: number }
  uFront: { value: number }
  uBase: { value: number }
  uBeat: { value: number }
  uPulse: { value: number }
  uOpacity: { value: number }
  uFade: { value: THREE.Vector2 }
  uColor: { value: THREE.Color }
  uHot: { value: THREE.Color }
  uBeatA: { value: number }
  uBeatV: { value: number }
  uAmp: { value: number }
}

/**
 * Light travelling through thin tubes: a reveal front that grows outward from the source,
 * heartbeat flashes, and pulses flowing along each vessel.
 */
export function makeGlowMaterial(color = '#5fe3ff', hot = '#eafcff') {
  const uniforms: GlowUniforms = {
    uTime: { value: 0 },
    uReveal: { value: 1 },
    uFront: { value: 16 },
    uBase: { value: 0.1 },
    uBeat: { value: 0 },
    uPulse: { value: 1 },
    uOpacity: { value: 1 },
    uFade: { value: new THREE.Vector2(6, 13) },
    uColor: { value: new THREE.Color(color) },
    uHot: { value: new THREE.Color(hot) },
    uBeatA: { value: 0 },
    uBeatV: { value: 0 },
    uAmp: { value: 1 },
  }
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader:
      BEAT_VERTEX +
      /* glsl */ `
      attribute float aSeq;
      attribute float aDist;
      varying float vDist;
      varying float vSeq;
      varying vec3 vN;
      varying vec3 vV;
      void main(){
        vec3 p = beat(position, 1.0 - smoothstep(1.3, 2.2, length(position)));
        vDist = aDist;
        vSeq = aSeq;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uReveal, uFront, uBase, uBeat, uPulse, uOpacity;
      uniform vec2 uFade;
      uniform vec3 uColor, uHot;
      varying float vDist;
      varying float vSeq;
      varying vec3 vN;
      varying vec3 vV;
      void main(){
        float front = uReveal * uFront;
        float lit = 1.0 - smoothstep(front - 1.4, front, vDist + vSeq * 2.5);
        float pulse = pow(fract(vDist * 0.3 - uTime * 0.55 - vSeq), 38.0) * uPulse;
        float flash = uBeat * exp(-vDist * 0.22);
        float core = abs(dot(normalize(vN), vV));
        float fade = 1.0 - smoothstep(uFade.x, uFade.y, vDist);
        float I = (uBase + lit * (0.42 + flash * 1.1 + pulse * 2.2)) * fade * (0.25 + 0.75 * core);
        vec3 col = mix(uColor, uHot, clamp(pulse * lit + flash * 0.35, 0.0, 1.0));
        gl_FragColor = vec4(col * I * 1.7, clamp(I, 0.0, 1.0) * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}
