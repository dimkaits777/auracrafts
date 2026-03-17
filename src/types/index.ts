export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  category: 'laser-cutting' | 'graphics' | 'embroidery';
}
