import 'dotenv/config';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import moment from 'moment-timezone';
import { config } from '../controllers/config/config';

// 환경 설정 및 AWS S3 클라이언트 초기화
const s3 = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
    },
});

// Multer와 Multer-S3 설정
const upload = multer({
    storage: multerS3({
        s3: s3, // 위에서 생성한 클라이언트 객체
        bucket: process.env.AWS_BUCKET_NAME, // 버킷 이름
        acl: 'public-read', // 퍼블릭 읽기 설정 추가
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const date = moment().tz(config.timezone).format('YYYY-MM-DD-HH:mm:ss'); // S3에 저장하는 시간
            const fileExtension = file.originalname.split('.').pop(); // S3에 저장하는 파일의 확장자명
            const filename = `file-${date}.${fileExtension}`; // S3에 저장하는 파일 이름
            cb(null, filename);
        },
    }),
});

export { upload };
