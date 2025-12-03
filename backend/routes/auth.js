const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (user) =>
  jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already used" });
    
    const user = await User.create({ name, email, password });
    const token = createToken(user);
    
    
    res
      .cookie("token", token, { 
        httpOnly: true, 
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000 
      })
      .json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
 
    res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const token = createToken(user);
   
    res
      .cookie("token", token, { 
        httpOnly: true, 
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000 
      })
      .json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
  
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", require("../middleware/auth"), (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token").json({ message: "Logged out" });
});

module.exports = router;
