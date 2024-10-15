import { Box, TextField, Button, Typography, List, ListItem, ListItemText } from '@mui/material';
import React, { useState } from 'react';
import Banner from '../assets/darkSpace.webp';

const AsteroidCreationAndFetch = () => {
  const [asteroidData, setAsteroidData] = useState({ num_asteroids: '' });
  const [responseMessage, setResponseMessage] = useState('');
  const [asteroids, setAsteroids] = useState([]); // Store retrieved asteroids

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAsteroidData({
      ...asteroidData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5550/generate_asteroids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asteroidData),
      });

      const data = await response.json();
      setResponseMessage(data.message);
    } catch (error) {
      console.error('Error submitting asteroid data:', error);
      setResponseMessage('Failed to submit asteroid data');
    }
  };

  const fetchAsteroids = async () => {
    try {
      const response = await fetch('http://localhost:5550/get_asteroids');
      const data = await response.json();
      console.log(data)
      setAsteroids(data.asteroids);
    } catch (error) {
      console.error('Error fetching asteroid data:', error);
    }
  };

  return (
    <Box
      variant="container"
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${Banner})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <Typography variant="h4" gutterBottom textAlign="center">
          Generate Asteroids
        </Typography>
        
        <TextField
          fullWidth
          label="Number of Asteroids"
          variant="outlined"
          name="num_asteroids"
          type="number"
          value={asteroidData.num_asteroids}
          onChange={handleInputChange}
          sx={{ marginBottom: '20px' }}
        />

        <Button type="submit" variant="contained" fullWidth sx={{ backgroundColor: '#1976d2', color: '#fff' }}>
          Créé
        </Button>

        {responseMessage && (
          <Typography variant="body1" color="primary" textAlign="center" sx={{ marginTop: '20px' }}>
            {responseMessage}
          </Typography>
        )}

        {/* Fetch Latest Asteroids */}
        <Button
          onClick={fetchAsteroids}
          variant="contained"
          fullWidth
          sx={{ backgroundColor: '#4caf50', color: '#fff', marginTop: '20px' }}
        >
          Fetch Latest Asteroids
        </Button>

        {/* Display the List of Asteroids */}
        {asteroids && asteroids.length > 0 && (
          <List sx={{ marginTop: '20px' }}>
            {asteroids.map((asteroid, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`Asteroid ID: ${asteroid.id}`}
                  secondary={`Position: (x: ${asteroid.position.x}, y: ${asteroid.position.y}, z: ${asteroid.position.z})
                              Velocity: (vx: ${asteroid.velocity.vx}, vy: ${asteroid.velocity.vy}, vz: ${asteroid.velocity.vz})
                              Size: ${asteroid.size} km, Mass: ${asteroid.mass} kg`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default AsteroidCreationAndFetch;
