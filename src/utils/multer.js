const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('./config');


const s3Client = new S3Client({
  region: config.AWS_REGION, 
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey:config.AWS_SECRET_ACCESS_KEY,
  },
});


const profileUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.S3_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, `StaffProfilePhoto/${Date.now()}_${file.originalname}`);
    },
  }),
});

const userProfileUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.S3_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, `UserProfilePhoto/${Date.now()}_${file.originalname}`);
    },
  }),
});

const serviceImgUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.S3_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, `ServiceCardPhoto/${Date.now()}_${file.originalname}`);
    },
  }),
});

const applicationImgUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.S3_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, `ServiceApplicationFile/${Date.now()}_${file.originalname}`);
    },
  }),
});



const blogImgUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.S3_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, `BlogImgFile/${Date.now()}_${file.originalname}`);
    },
  }),
});



const myDocuments = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.S3_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, `myDocuments/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Configure multer to upload files to S3
// const upload = multer({
//   storage: multerS3({
//     s3: s3Client,
//     bucket:config.S3_BUCKET_NAME, // Ensure your bucket name is correct
//     acl: 'public-read',
//     key: (req, file, cb) => {
//       // Generate a unique filename for the uploaded file
//       cb(null, `Dashboard/${Date.now()}_${file.originalname}`);
//     },
//   }),
// });



module.exports = {profileUpload ,serviceImgUpload ,applicationImgUpload,blogImgUpload, myDocuments ,userProfileUpload};


