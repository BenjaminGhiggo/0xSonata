import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Artist } from './artist.entity';
import { CreativeStep } from './creative-step.entity';

@Entity('ideas')
export class Idea {
  @PrimaryColumn({ type: 'int' })
  tokenId: number;

  @Column({ type: 'varchar', length: 66 })
  audioHash: string;

  @Column({ type: 'varchar', length: 42 })
  creatorAddress: string;

  @Column({ type: 'int', default: 0 })
  verificationCount: number;

  @Column({ type: 'int', default: 0 })
  stepCount: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  tokenURI: string;

  @Column({ type: 'bigint' })
  blockTimestamp: number;

  @Column({ type: 'varchar', length: 66, nullable: true })
  txHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Artist, (artist) => artist.ideas)
  @JoinColumn({ name: 'creatorAddress', referencedColumnName: 'address' })
  artist: Artist;

  @OneToMany(() => CreativeStep, (step) => step.idea)
  steps: CreativeStep[];
}
