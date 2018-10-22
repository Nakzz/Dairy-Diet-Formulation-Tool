<?php

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

abstract class FeedValAspect {

    protected static $logger;

    public function __construct()
    {
        self::$logger = LoggerFactory::getLogger();
        $this->createAdvices();
    }

    public abstract function createAdvices();

}

