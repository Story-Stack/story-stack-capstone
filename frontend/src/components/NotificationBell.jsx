import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import "./NotificationBell.css";

// Create a custom event for notification refresh
export const refreshNotificationsEvent = new Event("refreshNotifications");

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);
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
        console.log("Raw notifications data:", data);

        // Store the previous notification count before updating
        const prevCount = notifications.length;

        // Check if any notifications have isRead or isRecommendation set to undefined and fix it
        const fixedData = data.map((notification) => ({
          ...notification,
          isRead:
            notification.isRead === undefined ? false : notification.isRead,
          isRecommendation:
            notification.isRecommendation === undefined
              ? false
              : notification.isRecommendation,
        }));

        console.log("Fixed notifications data:", fixedData);

        // Count unread notifications
        const newUnreadCount = fixedData.filter((n) => !n.isRead).length;

        // Update state
        setNotifications(fixedData);
        setUnreadCount(newUnreadCount);

        // If this is not the first load and we have new notifications
        if (prevCount > 0 && data.length > prevCount) {
          console.log(
            `New notifications detected! (${data.length - prevCount} new)`
          );

          // Animate the bell
          if (bellRef.current) {
            bellRef.current.classList.add("bell-animation");
            setTimeout(() => {
              if (bellRef.current) {
                bellRef.current.classList.remove("bell-animation");
              }
            }, 2000);
          }

          // Update the last notification count
          setLastNotificationCount(data.length);
        }
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user, notifications.length]);

  // Check for new notifications
  useEffect(() => {
    // Initialize lastNotificationCount if it's 0 and we have notifications
    if (lastNotificationCount === 0 && notifications.length > 0) {
      setLastNotificationCount(notifications.length);
      return;
    }

    // Check if we have new notifications
    if (notifications.length > lastNotificationCount) {
      console.log(
        `New notifications detected! Previous: ${lastNotificationCount}, Current: ${notifications.length}`
      );

      // Animate the bell
      if (bellRef.current) {
        bellRef.current.classList.add("bell-animation");
        setTimeout(() => {
          if (bellRef.current) {
            bellRef.current.classList.remove("bell-animation");
          }
        }, 2000);
      }

      // Update the last count
      setLastNotificationCount(notifications.length);

      // Show a browser notification if supported
      if (Notification.permission === "granted") {
        const unreadNotifications = notifications.filter((n) => !n.isRead);
        if (unreadNotifications.length > 0) {
          const latestNotification = unreadNotifications[0];
          new Notification("New Book Recommendation", {
            body: latestNotification.content,
            icon: "/favicon.ico",
          });
        }
      }
    }
  }, [notifications.length, lastNotificationCount]);

  // Function to manually trigger a notification refresh
  const triggerNotificationRefresh = useCallback(() => {
    if (user) {
      console.log("Manually triggering notification refresh");
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Expose the refresh function globally
  useEffect(() => {
    if (user) {
      // Add the function to the window object so it can be called from anywhere
      window.triggerNotificationRefresh = triggerNotificationRefresh;

      fetchNotifications();

      // Set up polling to check for new notifications every 10 seconds (more frequent)
      const interval = setInterval(fetchNotifications, 10000);

      // Add event listener for manual refresh
      window.addEventListener("refreshNotifications", fetchNotifications);

      // Request notification permission
      if (
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
      ) {
        Notification.requestPermission();
      }

      return () => {
        clearInterval(interval);
        window.removeEventListener("refreshNotifications", fetchNotifications);
        delete window.triggerNotificationRefresh;
      };
    }
  }, [user, fetchNotifications, triggerNotificationRefresh]);

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

      console.log("Handling notification click:", notification);

      // If it's a comment notification (has comment_id)
      if (notification.comment_id) {
        console.log(
          `Navigating to book page with comment: /book/${notification.bookId}?comment=${notification.comment_id}`
        );
        // Navigate to the book page with the comment ID
        navigate(
          `/book/${notification.bookId}?comment=${notification.comment_id}`
        );
      } else {
        // Navigate to the discussion page for this book/channel
        console.log(
          `Navigating to discussion page: /discussion/${notification.bookId}`
        );
        navigate(`/discussion/${notification.bookId}`);
      }

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
      <div
        className="notification-bell"
        onClick={handleBellClick}
        ref={bellRef}
      >
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
                  } ${notification.isRecommendation ? "recommendation" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Check if this is a recommendation or new release notification based on content */}
                  {(notification.isRecommendation ||
                    (notification.content &&
                      (notification.content.includes("enjoy reading") ||
                        notification.content.includes("New release:")) &&
                      (notification.content.includes(
                        "based on your preferences"
                      ) ||
                        notification.content.includes(
                          "is now available"
                        )))) && (
                    <div className="recommendation-badge">
                      {notification.content &&
                      notification.content.includes("New release:")
                        ? "🆕 New Release"
                        : "📚 Recommendation"}
                    </div>
                  )}
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
