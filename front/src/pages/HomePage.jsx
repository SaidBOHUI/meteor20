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
import lilMeteor from '../assets/meteor.png'
import EarthGif from '../assets/spinningEarth.gif'
import ExplosionGif from '../assets/collision.gif'

const HomePage = () => {
  const canvasRef = useRef(null)
  const positionsRef = useRef([])

  useEffect(() => {
    // Connexion WebSocket
    const socket = new WebSocket('ws://localhost:8080')

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      positionsRef.current = data.meteors // Récupère toutes les météorites
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

    // Charger les textures des comètes et de l'explosion
    const textureLoader = new THREE.TextureLoader()
    const cometTexture = textureLoader.load(lilMeteor)
    const explosionTexture = textureLoader.load(ExplosionGif)

    // Map pour stocker les sprites des comètes
    const cometsMap = new Map()

    // Fonction pour détecter les collisions (crash)
    const isCollision = (cometX, cometY) => {
      const threshold = 50 // Ajuste le seuil de distance pour la collision
      return Math.abs(cometX) < threshold && Math.abs(cometY) < threshold
    }

    // Fonction pour mettre à jour et afficher les comètes
    const updateComets = () => {
      positionsRef.current.forEach(({ id, x, y }) => {
        // Vérifie si la comète existe déjà, sinon crée un nouveau sprite
        if (!cometsMap.has(id)) {
          const material = new THREE.SpriteMaterial({ map: cometTexture })
          const sprite = new THREE.Sprite(material)
          sprite.scale.set(50, 50, 1) // Taille de la comète
          sprite.position.z = 0 // Assure que les comètes sont en arrière-plan
          scene.add(sprite)
          cometsMap.set(id, sprite)
        }

        // Met à jour la position du sprite correspondant à l'ID de la comète
        const sprite = cometsMap.get(id)

        // Vérifie la collision avec la Terre
        if (isCollision(x, y)) {
          // Affiche l'animation d'explosion à la place de la comète
          const explosionMaterial = new THREE.SpriteMaterial({ map: explosionTexture })
          sprite.material = explosionMaterial
          sprite.scale.set(100, 100, 1) // Ajuste la taille de l'explosion
          
          // Retire l'explosion après un certain temps
          setTimeout(() => {
            scene.remove(sprite)
            cometsMap.delete(id)
          }, 1000) // Durée de l'animation en millisecondes
        } else {
          // Met à jour la position de la comète si pas de collision
          sprite.position.set(x, -y, 0)
        }
      })

      // Supprime les sprites des comètes qui ne sont plus dans les positions
      cometsMap.forEach((sprite, id) => {
        if (!positionsRef.current.some(meteor => meteor.id === id)) {
          scene.remove(sprite)
          cometsMap.delete(id)
        }
      })
    }

    // Fonction pour animer les comètes
    const animate = () => {
      updateComets()
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      socket.close()
      renderer.dispose()
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
        position: 'relative',
      }}
    >
      <img
        src={EarthGif}
        alt="Terre"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100px',
          height: '100px',
          zIndex: 1,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </Box>
  )
}

export default HomePage
