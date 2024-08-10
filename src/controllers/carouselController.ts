import { Request, Response } from 'express';
import { Post } from '../entities/Post';
import AppDataSource from '../database/data-source';

export class CarouselController {
    // carousel에 표시할 featured 게시글 설정하기 Setting featured posts to display in carousel
    static featurePost = async (req: Request, res: Response) => {
        const { boardId, categoryId, postId } = req.body;
        const postRepository = AppDataSource.getRepository(Post);

        try {
            // Post 데이터를 조회할 조건 객체를 만듦 Create a condition object to query Post data
            const conditions = {
                id: Number(postId),
                boardId: Number(boardId),
                categoryId,
            };

            // categoryId 존재여부 확인. 있으면 String에서 Number로 변경 Check whether categoryId exists. If so, change from String to Number
            if (categoryId !== undefined && categoryId !== null) {
                conditions.categoryId = Number(categoryId);
            }

            const post = await postRepository.findOne({ where: conditions });

            if (post) {
                post.isCarousel = true;
                await postRepository.save(post);
                res.json({ message: 'Your post has been posted to the carousel', post });
            } else {
                res.status(404).json({ message: 'Cant find the post.' });
            }
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: 'Failed to upload post to carousel.' });
        }
    };

    // carousel에 표시할 featured 게시글 해제하기 Turn off featured posts to be displayed in the carousel
    static unfeaturePost = async (req: Request, res: Response) => {
        const { boardId, categoryId, postId } = req.body;
        const postRepository = AppDataSource.getRepository(Post);

        try {
            const conditions = {
                id: parseInt(postId),
                boardId: parseInt(boardId),
                categoryId,
            };

            if (categoryId !== undefined && categoryId !== null) {
                conditions.categoryId = parseInt(categoryId);
            }

            const post = await postRepository.findOne({ where: conditions });

            if (post) {
                post.isCarousel = false;
                await postRepository.save(post);
                res.json({ message: 'Post has been removed from the carousel', post });
            } else {
                res.status(404).json({ message: 'Cant find the post' });
            }
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: 'Failed to unload post from carousel' });
        }
    };

    // 캐러셀에 표시할 featured 게시글을 가져오는 경로 Path to retrieve featured posts to be displayed in the carousel
    static getFeaturedPosts = async (req: Request, res: Response) => {
        const postRepository = AppDataSource.getRepository(Post);

        try {
            const featuredPosts = await postRepository.find({
                where: { isCarousel: true },
                order: { createdAt: 'DESC' },
            });
            res.status(200).json(featuredPosts);
        } catch (error) {
            res.status(500).json({ message: 'Failed to view carousel posts' });
        }
    };
}
