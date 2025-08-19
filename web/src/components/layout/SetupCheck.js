import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { StatusContext } from '../../context/Status';

// 初始化检测
const SetupCheck = ({ children }) => {
  const [statusState] = useContext(StatusContext);
  const location = useLocation();

  useEffect(() => {
    if (statusState?.status?.setup === false && location.pathname !== '/setup') {
      window.location.href = '/setup';
    }
  }, [statusState?.status?.setup, location.pathname]);

  return children;
};

export default SetupCheck; 