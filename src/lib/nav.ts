import { useNavigate } from "react-router-dom";

// go("protocol/aave") style nav helper on top of react-router
export function useGo() {
  const navigate = useNavigate();
  return (route: string) => {
    navigate("/" + route.replace(/^\/+/, ""));
    window.scrollTo({ top: 0 });
  };
}

export type Go = (route: string) => void;
