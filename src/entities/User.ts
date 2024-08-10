import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RoleType } from './enums/RoleType';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column({
        type: 'enum',
        enum: RoleType,
    })
    role: RoleType;

    @Column({ nullable: true })
    emailToken: string;

    @Column({ type: 'timestamp', nullable: true })
    emailTokenExpiry: Date;

    @Column({ nullable: true })
    resetPasswordToken: string;

    @Column({ type: 'timestamp', nullable: true })
    resetPasswordExpiry: Date;

    @Column({ nullable: true })
    refreshToken: string;
}
