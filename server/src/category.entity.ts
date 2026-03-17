import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // 例如：玫瑰、康乃馨

  @Column({ default: true })
  isActive: boolean;
}