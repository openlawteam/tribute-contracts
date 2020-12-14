import React, { useState } from "react";
import "./App.css";

const App = () => {
  const ethereum = window.ethereum;
  const [addr, setAddr] = useState(null);
  if (ethereum) {
    ethereum.on("accountsChanged", (accounts) => setAddr(accounts[0]));
  }

  return (
    <div className="App">
      {addr && <p>Connected Account: {addr} </p>}
      {!addr && <p>Please connect to your MetaMask account</p>}
    </div>
  );
};

export default App;
