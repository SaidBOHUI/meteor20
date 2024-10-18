import { Box, TextField, Button, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Banner from "../assets/darkSpace.webp";
import lilMeteor from "../assets/meteor.png";
import randomMeteor from "../assets/meteorMoyen.webp";
import bigMeteor from "../assets/bigMeteor.webp";
import EarthGif from "../assets/spinningEarth.gif";
import { io } from "socket.io-client";

const HomePage = () => {
  const canvasRef = useRef(null);
  const positionsRef = useRef([]);  // Store asteroid positions and velocities
  const [numAsteroids, setNumAsteroids] = useState(0);
  const [responseMessage, setResponseMessage] = useState("");

  const handleGenerateAsteroids = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5550/generate_asteroids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_asteroids: Number(numAsteroids) }),
      });

      const data = await response.json();
      setResponseMessage(data.message);
    } catch (error) {
      setResponseMessage("Failed to generate asteroids, " + error);
    }
  };

  useEffect(() => {
    const socket = io("http://localhost:5550");

    socket.on("connect", () => {
      socket.emit("start_stream");
    });

    // Handle receiving asteroid updates
    socket.on("asteroid_update", (data) => {
      console.log("Received asteroid data:", data);
      positionsRef.current = [...positionsRef.current.filter(p => p.id !== data.id), data];
      
    });

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 10;

    const textureLoader = new THREE.TextureLoader();
    const cometTexture = textureLoader.load(lilMeteor);
    const randomMeteorTexture = textureLoader.load(randomMeteor);
    const bigMeteorTexture = textureLoader.load(bigMeteor);
    const cometsMap = new Map();

    const updateComets = () => {
      positionsRef.current.forEach(({ id, position, velocity, size }) => {
        const { x, y, z } = position;
        let texture = cometTexture;

        if (size < 5) {
          texture = randomMeteorTexture;
        } else {
          texture = bigMeteorTexture;
        }

        if (!cometsMap.has(id)) {
          const material = new THREE.SpriteMaterial({ map: texture });
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(size * 20, size * 20, 1);
          sprite.position.set(x, -y, z);  // Set the initial position
          scene.add(sprite);
          cometsMap.set(id, { sprite, velocity });  // Store velocity for movement
        }
      });

      // Update asteroid positions based on their velocities
      cometsMap.forEach(({ sprite, velocity }, id) => {
        const isInBounds = (sprite.position.x > -window.innerWidth && sprite.position.x < window.innerWidth &&
          sprite.position.y > -window.innerHeight && sprite.position.y < window.innerHeight);

        if (positionsRef.current.some(p => p.id === id) && isInBounds) {
          sprite.position.x += velocity.vx * 0.05;  // Adjust scaling for smoother motion
          sprite.position.y += velocity.vy * 0.05;
          sprite.position.z += velocity.vz * 0.05;
        } else {
          scene.remove(sprite);
          cometsMap.delete(id);
        }
      });
    };

    const animate = () => {
      updateComets();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      socket.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <Box
      variant="container"
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${Banner})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
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
            InputLabelProps={{
              style: { color: 'white' },
            }}
            InputProps={{
              style: { color: 'white' },
            }}
            sx={{ marginBottom: 1, color: 'text.primary' }}
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
        alt="Earth"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100px",
          height: "100px",
          zIndex: 1,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vh",
          height: "100vw",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
};

export default HomePage;
