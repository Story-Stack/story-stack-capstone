import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import "./NotificationBell.css";

// Create a custom event for notification refresh
export const refreshNotificationsEvent = new Event("refreshNotifications");

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Make fetchNotifications a useCallback so it can be used in the event listener
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log("Fetching notifications for user:", user.id);
      const response = await fetch(
        `http://localhost:3000/api/notifications/user/${user.id}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Notifications received:", data.length);
        console.log("Notification data:", data);

        // Check if any notifications have isRead set to undefined and fix it
        const fixedData = data.map((notification) => ({
          ...notification,
          isRead:
            notification.isRead === undefined ? false : notification.isRead,
        }));

        setNotifications(fixedData);
        setUnreadCount(fixedData.filter((n) => !n.isRead).length);
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up polling to check for new notifications every 10 seconds (more frequent)
      const interval = setInterval(fetchNotifications, 10000);

      // Add event listener for manual refresh
      window.addEventListener("refreshNotifications", fetchNotifications);

      return () => {
        clearInterval(interval);
        window.removeEventListener("refreshNotifications", fetchNotifications);
      };
    }
  }, [user, fetchNotifications]);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification) => {
    // Mark notification as read
    try {
      await fetch(
        `http://localhost:3000/api/notifications/${notification.id}/read`,
        {
          method: "PUT",
        }
      );

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Navigate to the discussion page for this book/channel
      navigate(`/discussion/${notification.bookId}`);
      setShowDropdown(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      await fetch(
        `http://localhost:3000/api/notifications/user/${user.id}/read-all`,
        {
          method: "PUT",
        }
      );

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleViewAllClick = () => {
    navigate("/notifications");
    setShowDropdown(false);
  };

  return (
    <div className="notification-bell-container">
      <div className="notification-bell" onClick={handleBellClick}>
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.isRead ? "read" : "unread"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p>{notification.content}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-notifications">No new notifications</p>
            )}
          </div>

          <div className="notification-footer">
            <button onClick={handleViewAllClick}>View all</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
