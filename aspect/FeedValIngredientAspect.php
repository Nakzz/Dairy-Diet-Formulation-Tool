<?php

class FeedValIngredientAspect extends FeedValAspect {

    public function aroundRefetchPrices(AopJoinPoint $jpt)
    {
        try {
            $ingredient = $jpt->getObject()->getName();
            self::$logger->addInfo('-------------------------------------------------------');
            self::$logger->addInfo("Deleting and refetching all prices for $ingredient ...");
            $jpt->process();
        } catch (Exception $ex) {
            self::$logger->addError($ex->getMessage());
            throw $ex;
        }
    }

    public function aroundRefetchPriceForDate(AopJoinPoint $jpt)
    {
        try {
            $ingredient = $jpt->getObject()->getName();
            $args = $jpt->getArguments();
            $date = $args[0];
            self::$logger->addInfo("Refetching price for $ingredient for date $date ...");
            $jpt->process();
        } catch (Exception $ex) {
            self::$logger->addError($ex->getMessage());
            throw $ex;
        }
    }

    public function aroundRecordTodaysPrice(AopJoinPoint $jpt)
    {
        try {
            $ingredient = $jpt->getObject()->getName();
            self::$logger->addInfo("Recording today's price for $ingredient ...");
            $jpt->process();
        } catch (Exception $ex) {
            self::$logger->addError($ex->getMessage());
            throw $ex;
        }
    }

    public function aroundDeletePrices(AopJoinPoint $jpt)
    {
        try {
            $ingredient = $jpt->getObject()->getName();
            self::$logger->addInfo("Deleting all prices for $ingredient ...");
            $jpt->process();
        } catch (Exception $ex) {
            self::$logger->addError($ex->getMessage());
            throw $ex;
        }
    }

    public function aroundInsertPrice(AopJoinPoint $jpt)
    {
        try {
            $arguments = $jpt->getArguments();
            $date = $arguments[0];
            $price = $arguments[1];
            $unit = $arguments[2];
            self::$logger->addInfo("Inserting Date: $date, Price: $price, Unit: $unit ...");
            $jpt->process();
        } catch (Exception $ex) {
            self::$logger->addError($ex->getMessage());
            throw $ex;
        }
    }

    public function createAdvices()
    {
        aop_add_around('FeedValIngredient->refetchPrices()', array($this,
            'aroundRefetchPrices'));
        aop_add_around('FeedValIngredient->refetchPriceForDate()', array($this,
            'aroundRefetchPriceForDate'));
        aop_add_around('FeedValIngredient->recordTodaysPrice()', array($this,
            'aroundRecordTodaysPrice'));
        aop_add_around('FeedValIngredient->deletePrices()', array($this,
            'aroundDeletePrices'));
        aop_add_around('FeedValIngredient->insertPrice()', array($this,
            'aroundInsertPrice'));
    }
}