import { useDispatch } from "react-redux";
import type { AppDispatch } from "../types/type/AppDispatch";
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
