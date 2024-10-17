// import { Box, Button, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
// import React, { useState } from 'react';
// import AsteroidForm from '../Components/AsteroidForm';
// import Banner from '../assets/darkSpace.webp';
 
// const HomePage = () => {
//   const [numAsteroids, setNumAsteroids] = useState('');
//   const [responseMessage, setResponseMessage] = useState('');
//   const [asteroids, setAsteroids] = useState([]); // Store fetched asteroids
//   const [showForm, setShowForm] = useState(false); // Toggle manual form visibility
 
//   // Handle input change for the number of asteroids
//   const handleInputChange = (e) => {
//     setNumAsteroids(e.target.value);
//   };
 
//   // Submit number of asteroids to generate
//   const handleGenerateAsteroids = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:5550/generate_asteroids', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ num_asteroids: Number(numAsteroids) }),
//       });
 
//       const data = await response.json();
//       setResponseMessage(data.message);
//     } catch (error) {
//       console.error('Error generating asteroids:', error);
//       setResponseMessage('Failed to generate asteroids');
//     }
//   };
 
//   // Fetch latest asteroids
//   const fetchAsteroids = async () => {
//     try {
//       const response = await fetch('http://localhost:5550/get_asteroids');
//       const data = await response.json();
//       setAsteroids(data.asteroids); // Update state with fetched asteroids
//     } catch (error) {
//       console.error('Error fetching asteroids:', error);
//     }
//   };
 
//   // Show the form for manual asteroid creation
//   const openForm = () => {
//     setShowForm(true);
//   };
 
//   // Close the manual form
//   const closeForm = () => {
//     setShowForm(false);
//   };
 
//   return (
//     <Box
//       variant="container"
//       sx={{
//         minHeight: '100vh',
//         background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${Banner})`,
//         backgroundRepeat: 'no-repeat',
//         backgroundPosition: 'center',
//         backgroundSize: 'cover',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: '20px',
//         flexDirection: 'column',
//       }}
//     >
//       {/* Form to create asteroids by specifying a number */}
//       <Box
//         component="form"
//         onSubmit={handleGenerateAsteroids}
//         sx={{
//           backgroundColor: 'rgba(255, 255, 255, 0.9)',
//           padding: '20px',
//           borderRadius: '8px',
//           maxWidth: '400px',
//           width: '100%',
//           marginBottom: '20px',
//         }}
//       >
//         <Typography variant="h4" gutterBottom textAlign="center">
//           Generate Multiple Asteroids
//         </Typography>
 
//         <TextField
//           fullWidth
//           label="Number of Asteroids"
//           variant="outlined"
//           name="num_asteroids"
//           type="number"
//           value={numAsteroids}
//           onChange={handleInputChange}
//           sx={{ marginBottom: '20px' }}
//         />
 
//         <Button
//           type="submit"
//           variant="contained"
//           fullWidth
//           sx={{ backgroundColor: '#1976d2', color: '#fff' }}
//         >
//           Generate
//         </Button>
 
//         {responseMessage && (
//           <Typography variant="body1" color="primary" textAlign="center" sx={{ marginTop: '20px' }}>
//             {responseMessage}
//           </Typography>
//         )}
//       </Box>
 
//       {/* Button to open the manual asteroid creation form */}
//       <Button
//         variant="contained"
//         onClick={openForm}
//         sx={{ backgroundColor: '#1976d2', color: '#fff', marginBottom: '20px' }}
//       >
//         Create Asteroid Manually
//       </Button>
 
//       {/* Display the manual form only when the button is clicked */}
//       {showForm && <AsteroidForm closeForm={closeForm} />}
 
//       {/* Button to fetch asteroids */}
//       <Button
//         onClick={fetchAsteroids}
//         variant="contained"
//         fullWidth
//         sx={{ backgroundColor: '#4caf50', color: '#fff', marginTop: '20px', marginBottom: '20px' }}
//       >
//         Fetch Latest Asteroids
//       </Button>
 
