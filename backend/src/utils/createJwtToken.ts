import jwt from "jsonwebtoken";

const createJWTToken = (id: string, role: string) => {
  const token = jwt.sign(
    { id, role },
    process.env.JWT_ACCESS_TOKEN_SECRET as string,
    { expiresIn: "24h" }
  );

  return token;
};

export default createJWTToken;
