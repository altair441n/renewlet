import { z } from "zod";

export const uploadKindSchema = z.enum(["logo", "icon"]);

export const uploadImageResponseSchema = z.object({
  url: z.string().min(1),
}).strict();

export const mediaCandidateKindSchema = uploadKindSchema;

export const mediaCandidateModeSchema = z.enum(["auto", "search"]);

export const mediaCandidateSourceSchema = z.enum(["builtIn", "favicon"]);

export const mediaCandidateConfidenceSchema = z.enum(["exact", "strong", "medium", "weak"]);

/**
 * 候选解析输入只包含用户主动提供的名称/站点。
 *
 * 后端不会抓取用户 URL 或 HTML；favicon 候选只生成可由浏览器加载的确定性图片地址。
 */
export const mediaCandidateResolveItemSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  website: z.string().trim().max(500).optional(),
}).strict();

/**
 * Logo/Icon 候选的统一响应项。
 *
 * provider/variant 是内置图标来源设置和排序预算的契约，Docker 与 Cloudflare 必须同时提供。
 */
export const mediaCandidateSchema = z.object({
  id: z.string().min(1),
  kind: mediaCandidateKindSchema,
  source: mediaCandidateSourceSchema,
  provider: z.string().min(1),
  label: z.string().min(1),
  variant: z.string().min(1).nullable(),
  url: z.string().min(1),
  confidence: mediaCandidateConfidenceSchema,
  autoAssignable: z.boolean(),
  matchedQuery: z.string().min(1),
  rank: z.number().int().nonnegative(),
}).strict();

export const mediaCandidateGroupSchema = z.object({
  best: mediaCandidateSchema.nullable(),
  builtIn: z.array(mediaCandidateSchema),
  favicon: z.array(mediaCandidateSchema),
}).strict();

export const mediaCandidateResolveRequestSchema = z.object({
  kind: mediaCandidateKindSchema,
  mode: mediaCandidateModeSchema,
  items: z.array(mediaCandidateResolveItemSchema).min(1).max(100),
  limit: z.number().int().positive().optional(),
}).strict();

export const mediaCandidateResolveItemResponseSchema = z.object({
  id: z.string().min(1),
  autoCandidate: mediaCandidateSchema.nullable(),
  candidates: mediaCandidateGroupSchema,
}).strict();

export const mediaCandidateResolveResponseSchema = z.object({
  items: z.array(mediaCandidateResolveItemResponseSchema),
}).strict();

export type UploadKind = z.infer<typeof uploadKindSchema>;
export type ApiUploadImageResponse = z.infer<typeof uploadImageResponseSchema>;
export type MediaCandidateKind = z.infer<typeof mediaCandidateKindSchema>;
export type MediaCandidateMode = z.infer<typeof mediaCandidateModeSchema>;
export type MediaCandidateSource = z.infer<typeof mediaCandidateSourceSchema>;
export type MediaCandidateConfidence = z.infer<typeof mediaCandidateConfidenceSchema>;
export type MediaCandidateResolveItem = z.infer<typeof mediaCandidateResolveItemSchema>;
export type MediaCandidate = z.infer<typeof mediaCandidateSchema>;
export type MediaCandidateGroup = z.infer<typeof mediaCandidateGroupSchema>;
export type MediaCandidateResolveRequest = z.infer<typeof mediaCandidateResolveRequestSchema>;
export type MediaCandidateResolveItemResponse = z.infer<typeof mediaCandidateResolveItemResponseSchema>;
export type MediaCandidateResolveResponse = z.infer<typeof mediaCandidateResolveResponseSchema>;
