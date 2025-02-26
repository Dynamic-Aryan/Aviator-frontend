import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000"; // Update this if needed

const socket = io(BACKEND_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
});

const App = () => {
    const [balance, setBalance] = useState(1000);
    const [betAmount, setBetAmount] = useState(100);
    const [multiplier, setMultiplier] = useState(1.0);
    const [crashPoint, setCrashPoint] = useState(null);
    const [betPlaced, setBetPlaced] = useState(false);
    const [cashedOut, setCashedOut] = useState(false);
    const [winnings, setWinnings] = useState(0);
    const [countdown, setCountdown] = useState(null);
    const [bettingOpen, setBettingOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        socket.on("bettingStart", (data) => {
            setCountdown(data.countdown);
            setBettingOpen(true);
            setBetPlaced(false);
            setCashedOut(false);
            setWinnings(0);
            setCrashPoint(null);
        });

        socket.on("bettingCountdown", (data) => {
            setCountdown(data.countdown);
            if (data.countdown === 0) {
                setBettingOpen(false);
            }
        });

        socket.on("multiplierUpdate", (data) => {
            setMultiplier(data.multiplier);
        });

        socket.on("gameCrash", (data) => {
            setCrashPoint(data.crashPoint);
            setBetPlaced(false);
            setCashedOut(false);
        });

        socket.on("playerCashout", (data) => {
            if (data.playerId === "User1") {
                setWinnings(data.winnings);
                setBalance(data.newBalance);
                setCashedOut(true);
            }
        });

        return () => {
            socket.off("bettingStart");
            socket.off("bettingCountdown");
            socket.off("multiplierUpdate");
            socket.off("gameCrash");
            socket.off("playerCashout");
        };
    }, []);

    const placeBet = async () => {
        if (!bettingOpen) {
            setErrorMessage("Betting is closed!");
            return;
        }
        try {
            const response = await axios.post(`${BACKEND_URL}/bet`, { playerId: "User1", amount: betAmount });
            setBalance(response.data.newBalance);
            setBetPlaced(true);
            setErrorMessage("");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Bet failed!");
        }
    };

    const cashOut = async () => {
        try {
            const response = await axios.post(`${BACKEND_URL}/cashout`, { playerId: "User1" });
            setWinnings(response.data.winnings);
            setBalance(response.data.newBalance);
            setCashedOut(true);
            setErrorMessage("");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Cashout failed!");
        }
    };

    return (
        <div style={{ textAlign: "center", padding: "50px", backgroundColor: "#121212", color: "white", minHeight: "100vh" }}>
            <h1>🚀 Aviator Game</h1>
            <h2>💰 Your Balance: ₹{balance}</h2>
            
            {bettingOpen && <h3 style={{ color: "gold" }}>⏳ Place your bets! {countdown}s remaining</h3>}
            <h3>Multiplier: <span style={{ fontSize: "30px", color: "green" }}>x{multiplier}</span></h3>
            {crashPoint && <h3 style={{ color: "red" }}>🔥 Crashed at: x{crashPoint}</h3>}

            {!betPlaced && bettingOpen && (
                <>
                    <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        style={{ padding: "5px", fontSize: "16px", width: "100px", marginRight: "10px" }}
                    />
                    <button onClick={placeBet} disabled={!bettingOpen} style={styles.button}>Place Bet</button>
                </>
            )}

            {betPlaced && !cashedOut && (
                <button onClick={cashOut} style={{ ...styles.button, backgroundColor: "gold" }}>💰 Cash Out</button>
            )}

            {cashedOut && <h3 style={{ color: "green" }}>🎉 You won ₹{winnings}!</h3>}

            {errorMessage && <h4 style={{ color: "red", marginTop: "20px" }}>⚠️ {errorMessage}</h4>}
        </div>
    );
};

const styles = {
    button: {
        padding: "10px 20px",
        fontSize: "18px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        marginTop: "10px"
    }
};

export default App;
