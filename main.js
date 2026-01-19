import * as THREE from "https://unpkg.com/three@0.133.1/build/three.module.js"

const canvasEl = document.getElementById("canvas")
const cleanBtn = document.querySelector(".clean-btn")
const hint = document.querySelector(".name")   // NEW
let firstClick = false                         // NEW

const audio = new Audio("./music/Ronetts_-_Be_my_Baby_(mp3.pm).mp3")
audio.loop = true

const lyricsContainer = document.getElementById("lyrics-container")
const lyricsData = [
  { time: 7.5, text: "The night we met, I knew I needed you so" },
  { time: 14.2, text: "And if I had the chance, I'd never let you go" },
  { time: 20.8, text: "So won't you say you love me?\nI'll make you so proud of me" },
  { time: 27.5, text: "We'll make 'em turn their heads\nevery place we go" },
  { time: 34.0, text: "So won't you, please\n(be my, be my baby)" },
  { time: 37.5, text: "Be my little baby?\n(My one, and only baby)" },
  { time: 41.0, text: "Say you'll be my darlin'\n(be my, be my baby)" },
  { time: 44.5, text: "Be my baby now\n(my one, and only baby)" },
  { time: 48.0, text: "Whoa, oh, oh, oh" },
  { time: 54.5, text: "I'll make you happy, baby (ooh-ooh),\njust wait and see (ooh, ooh)" },
  { time: 61.2, text: "(Ooh) for every kiss you give me (ooh-ooh),\nI'll give you three (ooh, ooh)" },
  { time: 67.8, text: "(Ah) oh, since the day I saw you" },
  { time: 71.2, text: "(Ah) I have been waiting for you" },
  { time: 74.5, text: "(Ah) you know,\nI will adore you 'til eternity (ah)" },
  { time: 81.2, text: "So won't you, please\n(be my, be my baby)" },
  { time: 84.5, text: "Be my little baby?\n(My one, and only baby)" },
  { time: 88.0, text: "Say you'll be my darlin'\n(be my, be my baby)" },
  { time: 91.5, text: "Be my baby now\n(my one, and only baby)" },
  { time: 95.0, text: "Whoa, oh, oh, oh, oh" },
  { time: 101.5, text: "So come on and be\n(be my, be my baby)" },
  { time: 105.0, text: "Be my little baby\n(my one, and only baby)" },
  { time: 108.5, text: "Say you'll be my darlin'\n(be my, be my baby)" },
  { time: 111.8, text: "Be my baby now\n(my one, and only baby)" },
  { time: 115.5, text: "Oh, oh, oh, oh\nbe my little baby" },
  { time: 121.5, text: "(My one, and only baby)\noh, oh-oh" },
  { time: 124.5, text: "(Be my, be my baby)\noh, oh" },
  { time: 128.5, text: "(My one, and only baby)\nwhoa, oh, oh, oh, oh" },
  { time: 135.5, text: "(My one, and only baby)\noh, oh-oh" },
  { time: 138.5, text: "(Be my, be my baby)\nbe my baby now" }
]

function showLyrics() {
  let currentLyricIndex = -1

  const updateLyrics = () => {
    const currentTime = audio.currentTime
    const index = lyricsData.findLastIndex(l => currentTime >= l.time)

    if (index !== currentLyricIndex && index !== -1) {
      currentLyricIndex = index
      lyricsContainer.classList.remove("active")

      setTimeout(() => {
        lyricsContainer.innerHTML = lyricsData[index].text.split("\n").map(line => `<span>${line}</span>`).join("")
        lyricsContainer.classList.add("active")
      }, 400) // Reduced transition delay for snappier feel
    }
    requestAnimationFrame(updateLyrics)
  }
  updateLyrics()
}

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

// CLICK EVENT — UPDATED
window.addEventListener("click", e => {
  pointer.x = e.clientX / innerWidth
  pointer.y = e.clientY / innerHeight
  pointer.clicked = true

  if (!firstClick) {
    hint.style.display = "none"
    audio.play().catch(e => console.error("Audio playback failed:", e))
    showLyrics()
    firstClick = true
  }
})

// TOUCH EVENT — UPDATED
window.addEventListener("touchstart", e => {
  pointer.x = e.touches[0].clientX / innerWidth
  pointer.y = e.touches[0].clientY / innerHeight
  pointer.clicked = true

  if (!firstClick) {
    hint.style.display = "none"
    audio.play().catch(e => console.error("Audio playback failed:", e))
    showLyrics()
    firstClick = true
  }
})

cleanBtn.addEventListener("click", () => {
  pointer.vanishCanvas = true
  setTimeout(() => pointer.vanishCanvas = false, 50)
})

function createPlane() {
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_stop_time: { value: 0 },
      u_stop_randomizer: {
        value: new THREE.Vector2(Math.random(), Math.random()),
      },
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