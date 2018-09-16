CREATE TABLE feeds (
  id varchar(255),
  title varchar(255),
  url varchar(255),
  lastUpdated varchar(255)
);

CREATE TABLE posts (
  guid varchar(255),
  title varchar(255),
  content text,
  pubDate integer,
  link varchar(255)
);
