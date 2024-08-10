import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CommentFile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    commentId: string;

    @Column()
    fileId: number;
}
