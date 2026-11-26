import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import auth, { sessionReceived, sessionCleared } from './slices/authSlice';
import modal, { setPending } from './slices/modalSlice';
import { notificationApi } from '../services/api/notificationApi';
import { configureSession } from '../services/api/axiosInstance';
import { savePending } from '../services/helper/pending';
const listener = createListenerMiddleware();
export const store = configureStore({ reducer: { auth, modal, [notificationApi.reducerPath]: notificationApi.reducer }, middleware: g => g().prepend(listener.middleware).concat(notificationApi.middleware) });
listener.startListening({ actionCreator: setPending, effect: a => savePending(a.payload) });
listener.startListening({ matcher: isAnyOf(sessionReceived, sessionCleared), effect: (a, api) => { const before = api.getOriginalState() as ReturnType<typeof store.getState>; const after = api.getState() as ReturnType<typeof store.getState>; if (before.auth.user?.id !== after.auth.user?.id) {
        api.dispatch(notificationApi.util.resetApiState());
    } } });
configureSession(() => store.getState().auth.accessToken, s => store.dispatch(sessionReceived(s)), () => store.dispatch(sessionCleared()));
setupListeners(store.dispatch);