//       {/* Display fetched asteroids */}
//       {asteroids && asteroids.length > 0 && (
//         <List sx={{ marginTop: '20px', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '8px' }}>
//           {asteroids.map((asteroid, index) => (
//             <ListItem key={index}>
//               <ListItemText
//                 primary={`Asteroid ID: ${asteroid.id}`}
//                 secondary={`Position: (x: ${asteroid.position.x}, y: ${asteroid.position.y}, z: ${asteroid.position.z})
//                             Velocity: (vx: ${asteroid.velocity.vx}, vy: ${asteroid.velocity.vy}, vz: ${asteroid.velocity.vz})
//                             Size: ${asteroid.size} km, Mass: ${asteroid.mass} kg`}
//               />
//             </ListItem>
//           ))}
//         </List>
//       )}
//     </Box>
//   );
// };
 
// export default HomePage;


import { Box, TextField, Button, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Banner from '../assets/darkSpace.webp'
import lilMeteor from '../assets/meteor.png'
import EarthGif from '../assets/spinningEarth.gif'
import ExplosionGif from '../assets/collision.gif'

const HomePage = () => {
  const canvasRef = useRef(null)
  const positionsRef = useRef([])
  const [numAsteroids, setNumAsteroids] = useState(0)
  const [responseMessage, setResponseMessage] = useState('')

  const handleGenerateAsteroids = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:5550/generate_asteroids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ num_asteroids: Number(numAsteroids) }),
      })

      const data = await response.json()
      console.log("data: ", data);
      setResponseMessage(data.message)
    } catch (error) {
      console.error('Error generating asteroids:', error)
      setResponseMessage('Failed to generate asteroids')
    }
  }

  useEffect(() => {
    // Connexion WebSocket
    const socket = new WebSocket('ws://localhost:5550')

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

    const textureLoader = new THREE.TextureLoader()
    const cometTexture = textureLoader.load(lilMeteor)
    const explosionTexture = textureLoader.load(ExplosionGif)
    const cometsMap = new Map()

    const isCollision = (cometX, cometY) => {
      const threshold = 50
      return Math.abs(cometX) < threshold && Math.abs(cometY) < threshold
    }

    const updateComets = () => {
      positionsRef.current.forEach(({ id, x, y }) => {
        if (!cometsMap.has(id)) {
          const material = new THREE.SpriteMaterial({ map: cometTexture })
          const sprite = new THREE.Sprite(material)
          sprite.scale.set(50, 50, 1)
          sprite.position.z = 0
          scene.add(sprite)
          cometsMap.set(id, sprite)
        }

        const sprite = cometsMap.get(id)

        if (isCollision(x, y)) {
          const explosionMaterial = new THREE.SpriteMaterial({ map: explosionTexture })
          sprite.material = explosionMaterial
          sprite.scale.set(100, 100, 1)
          setTimeout(() => {
            scene.remove(sprite)
            cometsMap.delete(id)
          }, 1000)
        } else {
          sprite.position.set(x, -y, 0)
        }
      })

      cometsMap.forEach((sprite, id) => {
        if (!positionsRef.current.some(meteor => meteor.id === id)) {
          scene.remove(sprite)
          cometsMap.delete(id)
        }
      })
    }

    const animate = () => {
      updateComets()
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      camera.left = window.innerWidth / -2
      camera.right = window.innerWidth / 2
      camera.top = window.innerHeight / 2
      camera.bottom = window.innerHeight / -2
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      socket.close()
      renderer.dispose()
      window.removeEventListener('resize', handleResize)
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
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: 2,
          borderRadius: 4,
          zIndex: 10,
        }}
      >
        <form onSubmit={handleGenerateAsteroids}>
          <TextField
            label="Number of Asteroids"
            type="number"
            value={numAsteroids}
            onChange={(e) => setNumAsteroids(e.target.value)}
            sx={{ marginBottom: 1 }}
          />
          <Button type="submit" variant="contained" color="primary">
            Generate
          </Button>
          {responseMessage && (
            <Typography variant="body2" color="white" sx={{ marginTop: 1 }}>
              {responseMessage}
            </Typography>
          )}
        </form>
      </Box>
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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
    </Box>
  )
}

export default HomePage