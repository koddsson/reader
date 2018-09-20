CREATE TABLE IF NOT EXISTS feeds (
  id varchar(255),
  title varchar(255),
  url varchar(255),
  lastUpdated varchar(255)
);

CREATE TABLE IF NOT EXISTS posts (
  guid varchar(255) PRIMARY KEY,
  title varchar(255),
  content text,
  pubDate integer,
  link varchar(255),
  feed_id varchar(255)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint varchar(512),
  p256dh varchar(512),
  auth varchar(512),
  expiration_time varchar(512)
)
