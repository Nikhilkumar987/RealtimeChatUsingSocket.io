import jwt from "jsonwebtoken";

export const generateJWTtoken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, { // name of cookie is jwt here we havew given 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // prevent XSS
    sameSite: "strict", // prevent CSRF
    secure: process.env.NODE_ENV !== "development", // secure cookies in prod
  });

  return token;
};
