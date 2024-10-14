import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Header from './Components/Header'
import MainRoutes from './routes/MainRoutes'


const theme = createTheme({
  palette: {
    primary: {
      main: "#660C0B",
    },
    secondary: {
      main: "#DF921A",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});


const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Header />
        <MainRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
