import Notification from "../model/notification.model.js";

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const notifications = await Notification.find({ user_id }).sort({
      created_at: -1,
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id },
      { read: true },
      { new: true }
    );
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark as read." });
  }
};

// Delete all notifications
export const deleteNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    await Notification.deleteMany({ user_id });
    res.json({ message: "All notifications deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete notifications." });
  }
};
