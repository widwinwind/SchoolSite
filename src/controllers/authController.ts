import { Request, Response } from 'express';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import { RoleType } from '../entities/enums/RoleType';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import AppDataSource from '../database/data-source';

export class AuthController {
    // 이메일 인증을 통한 회원가입 Sign up through email verification
    static register = async (req: Request, res: Response) => {
        const { name, email, role } = req.body;
        const userRepository = AppDataSource.getRepository(User);

        try {
            // 이메일 존재 여부 확인 Check for existence of email
            const findUser = await userRepository.findOne({ where: { email } });

            if (findUser) {
                // 가입된 이메일인 경우 If it is a registered email
                if (findUser.emailToken == null && findUser.emailTokenExpiry == null) {
                    return res.status(400).json({ message: '이미 가입된 이메일입니다.' });
                }

                // 가입되지 않은 이메일인 경우 if not
                if (findUser.emailToken && findUser.emailTokenExpiry) {
                    const currentTime = new Date();

                    if (currentTime < findUser.emailTokenExpiry) {
                        // 이메일 인증 토큰이 만료되지 않은 경우 If your email authentication token has not expired
                        return res.status(400).json({ message: '이메일 인증을 완료해주세요.' });
                    } else {
                        // 이메일 인증 토큰이 만료된 경우 If your email authentication token has expired
                        await userRepository.remove(findUser);
                    }
                }
            }

            // 이메일 인증 토큰 및 만료시간 설정 Email authentication token and expiration time settings
            const emailToken = crypto.randomBytes(32).toString('hex');
            const emailTokenExpiry = new Date();
            emailTokenExpiry.setHours(emailTokenExpiry.getHours() + 1);

            // 비밀번호 재설정 토큰 및 만료기간 저장 Save password reset token and expiration period
            const user = userRepository.create({
                name,
                email,
                password: '',
                role: role === RoleType.TEACHER ? RoleType.TEACHER : RoleType.STUDENT,
                emailToken: emailToken,
                emailTokenExpiry,
            });

            await userRepository.save(user);

            // 이메일 전송 send email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Email Verification',
                text: `Click the following link to verify your email: \n\n ${process.env.URL}/users/verify/${emailToken}`,
                html: `<p>Click the following link to verify your email:</p><p><a href="${process.env.URL}/users/verify/${emailToken}">Email verification link</a></p>`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: 'A verification link has been sent to your email.' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Server Error.' });
        }
    };

    // 이메일 인증 및 비밀번호 설정 Email authentication and password settings
    static verifyEmail = async (req: Request, res: Response) => {
        const { emailToken, password } = req.body;

        try {
            const userRepository = AppDataSource.getRepository(User);

            // 유효한 이메일 인증 토큰인지 확인 Check if email authentication token is valid
            const user = await userRepository.findOne({ where: { emailToken: emailToken } });
            if (!user) {
                return res.status(400).json({ message: 'Invalid email authentication token.' });
            }

            // 만료된 이메일 인증 토큰인지 확인 Check if email authentication token is expired
            const currentTime = new Date();
            if (user.emailTokenExpiry && currentTime > user.emailTokenExpiry) {
                return res.status(400).json({ message: 'Email authentication token has expired.' });
            }

            // 비밀번호 설정 Setting Password
            const hashedPassword = await bcrypt.hash(password, 10);

            user.password = hashedPassword;
            user.emailToken = null;
            user.emailTokenExpiry = null;

            await userRepository.save(user);

            res.status(200).json({ message: 'Registration has been completed.' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Server Error.' });
        }
    };

    // 로그인 Login
    static login = async (req: Request, res: Response) => {
        const { email, password } = req.body;

        try {
            const userRepository = AppDataSource.getRepository(User);

            // 이메일 일치 여부 확인 Check if email matches
            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(400).json({ message: 'User not found.' });
            }

            const currentTime = new Date();

            // 이메일 인증 여부 확인 Check whether email is verified
            if (user.emailTokenExpiry && currentTime < user.emailTokenExpiry) {
                return res.status(400).json({ message: 'Please complete email verification first.' });
            }

            // 만료된 이메일 인증 토큰을 가진 이메일인지 확인 Check if the email has an expired email authentication token
            if (user.emailTokenExpiry && currentTime > user.emailTokenExpiry) {
                return res.status(400).json({ message: 'Your email verification has expired. Please sign up again.' });
            }

            // 비밀번호 일치 여부 확인 Check if password matches
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ message: 'Wrong Password.' });
            }

