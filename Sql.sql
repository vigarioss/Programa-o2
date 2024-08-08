create database if not exists Info22P2;


USE Info22P2;

create table if not exists EntidadeA (
    id int auto_increment primary key,
    nome varchar(200)
);


create table if not exists EntidadeB (
    id int auto_increment primary key,
    descricao varchar(200),
    EntidadeA_id int,
    foreign key (EntidadeA_id) references EntidadeA(id) on delete cascade
);