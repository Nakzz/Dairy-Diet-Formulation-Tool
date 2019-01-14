<?php

class FeedValIngredientType3Aspect extends FeedValAspect {

    public function aroundGetHTMLDomDocument(AopJoinPoint $jpt)
    {
        try {
            $jpt->process();
        } catch (Exception $ex) {
            self::$logger->addError($ex->getMessage());
            throw $ex;
        }
    }

    public function aroundGetPriceTable(AopJoinPoint $jpt)
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
        aop_add_around('FeedValIngredientType3->getHTMLDomDocument()', array($this,
            'aroundGetHTMLDomDocument'));
        aop_add_around('FeedValIngredientType3->getPriceTable()', array($this,
            'aroundGetPriceTable'));
    }
}
