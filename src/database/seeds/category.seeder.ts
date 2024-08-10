import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";
import { Category } from "../../entities/Category";

// category entity에 초기값 넣기
export default class CategorySeeder implements Seeder {
  async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(Category);
    await repository.insert([
      {
        boardId: 2,
        name: "school",
      },
      {
        boardId: 2,
        name: "academic",
      },
      {
        boardId: 3,
        name: "pysics",
      },
      {
        boardId: 3,
        name: "biology",
      },
      {
        boardId: 5,
        name: "soccer",
      },
      {
        boardId: 5,
        name: "baseball",
      },
    ]);
  }
}
