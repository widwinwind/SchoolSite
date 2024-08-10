import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('points')
export class Point {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    team: string;

    @Column()
    event: string;

    @Column()
    score: number;

    @Column()
    date: Date;
}
