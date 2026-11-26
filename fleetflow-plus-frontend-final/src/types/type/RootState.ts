export type RootState = ReturnType<
  typeof import("../../redux/store").store.getState
>;
