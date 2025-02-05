import React from "react";

const Spinner = () => {
  return (
    <div
      className="pulse"
      style={{
        width: "50px",
        height: "50px",
        backgroundColor: "white",
        borderRadius: "50%",
        animation: "pulse 1.5s infinite",
        margin: " auto",
      }}
    />
  );
};

export default Spinner;
