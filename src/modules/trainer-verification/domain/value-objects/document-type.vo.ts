export const DOCUMENT_TYPES = [
  'ine_front',
  'ine_back',
  'passport',
  'other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType);
}
