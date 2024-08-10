import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('boards')
export class Board {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
