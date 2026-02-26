import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import MyPublish from './pages/MyPublish';
import MyClaim from './pages/MyClaim';
import AdminLayout from './pages/AdminLayout';
import AdminFoods from './pages/AdminFoods';
import AdminUsers from './pages/AdminUsers';
import MyAccount from './pages/MyAccount';
import MyMessages from './pages/MyMessages';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/my-publish" element={<MyPublish />} />
        <Route path="/my-claim" element={<MyClaim />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/my-messages" element={<MyMessages />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* 管理后台嵌套路由 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminFoods />} />          {/* /admin 默认显示食物管理 */}
          <Route path="foods" element={<AdminFoods />} />   {/* /admin/foods */}
          <Route path="users" element={<AdminUsers />} />   {/* /admin/users */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;