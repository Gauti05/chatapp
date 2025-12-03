const router = require("express").Router();
const Channel = require("../models/Channel");
const auth = require("../middleware/auth");


router.get("/", auth, async (req, res) => {
  try {
    const channels = await Channel.find().populate("members", "name");
    res.json(channels);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch channels" });
  }
});


router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Channel name too short" });
    }
    
    const exists = await Channel.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ message: "Channel name exists" });
    
    const channel = await Channel.create({ 
      name: name.trim(), 
      members: [req.user.id] 
    });
    
    res.status(201).json(channel);
  } catch (e) {
    res.status(500).json({ message: "Failed to create channel" });
  }
});


router.post("/:id/join", auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    
    if (!channel.members.includes(req.user.id)) {
      channel.members.push(req.user.id);
      await channel.save();
    }
    
    res.json(channel);
  } catch (e) {
    res.status(500).json({ message: "Failed to join channel" });
  }
});

module.exports = router;
