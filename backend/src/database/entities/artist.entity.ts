import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Idea } from './idea.entity';

@Entity('artists')
export class Artist {
  @PrimaryColumn({ type: 'varchar', length: 42 })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  alias: string;

  @Column({ type: 'int', default: 0 })
  totalMints: number;

  @Column({ type: 'int', default: 0 })
  totalVerificationsGiven: number;

  @Column({ type: 'int', default: 0 })
  totalVerificationsReceived: number;

  @Column({ type: 'smallint', default: 0 })
  tier: number;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'boolean', default: false })
  isSeed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Idea, (idea) => idea.artist)
  ideas: Idea[];
}
