import jwt from "jsonwebtoken";

const authDoctor = async (req, res, next) => {
  try {
    const dtoken = req.headers.dtoken;
    if (!dtoken) {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
    }

    const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);
    req.docId = decoded.id; 

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: "Authentication failed." });
  }
};

export default authDoctor;