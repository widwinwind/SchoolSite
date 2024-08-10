import { Request, Response } from 'express';
import AppDataSource from '../database/data-source';
import { Category } from '../entities/Category';

class CategoryController {
    // 카테고리 이름 조회 Category Name Lookup
    static getCategoryById = async (req: Request, res: Response) => {
        const categoryId = Number(req.params.id);
        const categoryRepository = AppDataSource.getRepository(Category);

        try {
            // 카테고리 조회 Category View
            const category = await categoryRepository.findOne({ where: { id: categoryId } });

            if (category) {
                // 카테고리 이름 반환 Return category name
                res.status(200).json({ name: category.name });
            } else {
                // 카테고리가 없는 경우 If there is no category
                res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
            }
        } catch (error) {
            // 오류 처리 Error
            res.status(500).json({ message: 'Category name search failed', error: error.message });
        }
    };
}

export default CategoryController;
