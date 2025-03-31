import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { FaFacebookSquare } from "react-icons/fa";
import { auth, provider, signInWithPopup } from "../firebasegmail";
import "./LoginSecurity.css";

export default function LogSec() {
  const [showInput, setShowInput] = useState(false);
  const navigate = useNavigate(); 

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("User signed in:", result.user);
      alert('Welcome, ${result.user.displayName}!');

      navigate("/dashboard"); 
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <React.Fragment>
      <div>
        <div className="row pt-4">
          <span className="col-sm-auto fw-medium">Email</span>
          <li
            className="col-sm-auto btn"
            onClick={() => setShowInput(!showInput)}
          >
            {showInput ? "Cancel" : "Edit"}
          </li>
          <li
            className="col-sm-auto btn"
            onClick={() => setShowInput(!showInput)}
          >
            {showInput ? "Confirm" : ""}
          </li>
          {showInput && (
            <input
              type="text"
              className="col-sm-auto"
              placeholder="Enter text..."
            />
          )}
        </div>
        <div className="row pt-2">
          <span className="col-sm-auto fw-medium">Password</span>
          <span>Set a password to protect your account</span>
        </div>
        <h3>Social Media Login</h3>
        <ul className="row gap-2">
          <li className="w-50 btn">
            <FaFacebookSquare size="30" />
            Facebook
          </li>
          <li className="w-50 btn">Instagram</li>
          <li className="w-50 btn" onClick={handleGoogleLogin}>
            Gmail
          </li>
        </ul>
        <div className="row gap-5 mt-5">
          <li className="w-50 btn">Download Data</li>
          <li className="w-50 btn">Account Deletion</li>
        </div>
      </div>
    </React.Fragment>
  );
}