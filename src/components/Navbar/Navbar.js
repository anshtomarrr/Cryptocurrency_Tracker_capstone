import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="nav-logo">
                <Link to="/">Coinverse</Link>
            </div>
            <ul className="nav-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/portfolio">Portfolio</Link></li>
                <li><Link to="/news">News</Link></li>
                <li><Link to="/about">About Us</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;