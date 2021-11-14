create table channels
(
    server   varchar(20)          not null,
    channel  varchar(20)          not null,
    register timestamp            not null,
    active   boolean default true not null,
    constraint channels_pk
        primary key (channel)
);

create unique index channels_channel_uindex
    on channels (channel);

create table games
(
    channel varchar(20)  not null,
    product varchar(255) not null,
    week    date         not null,
    constraint games_pk
        primary key (channel, product, week),
    constraint games_channels_channel_fk
        foreign key (channel) references channels
            on update cascade on delete cascade
);

create unique index games_channel_product_week_uindex
    on games (channel, product, week);
