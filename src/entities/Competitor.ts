import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Competition } from './Competition';

@Entity('competitors')
export class Competitor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    score: number;

    @ManyToOne(() => Competition, competition => competition.competitors)
    competition: Competition;
}
