import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Idea } from './idea.entity';

@Entity('creative_steps')
export class CreativeStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  tokenId: number;

  @Column({ type: 'varchar', length: 66 })
  contentHash: string;

  @Column({ type: 'smallint' })
  stepType: number;

  @Column({ type: 'varchar', length: 500 })
  metadata: string;

  @Column({ type: 'bigint' })
  blockTimestamp: number;

  @Column({ type: 'varchar', length: 66, nullable: true })
  txHash: string;

  @ManyToOne(() => Idea, (idea) => idea.steps)
  @JoinColumn({ name: 'tokenId', referencedColumnName: 'tokenId' })
  idea: Idea;
}
