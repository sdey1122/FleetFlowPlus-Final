import { useSelector } from "react-redux";
import type { RootState } from "../types/type/RootState";
export const useAppSelector = useSelector.withTypes<RootState>();
