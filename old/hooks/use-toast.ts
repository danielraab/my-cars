import { useContext } from "react";
import ToastContext from "../context/toast-context";

const useToast = () => {
  const { addToast } = useContext(ToastContext);

  return addToast;
};
export default useToast;
