import React, { useEffect, useState } from "react";
import BodyLayout from "../layouts/BodyLayout";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoomData } from "../../api/room";
import Loader from "../elements/Loader";

const Room = () => {
  const location = useLocation();
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const {
    data: roomData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["get-room-data"],
    queryFn: () => getRoomData(code),
    retry: false,
    enabled: !!code,
  });

  useEffect(() => {
    if (isError)
      navigate("/", {
        state: {
          message: "Room not found",
        },
      });
  }, [isError]);

  console.log(roomData);

  useEffect(() => {
    if (location.state.verification && location.state.code) {
      setCode(location.state.code);
    } else navigate("/", { replace: true });
  }, [roomData]);

  return isPending ? (
    <Loader />
  ) : (
    <BodyLayout>
      <h1>Hello {code}</h1>
    </BodyLayout>
  );
};

export default Room;
