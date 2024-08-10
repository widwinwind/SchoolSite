import { Request, Response } from 'express';
import AppDataSource from '../database/data-source';
import { Competition } from '../entities/Competition';
import moment from 'moment-timezone';
import { config } from './config/config';
import { Competitor } from '../entities/Competitor';
import { Category } from '../entities/Category';

export class CompetitionController {
    // 대회 정보 생성
    static createCompetition = async (req: Request, res: Response) => {
        const userId = req.user.userId;
        const { boardId, categoryId, name, date, competitors, type, award, result } = req.body;
        const competitionRepository = AppDataSource.getRepository(Competition);
        const competitorRepository = AppDataSource.getRepository(Competitor);

        const newCompetition = competitionRepository.create({
            userId,
            boardId,
            categoryId,
            name,
            date: new Date(date),
            type,
            award,
            result,
        });

        try {
            await competitionRepository.save(newCompetition);

            // Competitors 데이터 생성
            if (competitors && competitors.length > 0) {
                const newCompetitors = competitors.map((competitor: any) => {
                    return competitorRepository.create({
                        competition: newCompetition,
                        name: competitor.name,
                        score: competitor.score,
                    });
                });

                await competitorRepository.save(newCompetitors);
            }

            // 새로 생성된 대회와 관련된 Competitor 데이터를 포함하여 다시 조회
            const savedCompetition = await competitionRepository.findOne({
                where: { id: newCompetition.id },
                relations: ['competitors'], // 관계를 명시하여 관련 데이터를 포함
            });

            res.status(201).json(savedCompetition);
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: '대회 정보 생성 실패' });
        }
    };

    // 모든 대회 정보 조회
    // 몇개 보이게 할지는 프론트에서 정하면 됨
    static getCompetitionsOnScoreBoard = async (req: Request, res: Response) => {
        const competitionRepository = AppDataSource.getRepository(Competition);

        try {
            const competitions = await competitionRepository.find({
                order: { date: 'DESC' },
                relations: ['competitors'], // Competitors 데이터를 함께 조회
            });

            const localTimeCompetitions = competitions.map(competition => ({
                ...competition,
                date: moment.tz(competition.date, config.timezone).format('YYYY-MM-DD'),
            }));

            res.status(200).json(localTimeCompetitions);
        } catch (error) {
            res.status(500).json({ message: '대회 정보 조회 실패' });
        }
    };

    // 카테고리 아이디별 각 종목 상위 3개 대회 조회
    static getTopThreeCompetition = async (req: Request, res: Response) => {
        const categoryId = Number(req.params.categoryId);
        const competitionRepository = AppDataSource.getRepository(Competition);
        const categoryRepository = AppDataSource.getRepository(Category);

        try {
            // 해당 카테고리 존재 여부 확인
            const category = await categoryRepository.findOne({ where: { id: categoryId } });
            if (!category) {
                return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
            }

            // 카테고리에 속한 최신 대회 3개 조회
            const topCompetitions = await competitionRepository.find({
                where: { categoryId },
                order: {
                    date: 'DESC',
                },
                take: 3,
                relations: ['competitors'], // Competitors 및 Category 데이터를 함께 조회
            });

            if (topCompetitions.length > 0) {
                const localTimeCompetitions = topCompetitions.map(competition => ({
                    ...competition,
                    date: moment.tz(competition.date, config.timezone).format('YYYY-MM-DD'),
                }));

                res.status(200).json({ competitions: localTimeCompetitions });
            } else {
                res.status(404).json({ message: '대회 정보를 찾을 수 없습니다.' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: '대회 정보 조회 실패' });
        }
    };

    // 대회 정보 수정
    static updateCompetition = async (req: Request, res: Response) => {
        const competitionId = Number(req.params.id);
        const { name, date, competitors, type, award, result } = req.body;
        const competitionRepository = AppDataSource.getRepository(Competition);
        const competitorRepository = AppDataSource.getRepository(Competitor);

        try {
            const competition = await competitionRepository.findOne({
                where: { id: competitionId },
                relations: ['competitors'],
            });

            if (competition) {
                competition.name = name;
                competition.date = new Date(date);
                competition.type = type;
                competition.competitors = competitors;
                competition.award = award;
                competition.result = result;

                await competitionRepository.save(competition);

                // 기존 Competitors 삭제 후 새로 생성
                if (competitors && competitors.length > 0) {
                    await competitorRepository.delete({ competition: competition });

                    const newCompetitors = competitors.map((competitor: any) => {
                        return competitorRepository.create({
                            competition: competition,
                            score: competitor.score,
                        });
                    });

                    await competitorRepository.save(newCompetitors);
                }
                res.status(200).json(competition);
            } else {
                res.status(404).json({ message: '대회 정보을 찾을 수 없습니다' });
            }
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: '대회 정보 수정 실패' });
        }
    };

    // 대회 정보 삭제
    static deleteCompetition = async (req: Request, res: Response) => {
        const competitionId = Number(req.params.id);
        const competitionRepository = AppDataSource.getRepository(Competition);
        const competitorRepository = AppDataSource.getRepository(Competitor);

        try {
            const competition = await competitionRepository.findOne({
                where: { id: competitionId },
                relations: ['competitors'],
            });

            if (competition) {
                await competitorRepository.delete({ competition: competition });
                await competitionRepository.remove(competition);
                res.status(204).send();
            } else {
                res.status(404).json({ message: '대회 정보을 찾을 수 없습니다' });
            }
        } catch (error) {
            res.status(500).json({ message: '대회 정보 삭제 실패' });
        }
    };
}
