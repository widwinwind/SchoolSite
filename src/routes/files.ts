import { Router } from 'express';
import { FileController } from '../controllers/fileController';
import { upload } from '../middlewares/upload';
import { isLoggedin } from '../middlewares/auth';
const router = Router();

// AWS S3 파일 저장하고 데이터베이스에 파일에 관한 정보 저장. 10은 한 번 업로드할 때, 10개까지 업로드할 수 있다.
router.post('/', isLoggedin, upload.array('files', 10), FileController.uploadFiles);

export default router;
