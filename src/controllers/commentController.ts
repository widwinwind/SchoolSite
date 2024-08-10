import { Request, Response } from 'express';
import { Comment } from '../entities/Comment';
import AppDataSource from '../database/data-source';
import { IsNull, MoreThanOrEqual } from 'typeorm';

export class CommentController {
    // 댓글 생성
    static createComment = async (req: Request, res: Response) => {
        const { content, parentCommentId } = req.body;
        const userId = req.user.userId;
        const postId = Number(req.params.postId);

        // 유효성 검사
        if (isNaN(userId) || isNaN(postId) || !content) {
            return res.status(400).json({ message: '유효하지 않은 입력 값' });
        }

        const commentRepository = AppDataSource.getRepository(Comment);

        try {
            // 부모 댓글이 있는 경우 부모 댓글 찾기
            let parentComment = null;
            if (parentCommentId) {
                parentComment = await commentRepository.findOne({ where: { id: parentCommentId } });
                if (!parentComment) {
                    return res.status(400).json({ message: '유효하지 않음 부모 댓글 ID' });
                }
            }

            // 새로운 댓글 생성
            const newComment = commentRepository.create({
                userId,
                postId,
                content,
                parentComment,
            });

            // 댓글 저장
            await commentRepository.save(newComment);

            // 새로운 댓글 정보와 관련된 정보 반환
            const savedComment = await commentRepository.findOne({
                where: { id: newComment.id },
                relations: ['parentComment'],
            });

            res.status(201).json(savedComment);
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: '댓글 생성 실패' });
        }
    };

    // 특정 게시글의 댓글 및 대댓글 조회
    static getCommentsByPostId = async (req: Request, res: Response) => {
        const postId = Number(req.params.postId);

        if (isNaN(postId)) {
            return res.status(400).json({ message: '유효하지 않은 입력 값' });
        }
        const commentRepository = AppDataSource.getRepository(Comment);

        try {
            // 일반 댓글만 조회하고, 그에 속한 대댓글도 함께 가져오기
            const comments = await commentRepository.find({
                where: { postId, parentComment: IsNull() },
                relations: ['replies'],
                order: { createdAt: 'ASC' },
            });

            // 대댓글들도 생성된 순서대로 정렬
            comments.forEach(comment => {
                comment.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            });

            res.json(comments);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: '댓글 조회 실패' });
        }
    };

    // 특정 게시글의 베스트 댓글 조회 (베스트 댓글은 좋아요 5개 이상)
    static getBestCommentByPostId = async (req: Request, res: Response) => {
        const postId = Number(req.params.postId);
        const commentRepository = AppDataSource.getRepository(Comment);

        try {
            const bestComment = await commentRepository.find({
                where: { postId, likesCount: MoreThanOrEqual(5) },
                order: { likesCount: 'DESC' },
                take: 1,
            });
            return res.status(200).json(bestComment);
        } catch (error) {
            res.status(500).json({ message: '베스트 댓글 조회 실패', error });
        }
    };

    // 댓글 수정
    static updateComment = async (req: Request, res: Response) => {
        const commentId = Number(req.params.id);
        const { content } = req.body;
        const commentRepository = AppDataSource.getRepository(Comment);

        try {
            const comment = await commentRepository.findOne({
                where: { id: commentId },
            });

            if (comment) {
                comment.content = content;
                await commentRepository.save(comment);
                res.json(comment);
            } else {
                res.status(404).json({ message: '댓글을 찾을 수 없습니다' });
            }
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: '댓글 수정 실패' });
        }
    };

    // 댓글 삭제
    static deleteComment = async (req: Request, res: Response) => {
        const commentId = Number(req.params.id);
        const commentRepository = AppDataSource.getRepository(Comment);

        try {
            const comment = await commentRepository.findOne({
                where: { id: commentId },
            });
            if (comment) {
                await commentRepository.remove(comment);
                res.status(204).send();
            } else {
                res.status(404).json({ message: '댓글을 찾을 수 없습니다' });
            }
        } catch (error) {
            res.status(500).json({ message: '댓글 삭제 실패' });
        }
    };
}
