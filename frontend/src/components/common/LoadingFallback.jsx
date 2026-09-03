import React from "react";
import "./LoadingFallback.css";

export const LoadingFallback = () => {
  return (
    <div className="loading-fallback-container" role="status" aria-label="Loading page">
      <div className="loading-fallback-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-core"></div>
      </div>
      <p className="loading-fallback-text">Loading...</p>
    </div>
  );
};

export default LoadingFallback;
