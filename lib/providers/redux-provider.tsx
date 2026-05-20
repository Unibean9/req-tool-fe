"use client";

import { type ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { useAuthSessionBootstrap } from "@/hooks/useAuthSessionBootstrap";
import apiService from "@/lib/api/core";
import { persistor, store } from "@/lib/redux/store";

function syncApiAuthFromStore() {
  apiService.setAuthToken(store.getState().auth.token);
}

function AuthSessionBootstrap() {
  useAuthSessionBootstrap();
  return null;
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
        onBeforeLift={syncApiAuthFromStore}
      >
        <AuthSessionBootstrap />
        {children}
      </PersistGate>
    </Provider>
  );
}
