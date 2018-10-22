<?php

class DatabaseConnectionFactoryAspect extends FeedValAspect {

    /**
     * After getConnection throws an exception.
     * @param AopJoinPoint $jpt the join point.
     *
     * @return PDO the database connection.
     */
    public function aroundGetConnection(AopJoinPoint $jpt)
    {
        try {
            $db = $jpt->process();
        } catch (PDOException $ex) {
            self::$logger->addError($ex->getMessage());
            exit(1);
        }

        return $db;
    }

    public function createAdvices()
    {
        aop_add_around('DatabaseConnectionFactory->getConnection()', array($this, 'aroundGetConnection'));
    }
}