import multer from 'multer';
import path from 'path';
import {Request} from 'express'

// Multer storage configuration (optional, if you want to validate file types or customize filenames)
const storage = multer.memoryStorage();

// const fileFilter = (req:Request, file:any, cb:any) => {
//   const fileTypes = /jpeg|jpg|png|gif/;
//   const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimeType = fileTypes.test(file.mimetype);

//   if (extname && mimeType) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only images are allowed'));
//   }
// };

// Multer middleware
const upload = multer({
  storage,
//   fileFilter,
  // limits: { fileSize: 5 * 1024 * 1024 }, // Limit size to 5MB
});

export default upload;
