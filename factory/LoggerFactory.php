<?php

use Monolog\Handler\StreamHandler;
use Monolog\Logger;

class LoggerFactory {

    const LOG_FILE = '../log/events.log';

    private static $logger;

    public static function getLogger()
    {
        if (!isset(self::$logger)) {
            self::truncateLogFile();
            $streamHandler = new StreamHandler(self::LOG_FILE, Logger::INFO);
            $loggers = array($streamHandler);
            self::$logger = new Logger('Event logger', $loggers);
        }

        return self::$logger;
    }

    private static function truncateLogFile()
    {
        ftruncate(fopen(self::LOG_FILE, 'w+'), 0);
    }
}