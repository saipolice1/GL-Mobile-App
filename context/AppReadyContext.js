import React, { createContext, useCallback, useContext, useState } from 'react';

const AppReadyContext = createContext({ markReady: () => {} });

export const useAppReady = () => useContext(AppReadyContext);

export const AppReadyProvider = ({ children }) => {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  return (
    <AppReadyContext.Provider value={{ ready, markReady }}>
      {children}
    </AppReadyContext.Provider>
  );
};
