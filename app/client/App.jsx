import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx"
import Game from "./pages/Game.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateGame from "./pages/CreateGame.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ManageTokens from "./pages/ManageToken.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />}/>
                <Route path="/register" element={<Register />}/>

                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tokens" element={<ManageTokens />} />
                    <Route path="/games/create" element={<CreateGame />} />
                    <Route path="/games/:gameId" element={<Game />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
