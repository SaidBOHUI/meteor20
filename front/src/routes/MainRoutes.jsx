//Routeur
import * as React from "react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "../pages/HomePage";

const MainRoutes = () => {

	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
		</Routes>
	);
};

export default MainRoutes;
