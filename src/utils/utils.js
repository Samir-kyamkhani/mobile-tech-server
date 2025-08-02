import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const hashPassword = async (password) => {
  if (!password) {
    throw new Error("Password is required for hashing.");
  }
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (id, email, role) => {
  return jwt.sign(
    {
      id,
      email,
      role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

export const sendEmail = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or use SMTP config
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

export function formattedJoinDate(joinDate) {
  return new Date(joinDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function deleteOldImage(oldImagePath) {
  if (fs.existsSync(oldImagePath)) {
    try {
      fs.unlinkSync(oldImagePath);
      console.log("Old image deleted successfully:", oldImagePath);
    } catch (err) {
      console.error("Error deleting old image:", err.message);
    }
  } else {
    console.log("No old image to delete at:", oldImagePath);
  }
}
