import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = () => {
  const { CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY } = process.env;

  if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_SECRET_KEY) {
    console.error("Cloudinary env vars missing! Check .env file");
    throw new Error("Cloudinary configuration failed");
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_SECRET_KEY,
  });

  console.log("Cloudinary connected successfully!");
};

export default connectCloudinary;
export { cloudinary };
