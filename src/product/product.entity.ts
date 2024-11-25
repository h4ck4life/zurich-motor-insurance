/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('PRODUCT')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    productCode: string;

    @Column()
    location: string;

    @Column('decimal')
    price: number;
}