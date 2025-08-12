// contexts/User/index.jsx

import React from 'react';
import {initialState, reducer} from './reducer';

// 创建一个 context （里面存储一个 json 对象，有 state、dispatch 字段）
// 使用 createContext 创建组件能够读写的上下文。
// const Ctx = createContext(defaultValue)
//   defaultValue: 当读取上下文的组件上方的树中没有匹配的上下文时，希望该上下文具有的默认值。
//   返回值： createContext 返回一个上下文对象。该上下文对象并不包含任何信息。它只表示其他组件读取或提供的那个上下文。
//      <Ctx value={value}>
//          <Xxxx></Xxxx>
//      </Ctx>
// 子组件通过 useContext 来读取上下文
//   const [userState, userDispatch] = useContext(UserContext);
export const UserContext = React.createContext({
  state: initialState,
  dispatch: () => null,
});

export const UserProvider = ({children}) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  return (
    <UserContext.Provider value={[state, dispatch]}>
      {children}
    </UserContext.Provider>
  );
};
