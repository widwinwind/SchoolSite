import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    AfterInsert,
    AfterRemove,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import AppDataSource from '../database/data-source';
import { Post } from './Post';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    postId: number;

    @ManyToOne(() => Comment, comment => comment.replies, { nullable: true, onDelete: 'CASCADE' })
    parentComment: Comment;

    @OneToMany(() => Comment, comment => comment.parentComment)
    replies: Comment[];

    @Column()
    content: string;

    @Column({ default: 0 })
    likesCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // 댓글이 생성되면 Post 엔티티에서 댓글 수 1 증가
    @AfterInsert()
    async incrementPostCommentsCount() {
        const postRepository = AppDataSource.getRepository(Post);
        const post = await postRepository.findOne({ where: { id: this.postId } });
        if (post) {
            post.commentsCount += 1;
            await postRepository.save(post);
        }
    }

    // 댓글이 제거되면 Post 엔티티에서 댓글 수 1 감소
    @AfterRemove()
    async decrementPostCommentsCount() {
        const postRepository = AppDataSource.getRepository(Post);
        const post = await postRepository.findOne({ where: { id: this.postId } });
        if (post && post.commentsCount > 0) {
            post.commentsCount -= 1;
            await postRepository.save(post);
        }
    }
}
