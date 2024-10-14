import { BrowserRouter, useLocation } from "react-router-dom";
import Header from './Components/Header';
import MainRoutes from "./routes/MainRoutes";


const App = () => {
	return (
		<BrowserRouter>
			<Header />
			<MainRoutes />
		</BrowserRouter>
	);
};

export default App;
