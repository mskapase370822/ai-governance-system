import Alert from "../models/Alert.js";

/**
 * Get all alerts (Admin/Manager) with filtering
 */
export const getAlerts = async (req, res) => {
  try {
    const { type, isRead, limit = 50 } = req.query;
    const filter = {};

    if (type && type !== "all") filter.type = type;
    if (isRead === "true") filter.isRead = true;
    if (isRead === "false") filter.isRead = false;

    const alerts = await Alert.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Alert.countDocuments({ isRead: false });

    res.json({ alerts, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark alert as read
 */
export const markAlertRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark all alerts as read
 */
export const markAllAlertsRead = async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: "All alerts marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Dismiss an alert
 */
export const dismissAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isDismissed: true, isRead: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
