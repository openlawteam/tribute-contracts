import axios from "axios";

export const submitProposal = (addr, message, signature) => {
  const data = {
    address: addr,
    msg: JSON.stringify(message),
    sig: signature,
  };
  return axios.post(
    `${process.env.REACT_APP_SNAPSHOT_HUB_API_URL}/api/message`,
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

export const getApiStatus = () => {
  return axios.get(`${process.env.REACT_APP_SNAPSHOT_HUB_API_URL}/api`);
};
