import jwt from "jsonwebtoken";

const generateToken = (id, role, username) => {
  return jwt.sign({ id, role, username }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
};

export default generateToken;
