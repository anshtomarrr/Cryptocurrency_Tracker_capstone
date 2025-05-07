import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import CoinDetail from "./components/CoinDetail/CoinDetail";
import Navbar from "./components/Navbar/Navbar";
import { CoinProvider } from "./context/CoinContext";

function App() {
  return (
    <Router>
      <CoinProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/coin/:id" element={<CoinDetail />} />
          </Routes>
        </div>
      </CoinProvider>
    </Router>
  );
}

export default App;
