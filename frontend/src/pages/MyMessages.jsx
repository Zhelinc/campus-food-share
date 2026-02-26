import { useState, useEffect } from 'react';
import api from '../utils/axios';

const MyMessages = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/notifications?page=${pageNum}&limit=20`);
      setNotifications(res.notifications);
      setTotalPages(res.pagination.pages);
      setPage(res.pagination.page);
    } catch (err) {
      alert('获取消息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (notificationId) => {
    try {
      await api.post('/api/notifications/mark-read', { notificationId });
      fetchNotifications(page);
    } catch (err) {
      alert('操作失败');
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-read', { all: true });
      fetchNotifications(page);
    } catch (err) {
      alert('操作失败');
    }
  };

  return (
    <div style={{ width: '800px', margin: '20px auto' }}>
      <h2>我的消息</h2>
      <button onClick={markAllRead} style={{ marginBottom: '15px', padding: '5px 10px' }}>全部标为已读</button>
      {loading && <p>加载中...</p>}
      {!loading && notifications.length === 0 && <p>暂无消息</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notifications.map(n => (
          <li key={n.id} style={{
            padding: '15px', marginBottom: '10px',
            backgroundColor: n.isRead ? '#f9f9f9' : '#fff3e0',
            border: '1px solid #ddd', borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p>{n.content}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>
              {!n.isRead && (
                <button onClick={() => markAsRead(n.id)} style={{ fontSize: '12px' }}>标为已读</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <button disabled={page === 1} onClick={() => fetchNotifications(page - 1)}>上一页</button>
          <span>第 {page} / {totalPages} 页</span>
          <button disabled={page === totalPages} onClick={() => fetchNotifications(page + 1)}>下一页</button>
        </div>
      )}
    </div>
  );
};

export default MyMessages;