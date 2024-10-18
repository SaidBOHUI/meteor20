import { Box, TextField, Button, Typography } from "@mui/material"
import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import Banner from "../assets/darkSpace.webp"
import lilMeteor from "../assets/meteor.png"
import randomMeteor from "../assets/meteorMoyen.webp"
import bigMeteor from "../assets/bigMeteor.webp"
import EarthGif from "../assets/spinningEarth.gif"
import ExplosionGif from "../assets/collision.gif"
import io from "socket.io-client"

const HomePage = () => {
	const canvasRef = useRef(null)
	const positionsRef = useRef([])
	const [numAsteroids, setNumAsteroids] = useState(0)
	const [responseMessage, setResponseMessage] = useState("")

	const handleGenerateAsteroids = async (e) => {
		e.preventDefault()
		try {
			const response = await fetch("http://localhost:5550/generate_asteroids", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ num_asteroids: Number(numAsteroids) }),
			})

			const data = await response.json()
			console.log("data: ", data)
			setResponseMessage(data.message)
		} catch (error) {
			console.error("Error generating asteroids:", error)
			setResponseMessage("Failed to generate asteroids")
		}
	}

	// Fonction pour ajouter une comète de test
	const handleAddTestComet = () => {
		const testComet = {
			id: "test_comet_001",
			position: { x: 100, y: 150, z: 0 },
			size: 8, // Taille ajustée pour la météorite de test
			mass: 1e12,
		}

		positionsRef.current = [...positionsRef.current, testComet]
	}

	useEffect(() => {
		const socket = io("http://localhost:5550")

		socket.on("connect", () => {
			console.log("WebSocket")
		})

		socket.on("asteroid_update", (data) => {
			console.log("Received asteroid update:", data)
			// positionsRef.current = [
			// 	...positionsRef.current.filter((m) => m.id !== data.id),
			// 	data,
			// ]
			positionsRef.current = data.asteroids;
		})

		socket.on("disconnect", () => {
			console.log("Disconnected from WebSocket")
		})

		const scene = new THREE.Scene()
		const camera = new THREE.OrthographicCamera(
			window.innerWidth / -2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			window.innerHeight / -2,
			0.1,
			1000
		)
		const renderer = new THREE.WebGLRenderer({
			canvas: canvasRef.current,
			alpha: true,
		})
		renderer.setSize(window.innerWidth, window.innerHeight)

		camera.position.z = 10

		const textureLoader = new THREE.TextureLoader()
		const cometTexture = textureLoader.load(lilMeteor)
		const randomMeteorTexture = textureLoader.load(randomMeteor)
		const bigMeteorTexture = textureLoader.load(bigMeteor)
		const explosionTexture = textureLoader.load(ExplosionGif)
		const cometsMap = new Map()

		const frustum = new THREE.Frustum()
		const cameraViewProjectionMatrix = new THREE.Matrix4()

		const isCollision = (cometX, cometY) => {
			const threshold = 50
			return Math.abs(cometX) < threshold && Math.abs(cometY) < threshold
		}

		const updateComets = () => {
			camera.updateMatrixWorld();
			cameraViewProjectionMatrix.multiplyMatrices(
				camera.projectionMatrix,
				camera.matrixWorldInverse
			);
			frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
		
			positionsRef.current.forEach(({ id, position, size }) => {
				const { x, y } = position;
				const vector = new THREE.Vector3(x, -y, 0);
		
				// Check if the comet is within the frustum (i.e., visible in the camera's view)
				if (frustum.containsPoint(vector)) {
					let texture = cometTexture;
					if (size < 5) {
						texture = randomMeteorTexture;
					} else {
						texture = bigMeteorTexture;
					}
		
					const scaledSize = size * 20;
		
					if (!cometsMap.has(id)) {
						const material = new THREE.SpriteMaterial({ map: texture });
						const sprite = new THREE.Sprite(material);
						sprite.scale.set(scaledSize, scaledSize, 1);
						sprite.position.set(x, -y, 0);
						scene.add(sprite);
						cometsMap.set(id, sprite);
					} else {
						const sprite = cometsMap.get(id);
						sprite.material.map = texture;
						sprite.scale.set(scaledSize, scaledSize, 1);
						sprite.position.set(x, -y, 0);
		
						if (isCollision(x, y)) {
							const explosionMaterial = new THREE.SpriteMaterial({
								map: explosionTexture,
							});
							sprite.material = explosionMaterial;
							sprite.scale.set(100, 100, 1);
							setTimeout(() => {
								scene.remove(sprite);
								cometsMap.delete(id);
							}, 1000);
						}
					}
				} else if (cometsMap.has(id)) {
					const sprite = cometsMap.get(id);
					scene.remove(sprite);
					cometsMap.delete(id);
				}
			});
		};
		
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

		window.addEventListener("resize", handleResize)
		return () => {
			socket.close()
			renderer.dispose()
			window.removeEventListener("resize", handleResize)
		}
	}, [])

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
				<Button
					variant="contained"
					color="secondary"
					onClick={handleAddTestComet}
					sx={{ marginTop: 2 }}
				>
					Add Test Comet
				</Button>
			</Box>
			<img
				src={EarthGif}
				alt="Terre"
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: "80px", 
					height: "80px",
					zIndex: 1,
				}}
			/>
			<canvas
				ref={canvasRef}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					zIndex: 0,
					pointerEvents: "none",
				}}
			/>
		</Box>
	)
}

export default HomePage