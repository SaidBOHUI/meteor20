// import { Box } from '@mui/material'
// import React from 'react'
// import Banner from '../assets/darkSpace.webp'

// const HomePage = () => {
//   return (
// 		<Box
// 		variant="container"
// 		sx={{
// 			minHeight: "100vh",
// 			background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${Banner})`,
// 			backgroundRepeat: "no-repeat",
// 			backgroundPosition: "center",
// 			backgroundSize: "cover",
// 		}}
// 		>

//         </Box>
//   )
// }

// export default HomePage


import { Box } from '@mui/material'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import Banner from '../assets/darkSpace.webp'
import lilMeteor from "../assets/meteor.png"

const HomePage = () => {
  const canvasRef = useRef(null)
  const positionsRef = useRef([])

  useEffect(() => {
    // Connexion WebSocket
    const socket = new WebSocket('ws://localhost:8080')

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      positionsRef.current = data.meteors.slice(0, 3000) // Limite à 3000 météorites
    }

    // Initialisation de Three.js
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2, window.innerWidth / 2, 
      window.innerHeight / 2, window.innerHeight / -2, 
      0.1, 1000
    )
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)

    camera.position.z = 10

    // Charger l'image des comètes comme texture
    const textureLoader = new THREE.TextureLoader()
    const cometTexture = textureLoader.load(lilMeteor) // Remplace par ton image

    const comets = []

    // Créer des sprites pour chaque comète
    for (let i = 0; i < 3000; i++) {
      const material = new THREE.SpriteMaterial({ map: cometTexture })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(100, 100, 1) // Taille des comètes
      scene.add(sprite)
      comets.push(sprite)
    }

    // Fonction pour animer les comètes
    const animate = () => {
      comets.forEach((sprite, index) => {
        const { x, y } = positionsRef.current[index] || {}
        if (x !== undefined && y !== undefined) {
          sprite.position.set(x - window.innerWidth / 2, -(y - window.innerHeight / 2), 0)
        }
      })

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      socket.close()
      renderer.dispose() // Nettoie Three.js à la désactivation
    }
  }, [])

  return (
    <Box
      variant="container"
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${Banner})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </Box>
  )
}

export default HomePage