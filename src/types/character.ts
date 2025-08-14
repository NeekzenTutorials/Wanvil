export type TemplateFieldType = 'text'|'textarea'|'number'|'date'|'select'|'chips'|'richtext'|'images'
export type TemplateField = {
  id: string; type: TemplateFieldType; label: string;
  required?: boolean; options?: string[]; builtin?: boolean;
}
export type CharacterTemplate = { version: number; fields: TemplateField[] }

export type CharacterCard = {
  id: string; firstname: string; lastname: string; avatarUrl?: string;
  tags: { id:string; name:string; color?:string }[];
}

export type Tag = { id: string; name: string; color?: string; note?: string; collectionId: string }