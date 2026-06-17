import * as React from 'react'

import { cn } from './primitives.tsx'

export interface LiquidEtherProps extends React.HTMLAttributes<HTMLDivElement> {
  mouseForce?: number
  cursorSize?: number
  resolution?: number
  autoDemo?: boolean
  autoSpeed?: number
  autoIntensity?: number
  autoResumeDelay?: number
  opacity?: number
  respectReducedMotion?: boolean
}

const vertexShaderSource = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const fragmentShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform vec2 u_velocity;
uniform float u_time;
uniform float u_cursor_size;
uniform float u_mouse_force;
uniform float u_auto_intensity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(0.82, -0.58, 0.58, 0.82);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.05 + 0.17;
    amplitude *= 0.52;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(u_resolution.xy, vec2(1.0));
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 centered = (uv - 0.5) * aspect;
  vec2 pointerUv = u_pointer / max(u_resolution.xy, vec2(1.0));
  vec2 pointerCentered = (pointerUv - 0.5) * aspect;
  vec2 velocity = u_velocity / max(max(u_resolution.x, u_resolution.y), 1.0);

  float pointerDistance = distance(centered, pointerCentered);
  float cursorRadius = max(u_cursor_size / max(max(u_resolution.x, u_resolution.y), 1.0), 0.002);
  float pointerInfluence = exp(-pointerDistance * pointerDistance / max(cursorRadius * cursorRadius, 0.0001));
  float motion = clamp(length(velocity) * u_mouse_force, 0.0, 2.8);
  float t = u_time * 0.12;

  vec2 flow = centered;
  flow += 0.105 * vec2(
    sin((centered.y * 7.2) + t * 2.2),
    cos((centered.x * 6.6) - t * 1.8)
  );
  flow += velocity * pointerInfluence * 0.96;

  float mist = fbm(flow * 2.9 + vec2(t * 0.48, -t * 0.31));
  float slow = fbm(flow * 5.8 - vec2(t * 0.23, t * 0.34));
  float ribbon = sin((flow.x + mist * 0.72) * 15.0 + (flow.y - slow * 0.44) * 8.0 + u_time * 1.15);
  float ripple = sin(pointerDistance * 54.0 - u_time * 7.6 + mist * 5.0)
    * exp(-pointerDistance * 6.2)
    * pointerInfluence
    * motion;

  float body = smoothstep(0.16, 0.78, mist * 0.62 + slow * 0.34 + ripple * 0.22);
  float vein = smoothstep(0.34, 0.88, ribbon * 0.5 + 0.5) * smoothstep(0.18, 0.92, slow);
  vec3 pine = vec3(0.30, 0.43, 0.32);
  vec3 moss = vec3(0.72, 0.82, 0.49);
  vec3 air = vec3(0.58, 0.72, 0.58);
  vec3 pearl = vec3(0.96, 0.95, 0.88);
  vec3 color = mix(pearl, air, body);
  color = mix(color, moss, smoothstep(0.26, 0.84, slow) * 0.48);
  color = mix(color, pine, (vein * 0.24) + (pointerInfluence * motion * 0.22) + max(ripple, 0.0) * 0.18);

  float vignette = smoothstep(1.05, 0.12, length(centered));
  float alpha = (0.34 + body * 0.50 + vein * 0.16 + pointerInfluence * motion * 0.24 + u_auto_intensity * 0.055) * vignette;
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.92));
}
`

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function LiquidEther({
  className,
  mouseForce = 15,
  cursorSize = 120,
  resolution = 0.4,
  autoDemo = true,
  autoSpeed = 0.3,
  autoIntensity = 1.8,
  autoResumeDelay = 2000,
  opacity = 0.78,
  respectReducedMotion = true,
  ...props
}: LiquidEtherProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const reducedMotion = respectReducedMotion
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: false,
    })
    if (!gl) return undefined

    const program = createProgram(gl)
    if (!program) return undefined
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const pointerLocation = gl.getUniformLocation(program, 'u_pointer')
    const velocityLocation = gl.getUniformLocation(program, 'u_velocity')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const cursorSizeLocation = gl.getUniformLocation(program, 'u_cursor_size')
    const mouseForceLocation = gl.getUniformLocation(program, 'u_mouse_force')
    const autoIntensityLocation = gl.getUniformLocation(program, 'u_auto_intensity')
    const buffer = gl.createBuffer()
    if (!buffer) return undefined

    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let animationFrame = 0
    let width = 1
    let height = 1
    let lastFrame = performance.now()
    let idleSince = performance.now()
    const pointer = {
      x: 0.5,
      y: 0.5,
      targetX: 0.5,
      targetY: 0.5,
      vx: 0,
      vy: 0,
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const scale = clamp((window.devicePixelRatio || 1) * resolution, 0.25, 1.25)
      width = Math.max(1, Math.floor(rect.width * scale))
      height = Math.max(1, Math.floor(rect.height * scale))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
      pointer.x = pointer.x || width * 0.5
      pointer.y = pointer.y || height * 0.5
      pointer.targetX = pointer.targetX || width * 0.5
      pointer.targetY = pointer.targetY || height * 0.5
    }

    const handlePointerMove = (event: PointerEvent | MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect()
      const clientX = 'clientX' in event ? event.clientX : 0
      const clientY = 'clientY' in event ? event.clientY : 0
      const scaleX = width / Math.max(rect.width, 1)
      const scaleY = height / Math.max(rect.height, 1)
      pointer.targetX = clamp((clientX - rect.left) * scaleX, 0, width)
      pointer.targetY = clamp((rect.bottom - clientY) * scaleY, 0, height)
      idleSince = performance.now()
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) handlePointerMove(touch)
    }

    const render = (now: number) => {
      const delta = Math.min(48, now - lastFrame)
      lastFrame = now
      resize()

      const idle = now - idleSince
      if (autoDemo && (idle > autoResumeDelay || reducedMotion)) {
        const autoT = now * 0.001 * (reducedMotion ? autoSpeed * 0.2 : autoSpeed)
        const radiusX = width * (0.21 + Math.sin(autoT * 0.7) * 0.035)
        const radiusY = height * (0.18 + Math.cos(autoT * 0.5) * 0.025)
        pointer.targetX = width * 0.5 + Math.cos(autoT) * radiusX
        pointer.targetY = height * 0.5 + Math.sin(autoT * 0.86) * radiusY
      }

      const previousX = pointer.x
      const previousY = pointer.y
      const smoothing = reducedMotion ? 0.018 : 0.075
      pointer.x += (pointer.targetX - pointer.x) * smoothing
      pointer.y += (pointer.targetY - pointer.y) * smoothing
      pointer.vx = (pointer.x - previousX) / Math.max(delta, 1)
      pointer.vy = (pointer.y - previousY) / Math.max(delta, 1)

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.uniform2f(resolutionLocation, width, height)
      gl.uniform2f(pointerLocation, pointer.x, pointer.y)
      gl.uniform2f(velocityLocation, pointer.vx * 1000, pointer.vy * 1000)
      gl.uniform1f(timeLocation, now * 0.001)
      gl.uniform1f(cursorSizeLocation, cursorSize * clamp(resolution, 0.25, 1.25))
      gl.uniform1f(mouseForceLocation, reducedMotion ? mouseForce * 0.2 : mouseForce)
      gl.uniform1f(autoIntensityLocation, autoDemo ? autoIntensity : 0)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      animationFrame = window.requestAnimationFrame(render)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    resize()
    animationFrame = window.requestAnimationFrame(render)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('touchmove', handleTouchMove)
      observer.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [
    autoDemo,
    autoIntensity,
    autoResumeDelay,
    autoSpeed,
    cursorSize,
    mouseForce,
    resolution,
    respectReducedMotion,
  ])

  return (
    <div
      className={cn('drama-liquid-ether', className)}
      aria-hidden="true"
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="drama-liquid-ether-canvas"
        style={{ opacity }}
      />
    </div>
  )
}
