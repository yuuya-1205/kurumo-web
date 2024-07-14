ALTER USER ‘root’@‘%’ IDENTIFIED WITH mysql_native_password BY ‘root’;
CREATE USER ‘test’@‘%’ IDENTIFIED WITH mysql_native_password BY ‘test’;
GRANT ALL PRIVILEGES ON *.* TO ‘test’@‘%’ WITH GRANT OPTION;
FLUSH PRIVILEGES;