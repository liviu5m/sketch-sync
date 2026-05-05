import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL;

export async function createRoomFunc() {
  const response = await axios.post(
    `${baseUrl}/api/room`,
    {},
    {
      withCredentials: true,
    },
  );
  return response.data;
}

export async function getRoomData(code: string) {
  const response = await axios.get(`${baseUrl}/api/room/${code}`, {
    withCredentials: true,
  });
  return response.data;
}
