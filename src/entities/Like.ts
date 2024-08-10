import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    AfterInsert,
    AfterRemove,
    BeforeInsert,
    Unique,
    BeforeRemove,
} from 'typeorm';
import AppDataSource from '../database/data-source';
import { Post } from './Post';
import { Comment } from './Comment';

@Entity('likes')
@Unique(['userId', 'postId'])
@Unique(['userId', 'commentId'])
export class Like {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ nullable: true })
    postId?: number;

    @Column({ nullable: true })
    commentId?: number;

    private tempPostId?: number;
    private tempCommentId?: number;

    @BeforeInsert() // 데이터 삽입 전 아래 함수를 실행
    validateFileds() {
        //  postId와 comment가 둘 다 동시에 존재하는지, 존재하지 않는지 확인
        if (this.postId === null && this.commentId === null) {
            throw new Error('Ether postId or commentId must be provided.');
        }
        if (this.postId !== null && this.commentId !== null) {
            throw new Error('Only one of postId or commentId can be provided.');
        }
    }

    @AfterInsert() // 데이터 삽입 후 아래 함수 실행
    async updateLikesCount() {
        // 좋아요 수 증가
        if (this.postId !== null) {
            const postRepository = AppDataSource.getRepository(Post);
            const post = await postRepository.findOne({
                where: { id: this.postId },
            });
            if (post) {
                post.likesCount += 1;
                await postRepository.save(post);
            }
        } else if (this.commentId !== null) {
            const commentRepository = AppDataSource.getRepository(Comment);
            const comment = await commentRepository.findOne({
                where: { id: this.commentId },
            });
            if (comment) {
                comment.likesCount += 1;
                await commentRepository.save(comment);
            }
        }
    }

    @BeforeRemove() // 데이터 삭제 전 아래 함수 실행
    saveIds() {
        // postId와 commentId 값을 저장
        this.tempPostId = this.postId;
        this.tempCommentId = this.commentId;
    }

    @AfterRemove() // 데이터 삭제 후 아래 함수 실행
    async decreaseLikesCount() {
        // 좋아요 수 감소 하기
        if (this.tempPostId !== null) {
            const postRepository = AppDataSource.getRepository(Post);

            const post = await postRepository.findOne({
                where: { id: this.tempPostId },
            });
            if (post) {
                post.likesCount -= 1;
                await postRepository.save(post);
            }
        } else if (this.tempCommentId !== null) {
            const commentRepository = AppDataSource.getRepository(Comment);
            const comment = await commentRepository.findOne({
                where: { id: this.tempCommentId },
            });
            if (comment) {
                comment.likesCount -= 1;
                await commentRepository.save(comment);
            }
        }
    }
}
