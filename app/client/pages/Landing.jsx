import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import "../styles/landing.css";

export default function Landing() {
    return (
        <div className="landing-page">
            <Header />

            <main className="landing-content">
                <section className="landing-hero">
                    

                    <h2>A simple, lightweight virtual tabletop for D&D.</h2>

                    <hr/>

                    <div className="landing-actions">
                        <Link to="/login" className="landing-start">
                            Create a Game
                        </Link>

                        <Link to="/login" className="landing-start">
                            Join a Game
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
