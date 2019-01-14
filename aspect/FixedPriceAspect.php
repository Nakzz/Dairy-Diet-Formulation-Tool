<?php

class FixedPriceAspect extends FeedValAspect {

    public function aroundGetHtml(AopJoinPoint $jpt)
    {
        try {
            $jpt->process();
        } catch (Exception $ex) {
            self::$logger->addError($ex->getMessage());
            throw $ex;
        }
    }

    public function createAdvices()
    {
        aop_add_around('FixedPrice->getHtml()', array($this,
            'aroundGetHtml'));
    }
}
