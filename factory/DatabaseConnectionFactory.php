<?php

class FeedValDatabaseConnectionFactory {

    const DB_HOST = 'localhost';
    const DB_USER = 'dairymgt';
    const DB_NAME = 'dietformulation';
    const DB_PASSWORD = '10@(Dairymgt#@!1';

    /**
     * Creates a connection to the database and returns the data object.
     *
     * @return PDO A data object representing a connection to the database.
     */
    public static function getConnection() {
        $dsn = 'mysql:dbname=' . self::DB_NAME . ';host=' . self::DB_HOST;
        $db = new PDO($dsn, self::DB_USER, self::DB_PASSWORD);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        return $db;
    }

}
