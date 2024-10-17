//Routeur
import * as React from "react";
import { Navigate, Route, Routes } from "react-router";
// import AsteroidCreationAndFetch from "../pages/AsteroidCreationAndFetch";
import HomePage from "../pages/HomePage";


const MainRoutes = () => {

	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			{/* <Route path="/" element={<AsteroidCreationAndFetch />} /> */}
		</Routes>
	);
};

export default MainRoutes;
