import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class UserFile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    fileId: number;
}
