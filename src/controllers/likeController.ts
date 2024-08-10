import { Request, Response } from 'express';
import AppDataSource from '../database/data-source';
import { Like } from '../entities/Like';

class LikeController {
    static addLike = async (req: Request, res: Response) => {
        const { postId, commentId } = req.body;
        const userId = req.user.userId;
        const likeRepository = AppDataSource.getRepository(Like);

        try {
            if (postId === undefined && commentId === undefined) {
                return res.status(400).json({ message: 'postId 또는 commentId가 필요합니다.' });
            }

            if (postId !== undefined && commentId !== undefined) {
                return res.status(400).json({ message: 'postId와 commentId는 동시에 제공될 수 없습니다.' });
            }

            // 중복 좋아요 검사
            let existingLike: Like;
            if (postId !== undefined) {
                existingLike = await likeRepository.findOne({
                    where: { postId, userId },
                });
            } else if (commentId !== undefined) {
                existingLike = await likeRepository.findOne({
                    where: { commentId, userId },
                });
            }

            if (existingLike) {
                return res.status(400).json({ message: '이미 좋아요를 눌렀습니다.' });
            }

            const newLike = likeRepository.create({
                postId: postId || null,
                commentId: commentId || null,
                userId,
            });

            await likeRepository.save(newLike);
            res.status(201).json(newLike);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: '좋아요 추가 실패' });
        }
    };

    static removeLike = async (req: Request, res: Response) => {
        const likeId = Number(req.params.id);
        const likeRepository = AppDataSource.getRepository(Like);

        try {
            const like = await likeRepository.findOne({ where: { id: likeId } });
            if (!like) {
                return res.status(404).json({ message: '좋아요를 찾을 수 없습니다.' });
            }

            await likeRepository.remove(like);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: '좋아요 삭제 실패', error });
        }
    };
}

export default LikeController;
