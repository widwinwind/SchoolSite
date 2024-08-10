import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CompetitionType } from './enums/CompetitionType';
import { Competitor } from './Competitor';
@Entity('competitions')
export class Competition {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    boardId: number;

    @Column()
    categoryId: number;

    @Column()
    name: string;

    @Column()
    date: Date;

    @Column({
        type: 'enum',
        enum: CompetitionType,
    })
    type: CompetitionType;

    @Column({ nullable: true })
    award: string;

    @Column({ nullable: true })
    result?: string;

    @OneToMany(() => Competitor, competitor => competitor.competition)
    competitors: Competitor[];
}
