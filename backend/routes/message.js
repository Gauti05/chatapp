const router = require("express").Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
  try {
    const { channelId, text } = req.body;
    if (!channelId || !text) return res.status(400).json({ message: "Missing data" });

    const message = await Message.create({
      sender: req.user.id,
      channel: channelId,
      text,
    });

    res.status(201).json(message);
  } catch (e) {
    res.status(500).json({ message: "Failed to send message" });
  }
});


router.get("/:channelId", auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({ channel: channelId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender", "name");

    res.json(messages.reverse()); 
  } catch (e) {
    res.status(500).json({ message: "Failed to load messages" });
  }
});

module.exports = router;
