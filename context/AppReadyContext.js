import React, { createContext, useCallback, useContext, useState } from 'react';

const AppReadyContext = createContext({ introComplete: false, markIntroComplete: () => {} });

export const useAppReady = () => useContext(AppReadyContext);

export const AppReadyProvider = ({ children }) => {
  const [introComplete, setIntroComplete] = useState(false);
  const markIntroComplete = useCallback(() => setIntroComplete(true), []);
  return (
    <AppReadyContext.Provider value={{ introComplete, markIntroComplete }}>
      {children}
    </AppReadyContext.Provider>
  );
};
