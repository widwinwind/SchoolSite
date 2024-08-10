import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";
import { Board } from "../../entities/Board";

// board entity에 초기값 넣기
export default class BoardSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(Board);
    await repository.insert([
      {
        name: "announcement", 
      },
      {
        name: "general",
      },
      {
        name: "curriculum",
      },
      {
        name: "suggestion",
      },
      {
        name: "sports",
      },
    ]);
  }
}
