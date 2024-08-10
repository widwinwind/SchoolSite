import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PostFile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    postId: string;

    @Column()
    fileId: number;
}
