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
            page,
            limit,
            lastPage,
            hasNextPage: page < lastPage,
            hasPreviousPage: page > 1,
        };
    }

    /**
     * Common search where clause helper
     */
    protected buildSearchWhere(search?: string, fields: string[] = []) {
        if (!search || fields.length === 0) return {};

        return {
            OR: fields.map((field) => ({
                [field]: { contains: search, mode: 'insensitive' },
            })),
        };
    }
}
