import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Swagger compiler configuration', () => {
  it('keeps DTO property discovery enabled for every request schema', () => {
    const configuration = JSON.parse(
      readFileSync(resolve(process.cwd(), 'nest-cli.json'), 'utf8'),
    ) as {
      compilerOptions?: {
        deleteOutDir?: boolean;
        plugins?: Array<{
          name?: string;
          options?: {
            classValidatorShim?: boolean;
            dtoFileNameSuffix?: string[];
          };
        }>;
      };
    };
    const plugin = configuration.compilerOptions?.plugins?.find(
      (candidate) => candidate.name === '@nestjs/swagger',
    );
    expect(plugin?.options).toEqual(
      expect.objectContaining({
        classValidatorShim: true,
        dtoFileNameSuffix: expect.arrayContaining(['.dto.ts']),
      }),
    );
    expect(configuration.compilerOptions?.deleteOutDir).toBe(false);
  });
});
