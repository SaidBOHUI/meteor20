import { Box, TextField, Button, Typography } from '@mui/material';
import React, { useState } from 'react';

const AsteroidForm = ({ closeForm }) => {
  const [asteroidData, setAsteroidData] = useState({
    x: '',
    y: '',
    z: '',
    vx: '',
    vy: '',
    vz: '',
    size: '',
    mass: ''
  });

  const [responseMessage, setResponseMessage] = useState('');

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAsteroidData({
      ...asteroidData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5550/generate_asteroid', {
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

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '100%',
        marginTop: '20px',
      }}
    >
      <Typography variant="h4" gutterBottom textAlign="center">
        Create Asteroid
      </Typography>

      {/* Position Fields */}
      <TextField
        fullWidth
        label="Position X"
        variant="outlined"
        name="x"
        type="number"
        value={asteroidData.x}
        onChange={handleInputChange}
        sx={{ marginBottom: '20px' }}
      />
      <TextField
        fullWidth
        label="Position Y"
        variant="outlined"
        name="y"
        type="number"
        value={asteroidData.y}
        onChange={handleInputChange}
        sx={{ marginBottom: '20px' }}
      />
      <TextField
        fullWidth
        label="Position Z"
        variant="outlined"
        name="z"
        type="number"
        value={asteroidData.z}
        onChange={handleInputChange}
        sx={{ marginBottom: '20px' }}
      />

      {/* Velocity Fields */}
      <TextField
        fullWidth
        label="Velocity X"
        variant="outlined"
        name="vx"
        type="number"
        value={asteroidData.vx}
        onChange={handleInputChange}
        sx={{ marginBottom: '20px' }}
      />
      <TextField
        fullWidth
        label="Velocity Y"
        variant="outlined"
        name="vy"
        type="number"
        value={asteroidData.vy}
        onChange={handleInputChange}
        sx={{ marginBottom: '20px' }}
      />
      <TextField
        fullWidth
        label="Velocity Z"
        variant="outlined"
        name="vz"
        type="number"
        value={asteroidData.vz}
        onChange={handleInputChange}
        sx={{ marginBottom: '20px' }}
      />

      {/* Size and Mass */}
      <TextField
        fullWidth
        label="Size (km)"
        variant="outlined"
        name="size"
        type="number"
        value={asteroidData.size}
        onChange={handleInputChange}
        sx={{ marginBottom: '20px' }}
      />
      <TextField
        fullWidth
        label="Mass (kg)"
        variant="outlined"
        name="mass"
        type="number"
        value={asteroidData.mass}
        onChange={handleInputChange}
        sx={{ marginBottom: '20px' }}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ backgroundColor: '#1976d2', color: '#fff' }}
      >
        Submit
      </Button>

      {/* Response Message */}
      {responseMessage && (
        <Typography variant="body1" color="primary" textAlign="center" sx={{ marginTop: '20px' }}>
          {responseMessage}
        </Typography>
      )}

      {/* Close Form Button */}
      <Button
        onClick={closeForm}
        variant="contained"
        fullWidth
        sx={{ marginTop: '10px', backgroundColor: '#f44336', color: '#fff' }}
      >
        Close
      </Button>
    </Box>
  );
};

export default AsteroidForm;
