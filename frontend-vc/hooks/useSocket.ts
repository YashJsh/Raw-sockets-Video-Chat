import { socketContext } from "@/context/CallContext";
import { useContext } from "react";

export const useSocket = () => {
  const context = useContext(socketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context.socket;
};