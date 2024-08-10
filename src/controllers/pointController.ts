import { Request, Response } from 'express';
import AppDataSource from '../database/data-source';
import { Point } from '../entities/Point';
import { Between, In } from 'typeorm';

export class PointController {
    // 팀, 이벤트, 점수 생성
    static addPoints = async (req: Request, res: Response) => {
        const { teamNames, event, scores, date } = req.body;
        const pointRepository = AppDataSource.getRepository(Point);

        try {
            // 여러 개의 점수를 한 번에 생성
            const newPoints = teamNames.map((teamName: string, index: number) => {
                return pointRepository.create({
                    team: teamName,
                    event: event,
                    score: scores[index],
                    date: date,
                });
            });

            const points = await pointRepository.save(newPoints);
            return res.status(200).json({ message: '점수 생성 성공', points });
        } catch (error) {
            res.status(500).json({ message: '점수 생성 실패' });
        }
    };

    // 팀, 이벤트, 점수 조회
    static getAllPoints = async (req: Request, res: Response) => {
        const year = req.query.year;
        const pointRepository = AppDataSource.getRepository(Point);

        // 점수판을 보여주는 기간 (해당 연도)
        const startDate = new Date(`${year}-08-01`);
        const endDate = new Date(`${year}-07-31`);
        endDate.setFullYear(endDate.getFullYear() + 1); // endDate의 연도를 다음 해로 설정

        try {
            // 기록한 팀 순서대로
            const scores = await pointRepository.find({
                where: {
                    date: Between(startDate, endDate),
                },
                order: { id: 'ASC' },
            });

            const totalScores = await pointRepository
                .createQueryBuilder('points')
                .select('points.team')
                .addSelect('SUM(points.score)', 'totalScore')
                .where('points.date BETWEEN :startDate AND :endDate', { startDate, endDate })
                .groupBy('points.team')
                .orderBy('MIN(points.id)', 'ASC') // 최소 id 기준으로 정렬
                .getRawMany();

            res.status(200).json({ scores, totalScores });
        } catch (error) {
            console.error(error);
            res.status(404).json({ message: 'Grade Points를 조회하는데 실패했습니다.' });
        }
    };

    // 팀, 이벤트, 점수 수정
    static updatePoints = async (req: Request, res: Response) => {
        const { pointsId, teamNames, event, scores, date } = req.body;
        const pointRepository = AppDataSource.getRepository(Point);

        try {
            // 업데이트할 점수들을 배열로 생성
            const pointsToUpdate = await Promise.all(
                pointsId.map(async (id: number, index: number) => {
                    const point = await pointRepository.findOne({ where: { id } });

                    if (point) {
                        point.team = teamNames[index];
                        point.event = event;
                        point.score = scores[index];
                        point.date = date;
                        return point;
                    } else {
                        throw new Error('점수를 찾을 수 없습니다.');
                    }
                }),
            );

            const updatedPoints = await pointRepository.save(pointsToUpdate);
            res.status(200).json({ message: '점수가 성공적으로 업데이트되었습니다.', updatedPoints });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: '점수 업데이트 실패' });
        }
    };

    // 팀, 이벤트, 점수 삭제
    static deletePoints = async (req: Request, res: Response) => {
        const { pointsId } = req.body;
        const pointRepository = AppDataSource.getRepository(Point);

        try {
            const pointsToDelete = await pointRepository.findBy({ id: In(pointsId) });

            if (pointsToDelete.length !== pointsId.length) {
                return res.status(404).json({ message: '일부 점수를 찾을 수 없습니다.' });
            }

            await pointRepository.remove(pointsToDelete);

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: '점수 삭제 실패' });
        }
    };
}
