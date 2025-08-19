import HeaderBar from './HeaderBar.js';
import { Layout } from '@douyinfe/semi-ui';
import SiderBar from './SiderBar.js';
import App from '../../App.js';
import FooterBar from './Footer.js';
import { ToastContainer } from 'react-toastify';
import React, { useContext, useEffect, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { useSidebarCollapsed } from '../../hooks/useSidebarCollapsed.js';
import { useTranslation } from 'react-i18next';
import { API, getLogo, getSystemName, showError, setStatusData } from '../../helpers/index.js';
import { UserContext } from '../../context/User/index.js';
import { StatusContext } from '../../context/Status/index.js';
import { useLocation } from 'react-router-dom';
const { Sider, Content, Header } = Layout;

const PageLayout = () => {
  const [, userDispatch] = useContext(UserContext);
  const [, statusDispatch] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const [collapsed, , setCollapsed] = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { i18n } = useTranslation();
  const location = useLocation();

  // 必须要隐藏 footer 路由
  const shouldHideFooter = location.pathname === '/console/playground' || location.pathname.startsWith('/console/chat');

  // 是否要填充 padding 属性
  const shouldInnerPadding = location.pathname.includes('/console') &&
    !location.pathname.startsWith('/console/chat') &&
    location.pathname !== '/console/playground';

  // 是否为 console（控制台页面） 路由
  const isConsoleRoute = location.pathname.startsWith('/console');
  // 是否应该展示侧边栏
  const showSider = isConsoleRoute && (!isMobile || drawerOpen);

  // 当 isMobile、drawerOpen、collapsed、setCollapsed 变化时，重新计算是否应该显示 侧边栏
  useEffect(() => {
    if (isMobile && drawerOpen && collapsed) {
      setCollapsed(false);
    }
  }, [isMobile, drawerOpen, collapsed, setCollapsed]);

  // 尝试从 localStorage 加载用户
  const loadUser = () => {
    let user = localStorage.getItem('user');
    if (user) {
      let data = JSON.parse(user);
      userDispatch({ type: 'login', payload: data });
    }
  };

  // 请求 /api/status 接口
  const loadStatus = async () => {
    try {
      const res = await API.get('/api/status');
      const { success, data } = res.data;
      if (success) { // 成功
        statusDispatch({ type: 'set', payload: data }); // set status
        // 将 /api/status 的响应结果写入 localStorage
        setStatusData(data);
      } else {
        showError('Unable to connect to server');
      }
    } catch (error) {
      showError('Failed to load status');
    }
  };

  useEffect(() => {
    loadUser();
    loadStatus().catch(console.error);
    let systemName = getSystemName(); // 获取系统名称，已经通过 loadStatus() 方法加载到  localStorage
    if (systemName) {
      document.title = systemName;
    }
    let logo = getLogo(); // logo 的路径
    if (logo) {
      /*
       *  link[rel~='icon'] 属性选择器，选择 link 标签，具有 ref 属性，属性值包含独立单吃 icon 的元素
       *  ~= 是 "包含单词" 匹配符（Word Match）
       */
      let linkElement = document.querySelector("link[rel~='icon']");
      if (linkElement) {
        linkElement.href = logo;
      }
    }
    const savedLang = localStorage.getItem('i18nextLng'); // i18n 的配置
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    /*
      semi-ui 的组件库：https://semi.design/zh-CN/basic/layout
    */
    <Layout
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: isMobile ? 'visible' : 'hidden',
      }}
    >
      <Header
        style={{
          padding: 0,
          height: 'auto',
          lineHeight: 'normal',
          position: 'fixed',
          width: '100%',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* 系统的 header */}
        <HeaderBar onMobileMenuToggle={() => setDrawerOpen(prev => !prev)} drawerOpen={drawerOpen} />
      </Header>
      <Layout
        style={{
          overflow: isMobile ? 'visible' : 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {showSider && (
          <Sider
            style={{
              position: 'fixed',
              left: 0,
              top: '64px',
              zIndex: 99,
              border: 'none',
              paddingRight: '0',
              height: 'calc(100vh - 64px)',
              width: 'var(--sidebar-current-width)',
            }}
          >
            {/* 侧边栏 */}
            <SiderBar onNavigate={() => { if (isMobile) setDrawerOpen(false); }} />
          </Sider>
        )}
        <Layout
          style={{
            marginLeft: isMobile ? '0' : showSider ? 'var(--sidebar-current-width)' : '0',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Content
            style={{
              flex: '1 0 auto',
              overflowY: isMobile ? 'visible' : 'hidden',
              WebkitOverflowScrolling: 'touch',
              padding: shouldInnerPadding ? (isMobile ? '5px' : '24px') : '0',
              position: 'relative',
            }}
          >
            <App />
          </Content>
          {!shouldHideFooter && (
            <Layout.Footer
              style={{
                flex: '0 0 auto',
                width: '100%',
              }}
            >
              <FooterBar />
            </Layout.Footer>
          )}
        </Layout>
      </Layout>
      <ToastContainer />
    </Layout>
  );
};

export default PageLayout;
