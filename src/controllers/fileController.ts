import { Request, Response } from 'express';
import { File } from '../entities/File';
import AppDataSource from '../database/data-source';
import { UserFile } from '../entities/UserFile';
import { PostFile } from '../entities/PostFile';
import { CommentFile } from '../entities/CommentFile';

export class FileController {
    static uploadFiles = async (req: Request, res: Response) => {
        try {
            const files = req.files as Express.MulterS3.File[];
            const fileRepository = AppDataSource.getRepository(File);
            const userFileRepository = AppDataSource.getRepository(UserFile);
            const postFileRepository = AppDataSource.getRepository(PostFile);
            const commentFileRepository = AppDataSource.getRepository(CommentFile);

            let { userId, postId, commentId } = req.body;
            userId = userId ? parseInt(userId) : null;
            postId = postId ? parseInt(postId) : null;
            commentId = commentId ? parseInt(commentId) : null;

            if (!files || files.length === 0) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            if (!userId && !postId && !commentId) {
                // userId, postId, commentId 모두 없을 때
                return res.status(400).json({ message: 'userId, postId, commentId 중 하나는 필요합니다.' });
            }

            /**
             *  req.files에는 여러 파일들이 존재한다.
             *  파일 데이터를 정제해서 DB에 넣기 위해 map으로 형태를 바꿔주고 DB에 저장한다.
             *  Promise.all로 파일이 순서대로 저장되는 것이 아니라 동시에 저장된다.
             */

            const newFiles = files.map(async file => {
                const newFile = fileRepository.create({
                    name: file.originalname,
                    mime: file.mimetype,
                    size: file.size,
                    url: file.location,
                });

                const savedFile = await fileRepository.save(newFile);

                //  유저-파일, 게시글-파일, 댓글-파일의 중간 테이블에 id들 저장
                if (userId) {
                    const userFile = userFileRepository.create({
                        userId,
                        fileId: savedFile.id,
                    });
                    await userFileRepository.save(userFile);
                }

                if (postId) {
                    const postFile = postFileRepository.create({
                        postId,
                        fileId: savedFile.id,
                    });
                    await postFileRepository.save(postFile);
                }

                if (commentId) {
                    const commentFile = commentFileRepository.create({
                        commentId,
                        fileId: savedFile.id,
                    });
                    await commentFileRepository.save(commentFile);
                }

                return newFile;
            });

            const savedFiles = await Promise.all(newFiles); // Promise.all로 파일 여러개 파일 동시에 저장

            return res.status(201).json(savedFiles);
        } catch (error) {
            return res.status(404).json({ message: '파일을 업로드할 수 없습니다.', error });
        }
    };
}
