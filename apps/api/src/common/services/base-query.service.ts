import { PaginationQueryDto } from '../dto/pagination-query.dto';

export abstract class BaseQueryService {
    /**
     * Generates pagination metadata
     */
    protected getPaginationMeta(total: number, query: PaginationQueryDto) {
        const { page = 1, limit = 10 } = query;
        const lastPage = Math.ceil(total / limit);

        return {
            total,
            page: Number(page),
            limit: Number(limit),
            lastPage,
            hasNextPage: page < lastPage,
            hasPreviousPage: page > 1,
        };
    }

    /**
     * Gets pagination options for Prisma
     */
    protected getPaginationOptions(query: PaginationQueryDto) {
        const { page = 1, limit = 10 } = query;
        const take = Number(limit);
        const skip = (Number(page) - 1) * take;

        return { skip, take };
    }

    /**
     * Common search where clause helper
     */
    protected buildSearchWhere(search?: string, fields: string[] = []) {
        if (!search || fields.length === 0) return {};

        return {
            OR: fields.map((field) => {
                if (field.includes('.')) {
                    const [relation, subField] = field.split('.');
                    return {
                        [relation]: {
                            [subField]: { contains: search, mode: 'insensitive' },
                        },
                    };
                }
                return {
                    [field]: { contains: search, mode: 'insensitive' },
                };
            }),
        };
    }
}
