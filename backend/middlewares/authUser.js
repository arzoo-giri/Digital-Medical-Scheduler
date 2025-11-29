import jwt from "jsonwebtoken";

// user authentication middleware
const authUser = async (req, res, next) => {
  try {
    // read token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id; // store userId here for getProfile
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
  }
};

export default authUser;
