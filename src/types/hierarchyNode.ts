export interface HierarchyNode {
    id: string;
    title: string;
    level: 'collection' | 'saga' | 'tome';
    children: HierarchyNode[];
  }
  