            // RefreshToken 유효성 검사 RefreshToken validation
            let isValidRefreshToken = false;
            if (user.refreshToken) {
                try {
                    const payload = verifyRefreshToken(user.refreshToken);
                    console.log(payload);
                    // RefreshToken이 유효한 경우 if Valid
                    isValidRefreshToken = true;
                } catch (error) {
                    // RefreshToken이 유효하지 않은 경우 If not Valid
                    if (error.message === 'TokenExpiredError') {
                        console.error('Refresh token expired');
                        isValidRefreshToken = false;
                    } else if (error.message === 'JsonWebTokenError') {
                        console.error('Invalid refresh token');
                        isValidRefreshToken = false;
                    } else {
                        console.error('Unknown token error');
                        isValidRefreshToken = false;
                    }
                }
            }

            const accessToken = generateAccessToken(user.id, user.role);
            let refreshToken;

            // RefreshToken이 유효하지 않으면 새로 생성 If RefreshToken is invalid, create a new one
            if (!isValidRefreshToken) {
                refreshToken = generateRefreshToken(user.id);
                user.refreshToken = refreshToken;
                await userRepository.save(user);
            } else {
                refreshToken = user.refreshToken;
            }

            res.status(200).json({ message: 'Login was successful.', accessToken, refreshToken });
        } catch (error) {
            res.status(500).json({ message: 'Server Error.' });
        }
    };

    // 비밀번호 찾기 Find password
    static findPassword = async (req: Request, res: Response) => {
        const { name, email } = req.body;

        const userRepository = AppDataSource.getRepository(User);
        try {
            // 이름과 이메일이 일치하는 사용자 찾기 Find users with matching name and email
            const user = await userRepository.findOne({ where: { name, email } });
            if (!user) {
                return res.status(400).json({ message: 'User not found.' });
            }

            // 비밀번호 재설정 토큰 및 만료시간 설정 Set password reset token and expiration time
            const resetPasswordToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date();
            resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

            // 비밀번호 재설정 토큰 및 만료기간 저장 Save password reset token and expiration period
            user.resetPasswordToken = resetPasswordToken;
            user.resetPasswordExpiry = resetTokenExpiry;

            await userRepository.save(user);

            // 이메일 전송 Send email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Reset password',
                text: `Click the following link to reset your password: \n\n ${process.env.URL}/reset-password/${resetPasswordToken}`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: 'A password reset link has been emailed to you.' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Server Error.' });
        }
    };

    // 비밀번호 재설정 Reset Password
    static resetPassword = async (req: Request, res: Response) => {
        const { resetPasswordToken, newPassword } = req.body;

        try {
            const userRepository = AppDataSource.getRepository(User);

            // 유효한 재설정 토큰인지 확인 Check if it is a valid reset token
            const user = await userRepository.findOne({ where: { resetPasswordToken: resetPasswordToken } });
            if (!user) {
                return res.status(400).json({ message: 'Invalid password reset token.' });
            }

            // 토큰 만료 여부 확인 Check if token expires
            const currentTime = new Date();
            if (user.resetPasswordExpiry && currentTime > user.resetPasswordExpiry) {
                return res.status(400).json({ message: 'Password reset token has expired.' });
            }

            // 새 비밀번호 설정 Set new Password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            user.password = hashedPassword;
            user.resetPasswordToken = null;
            user.resetPasswordExpiry = null;

            await userRepository.save(user);

            res.status(200).json({ message: 'Your password has been reset successfully.' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Server Error.' });
        }
    };
}
