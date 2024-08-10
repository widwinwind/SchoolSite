import express from 'express';
import cors from 'cors';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import likeRoutes from './routes/likes';
import competitionRoutes from './routes/competitions';
import carouselRoutes from './routes/carousels';
import fileRoutes from './routes/files';
import pointRoutes from './routes/points';
import AppDataSource from './database/data-source';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import boardRoutes from './routes/boards';
import categoryRoutes from './routes/categories';
import { RoleType } from './entities/enums/RoleType';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number | undefined;
                role: RoleType | undefined;
            };
        }
    }
}

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/boards', boardRoutes);
app.use('/categories', categoryRoutes);
app.use('/posts', postRoutes);
app.use('/', commentRoutes);
app.use('/likes', likeRoutes);
app.use('/competitions', competitionRoutes);
app.use('/carousels', carouselRoutes);
app.use('/files', fileRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/points', pointRoutes);

// 기본 페이지
app.get('/', (req, res) => {
    res.send('안녕하세요, 기본 페이지입니다.');
});

AppDataSource.initialize()
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch(error => console.log(error));

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
