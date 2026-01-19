import * as THREE from "https://unpkg.com/three@0.133.1/build/three.module.js"

const canvasEl = document.getElementById("canvas")
const cleanBtn = document.querySelector(".clean-btn")
const hint = document.querySelector(".name")
let firstClick = false

const audio = new Audio("./music/Ronetts_-_Be_my_Baby_(mp3.pm).mp3")
audio.loop = true

const pointer = { x: 0.5, y: 0.5, clicked: false }

let renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))

let sceneBasic = new THREE.Scene()
let sceneShader = new THREE.Scene()
let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10)
let clock = new THREE.Clock()

let renderTargets = [
  new THREE.WebGLRenderTarget(innerWidth, innerHeight),
  new THREE.WebGLRenderTarget(innerWidth, innerHeight)
]

let shaderMaterial, basicMaterial

createPlane()
onResize()
render()

window.addEventListener("resize", onResize)

// Interaction Trigger
function startExperience(x, y) {
  pointer.x = x
  pointer.y = y
  pointer.clicked = true

  if (!firstClick) {
    hint.style.display = "none"
    audio.play().catch(e => console.error("Playback failed:", e))
    firstClick = true
  }
}

window.addEventListener("click", e => startExperience(e.clientX / innerWidth, e.clientY / innerHeight))
window.addEventListener("touchstart", e => startExperience(e.touches[0].clientX / innerWidth, e.touches[0].clientY / innerHeight))

cleanBtn.addEventListener("click", () => {
  pointer.vanishCanvas = true
  setTimeout(() => pointer.vanishCanvas = false, 50)
})

function createPlane() {
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_stop_time: { value: 0 },
      u_stop_randomizer: { value: new THREE.Vector2(Math.random(), Math.random()) },
      u_cursor: { value: new THREE.Vector2(pointer.x, pointer.y) },
      u_ratio: { value: innerWidth / innerHeight },
      u_texture: { value: null },
      u_clean: { value: 1 },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent,
  })

  basicMaterial = new THREE.MeshBasicMaterial()
  const geo = new THREE.PlaneGeometry(2, 2)
  sceneBasic.add(new THREE.Mesh(geo, basicMaterial))
  sceneShader.add(new THREE.Mesh(geo, shaderMaterial))
}

function render() {
  shaderMaterial.uniforms.u_clean.value = pointer.vanishCanvas ? 0 : 1
  shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture
  if (pointer.clicked) {
    shaderMaterial.uniforms.u_cursor.value = new THREE.Vector2(pointer.x, 1 - pointer.y)
    shaderMaterial.uniforms.u_stop_randomizer.value = new THREE.Vector2(Math.random(), Math.random())
    shaderMaterial.uniforms.u_stop_time.value = 0
    pointer.clicked = false
  }
  shaderMaterial.uniforms.u_stop_time.value += clock.getDelta()
  renderer.setRenderTarget(renderTargets[1])
  renderer.render(sceneShader, camera)
  basicMaterial.map = renderTargets[1].texture
  renderer.setRenderTarget(null)
  renderer.render(sceneBasic, camera)
  let t = renderTargets[0]
  renderTargets[0] = renderTargets[1]
  renderTargets[1] = t
  requestAnimationFrame(render)
}

function onResize() {
  shaderMaterial.uniforms.u_ratio.value = innerWidth / innerHeight
  renderer.setSize(innerWidth, innerHeight)
}