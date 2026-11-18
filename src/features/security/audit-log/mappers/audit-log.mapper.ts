import type {
  AuditLog,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/security/audit-log/types/audit-log.types";

export function mapAuditLogDto(dto: {
  audit_id: number;
  user_id?: number | null;
  menu_name?: string | null;
  table_name?: string | null;
  record_id?: number | null;
  action: number;
  action_name: string;
  old_values?: unknown;
  new_values?: unknown;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}): AuditLog {
  return {
    auditId: dto.audit_id,
    userId: dto.user_id ?? null,
    menuName: dto.menu_name ?? null,
    tableName: dto.table_name ?? null,
    recordId: dto.record_id ?? null,
    action: dto.action,
    actionName: dto.action_name,
    oldValues: dto.old_values ?? null,
    newValues: dto.new_values ?? null,
    ipAddress: dto.ip_address ?? null,
    userAgent: dto.user_agent ?? null,
    createdAt: dto.created_at,
  };
}

export function mapPaginationMetaDto(dto: PaginationMetaDto): PaginationMeta {
  return {
    total: dto.total,
    page: dto.page,
    perPage: dto.per_page,
    lastPage: dto.last_page,
    hasMore: dto.has_more,
  };
}
