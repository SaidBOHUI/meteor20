import { Box, Button, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import AsteroidForm from '../Components/AsteroidForm';
import Banner from '../assets/darkSpace.webp';

const HomePage = () => {
  const [numAsteroids, setNumAsteroids] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [asteroids, setAsteroids] = useState([]); // Store fetched asteroids
  const [showForm, setShowForm] = useState(false); // Toggle manual form visibility

  // Handle input change for the number of asteroids
  const handleInputChange = (e) => {
    setNumAsteroids(e.target.value);
  };

  // Submit number of asteroids to generate
  const handleGenerateAsteroids = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5550/generate_asteroids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ num_asteroids: Number(numAsteroids) }),
      });

      const data = await response.json();
      setResponseMessage(data.message);
    } catch (error) {
      console.error('Error generating asteroids:', error);
      setResponseMessage('Failed to generate asteroids');
    }
  };

  // Fetch latest asteroids
  const fetchAsteroids = async () => {
    try {
      const response = await fetch('http://localhost:5550/get_asteroids');
      const data = await response.json();
      setAsteroids(data.asteroids); // Update state with fetched asteroids
    } catch (error) {
      console.error('Error fetching asteroids:', error);
    }
  };

  // Show the form for manual asteroid creation
  const openForm = () => {
    setShowForm(true);
  };

  // Close the manual form
  const closeForm = () => {
    setShowForm(false);
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
        flexDirection: 'column',
      }}
    >
      {/* Form to create asteroids by specifying a number */}
      <Box
        component="form"
        onSubmit={handleGenerateAsteroids}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '100%',
          marginBottom: '20px',
        }}
      >
        <Typography variant="h4" gutterBottom textAlign="center">
          Generate Multiple Asteroids
        </Typography>

        <TextField
          fullWidth
          label="Number of Asteroids"
          variant="outlined"
          name="num_asteroids"
          type="number"
          value={numAsteroids}
          onChange={handleInputChange}
          sx={{ marginBottom: '20px' }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ backgroundColor: '#1976d2', color: '#fff' }}
        >
          Generate
        </Button>

        {responseMessage && (
          <Typography variant="body1" color="primary" textAlign="center" sx={{ marginTop: '20px' }}>
            {responseMessage}
          </Typography>
        )}
      </Box>

      {/* Button to open the manual asteroid creation form */}
      <Button
        variant="contained"
        onClick={openForm}
        sx={{ backgroundColor: '#1976d2', color: '#fff', marginBottom: '20px' }}
      >
        Create Asteroid Manually
      </Button>

      {/* Display the manual form only when the button is clicked */}
      {showForm && <AsteroidForm closeForm={closeForm} />}

      {/* Button to fetch asteroids */}
      <Button
        onClick={fetchAsteroids}
        variant="contained"
        fullWidth
        sx={{ backgroundColor: '#4caf50', color: '#fff', marginTop: '20px', marginBottom: '20px' }}
      >
        Fetch Latest Asteroids
      </Button>

      {/* Display fetched asteroids */}
      {asteroids && asteroids.length > 0 && (
        <List sx={{ marginTop: '20px', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '8px' }}>
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
  );
};

export default HomePage;