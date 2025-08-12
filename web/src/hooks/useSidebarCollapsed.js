import {useCallback, useState} from 'react';

const KEY = 'default_collapse_sidebar';

export const useSidebarCollapsed = () => {
  // 侧栏是否折叠，（ 从 localStorage 读取 ，默认是 false）
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(KEY) === 'true');

  // 切换折叠状态
  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(KEY, next.toString());
      return next;
    });
  }, []);

  // 设置折叠状态
  const set = useCallback((value) => {
    setCollapsed(value);
    localStorage.setItem(KEY, value.toString());
  }, []);

  return [collapsed, toggle, set];
}; 