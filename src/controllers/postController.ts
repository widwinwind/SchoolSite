import { Request, Response } from 'express';
import { Post } from '../entities/Post';
import AppDataSource from '../database/data-source';
import { Category } from '../entities/Category';
import { Board } from '../entities/Board';
import { User } from '../entities/User';
import { Between, FindOptionsWhere, In, LessThan, MoreThan } from 'typeorm';

export class PostController {
    // 게시글 생성
    static createPost = async (req: Request, res: Response) => {
        const userId = req.user.userId;
        const { boardId, categoryId, title, content, season, isAnonymous } = req.body;
        const postRepository = AppDataSource.getRepository(Post);

        // newPost 객체 생성
        const newPost = postRepository.create({
            userId,
            boardId,
            categoryId,
            title,
            content,
            season,
            isAnonymous,
        });

        try {
            // post 테이블에 newPost 저장
            const savedPost = await postRepository.save(newPost);

            res.status(201).json(savedPost);
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: '게시글 생성 실패' });
        }
    };

    // sports 종목 목록
    static getSportsCategories = async (req: Request, res: Response) => {
        const { year, season } = req.query;
        const postRepository = AppDataSource.getRepository(Post);
        const categoryRepository = AppDataSource.getRepository(Category);

        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);

        try {
            // 스포츠 게시글을 year, seaon에 따라서 분류
            const posts = await postRepository.find({
                where: { season: season as string, createdAt: Between(startDate, endDate) },
            });

            // 카테고리 이름을 가져오기 위해 categoryId로 카테고리 조회
            const categoryIds = posts.map(post => post.categoryId);
            const categories = await categoryRepository.find({
                where: { id: In(categoryIds) },
            });

            // 각 게시글에 카테고리 이름 추가
            const postsWithCategories = posts.map(post => {
                const category = categories.find(cat => cat.id === post.categoryId);
                return {
                    ...post,
                    categoryName: category ? category.name : null,
                };
            });

            res.status(200).json(postsWithCategories);
        } catch (error) {
            res.status(400).json({ message: '게시글 작성해 실패 했습니다.' });
        }
    };

    // 모든 게시글 조회
    static getAllPosts = async (req: Request, res: Response) => {
        const { sort, limit, cursor } = req.query; // 쿼리에서 sort, limit를 가져온다.
        const { boardName, categoryName } = req.body; // body에서 boardName, categoryName을 가져온다.
        const userId = req.user.userId;

        const boardRepository = AppDataSource.getRepository(Board);
        const categoryRepository = AppDataSource.getRepository(Category);
        const postRepository = AppDataSource.getRepository(Post);
        const userRepository = AppDataSource.getRepository(User);

        try {
            let order = {}; // 정렬 객체 초기화

            switch (sort) {
                // 최신순
                case 'latest':
                    order = { createdAt: 'DESC' };
                    break;

                // 오래된순

                case 'oldest':
                    order = { createdAt: 'ASC' };
                    break;

                // 좋아요순
                case 'mostLikes':
                    order = { likesCount: 'DESC' };
                    break;

                default:
                    order = { createdAt: 'DESC' };
            }

            const board = await boardRepository.findOne({
                where: { name: boardName },
            });

            // 존재하는 게시판인지 확인
            if (!board) {
                return res.status(404).json({ message: '게시판을 찾을 수 없습니다.' });
            }

            let category = null; // category가 없는 게시판이 존재하므로 기본값은 null
            if (categoryName) {
                category = await categoryRepository.findOne({
                    where: { name: categoryName },
                });

                // 카테고리 존재하는지 확인
                if (!category) {
                    return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
                }
            }

            const whereClause: FindOptionsWhere<Post> = { boardId: board.id };

            if (category) {
                // 카테고리가 있으면 where 조건문에 cateogyId를 추가한다
                whereClause.categoryId = category.id;
            }

            if (cursor) {
                // 오래된순 정렬일 경우 cursor보다 더 큰(오래된) createdAt을 가져온다
                const cursorDate = new Date(cursor as string);
                if (sort === 'oldest') {
                    whereClause.createdAt = MoreThan(cursorDate);
                } else {
                    whereClause.createdAt = LessThan(cursorDate);
                }
            }

            // 게시글 작성자의 유저 아이디와 이름을 포함시켜 게시글글을 찾는다
            const posts = await postRepository.find({
                where: whereClause,
                order,
                take: Number(limit), // 쿼리를 반환할 최대 행 수
            });

            // 로그인한 유저
            const user = await userRepository.findOne({ where: { id: userId } });

            // 익명성 설정
            const result = await Promise.all(
                posts.map(async post => {
                    // 작성자 정보
                    const author = await userRepository.findOne({ where: { id: post.userId } });
                    if (post.isAnonymous && user?.role !== 'teacher') {
                        // 유저 권한이 teacher가 아닐 경우 게시글을 익명으로 공개
                        return {
                            ...post,
                            userId: null,
                            user: { id: null, name: 'Anonymous' },
                        };
                    } else {
                        // 유저 권한이 teacher인 경우 게시글을 실명으로 공개
                        return {
                            ...post,
                            user: { id: author?.id, name: author?.name },
                        };
                    }
                }),
            );

            const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt : null;

            res.status(200).json({ nextCursor, posts: result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: '게시글 조회 실패' });
        }
    };

    // 상세 게시글 조회
    static getPostById = async (req: Request, res: Response) => {
        const postId = Number(req.params.id);
        const userRepository = AppDataSource.getRepository(User);
        const postRepository = AppDataSource.getRepository(Post);
        const userRole = (req as any).role; // 요청한 사람 권한

        try {
            const post = await postRepository.findOne({ where: { id: postId } });

            // 게시글 존재 유무 판단
            if (!post) {
                res.status(404).json({ message: '게시글을 찾을 수 없습니다' });
            }

            // 게시글 작성자 정보 익명성 설정
            const author: Partial<User> = await userRepository.findOne({
                where: { id: post.userId },
                select: ['id', 'name'],
            });
            const responsePost = { ...post, user: author };

            // 요청한 사람이 선생님이면 작성자 이름 볼 수 있음
            if (post.isAnonymous) {
                responsePost.userId = userRole.role === 'teacher' ? post.userId : null;
                responsePost.user =
                    userRole.role === 'teacher' ? { id: author.id, name: author.name } : { id: null, name: null };
            }
            res.status(200).json(responsePost);
        } catch (error) {
            res.status(500).json({ message: '게시글 조회 실패' });
        }
    };

    // 게시글 수정
    static updatePost = async (req: Request, res: Response) => {
        const postId = Number(req.params.id);
        const { title, content, season } = req.body;
        const postRepository = AppDataSource.getRepository(Post);

        try {
            const post = await postRepository.findOne({ where: { id: postId } });
            if (post) {
                post.title = title;
                post.content = content;
                post.season = season;
                await postRepository.save(post);
                res.status(200).json(post);
            } else {
                res.status(404).json({ message: '게시글을 찾을 수 없습니다' });
            }
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: '게시글 수정 실패' });
        }
    };

    // 게시글 삭제
    static deletePost = async (req: Request, res: Response) => {
        const postId = Number(req.params.id);
        const postRepository = AppDataSource.getRepository(Post);

        try {
            const post = await postRepository.findOne({ where: { id: postId } });
            if (post) {
                await postRepository.remove(post);
                res.status(204).send();
            } else {
                res.status(404).json({ message: '게시글을 찾을 수 없습니다' });
            }
        } catch (error) {
            res.status(500).json({ message: '게시글 삭제 실패' });
        }
    };
}
