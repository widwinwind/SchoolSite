import { Request, Response } from 'express';
import AppDataSource from '../database/data-source';
import { Board } from '../entities/Board';

class BoardController {
    static getBoardById = async (req: Request, res: Response) => {
        const boardId = Number(req.params.id);
        const boardRepository = AppDataSource.getRepository(Board);

        try {
            // 카테고리 조회 Category View
            const board = await boardRepository.findOne({ where: { id: boardId } });

            if (board) {
                // 카테고리 이름 반환 Return category name
                res.status(200).json({ name: board.name });
            } else {
                // 카테고리가 없는 경우 If there is no category
                res.status(404).json({ message: 'Cant find the Category.' });
            }
        } catch (error) {
            // 오류 처리 Error handling
            res.status(500).json({ message: 'Category name search failed', error: error.message });
        }
    };
}

export default BoardController;
